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
}

// Define response types
interface HelloResponse {
  hello: string;
}

interface SearchRepositoriesResponse {
  searchRepositories: Repository[];
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
      }
    }
  `;
  const response = await graphqlClient.request<SearchRepositoriesResponse>(
    gqlQuery,
    { query, limit },
  );
  return response.searchRepositories;
};
