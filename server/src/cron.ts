import cron from "node-cron";
import db from "./db";
import { refreshRepository } from "./graphql";
import { batchPushNotifications } from "./notifications";

cron.schedule("*/15 * * * *", async () => {
  console.info("running a task every 15 minutes");
  const repositories = await db.query.repositories.findMany();
  for (const repository of repositories) {
    await refreshRepository(repository.repoId.toString())
      .then((repo) => {
        console.info(`Cron: Refreshed repository ${repo.owner}/${repo.name}`);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  await batchPushNotifications();
});
