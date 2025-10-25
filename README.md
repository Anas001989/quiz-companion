# 🎮 Quiz Companion

**Quiz Companion** is an interactive and gamified learning platform that enhances student engagement by combining quiz-solving with animated character feedback. The app supports multiple answer evaluation modes, animated character reactions (WebP + Lottie), and customizable quiz environments.

This project is designed with **scalability**, **clean architecture**, and **future classroom deployment** in mind. It can be used in schools, tutoring centers, and homeschooling environments.

---

## 🚀 Features

### ✅ Core Learning Mechanics
- **Multiple Question Types:** Single-choice and multi-select
- **Two Answer Modes:**
  - `single-pass` — move to next question after submission
  - `retry-until-correct` — keep practicing until correct answer is selected
- **Student Progress Tracking:** Score and attempt data stored by quiz session
- **Animated Character Feedback:** Characters react to correct / incorrect answers

### 🎨 Character Animation System
- Supports **WebP animated sprites**
- Supports **Lottie (`.json`) animations** for richer fluid motions
- Easy to swap or add character animation packs
- Scenes/Background Modes:
  - Forest *(default, customizable)*

### 🧠 Quiz Management
- Fully modeled in database for scalability:
  - `Quiz`, `Question`, `Option`, `Answer`, `Student`, `Teacher`, `Attempt`
- Designed so quizzes and content can be created by teachers/admins

---

## 🏗️ Tech Stack

| Layer | Technology |
|------|------------|
| Frontend Framework | **Next.js 14 (App Router)** |
| UI Framework | **Chakra UI** |
| Animation Rendering | **WebP + Lottie** |
| Global State | React Context API |
| Database | **Supabase (PostgreSQL)** |
| ORM + Schema | **Prisma** |
| Deployment | Vercel / Supabase Hosting |

---

## 📂 Project Structure

quiz-companion/
│
├─ src/
│ ├─ app/
│ │ └─ quiz/[quizId]/questions/ # Quiz flow pages
│ ├─ components/
│ │ ├─ quiz/ # Quiz UI components
│ │ └─ animations/ # Character animation handling
│ ├─ context/
│ │ └─ StudentContext.tsx # Global state for session & settings
│ ├─ lib/
│ │ └─ supabase.ts # DB client instance
│ └─ data/
│ └─ mockQuestions.ts # Temporary mock fallback data
│
├─ prisma/
│ └─ schema.prisma # Database schema
│
└─ README.md


---

## 🧱 Database Schema (Simplified)

Teacher ──< Quiz ──< Question ──< Option
│ │
│ └─< Answer
│
Student ──< Attempt (tracks score & question index)


This design ensures quizzes are **teacher-owned**, students have **separate progress tracking**, and content can scale without refactoring.

---

## ⚙️ Local Development

### 1) Clone Repo
```bash
git clone https://github.com/YOUR-USERNAME/quiz-companion.git
cd quiz-companion

2) Install Dependencies
npm install

3) Setup Environment

Create .env.local:

NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

4) Run Database Migrations
npx prisma migrate dev

5) Start Development Server
npm run dev

🌱 Roadmap
Status	Feature
✅	Character animation engine with WebP + Lottie support
✅	Answer mode learning reinforcement system
🔄	Load quizzes and questions from Supabase instead of mock data
🔄	Teacher dashboard to create quizzes
🔄	Student profiles and progress history
🔜	Classroom / course structure support
🔜	Multiplayer / group quiz mode
