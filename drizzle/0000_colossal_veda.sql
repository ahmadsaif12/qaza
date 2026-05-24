CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_log" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"uniqueKey" text NOT NULL,
	"type" text NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_log_uniqueKey_unique" UNIQUE("uniqueKey")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prayer_log" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"date" date NOT NULL,
	"prayerName" text NOT NULL,
	"status" text NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qaza_item" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"prayerName" text NOT NULL,
	"dateMissed" date,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password" text,
	"calcMethod" integer DEFAULT 2,
	"timezone" text,
	"latitude" double precision,
	"longitude" double precision,
	"trackWitr" boolean DEFAULT false NOT NULL,
	"asrMethod" integer DEFAULT 0 NOT NULL,
	"qazaPace" text,
	"excusedRanges" text,
	"dayCheckinEnabled" boolean DEFAULT true NOT NULL,
	"nightSummaryEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "prayer_log" ADD CONSTRAINT "prayer_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "qaza_item" ADD CONSTRAINT "qaza_item_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
UPDATE "prayer_log" SET "prayerName" = lower("prayerName") WHERE "prayerName" <> lower("prayerName");
--> statement-breakpoint
UPDATE "qaza_item" SET "prayerName" = lower("prayerName") WHERE "prayerName" <> lower("prayerName");
--> statement-breakpoint
DELETE FROM "prayer_log" target
USING (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "userId", "date", lower("prayerName")
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS row_num
    FROM "prayer_log"
  ) ranked
  WHERE row_num > 1
) duplicate
WHERE target."id" = duplicate."id";
--> statement-breakpoint
DELETE FROM "qaza_item" target
USING (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "userId", "dateMissed", lower("prayerName")
        ORDER BY "isCompleted" DESC, "completedAt" DESC NULLS LAST, "createdAt" DESC, "id" DESC
      ) AS row_num
    FROM "qaza_item"
    WHERE "dateMissed" IS NOT NULL
  ) ranked
  WHERE row_num > 1
) duplicate
WHERE target."id" = duplicate."id";
--> statement-breakpoint
DELETE FROM "push_subscription" target
USING (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "userId", "endpoint"
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS row_num
    FROM "push_subscription"
  ) ranked
  WHERE row_num > 1
) duplicate
WHERE target."id" = duplicate."id";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_log_user_type_idx" ON "notification_log" USING btree ("userId","type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prayer_log_user_date_prayer_unique" ON "prayer_log" USING btree ("userId","date","prayerName");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_log_user_date_idx" ON "prayer_log" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_log_user_status_idx" ON "prayer_log" USING btree ("userId","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscription_user_endpoint_unique" ON "push_subscription" USING btree ("userId","endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscription_user_idx" ON "push_subscription" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "qaza_item_user_date_prayer_unique" ON "qaza_item" USING btree ("userId","dateMissed","prayerName");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qaza_item_user_completed_idx" ON "qaza_item" USING btree ("userId","isCompleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qaza_item_user_prayer_idx" ON "qaza_item" USING btree ("userId","prayerName");
