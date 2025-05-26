import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./src/graphql.ts",
  generates: {
    "../shared/types/graphql.ts": {
      plugins: [
        "typescript",
        // "typescript-operations",
        // "typescript-graphql-request",
      ],
      config: {
        avoidOptionals: true,
        skipTypename: true,
        rawRequest: false,
        scalars: {
          Void: "void",
        },
      },
    },
    // "./graphql.schema.json": {
    //   plugins: ["introspection"],
    // },
  },
};

export default config;
