import { GraphQLClient } from "graphql-request";

// Create a GraphQL client instance
export const graphqlClient = new GraphQLClient("http://localhost:4000/graphql");

// Define the Repository type
export interface Repository {
  id: string;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  owner: string;
}

export interface TrackedRepository extends Omit<Repository, "id"> {
  tag_name: string | null;
  published_at: string | null;
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
  trackedRepositories: TrackedRepository[];
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
        id
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
export const trackRepository = async (name: string, owner: string) => {
  const mutation = `
    mutation TrackRepository($name: String!, $owner: String!) {
      trackRepository(name: $name, owner: $owner) {
        name
        description
        url
        stars
        language
        owner
        tag_name
        published_at
      }
    }
  `;
  const response = await graphqlClient.request<TrackRepositoryResponse>(
    mutation,
    { name, owner },
  );
  return response.trackRepository;
};

// Mutation to untrack a repository
export const untrackRepository = async (name: string, owner: string) => {
  const mutation = `
    mutation UntrackRepository($name: String!, $owner: String!) {
      untrackRepository(name: $name, owner: $owner)
    }
  `;
  const response = await graphqlClient.request<UntrackRepositoryResponse>(
    mutation,
    { name, owner },
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
        tag_name
        published_at
      }
    }
  `;
  const response =
    await graphqlClient.request<TrackedRepositoriesResponse>(query);
  return response.trackedRepositories;
};
