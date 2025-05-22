import {
  createInlineSigningKeyProvider,
  extractFromCookie,
  useJWT,
} from "@graphql-yoga/plugin-jwt";
import { Octokit } from "@octokit/rest";
import {
  GetResponseTypeFromEndpointMethod,
  OctokitResponse,
} from "@octokit/types";
import { useCookies } from "@whatwg-node/server-plugin-cookies";
import { and, eq } from "drizzle-orm";
import {
  createSchema,
  createYoga,
  useExtendContext,
  YogaInitialContext,
} from "graphql-yoga";
import db from "./db";
import { repositories, trackedRepositories } from "./db/schema";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

type RepositoryInfo = OctokitResponse<
  GetResponseTypeFromEndpointMethod<typeof octokit.rest.repos.get>["data"]
>;

async function fetchRepositoryInfo(id: bigint) {
  // name and owner may change over time, so using id
  const repoInfo: RepositoryInfo = await octokit.request(
    "GET /repositories/{id}",
    {
      id: id.toString(),
    }
  );
  const owner = repoInfo.data.owner.login;
  const name = repoInfo.data.name;

  // repo may not have a release
  let releaseInfo: GetResponseTypeFromEndpointMethod<
    typeof octokit.rest.repos.getLatestRelease
  > | null = null;
  let commit: string | null = null;

  // get release notes and relevant commit hash
  try {
    releaseInfo = await octokit.rest.repos.getLatestRelease({
      owner,
      repo: name,
    });

    if (releaseInfo.data.tag_name) {
      commit = (
        await octokit.rest.git.getRef({
          owner,
          repo: name,
          ref: `tags/${releaseInfo.data.tag_name}`,
        })
      ).data.object.sha;
    }
  } catch (error: any) {
    let status = error?.status;

    // 404 would be expected if the repo does not have a release
    if (status !== 404) {
      throw error;
    }
  }

  return {
    name,
    owner,
    id: repoInfo.data.id,
    description: repoInfo.data.description,
    releaseTag: releaseInfo?.data.tag_name,
    publishedAt: releaseInfo?.data.published_at,
    releaseNotes: releaseInfo?.data.body,
    releaseCommit: commit,
  };
}
interface Context extends YogaInitialContext {
  userId: number;
}

export const yoga = createYoga<Context>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Repository {
        id: String!
        name: String!
        description: String
        stars: Int!
        owner: String!
      }

      type TrackedRepository {
        id: Int!
        repoId: String!
        name: String!
        owner: String!
        description: String
        last_seen_at: String
        published_at: String
        release_tag: String
      }

      type TrackedRepositoryRelease {
        body: String
        commit: String
        description: String
        language: String
        name: String!
        owner: String!
        published_at: String
        seen: Boolean!
        stars: Int!
        tag_name: String
        url: String!
      }

      type MarkRepositoryAsSeenResponse {
        lastSeenAt: String!
      }

      type Query {
        searchRepositories(query: String!, limit: Int = 10): [Repository!]!
        getTrackedRepositories: [TrackedRepository!]!
        getTrackedRepository(repoId: String!): TrackedRepositoryRelease
      }

      type Mutation {
        trackRepository(repoId: String!): TrackedRepository!
        untrackRepository(repoId: String!): Boolean!
        markRepositoryAsSeen(repoId: String!): MarkRepositoryAsSeenResponse!
        refreshRepositories: Boolean!
      }
    `,
    resolvers: {
      Query: {
        searchRepositories: async (_, { query, limit }) => {
          const response = await octokit.rest.search.repos({
            q: `${query} in:name has:owner`,
            per_page: limit,
            sort: "stars",
            order: "desc",
          });

          return response.data.items.map((repo) => ({
            id: repo.id.toString(),
            name: repo.name,
            description: repo.description,
            stars: repo.stargazers_count,
            owner: repo.owner!.login,
          }));
        },
        getTrackedRepositories: async (_, __, ctx) => {
          const userId = ctx.userId;

          const trackedRepos = await db.query.trackedRepositories.findMany({
            where: eq(trackedRepositories.userId, userId),
            with: {
              repository: true,
            },
          });

          return trackedRepos.map((trackedRepo) => ({
            id: trackedRepo.id,
            repoId: trackedRepo.repository.repoId.toString(),
            name: trackedRepo.repository.name,
            description: trackedRepo.repository.description,
            owner: trackedRepo.repository.owner,
            published_at: trackedRepo.repository.publishedAt?.toISOString(),
            release_tag: trackedRepo.repository.releaseTag,
            last_seen_at: trackedRepo.lastSeenAt?.toISOString(),
          }));
        },
        getTrackedRepository: async (_, { name, owner }) => {
          const repo = await db.query.repositories.findFirst({
            where: and(
              eq(repositories.name, name),
              eq(repositories.owner, owner)
            ),
          });

          if (!repo) {
            return null;
          }

          const repoInfo = await fetchRepositoryInfo(repo.repoId);

          return {
            name: repoInfo.name,
            owner: repoInfo.owner,
            description: repoInfo.description,
            language: null,
            published_at: repoInfo.publishedAt,
            tag_name: repoInfo.releaseTag,
            body: repoInfo.releaseNotes,
            commit: repoInfo.releaseCommit,
            seen: false,
            stars: 0,
            url: `https://github.com/${repoInfo.owner}/${repoInfo.name}`,
          };
        },
      },
      Mutation: {
        trackRepository: async (_, { repoId: id }: { repoId: string }, ctx) => {
          const userId = ctx.userId;
          const repoId = BigInt(id);

          // upsert repo
          let repo = await db.query.repositories.findFirst({
            where: eq(repositories.repoId, repoId),
          });
          if (!repo) {
            const repoInfo = await fetchRepositoryInfo(repoId);

            repo = (
              await db
                .insert(repositories)
                .values({
                  repoId: repoId,
                  name: repoInfo.name,
                  owner: repoInfo.owner,
                  description: repoInfo.description,
                  publishedAt: repoInfo.publishedAt
                    ? new Date(repoInfo.publishedAt)
                    : null,
                  releaseTag: repoInfo.releaseTag,
                  releaseCommit: repoInfo.releaseCommit,
                  releaseNotes: repoInfo.releaseNotes,
                })
                .returning()
            )[0];
          }
          if (!repo) {
            throw new Error("Failed to create repository");
          }

          // upsert tracked repo
          const trackedRepo = await db
            .insert(trackedRepositories)
            .values({
              userId,
              repoId: repo.repoId,
            })
            .onConflictDoUpdate({
              target: [trackedRepositories.userId, trackedRepositories.repoId],
              set: {
                updatedAt: new Date(),
              },
            })
            .returning();

          return {
            id: trackedRepo[0]!.id,
            repoId: repo.repoId.toString(),
            name: repo.name,
            owner: repo.owner,
            description: repo.description,
            published_at: repo.publishedAt,
            release_tag: repo.releaseTag,
            last_seen_at: null,
          };
        },
        untrackRepository: async (_, { repoId }, ctx) => {
          const userId = ctx.userId;

          const repo = await db.query.repositories.findFirst({
            where: eq(repositories.repoId, BigInt(repoId)),
          });
          if (!repo) {
            throw new Error("Repository not found");
          }

          try {
            await db
              .delete(trackedRepositories)
              .where(
                and(
                  eq(trackedRepositories.userId, userId),
                  eq(trackedRepositories.repoId, repo.repoId)
                )
              );
            return true;
          } catch (error) {
            console.error(error);
            return false;
          }
        },
        markRepositoryAsSeen: async (_, { repoId }, ctx) => {
          const userId = ctx.userId;

          const repo = await db.query.repositories.findFirst({
            where: eq(repositories.repoId, BigInt(repoId)),
          });
          if (!repo) {
            throw new Error("Repository not found");
          }

          const newDate = new Date();
          await db
            .update(trackedRepositories)
            .set({ lastSeenAt: newDate })
            .where(
              and(
                eq(trackedRepositories.userId, userId),
                eq(trackedRepositories.repoId, repo.repoId)
              )
            );

          return { lastSeenAt: newDate.toISOString() };
        },
        refreshRepositories: async (_, __, ctx) => {
          const userId = ctx.userId;

          const trackedRepos = await db.query.trackedRepositories.findMany({
            where: eq(trackedRepositories.userId, userId),
            with: {
              repository: true,
            },
          });

          let promises = [];
          for (const repo of trackedRepos) {
            const repoInfo = await fetchRepositoryInfo(repo.repository.repoId);

            // in rare cases, owner and name may change over time
            // also we want to grab the latest release information
            promises.push(
              db
                .update(repositories)
                .set({
                  name: repoInfo.name,
                  owner: repoInfo.owner,
                  description: repoInfo.description,
                  publishedAt: repoInfo.publishedAt
                    ? new Date(repoInfo.publishedAt)
                    : null,
                  releaseTag: repoInfo.releaseTag,
                  releaseCommit: repoInfo.releaseCommit,
                  releaseNotes: repoInfo.releaseNotes,
                })
                .where(eq(repositories.id, repo.repository.id))
            );
          }
          await Promise.all(promises);
          return true;
        },
      },
    },
  }),
  plugins: [
    // parse and verify jwt cookie
    useCookies(),
    useJWT({
      signingKeyProviders: [
        createInlineSigningKeyProvider(process.env.JWT_SECRET!),
      ],
      tokenLookupLocations: [extractFromCookie({ name: "authToken" })],
    }),

    useExtendContext((ctx) => {
      const userId = ctx.jwt?.payload.userId;
      if (userId) {
        ctx.userId = userId;
      }
      return ctx;
    }),
  ],
});
