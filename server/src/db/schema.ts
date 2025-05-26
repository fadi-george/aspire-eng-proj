import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
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
  (table) => [unique("unique_repo_id").on(table.repoId)]
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

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    endpoint: text("endpoint").notNull(),
    authKey: text("auth_key").notNull(),
    p256dhKey: text("p256dh_key").notNull(),
    expirationTime: timestamp("expiration_time"),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_user_endpoint").on(table.userId, table.endpoint),
    index("user_id_idx").on(table.userId),
    index("endpoint_idx").on(table.endpoint),
  ]
);

export const notificationTypeEnum = pgEnum("notification_type", ["releases"]);
export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    notificationType: notificationTypeEnum("notification_type")
      .notNull()
      .default("releases"),
    lastSentAt: timestamp("last_sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_user_notification_type").on(
      table.userId,
      table.notificationType
    ),
    index("user_notification_type_idx").on(
      table.userId,
      table.notificationType
    ),
  ]
);

// relations
export const repositoriesRelations = relations(repositories, ({ many }) => ({
  trackedBy: many(trackedRepositories),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  })
);

export const trackedRepositoriesRelations = relations(
  trackedRepositories,
  ({ one }) => ({
    repository: one(repositories, {
      fields: [trackedRepositories.repoId],
      references: [repositories.repoId],
    }),
    user: one(users, {
      fields: [trackedRepositories.userId],
      references: [users.id],
    }),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  pushSubscriptions: many(pushSubscriptions),
  trackedRepositories: many(trackedRepositories),
}));

export const notificationSettingsRelations = relations(
  notificationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationSettings.userId],
      references: [users.id],
    }),
  })
);
