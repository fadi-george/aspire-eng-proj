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

// Mutation to untrack a repository
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
