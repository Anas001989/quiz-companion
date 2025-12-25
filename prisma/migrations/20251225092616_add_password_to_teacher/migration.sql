-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "password" TEXT;

-- Set temporary password for existing teachers
-- Password: temp123456 (teacher should change this after first login)
UPDATE "Teacher" SET "password" = '$2b$10$ByI4R5/XctKdxPbNzsNmcurBur7jClpS8m.2XVlc2JUxAA38mfdFi' WHERE "password" IS NULL;

-- Make password required
ALTER TABLE "Teacher" ALTER COLUMN "password" SET NOT NULL;

