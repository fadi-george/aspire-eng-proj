import { and, eq, InferSelectModel, isNotNull, lt } from "drizzle-orm";
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

const sendPushNotification = async (subscription: {
  endpoint: string;
  authKey: string;
  p256dhKey: string;
  owner: string;
  name: string;
  releaseTag: string;
  publishedAt: Date;
}) => {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey,
        },
      },
      JSON.stringify({
        title: `🚀 ${subscription.owner}/${subscription.name} ${subscription.releaseTag}`,
        body: `New release available!`,
        data: {
          published_at: subscription.publishedAt?.toISOString(),
          owner: subscription.owner,
          name: subscription.name,
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

type RepositoryRow = InferSelectModel<typeof repositories>;

// send notification for users who have not seen latest releases
export const sendReleaseNotification = async (repo: RepositoryRow) => {
  const usersWithSubscriptions = await db
    .select({
      // Repository fields
      owner: repositories.owner,
      name: repositories.name,
      publishedAt: repositories.publishedAt,
      releaseTag: repositories.releaseTag,
      // Push subscription fields
      endpoint: pushSubscriptions.endpoint,
      authKey: pushSubscriptions.authKey,
      p256dhKey: pushSubscriptions.p256dhKey,
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
        eq(trackedRepositories.repoId, repo.repoId),
        isNotNull(repositories.publishedAt), // repository is published
        isNotNull(repositories.releaseTag), // repository has a release tag
        isNotNull(trackedRepositories.lastSeenAt), // user has seen a release
        lt(trackedRepositories.lastSeenAt, repositories.publishedAt), // user has not seen the latest release
        eq(pushSubscriptions.isActive, true) // user has an active subscription
      )
    );

  for (const sub of usersWithSubscriptions) {
    const { releaseTag, publishedAt } = sub;
    if (releaseTag && publishedAt) {
      sendPushNotification({
        ...sub,
        releaseTag,
        publishedAt,
      });
    }
  }
};
