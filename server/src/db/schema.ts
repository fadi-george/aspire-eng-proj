import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
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
  (table) => ({
    githubIdIdx: index("github_id_idx").on(table.githubId),
  })
);
