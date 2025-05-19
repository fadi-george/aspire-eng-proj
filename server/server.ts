import { createSchema, createYoga } from "graphql-yoga";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

const trackedRepositories: {
  name: string;
  owner: string;
}[] = [];

async function fetchRepositoryInfo(name: string, owner: string) {
  try {
    const repoInfo = await octokit.rest.repos.get({
      owner,
      repo: name,
    });
    const releaseInfo = await octokit.rest.repos.getLatestRelease({
      owner,
      repo: name,
    });

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
        id: String!
        name: String!
        description: String
        url: String!
        stars: Int!
        language: String
        owner: String!
        tag_name: String
        published_at: String
      }

      type Query {
        hello: String
        searchRepositories(query: String!, limit: Int = 10): [Repository!]!
        trackedRepositories: [TrackedRepository!]!
      }

      type Mutation {
        trackRepository(name: String!, owner: String!): TrackedRepository!
        untrackRepository(name: String!, owner: String!): Boolean!
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
            trackedRepositories.map((repo) =>
              fetchRepositoryInfo(repo.name, repo.owner)
            )
          );
          return repos;
        },
      },
      Mutation: {
        trackRepository: async (_, { name, owner }) => {
          const repo = await fetchRepositoryInfo(name, owner);
          trackedRepositories.push({ name, owner });
          return repo;
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
