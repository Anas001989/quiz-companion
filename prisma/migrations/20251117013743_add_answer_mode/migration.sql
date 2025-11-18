-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "answerMode" TEXT NOT NULL DEFAULT 'retry-until-correct';

-- Update existing quizzes to have the default value
UPDATE "Quiz" SET "answerMode" = 'retry-until-correct' WHERE "answerMode" IS NULL;

