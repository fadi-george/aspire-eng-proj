import { GraphQLClient } from "graphql-request";

// Create a GraphQL client instance
export const graphqlClient = new GraphQLClient(
  "http://localhost:4000/graphql",
  {
    credentials: "include",
  },
);

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
  seen: boolean;
  tag_name: string | null;
  published_at: string | null;
}

export interface TrackedRepositoryRelease extends TrackedRepository {
  body: string | null;
  commit: string | null;
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

interface GetTrackedRepositoriesResponse {
  getTrackedRepositories: TrackedRepository[];
}

interface MarkRepositoryAsSeenResponse {
  markRepositoryAsSeen: boolean;
}

interface GetTrackedRepositoryResponse {
  getTrackedRepository: TrackedRepositoryRelease | null;
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
        description
        language
        name
        owner
        published_at
        seen
        stars
        tag_name
        url
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
      getTrackedRepositories {
        description
        last_seen_at
        name
        owner
        published_at
        tag_name
      }
    }
  `;
  const response =
    await graphqlClient.request<GetTrackedRepositoriesResponse>(query);
  return response.getTrackedRepositories;
};

export const markRepositoryAsSeen = async (name: string, owner: string) => {
  const mutation = `
    mutation MarkRepositoryAsSeen($name: String!, $owner: String!) {
      markRepositoryAsSeen(name: $name, owner: $owner)
    }
  `;
  const response = await graphqlClient.request<MarkRepositoryAsSeenResponse>(
    mutation,
    { name, owner },
  );
  return response.markRepositoryAsSeen;
};

export const getTrackedRepository = async (owner: string, name: string) => {
  const query = `
    query GetTrackedRepository($owner: String!, $name: String!) {
      getTrackedRepository(owner: $owner, name: $name) {
        body
        commit
        description
        language
        name
        owner
        published_at
        seen
        stars
        tag_name
        url
      }
    }
  `;
  const response = await graphqlClient.request<GetTrackedRepositoryResponse>(
    query,
    { owner, name },
  );
  return response.getTrackedRepository;
};
