-- AlterTable: Add attemptPolicy to Quiz
ALTER TABLE "public"."Quiz" ADD COLUMN IF NOT EXISTS "attemptPolicy" TEXT NOT NULL DEFAULT 'unlimited';

-- AlterTable: Make studentId nullable in Attempt
ALTER TABLE "public"."Attempt" ALTER COLUMN "studentId" DROP NOT NULL;

-- AlterTable: Add userId to Attempt (nullable, for Supabase auth user ID)
ALTER TABLE "public"."Attempt" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable: Add studentName to Attempt (nullable, for unlimited mode when no userId)
ALTER TABLE "public"."Attempt" ADD COLUMN IF NOT EXISTS "studentName" TEXT;

-- CreateIndex: Add index on userId for faster lookups
CREATE INDEX IF NOT EXISTS "Attempt_userId_idx" ON "public"."Attempt"("userId");

-- CreateIndex: Add composite index on quizId and userId for faster lookups
CREATE INDEX IF NOT EXISTS "Attempt_quizId_userId_idx" ON "public"."Attempt"("quizId", "userId");

-- CreateIndex: Add partial unique index to enforce one attempt per user per quiz (only when userId is not null)
-- This ensures that for single-attempt quizzes, each authenticated user can only have one attempt
CREATE UNIQUE INDEX IF NOT EXISTS "Attempt_quizId_userId_unique" 
ON "public"."Attempt"("quizId", "userId") 
WHERE "userId" IS NOT NULL;




