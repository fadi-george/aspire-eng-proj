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
  stars: number;
  owner: string;
}

export interface TrackedRepository {
  id: number;
  repoId: string;
  name: string;
  description: string | null;
  owner: string;
  published_at: string | null;
  release_tag: string | null;
  last_seen_at: string | null;
}

export interface TrackedRepositoryRelease extends TrackedRepository {
  release_commit: string | null;
  release_notes: string | null;
}

// Define response types
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
  markRepositoryAsSeen: {
    lastSeenAt: string;
  };
}

interface GetTrackedRepositoryResponse {
  getTrackedRepository: TrackedRepositoryRelease | null;
}

interface RefreshRepositoriesResponse {
  refreshRepositories: boolean;
}

// Example query to search repositories
export const searchRepositories = async (query: string, limit: number = 10) => {
  const gqlQuery = `
    query SearchRepositories($query: String!, $limit: Int!) {
      searchRepositories(query: $query, limit: $limit) {
        id
        name
        description
        stars
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
export const trackRepository = async (repoId: string) => {
  const mutation = `
    mutation TrackRepository($repoId: String!) {
      trackRepository(repoId: $repoId) {
        id
        repoId
        description
        last_seen_at
        name
        owner
        published_at
        release_tag
      }
    }
  `;
  const response = await graphqlClient.request<TrackRepositoryResponse>(
    mutation,
    { repoId },
  );
  return response.trackRepository;
};

// Mutation to untrack a repository
export const untrackRepository = async (repoId: string) => {
  const mutation = `
    mutation UntrackRepository($repoId: String!) {
      untrackRepository(repoId: $repoId)
    }
  `;
  const response = await graphqlClient.request<UntrackRepositoryResponse>(
    mutation,
    { repoId },
  );
  return response.untrackRepository;
};

export const getTrackedRepositories = async () => {
  const query = `
    query {
      getTrackedRepositories {
        id
        repoId
        description
        last_seen_at
        name
        owner
        published_at
        release_tag
      }
    }
  `;
  const response =
    await graphqlClient.request<GetTrackedRepositoriesResponse>(query);
  return response.getTrackedRepositories;
};

export const markRepositoryAsSeen = async (repoId: string) => {
  const mutation = `
    mutation MarkRepositoryAsSeen($repoId: String!) {
      markRepositoryAsSeen(repoId: $repoId) {
        lastSeenAt
      }
    }
  `;
  const response = await graphqlClient.request<MarkRepositoryAsSeenResponse>(
    mutation,
    { repoId },
  );
  return response.markRepositoryAsSeen;
};

export const getTrackedRepository = async (owner: string, name: string) => {
  const query = `
    query GetTrackedRepository($owner: String!, $name: String!) {
      getTrackedRepository(owner: $owner, name: $name) {
        id
        repoId
        description
        name
        owner
        last_seen_at
        published_at
        release_tag
        release_commit
        release_notes
      }
    }
  `;
  const response = await graphqlClient.request<GetTrackedRepositoryResponse>(
    query,
    { owner, name },
  );
  return response.getTrackedRepository;
};

export const refreshRepositories = async () => {
  const mutation = `
    mutation RefreshRepositories {
      refreshRepositories
    }
  `;
  const response =
    await graphqlClient.request<RefreshRepositoriesResponse>(mutation);
  return response.refreshRepositories;
};
