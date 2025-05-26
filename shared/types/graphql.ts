export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Void: { input: void; output: void; }
};

export type FailedRepository = {
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  repoId: Scalars['String']['output'];
};

export type MarkRepositoryAsSeenResponse = {
  last_seen_at: Scalars['String']['output'];
};

export type Mutation = {
  markRepositoryAsSeen: MarkRepositoryAsSeenResponse;
  refreshRepositories: RefreshRepositoriesResponse;
  refreshRepository: TrackedRepositoryRelease;
  trackRepository: TrackedRepository;
  untrackRepository: Maybe<Scalars['Void']['output']>;
};


export type MutationMarkRepositoryAsSeenArgs = {
  repoId: Scalars['String']['input'];
};


export type MutationRefreshRepositoryArgs = {
  repoId: Scalars['String']['input'];
};


export type MutationTrackRepositoryArgs = {
  repoId: Scalars['String']['input'];
};


export type MutationUntrackRepositoryArgs = {
  repoId: Scalars['String']['input'];
};

export type Query = {
  getTrackedRepositories: Array<TrackedRepository>;
  getTrackedRepository: Maybe<TrackedRepositoryRelease>;
  searchRepositories: Array<Repository>;
};


export type QueryGetTrackedRepositoryArgs = {
  name: Scalars['String']['input'];
  owner: Scalars['String']['input'];
};


export type QuerySearchRepositoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type RefreshRepositoriesResponse = {
  failedRepos: Array<FailedRepository>;
};

export type Repository = {
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  stars: Scalars['Int']['output'];
};

export type TrackedRepository = {
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  last_seen_at: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  published_at: Maybe<Scalars['String']['output']>;
  release_tag: Maybe<Scalars['String']['output']>;
  repoId: Scalars['String']['output'];
};

export type TrackedRepositoryRelease = {
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  last_seen_at: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  published_at: Maybe<Scalars['String']['output']>;
  release_commit: Maybe<Scalars['String']['output']>;
  release_notes: Maybe<Scalars['String']['output']>;
  release_tag: Maybe<Scalars['String']['output']>;
  repoId: Scalars['String']['output'];
};
