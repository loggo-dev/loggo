import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("bg-blue-500"),
    role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
    disabledAt: text("disabled_at"),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("bg-blue-500"),
    icon: text("icon").notNull().default("gallery"),
    kind: text("kind", { enum: ["personal", "shared"] }).notNull(),
    createdBy: text("created_by").notNull().references(() => users.id),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("workspaces_slug_idx").on(table.slug)],
);

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] }), index("workspace_members_user_idx").on(table.userId)],
);

export const logs = sqliteTable(
  "logs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    authorId: text("author_id").notNull().references(() => users.id),
    day: text("day").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
    updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
    deletedAt: text("deleted_at"),
    mirrorDirty: integer("mirror_dirty", { mode: "boolean" }).notNull().default(false),
    posX: integer("pos_x"),
    posY: integer("pos_y"),
    width: integer("width"),
    height: integer("height"),
  },
  (table) => [
    index("logs_workspace_day_idx").on(table.workspaceId, table.day),
    index("logs_workspace_updated_idx").on(table.workspaceId, table.updatedAt),
  ],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("tags_workspace_name_idx").on(table.workspaceId, table.name)],
);

export const logTags = sqliteTable(
  "log_tags",
  {
    logId: text("log_id").notNull().references(() => logs.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.logId, table.tagId] })],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    logId: text("log_id").notNull().references(() => logs.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    dueDate: text("due_date"),
    lineNo: integer("line_no").notNull(),
    completedAt: text("completed_at"),
  },
  (table) => [index("tasks_workspace_due_idx").on(table.workspaceId, table.dueDate)],
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    logId: text("log_id").notNull().references(() => logs.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    storageKey: text("storage_key").notNull(),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [index("attachments_workspace_idx").on(table.workspaceId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
