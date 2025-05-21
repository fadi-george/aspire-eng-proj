import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import jwt from "jsonwebtoken";
import { Octokit } from "octokit";
import db from "./db";
import { users } from "./db/schema";
import { yoga } from "./graphql";

const app = new Hono();

app.use("/*", cors());

app.post("/api/auth/github", async (c) => {
  try {
    const { code } = await c.req.json();

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri:
            process.env.GITHUB_REDIRECT_URI ||
            "http://localhost:3000/login/callback",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const data = await response.json();
    const token = data.access_token;

    // Fetch user info from GitHub
    const octokit = new Octokit({ auth: token });
    const { data: userData } = await octokit.rest.users.getAuthenticated();

    // Upsert user data
    await db
      .insert(users)
      .values({
        githubId: userData.id,
        username: userData.login,
        name: userData.name,
        avatarUrl: userData.avatar_url,
      })
      .onConflictDoUpdate({
        target: users.githubId,
        set: {
          username: userData.login,
          name: userData.name,
          avatarUrl: userData.avatar_url,
          updatedAt: new Date(),
        },
      })
      .returning();

    return c.json({
      authToken: jwt.sign({ userId: userData.id }, process.env.JWT_SECRET),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/auth/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "No token provided" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    return c.json(user);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GraphQL endpoint
app.all("/graphql", async (c) => {
  return yoga(c.req.raw);
});

const server = Bun.serve({
  fetch: app.fetch,
  port: 4000,
});

console.info(`Server is running on http://${server.hostname}:${server.port}`);
