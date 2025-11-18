-- CreateIndex
CREATE INDEX "Answer_attemptId_idx" ON "public"."Answer"("attemptId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "public"."Answer"("questionId");

-- CreateIndex
CREATE INDEX "Attempt_quizId_idx" ON "public"."Attempt"("quizId");

-- CreateIndex
CREATE INDEX "Attempt_studentId_idx" ON "public"."Attempt"("studentId");

-- CreateIndex
CREATE INDEX "Attempt_createdAt_idx" ON "public"."Attempt"("createdAt");

-- CreateIndex
CREATE INDEX "Option_questionId_idx" ON "public"."Option"("questionId");

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "public"."Question"("quizId");

-- CreateIndex
CREATE INDEX "Quiz_teacherId_idx" ON "public"."Quiz"("teacherId");

-- CreateIndex
CREATE INDEX "Quiz_createdAt_idx" ON "public"."Quiz"("createdAt");
