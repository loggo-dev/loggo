CREATE TABLE `applied_templates` (
	`workspace_id` text NOT NULL,
	`day` text NOT NULL,
	`applied_at` text DEFAULT (current_timestamp) NOT NULL,
	PRIMARY KEY(`workspace_id`, `day`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`log_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attachments_workspace_idx` ON `attachments` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `log_tags` (
	`log_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`log_id`, `tag_id`),
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`author_id` text NOT NULL,
	`day` text NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`deleted_at` text,
	`mirror_dirty` integer DEFAULT false NOT NULL,
	`pos_x` integer,
	`pos_y` integer,
	`width` integer,
	`height` integer,
	`z_index` integer DEFAULT 0 NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `logs_workspace_day_idx` ON `logs` (`workspace_id`,`day`);--> statement-breakpoint
CREATE INDEX `logs_workspace_updated_idx` ON `logs` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_workspace_name_idx` ON `tags` (`workspace_id`,`name`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`log_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`text` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`due_date` text,
	`line_no` integer NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tasks_workspace_due_idx` ON `tasks` (`workspace_id`,`due_date`);--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`mirror_dirty` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `templates_workspace_idx` ON `templates` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'bg-blue-500' NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`disabled_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	PRIMARY KEY(`workspace_id`, `user_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'bg-blue-500' NOT NULL,
	`icon` text DEFAULT 'gallery' NOT NULL,
	`kind` text NOT NULL,
	`template_mode` text DEFAULT 'today_only' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_idx` ON `workspaces` (`slug`);--> statement-breakpoint
CREATE VIRTUAL TABLE `logs_fts` USING fts5(
	`log_id` UNINDEXED,
	`workspace_id` UNINDEXED,
	`title`,
	`body`,
	`tag_names`,
	tokenize='unicode61'
);
--> statement-breakpoint
CREATE TRIGGER `logs_fts_insert` AFTER INSERT ON `logs`
WHEN new.deleted_at IS NULL BEGIN
	INSERT INTO logs_fts(log_id, workspace_id, title, body, tag_names)
	VALUES (new.id, new.workspace_id, coalesce(new.title, ''), new.body, '');
END;
--> statement-breakpoint
CREATE TRIGGER `logs_fts_update` AFTER UPDATE OF title, body, deleted_at ON `logs` BEGIN
	DELETE FROM logs_fts WHERE log_id = old.id;
	INSERT INTO logs_fts(log_id, workspace_id, title, body, tag_names)
	SELECT new.id, new.workspace_id, coalesce(new.title, ''), new.body, ''
	WHERE new.deleted_at IS NULL;
END;
--> statement-breakpoint
CREATE TRIGGER `logs_fts_delete` AFTER DELETE ON `logs` BEGIN
	DELETE FROM logs_fts WHERE log_id = old.id;
END;