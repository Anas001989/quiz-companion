-- Verification Script
-- Run this in your NEW Supabase project's SQL Editor to verify migration

-- Check table counts
SELECT 'Teacher' as table_name, COUNT(*) as count FROM "Teacher"
UNION ALL
SELECT 'Student', COUNT(*) FROM "Student"
UNION ALL
SELECT 'Quiz', COUNT(*) FROM "Quiz"
UNION ALL
SELECT 'Question', COUNT(*) FROM "Question"
UNION ALL
SELECT 'Option', COUNT(*) FROM "Option"
UNION ALL
SELECT 'Attempt', COUNT(*) FROM "Attempt"
UNION ALL
SELECT 'Answer', COUNT(*) FROM "Answer"
ORDER BY table_name;

-- Check for recent quizzes
SELECT id, title, "createdAt", 
       (SELECT COUNT(*) FROM "Question" WHERE "quizId" = q.id) as question_count
FROM "Quiz" q
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check for recent attempts
SELECT id, score, "createdAt",
       (SELECT COUNT(*) FROM "Answer" WHERE "attemptId" = a.id) as answer_count
FROM "Attempt" a
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verify foreign key relationships
SELECT 
    (SELECT COUNT(*) FROM "Question" WHERE "quizId" NOT IN (SELECT id FROM "Quiz")) as orphaned_questions,
    (SELECT COUNT(*) FROM "Option" WHERE "questionId" NOT IN (SELECT id FROM "Question")) as orphaned_options,
    (SELECT COUNT(*) FROM "Answer" WHERE "questionId" NOT IN (SELECT id FROM "Question")) as orphaned_answers;

