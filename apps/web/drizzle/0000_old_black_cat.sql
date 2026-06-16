CREATE TABLE `guestbook_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vid` text NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_guestbook_vid` ON `guestbook_entries` (`vid`);