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

const _trackedRepositories: {
  name: string;
  owner: string;
  seen: boolean;
}[] = [];

async function fetchRepositoryInfo(name: string, owner: string) {
  try {
    const repoInfo = await octokit.rest.repos.get({
      owner,
      repo: name,
    });

    let releaseInfo = { data: { tag_name: null, published_at: null } };
    try {
      releaseInfo = await octokit.rest.repos.getLatestRelease({
        owner,
        repo: name,
      });
    } catch (error) {
      console.info("No releases found for repository");
    }

    return {
      name,
      owner,
      id: repoInfo.data.id,
      url: repoInfo.data.html_url,
      stars: repoInfo.data.stargazers_count,
      language: repoInfo.data.language,
      description: repoInfo.data.description,
      tag_name: releaseInfo.data.tag_name,
      published_at: releaseInfo.data.published_at,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch repository: ${error.message}`);
  }
}

interface GitHubRepository {
  id: number;
  description: string | null;
  html_url: string;
  language: string | null;
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
        description: String
        last_seen_at: String
        name: String!
        owner: String!
        published_at: String
        tag_name: String
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
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language,
            owner: repo.owner.login,
          }));
        },
        getTrackedRepositories: async (_, __, ctx) => {
          const userId = ctx.userId;

          const trackedRepos = await db
            .select()
            .from(trackedRepositories)
            .leftJoin(
              repositories,
              eq(trackedRepositories.repoId, repositories.repoId)
            )
            .where(eq(trackedRepositories.userId, userId));
          console.log("uhh", trackedRepos);
          return [];
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
          console.log("repo", repo);
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
                  publishedAt: repoInfo.published_at,
                  tagName: repoInfo.tag_name,
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
        untrackRepository: async (_, { name, owner }) => {
          // const index = trackedRepositories.findIndex(
          //   (repo) => repo.name === name && repo.owner === owner
          // );

          // if (index === -1) {
          //   throw new Error("Repository not found in tracked list");
          // }

          // trackedRepositories.splice(index, 1);
          return true;
        },
        markRepositoryAsSeen: async (_, { name, owner }) => {
          // const index = trackedRepositories.findIndex(
          //   (repo) => repo.name === name && repo.owner === owner
          // );
          // if (index === -1) {
          //   throw new Error("Repository not found in tracked list");
          // }

          // trackedRepositories[index].seen = true;
          return true;
        },
      },
    },
  }),
  plugins: [
    // verify jwt cookie
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
