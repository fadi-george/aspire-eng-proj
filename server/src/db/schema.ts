import { relations } from "drizzle-orm";
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
    repoId: bigint("repo_id", { mode: "bigint" }).notNull().unique(),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    description: text("description"),
    publishedAt: timestamp("published_at"),
    releaseTag: text("release_tag"),
    releaseCommit: text("release_commit"),
    releaseNotes: text("release_notes"),
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
    repoId: bigint("repo_id", { mode: "bigint" })
      .notNull()
      .references(() => repositories.repoId, {
        onDelete: "cascade",
      }),
    lastSeenAt: timestamp("last_seen_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique("unique_user_repo").on(table.userId, table.repoId)]
);

// relations
export const repositoriesRelations = relations(repositories, ({ many }) => ({
  trackedBy: many(trackedRepositories),
}));

export const trackedRepositoriesRelations = relations(
  trackedRepositories,
  ({ one }) => ({
    repository: one(repositories, {
      fields: [trackedRepositories.repoId],
      references: [repositories.repoId],
    }),
  })
);
