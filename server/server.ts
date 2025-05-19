import { createSchema, createYoga } from "graphql-yoga";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

const trackedRepositories: {
  name: string;
  owner: string;
  seen: boolean;
}[] = [];

async function fetchRepositoryInfo(name: string, owner: string) {
  try {
    console.log("Fetching repository info for", name, owner);
    const repoInfo = await octokit.rest.repos.get({
      owner,
      repo: name,
    });
    console.log("Repository info fetched", repoInfo);

    let releaseInfo = { data: { tag_name: null, published_at: null } };
    try {
      releaseInfo = await octokit.rest.repos.getLatestRelease({
        owner,
        repo: name,
      });
      console.log("Release info fetched", releaseInfo);
    } catch (error) {
      console.log("No releases found for repository");
    }

    return {
      name,
      owner,
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

const yoga = createYoga({
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
        id: String!
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
        hello: String
        searchRepositories(query: String!, limit: Int = 10): [Repository!]!
        trackedRepositories: [TrackedRepository!]!
      }

      type Mutation {
        trackRepository(name: String!, owner: String!): TrackedRepository!
        untrackRepository(name: String!, owner: String!): Boolean!
        markRepositoryAsSeen(name: String!, owner: String!): Boolean!
      }
    `,
    resolvers: {
      Query: {
        hello: () => "Hello from Yoga!",
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
        trackedRepositories: async () => {
          const repos = await Promise.all(
            trackedRepositories.map(async (repo) => {
              const repoInfo = await fetchRepositoryInfo(repo.name, repo.owner);
              return { ...repoInfo, seen: repo.seen };
            })
          );
          return repos;
        },
      },
      Mutation: {
        trackRepository: async (_, { name, owner }) => {
          const repo = await fetchRepositoryInfo(name, owner);
          trackedRepositories.push({ name, owner, seen: false });
          return { ...repo, seen: false };
        },
        untrackRepository: async (_, { name, owner }) => {
          const index = trackedRepositories.findIndex(
            (repo) => repo.name === name && repo.owner === owner
          );

          if (index === -1) {
            throw new Error("Repository not found in tracked list");
          }

          trackedRepositories.splice(index, 1);
          return true;
        },
        markRepositoryAsSeen: async (_, { name, owner }) => {
          const index = trackedRepositories.findIndex(
            (repo) => repo.name === name && repo.owner === owner
          );
          if (index === -1) {
            throw new Error("Repository not found in tracked list");
          }

          trackedRepositories[index].seen = true;
          return true;
        },
      },
    },
  }),
});

const server = Bun.serve({
  fetch: yoga,
  port: 4000,
});

console.info(
  `Server is running on ${new URL(
    yoga.graphqlEndpoint,
    `http://${server.hostname}:${server.port}`
  )}`
);
