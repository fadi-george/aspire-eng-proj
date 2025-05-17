import { createSchema, createYoga } from "graphql-yoga";

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => "Hello from Yoga!",
      },
    },
  }),
});

// const server = createServer(yoga);

// server.listen(4000, () => {
//   console.info("Server is running on http://localhost:4000/graphql");
// });
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
