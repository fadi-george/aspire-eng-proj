import {
  createInlineSigningKeyProvider,
  extractFromCookie,
  useJWT,
} from "@graphql-yoga/plugin-jwt";
import { useCookies } from "@whatwg-node/server-plugin-cookies";
import { and, eq } from "drizzle-orm";
import {
  createSchema,
  createYoga,
  useExtendContext,
  YogaInitialContext,
} from "graphql-yoga";
import { Octokit } from "octokit";
import db from "./db";
import { repositories, trackedRepositories } from "./db/schema";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

async function fetchRepositoryInfo(name: string, owner: string) {
  try {
    const repoInfo = await octokit.rest.repos.get({
      owner,
      repo: name,
    });

    let releaseInfo = {
      data: { body: null, tag_name: null, published_at: null },
    };
    let commit: string | null = null;
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

      // not all repos have releases
      if (status !== 404) {
        throw error;
      }
    }

    return {
      name,
      owner,
      id: repoInfo.data.id,
      description: repoInfo.data.description,
      releaseTag: releaseInfo.data.tag_name,
      published_at: releaseInfo.data.published_at,
      releaseNotes: releaseInfo.data.body,
      releaseCommit: commit,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch repository: ${error.message}`);
  }
}

interface GitHubRepository {
  id: number;
  description: string | null;
  html_url: string;
  name: string;
  owner: {
    login: string;
  };
  published_at: string | null;
  stargazers_count: number;
  tag_name: string | null;
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
        url: String!
        stars: Int!
        language: String
        owner: String!
      }

      type TrackedRepository {
        id: Int!
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

      type Query {
        searchRepositories(query: String!, limit: Int = 10): [Repository!]!
        getTrackedRepositories: [TrackedRepository!]!
        getTrackedRepository(
          name: String!
          owner: String!
        ): TrackedRepositoryRelease
      }

      type Mutation {
        trackRepository(name: String!, owner: String!): TrackedRepository!
        untrackRepository(name: String!, owner: String!): Boolean!
        markRepositoryAsSeen(name: String!, owner: String!): Boolean!
      }
    `,
    resolvers: {
      Query: {
        searchRepositories: async (_, { query, limit }) => {
          const response = await octokit.rest.search.repos({
            q: `${query} in:name`,
            per_page: limit,
            sort: "stars",
            order: "desc",
          });

          return response.data.items.map((repo: GitHubRepository) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            stars: repo.stargazers_count,
            owner: repo.owner.login,
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
            name: trackedRepo.repository.name,
            description: trackedRepo.repository.description,
            owner: trackedRepo.repository.owner,
            published_at: trackedRepo.repository.publishedAt?.toISOString(),
            release_tag: trackedRepo.repository.releaseTag,
            last_seen_at: trackedRepo.lastSeenAt?.toISOString(),
          }));
        },
        getTrackedRepository: async (_, { name, owner }) => {
          // const repo = trackedRepositories.find(
          //   (repo) => repo.name === name && repo.owner === owner
          // );
          // if (!repo) {
          //   return null;
          // }

          // const repoInfo = await fetchRepositoryInfo(repo.name, repo.owner);
          // const release = await octokit.rest.repos.getLatestRelease({
          //   owner: repo.owner,
          //   repo: repo.name,
          // });

          // const ref = await octokit.rest.git.getRef({
          //   owner: repo.owner,
          //   repo: repo.name,
          //   ref: `tags/${release.data.tag_name}`,
          // });

          // return {
          //   ...repoInfo,
          //   seen: repo.seen,
          //   body: release.data.body,
          //   commit: ref.data.object.sha,
          //   published_at: release.data.published_at,
          //   tag_name: release.data.tag_name,
          // };
          return {};
        },
      },
      Mutation: {
        trackRepository: async (_, { name, owner }, ctx) => {
          const userId = ctx.userId;

          // upsert repo
          let repo = await db.query.repositories.findFirst({
            where: and(
              eq(repositories.name, name),
              eq(repositories.owner, owner)
            ),
          });
          if (!repo) {
            const repoInfo = await fetchRepositoryInfo(name, owner);

            repo = (
              await db
                .insert(repositories)
                .values({
                  repoId: repoInfo.id,
                  name,
                  owner,
                  description: repoInfo.description,
                  publishedAt: repoInfo.published_at
                    ? new Date(repoInfo.published_at)
                    : null,
                  releaseTag: repoInfo.tag_name,
                  releaseCommit: repoInfo.commit,
                  releaseNotes: repoInfo.notes,
                })
                .returning()
            )[0];
          }
          if (!repo) {
            throw new Error("Failed to create repository");
          }

          // upsert tracked repo
          await db
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
            });

          return {
            name,
            owner,
            description: repo.description,
            published_at: repo.publishedAt,
            tag_name: repo.tagName,
            last_seen_at: null,
          };
        },
        untrackRepository: async (_, { name, owner }, ctx) => {
          const userId = ctx.userId;

          const repo = await db.query.repositories.findFirst({
            where: and(
              eq(repositories.name, name),
              eq(repositories.owner, owner)
            ),
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
        markRepositoryAsSeen: async (_, { name, owner }, ctx) => {
          const userId = ctx.userId;
          const repo = await db.query.repositories.findFirst({
            where: and(
              eq(repositories.name, name),
              eq(repositories.owner, owner)
            ),
          });
          if (!repo) {
            throw new Error("Repository not found");
          }

          await db
            .update(trackedRepositories)
            .set({ lastSeenAt: new Date() })
            .where(
              and(
                eq(trackedRepositories.userId, userId),
                eq(trackedRepositories.repoId, repo.repoId)
              )
            );

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
