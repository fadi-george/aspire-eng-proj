import { subDays } from "date-fns";
import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import webpush from "web-push";
import db from "./db";
import {
  notificationSettings,
  pushSubscriptions,
  repositories,
  trackedRepositories,
  users,
} from "./db/schema";

webpush.setVapidDetails(
  "mailto:fadi@onesignal.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const sendBatchedPushNotification = async (
  subscription: {
    userId: number;
    endpoint: string;
    authKey: string;
    p256dhKey: string;
  },
  releases: {
    owner: string;
    name: string;
    releaseTag: string;
    publishedAt: Date;
  }[]
) => {
  console.log("sending push notification", { subscription, releases });
  try {
    const releaseCount = releases.length;
    let title: string;
    let body: string = "";
    let url = "/";

    if (releases.length === 1) {
      const release = releases[0]!;
      title = `🚀 ${release.owner}/${release.name} ${release.releaseTag}`;
      body = `New release available!`;
      url = `/repo/${release.owner}/${release.name}`;
    } else {
      title = `🚀 ${releaseCount} new releases available!`;
      const repoNames = releases.slice(0, 3).map((r) => `${r.name}`);
      body = `Repos: ${repoNames.join(", ")}`;
      if (releaseCount > 3) body += ` and ${releaseCount - 3} more`;
    }

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey,
        },
      },
      JSON.stringify({
        title,
        body,
        data: {
          url,
        },
      })
    );

    // Update notification settings after successful send
    await db
      .insert(notificationSettings)
      .values({
        userId: subscription.userId,
        notificationType: "releases",
        lastSentAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          notificationSettings.userId,
          notificationSettings.notificationType,
        ],
        set: {
          lastSentAt: new Date(),
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // unsubscribe user
        await db
          .update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      }
    }
  }
};

// send notification for users who have not seen latest releases
export const batchPushNotifications = async () => {
  const threeDaysAgo = subDays(new Date(), 3);

  // get 1 subscriptions per user
  const userSubscriptions = await db
    .selectDistinctOn([users.id], {
      userId: users.id,
      endpoint: pushSubscriptions.endpoint,
      authKey: pushSubscriptions.authKey,
      p256dhKey: pushSubscriptions.p256dhKey,
    })
    .from(users)
    .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
    .leftJoin(
      notificationSettings,
      and(
        eq(notificationSettings.userId, users.id),
        eq(notificationSettings.notificationType, "releases")
      )
    )
    .where(
      and(
        eq(pushSubscriptions.isActive, true),
        or(
          isNull(notificationSettings.lastSentAt),
          lt(notificationSettings.lastSentAt, threeDaysAgo)
        )
      )
    );

  const userIds = userSubscriptions.map((sub) => sub.userId);
  if (userIds.length === 0) return;

  // get all repos that have new releases and user has seen at least one release for each repo
  const userRepos = await db
    .select({
      userId: users.id,
      owner: repositories.owner,
      name: repositories.name,
      publishedAt: repositories.publishedAt,
      releaseTag: repositories.releaseTag,
    })
    .from(trackedRepositories)
    .innerJoin(
      repositories,
      eq(trackedRepositories.repoId, repositories.repoId)
    )
    .innerJoin(users, eq(trackedRepositories.userId, users.id))
    .where(
      and(
        inArray(users.id, userIds),
        isNotNull(repositories.publishedAt),
        isNotNull(repositories.releaseTag),
        isNotNull(trackedRepositories.lastSeenAt),
        lt(trackedRepositories.lastSeenAt, repositories.publishedAt)
      )
    );

  // group by userId
  const userReleases = new Map<
    number,
    {
      subscription: {
        userId: number;
        endpoint: string;
        authKey: string;
        p256dhKey: string;
      };
      releases: Array<{
        owner: string;
        name: string;
        releaseTag: string;
        publishedAt: Date;
      }>;
    }
  >();

  for (const sub of userSubscriptions) {
    userReleases.set(sub.userId, {
      subscription: sub,
      releases: [],
    });
  }

  for (const repo of userRepos) {
    const userData = userReleases.get(repo.userId)!;
    if (repo.releaseTag && repo.publishedAt) {
      userData.releases.push({
        owner: repo.owner,
        name: repo.name,
        releaseTag: repo.releaseTag,
        publishedAt: repo.publishedAt,
      });
    }
  }

  for (const userData of userReleases.values()) {
    const { subscription, releases } = userData;
    if (subscription.endpoint && releases.length > 0) {
      sendBatchedPushNotification(subscription, releases);
    }
  }
};
