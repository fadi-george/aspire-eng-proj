import { createSchema, createYoga } from "graphql-yoga";
import { Octokit } from "octokit";

const octokit = new Octokit();

const trackedRepositories: {
  url: string;
}[] = [];

async function fetchRepositoryInfo(url: string) {
  try {
    const [repo, owner] = url.split("/").reverse();
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      name: response.data.name,
      owner,
      url: response.data.html_url,
      stars: response.data.stargazers_count,
      language: response.data.language,
      description: response.data.description,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch repository: ${error.message}`);
  }
}

interface GitHubRepository {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  owner: {
    login: string;
  };
}

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Repository {
        name: String!
        description: String
        url: String!
        stars: Int!
        language: String
        owner: String!
      }

      type Query {
        hello: String
        searchRepositories(query: String!, limit: Int = 10): [Repository!]!
        trackedRepositories: [Repository!]!
      }

      type Mutation {
        trackRepository(url: String!): Repository!
        untrackRepository(url: String!): Boolean!
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
            trackedRepositories.map((repo) => fetchRepositoryInfo(repo.url))
          );
          return repos;
        },
      },
      Mutation: {
        trackRepository: async (_, { url }) => {
          const repo = await fetchRepositoryInfo(url);
          trackedRepositories.push({ url });
          return repo;
        },
        untrackRepository: async (_, { url }) => {
          const index = trackedRepositories.findIndex(
            (repo) => repo.url === url
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
