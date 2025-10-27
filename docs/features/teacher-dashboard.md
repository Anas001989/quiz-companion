# Feature: Teacher Dashboard (Fetch Data From Supabase)

## Goal
Replace mock data and student-context-based quiz storage. The teacher should view all quizzes they created, along with basic metadata (title, number of questions).

## User Story
As a Teacher, after logging in, I should see a dashboard showing:
- My quizzes
- A button to create a new quiz
- A way to click a quiz to manage its questions

## Related Tables (Supabase)
- `Teacher` (id, name, email)
- `Quiz` (id, title, description, teacherId, createdAt)
- `Question` (id, quizId, text, type)
- `Option` (id, questionId, text, isCorrect)

## Required Updates

### 1. Create Page
Path:
