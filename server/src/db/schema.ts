import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    githubId: integer("github_id").notNull().unique(),
    username: varchar("username", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("github_id_idx").on(table.githubId)]
);

export const repositories = pgTable(
  "repositories",
  {
    id: serial("id").primaryKey(),
    repoId: bigint("repo_id", { mode: "number" }).notNull().unique(),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    description: text("description"),
    publishedAt: timestamp("published_at"),
    tagName: text("tag_name"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique("unique_repo").on(table.owner, table.name)]
);

export const trackedRepositories = pgTable(
  "tracked_repositories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    repoId: bigint("repo_id", { mode: "number" })
      .notNull()
      .references(() => repositories.repoId),
    lastSeenTag: text("last_seen_tag"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique("unique_user_repo").on(table.userId, table.repoId)]
);
