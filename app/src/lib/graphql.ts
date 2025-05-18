import { GraphQLClient } from "graphql-request";

// Create a GraphQL client instance
export const graphqlClient = new GraphQLClient("http://localhost:4000/graphql");

// Define the Repository type
export interface Repository {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  owner: string;
}

// Define response types
interface HelloResponse {
  hello: string;
}

interface SearchRepositoriesResponse {
  searchRepositories: Repository[];
}

interface TrackRepositoryResponse {
  trackRepository: Repository;
}

interface UntrackRepositoryResponse {
  untrackRepository: boolean;
}

interface TrackedRepositoriesResponse {
  trackedRepositories: Repository[];
}

// Example query to get the hello message
export const getHello = async () => {
  const query = `
    query {
      hello
    }
  `;
  const response = await graphqlClient.request<HelloResponse>(query);
  return response.hello;
};

// Example query to search repositories
export const searchRepositories = async (query: string, limit: number = 10) => {
  const gqlQuery = `
    query SearchRepositories($query: String!, $limit: Int!) {
      searchRepositories(query: $query, limit: $limit) {
        name
        description
        url
        stars
        language
        owner
      }
    }
  `;
  const response = await graphqlClient.request<SearchRepositoriesResponse>(
    gqlQuery,
    { query, limit },
  );
  return response.searchRepositories;
};

// Mutation to track a repository
export const trackRepository = async (url: string) => {
  const mutation = `
    mutation TrackRepository($url: String!) {
      trackRepository(url: $url) {
        name
        description
        url
        stars
        language
        owner
      }
    }
  `;
  const response = await graphqlClient.request<TrackRepositoryResponse>(
    mutation,
    { url },
  );
  return response.trackRepository;
};

// Mutation to untrack a repository
export const untrackRepository = async (url: string) => {
  const mutation = `
    mutation UntrackRepository($url: String!) {
      untrackRepository(url: $url)
    }
  `;
  const response = await graphqlClient.request<UntrackRepositoryResponse>(
    mutation,
    { url },
  );
  return response.untrackRepository;
};

export const getTrackedRepositories = async () => {
  const query = `
    query {
      trackedRepositories {
        name
        description
        url
        stars
        language
        owner
      }
    }
  `;
  const response =
    await graphqlClient.request<TrackedRepositoriesResponse>(query);
  return response.trackedRepositories;
};
