import { Hono } from "hono";
import { cors } from "hono/cors";
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
    return c.json({ access_token: data.access_token });
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
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const userData = await response.json();
    return c.json(userData);
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
