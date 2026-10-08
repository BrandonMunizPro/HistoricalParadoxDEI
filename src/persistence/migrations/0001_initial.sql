CREATE TABLE IF NOT EXISTS `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `scenario` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`units_per_day` integer NOT NULL,
	`epoch_sim_time` text NOT NULL,
	`epoch_day_number` integer NOT NULL,
	`era_name` text NOT NULL,
	`era_direction` text NOT NULL,
	`era_first_year_number` integer NOT NULL,
	`era_first_year_start_day_number` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `calendar_month` (
	`month_index` integer PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`days` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `entity` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`scalar_state` integer,
	`ended` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pending_work` (
	`work_identifier` text PRIMARY KEY NOT NULL,
	`class_rank` integer NOT NULL,
	`due_sim_time` text NOT NULL,
	`work_kind` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ledger_event` (
	`id` text PRIMARY KEY NOT NULL,
	`occurred_at_sim_time` text NOT NULL,
	`event_type` text NOT NULL,
	`participants` text NOT NULL,
	`factions` text NOT NULL,
	`locations` text NOT NULL,
	`magnitude` integer,
	`causes` text NOT NULL,
	`witnesses` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ledger_consequence` (
	`source_id` text NOT NULL,
	`consequence_id` text NOT NULL,
	PRIMARY KEY (`source_id`, `consequence_id`)
);