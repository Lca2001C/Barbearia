-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Backfill username from email local-part (deduplicated)
WITH ranked AS (
  SELECT
    id,
    lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g')) AS base_username,
    row_number() OVER (
      PARTITION BY lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'))
      ORDER BY created_at, id
    ) AS rn
  FROM "users"
)
UPDATE "users" u
SET "username" = CASE
  WHEN r.rn = 1 THEN r.base_username
  ELSE r.base_username || '_' || r.rn
END
FROM ranked r
WHERE u.id = r.id;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
