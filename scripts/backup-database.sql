-- Database Backup Script
-- Run this in your OLD Supabase project's SQL Editor
-- This creates a backup of all your data

-- Export Teachers
COPY (SELECT * FROM "Teacher") TO STDOUT WITH CSV HEADER;

-- Export Students
COPY (SELECT * FROM "Student") TO STDOUT WITH CSV HEADER;

-- Export Quizzes
COPY (SELECT * FROM "Quiz") TO STDOUT WITH CSV HEADER;

-- Export Questions
COPY (SELECT * FROM "Question") TO STDOUT WITH CSV HEADER;

-- Export Options
COPY (SELECT * FROM "Option") TO STDOUT WITH CSV HEADER;

-- Export Attempts
COPY (SELECT * FROM "Attempt") TO STDOUT WITH CSV HEADER;

-- Export Answers
COPY (SELECT * FROM "Answer") TO STDOUT WITH CSV HEADER;

-- Note: Supabase SQL Editor may not support COPY TO STDOUT
-- Use pg_dump instead for full backup (see migration guide)

