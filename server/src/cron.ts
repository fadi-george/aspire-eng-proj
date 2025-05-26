import cron from "node-cron";
import db from "./db";
import { refreshRepository } from "./graphql";
import { sendReleaseNotification } from "./notifications";

cron.schedule("*/4 * * * *", async () => {
  console.log("running a task every 15 minutes");

  const repositories = await db.query.repositories.findMany();
  for (const repository of repositories) {
    await refreshRepository(repository.repoId.toString())
      .then((repo) => {
        console.log(
          `Cron: Refreshed repository ${repository.owner}/${repository.name}`
        );
        if (repo && repo.name === "react") {
          sendReleaseNotification(repo);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
});
