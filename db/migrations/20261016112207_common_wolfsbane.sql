CREATE TABLE `blog_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `blog_notes_slug_id_idx` ON `blog_notes` (`slug`,`id`);