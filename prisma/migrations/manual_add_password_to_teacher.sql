-- Manual migration to add password field to Teacher table
-- Run this SQL directly on your database if the automatic migration fails

-- Step 1: Add password column as nullable first (to handle existing teachers)
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Step 2: If you have existing teachers, you have two options:
-- Option A: Delete existing teachers (they'll need to re-register with passwords)
-- DELETE FROM "Teacher";

-- Option B: Set a temporary password for existing teachers
-- You'll need to generate a bcrypt hash for a default password first
-- Example (replace with actual bcrypt hash):
-- UPDATE "Teacher" SET "password" = '$2b$10$YourBcryptHashHere' WHERE "password" IS NULL;

-- Step 3: After handling existing teachers, make the column NOT NULL
-- ALTER TABLE "Teacher" ALTER COLUMN "password" SET NOT NULL;

