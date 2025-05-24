import type { Mutation, Query } from "@/types/graphql";
import { gql, GraphQLClient } from "graphql-request";

// Create a GraphQL client instance
export const graphqlClient = new GraphQLClient(
  "http://localhost:4000/graphql",
  {
    credentials: "include",
  },
);

type QueryResponse<T extends keyof Query> = Pick<Query, T>;
type MutationResponse<T extends keyof Mutation> = Pick<Mutation, T>;

/**
 * Search GitHub repositories by some search term
 * @param query - Search term (e.g., "react", "typescript")
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of repository results with metadata
 */
export const searchRepositories = async (query: string, limit: number = 10) => {
  const gqlQuery = gql`
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
  const response = await graphqlClient.request<
    QueryResponse<"searchRepositories">
  >(gqlQuery, { query, limit });
  return response.searchRepositories;
};

/**
 * Add a repository to the user's tracked list
 * @param repoId - GitHub repository ID
 * @returns The newly tracked repository object
 */
export const trackRepository = async (repoId: string) => {
  const mutation = gql`
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
  const response = await graphqlClient.request<
    MutationResponse<"trackRepository">
  >(mutation, { repoId });
  return response.trackRepository;
};

/**
 * Remove a repository from the user's tracked list
 * @param repoId - GitHub repository ID to untrack
 */
export const untrackRepository = async (repoId: string) => {
  const mutation = gql`
    mutation UntrackRepository($repoId: String!) {
      untrackRepository(repoId: $repoId)
    }
  `;
  const response = await graphqlClient.request<
    MutationResponse<"untrackRepository">
  >(mutation, { repoId });
  return response.untrackRepository;
};

/**
 * Get all repositories currently being tracked by the user
 * @returns Array of tracked repositories with release information
 */
export const getTrackedRepositories = async () => {
  const query = gql`
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
    await graphqlClient.request<QueryResponse<"getTrackedRepositories">>(query);
  return response.getTrackedRepositories;
};

/**
 * Mark a repository as "seen" by updating the last seen at timestamp
 * @returns The new last seen at timestamp
 */
export const markRepositoryAsSeen = async (repoId: string) => {
  const mutation = gql`
    mutation MarkRepositoryAsSeen($repoId: String!) {
      markRepositoryAsSeen(repoId: $repoId) {
        lastSeenAt
      }
    }
  `;
  const response = await graphqlClient.request<
    MutationResponse<"markRepositoryAsSeen">
  >(mutation, { repoId });
  return response.markRepositoryAsSeen;
};

/**
 * Get tracked repository information with release notes and commit information
 * @param owner - GitHub repository owner
 * @param name - GitHub repository name
 * @returns Tracked repository information with release details
 */
export const getTrackedRepository = async (owner: string, name: string) => {
  const query = gql`
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
  const response = await graphqlClient.request<
    QueryResponse<"getTrackedRepository">
  >(query, { owner, name });
  return response.getTrackedRepository;
};

/**
 * Refresh data (release tag, published at date, etc.) for all tracked repositories
 * including owner and name should those change if at all
 * @returns Object containing any repositories that failed to refresh
 */
export const refreshRepositories = async () => {
  const mutation = gql`
    mutation RefreshRepositories {
      refreshRepositories {
        failedRepos {
          repoId
          name
          owner
        }
      }
    }
  `;
  const response =
    await graphqlClient.request<MutationResponse<"refreshRepositories">>(
      mutation,
    );
  return response.refreshRepositories;
};

/**
 * Refresh release data for a single repository
 * @param repoId - GitHub repository ID
 * @returns The refreshed repository information (published at date, release tag, etc.)
 */
export const refreshRepository = async (repoId: string) => {
  const mutation = gql`
    mutation RefreshRepository($repoId: String!) {
      refreshRepository(repoId: $repoId) {
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
  const response = await graphqlClient.request<
    MutationResponse<"refreshRepository">
  >(mutation, { repoId });
  return response.refreshRepository;
};
