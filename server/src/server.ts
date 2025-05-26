import { zValidator } from "@hono/zod-validator";
import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { jwt as jwtHono } from "hono/jwt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import db from "./db";
import { pushSubscriptions, users } from "./db/schema";
import { yoga } from "./graphql";

// Start cron job
import { UserPushSubscription } from "@/shared/types/subscription";
import "./cron";

const TOKEN_KEY = "authToken";

const jwtMiddleware = jwtHono({
  secret: process.env.JWT_SECRET!,
  cookie: {
    key: TOKEN_KEY,
  },
});

const app = new Hono<{
  Variables: {
    jwtPayload: {
      userId: number;
    };
  };
}>();

app.use(
  "/*",
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

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
    const [user] = await db
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

    const authToken = jwt.sign(
      { userId: user!.id },
      process.env.JWT_SECRET as string
    );

    // Set HTTP-only cookie
    setCookie(c, TOKEN_KEY, authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/auth/me", jwtMiddleware, async (c) => {
  try {
    const payload = c.get("jwtPayload");
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, payload.userId),
    });

    return c.json({ ...user, pushSubscriptions: subscriptions });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/auth/logout", async (c) => {
  setCookie(c, "authToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });
  return c.json({ success: true });
});

app.post(
  "/api/notifications/subscribe",
  jwtMiddleware,
  zValidator(
    "json",
    z.object({
      subscription: z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
        expirationTime: z.number().nullable(),
      }),
    })
  ),
  async (c) => {
    const payload = c.get("jwtPayload");
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const { subscription } = await c.req.valid("json");
    const pushSubscription = (await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        expirationTime: subscription.expirationTime
          ? new Date(subscription.expirationTime)
          : null,
        userAgent: c.req.header("User-Agent"),
      })
      .returning()) satisfies UserPushSubscription[];

    return c.json({ pushSubscription });
  }
);

// GraphQL endpoint
app.all("/graphql", async (c) => {
  return yoga(c.req.raw);
});

const server = Bun.serve({
  fetch: app.fetch,
  port: 4000,
});

console.info(`Server is running on http://${server.hostname}:${server.port}`);
