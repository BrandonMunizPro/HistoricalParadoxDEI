CREATE TABLE IF NOT EXISTS `character` (
	`id` text PRIMARY KEY NOT NULL,
	`born_sim_time` text NOT NULL,
	`died_sim_time` text,
	`designated_successor` text,
	`memories` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `relationship` (
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`facets` text NOT NULL,
	PRIMARY KEY (`from_id`, `to_id`)
);
