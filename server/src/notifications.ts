import { and, eq, isNotNull, lt } from "drizzle-orm";
import webpush from "web-push";
import db from "./db";
import {
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
  try {
    const releaseCount = releases.length;
    let title: string;
    let body: string;
    let url = "/";

    if (releases.length === 1) {
      const release = releases[0]!;
      title = `🚀 ${release.owner}/${release.name} ${release.releaseTag}`;
      body = `New release available!`;
      url = `/repo/${release.owner}/${release.name}`;
    } else {
      title = `🚀 ${releaseCount} new releases available!`;

      const repoNames = releases.slice(0, 3).map((r) => `${r.name}`);
      body =
        releaseCount > 3
          ? `${repoNames.join(", ")} and ${releaseCount - 3} more`
          : repoNames.join(", ");
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
  const usersWithNewReleases = await db
    .selectDistinctOn([users.id], {
      userId: users.id,
      endpoint: pushSubscriptions.endpoint,
      authKey: pushSubscriptions.authKey,
      p256dhKey: pushSubscriptions.p256dhKey,
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
    .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
    .where(
      and(
        isNotNull(repositories.publishedAt),
        isNotNull(repositories.releaseTag),
        isNotNull(trackedRepositories.lastSeenAt),
        lt(trackedRepositories.lastSeenAt, repositories.publishedAt),
        eq(pushSubscriptions.isActive, true)
      )
    );

  // group by userId
  const userReleases = new Map<
    number,
    {
      subscription: {
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

  for (const user of usersWithNewReleases) {
    const userId = user.userId;

    if (!userReleases.has(userId)) {
      userReleases.set(userId, {
        subscription: {
          endpoint: user.endpoint,
          authKey: user.authKey,
          p256dhKey: user.p256dhKey,
        },
        releases: [],
      });
    }

    const userData = userReleases.get(userId)!;

    if (user.releaseTag && user.publishedAt) {
      userData.releases.push({
        owner: user.owner,
        name: user.name,
        releaseTag: user.releaseTag,
        publishedAt: user.publishedAt,
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
