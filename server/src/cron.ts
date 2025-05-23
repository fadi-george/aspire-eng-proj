import cron from "node-cron";
import db from "./db";
import { refreshRepository } from "./graphql";

cron.schedule("*/15 * * * *", async () => {
  console.log("running a task every 15 minutes");

  const repositories = await db.query.repositories.findMany();
  for (const repository of repositories) {
    await refreshRepository(repository.repoId.toString())
      .then(() => {
        console.log(`Cron: Refreshed repository ${repository.repoId}`);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});
