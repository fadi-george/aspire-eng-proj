# Aspire Project

Implements project instructor with the goal of tracking GitHub repositories releases and marking releases as seen.
Frontend is built using: React, Typescript, Vite, Tailwind, ShadCn, Tanstack
Server is built using: GraphQl Yoga, Hono, Drizzle

## Setup

Use bunjs. You can grab it like so:  
`.curl -fsSL https://bun.sh/install | bash`

### Server

Create an `.env` file and add variables as seen in the `.env.example` file. To limit quota errors, generate a [GitHub person access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token).

The login with GitHub logic will require setting up an [Oauth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). Create one and save client id and client secret to the .env file.

Create or use a Postgres DB instance and save the DB url. Can use a provider like Supabase.

You can generate a jwt secret like so: `openssl rand -hex 32`

Now run `bun run db:generate` to create migration files and `bun run db:migrate` to perform the migration and setup the tables.

## Running

You could also open two terminal instances and run `bun run dev` for the `/app` and `/server` folders.
