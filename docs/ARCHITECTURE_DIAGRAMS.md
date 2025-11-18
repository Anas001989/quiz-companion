# Quiz Companion - System Architecture Diagrams

This document contains Mermaid diagrams that can be rendered in:
- GitHub (native support)
- VS Code (with Mermaid extension)
- Documentation sites (Docusaurus, GitBook, etc.)
- Online tools (mermaid.live)

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        T["Teacher UI - Dashboard"]
        S["Student UI - Quiz Taking"]
        C["Character Animations"]
    end
    
    subgraph "Application Layer - Next.js"
        API["API Routes - Serverless Functions"]
        PR["Prisma ORM Client"]
    end
    
    subgraph "External Services"
        DB[("PostgreSQL Database")]
        AI["OpenAI API - GPT-4o-mini"]
        SB["Supabase Hosting"]
    end
    
    T --> API
    S --> API
    C --> API
    API --> PR
    API --> AI
    PR --> DB
    DB --> SB
```

---

## 2. AI Quiz Generation Sequence Diagram

```mermaid
sequenceDiagram
    participant T as Teacher
    participant UI as AIGenerateQuestionsModal
    participant API as Next.js API Route
    participant OpenAI as OpenAI API
    participant DB as PostgreSQL

    T->>UI: Enter quiz description & counts
    T->>UI: Click "Generate Questions"
    UI->>API: POST /api/teacher/quiz/[id]/generate-questions
    Note over API: Validate inputs<br/>(description, counts)
    API->>OpenAI: Send prompt with requirements
    Note over OpenAI: GPT-4o-mini processes<br/>Returns JSON questions
    OpenAI-->>API: JSON response with questions
    Note over API: Parse & validate questions<br/>Check correct answers
    API-->>UI: Return validated questions
    UI->>T: Display preview of questions
    T->>UI: Review & approve
    UI->>API: Save questions to quiz
    API->>DB: Create Question & Option records
    DB-->>API: Confirm creation
    API-->>UI: Success response
    UI->>T: Show success message
```

---

## 3. Student Quiz Taking Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant UI as Quiz UI
    participant API as API Routes
    participant DB as Database
    participant Anim as Character Animations

    S->>UI: Access quiz link
    UI->>S: Enter name & nickname
    S->>UI: Select character
    UI->>API: GET /api/teacher/quiz/[id]/questions
    API->>DB: Fetch quiz & questions
    DB-->>API: Return quiz data
    API-->>UI: Display first question
    
    loop For each question
        S->>UI: Select answer(s)
        S->>UI: Submit answer
        UI->>API: Validate answer locally
        alt Correct Answer
            UI->>Anim: Trigger celebration
            Anim-->>S: Show success animation
        else Incorrect Answer
            UI->>Anim: Trigger sad animation
            Anim-->>S: Show disappointment
            alt Retry Mode
                UI->>S: Allow retry
            else Single Pass
                UI->>S: Move to next
            end
        end
    end
    
    UI->>API: POST /api/student/attempts
    API->>DB: Calculate score
    API->>DB: Save attempt & answers
    DB-->>API: Confirm save
    API-->>UI: Return results
    UI->>S: Show results page
```

---

## 4. AI Generation Process Flow

```mermaid
flowchart TD
    Start([Teacher clicks AI Generate]) --> Input["Enter Description & Question Counts"]
    Input --> Validate{Validate Inputs}
    Validate -->|Invalid| Error[Show Error]
    Validate -->|Valid| CallAPI["POST /api/teacher/quiz/[id]/generate-questions"]
    CallAPI --> OpenAI["Call OpenAI API GPT-4o-mini"]
    OpenAI --> Parse[Parse JSON Response]
    Parse --> Check{Validate Questions}
    Check -->|Invalid| Retry["Show Error - Option to Retry"]
    Check -->|Valid| Preview[Show Preview Modal]
    Preview --> Review{Teacher Reviews}
    Review -->|Regenerate| CallAPI
    Review -->|Approve| Save["Save Questions to Database"]
    Save --> Success[Show Success Message]
    Error --> Start
    Retry --> Start
    Success --> End([Quiz Ready])
```

---

## 5. Database Entity Relationship Diagram

```mermaid
erDiagram
    Teacher ||--o{ Quiz : creates
    Quiz ||--o{ Question : contains
    Question ||--o{ Option : has
    Student ||--o{ Attempt : makes
    Quiz ||--o{ Attempt : receives
    Attempt ||--o{ Answer : includes
    Question ||--o{ Answer : references
    Option ||--o{ Answer : references
    
    Teacher {
        string id PK
        string email UK
        string name
        datetime createdAt
    }
    
    Quiz {
        string id PK
        string title
        string teacherId FK
        string answerMode
        datetime createdAt
    }
    
    Question {
        string id PK
        string text
        enum type
        string quizId FK
    }
    
    Option {
        string id PK
        string text
        boolean isCorrect
        string questionId FK
    }
    
    Student {
        string id PK
        string fullName
        string nickName
        datetime createdAt
    }
    
    Attempt {
        string id PK
        string studentId FK
        string quizId FK
        int score
        datetime createdAt
    }
    
    Answer {
        string id PK
        string attemptId FK
        string questionId FK
        string optionId FK
    }
```

---

## 6. Component Architecture

```mermaid
graph TD
    subgraph "Pages"
        TD[Teacher Dashboard]
        TQ[Teacher Quiz Management]
        SP[Student Page]
        SC[Select Character]
        QP[Quiz Questions Page]
        RP[Results Page]
    end
    
    subgraph "Components"
        QF[QuestionForm]
        AIM[AIGenerateQuestionsModal]
        QAM[QuizAttemptsModal]
        QQB[QuizQuestionBox]
        CP[CharacterPicker]
        GS[GameStageBox]
        QR[QuizResult]
    end
    
    subgraph "Context"
        TC[TeacherContext]
        SCtx[StudentContext]
    end
    
    subgraph "API Routes"
        TAPI[Teacher APIs]
        SAPI[Student APIs]
        OAI[OpenAI Integration]
    end
    
    TD --> TAPI
    TQ --> QF
    TQ --> AIM
    TQ --> QAM
    SP --> SC
    SC --> QP
    QP --> QQB
    QP --> GS
    QP --> SAPI
    QP --> RP
    RP --> QR
    
    TC --> TAPI
    SCtx --> SAPI
    AIM --> OAI
```

---

## 7. Performance Optimization Strategy

```mermaid
graph LR
    subgraph "Database Layer"
        IDX["Strategic Indexes - Foreign Keys - Frequently Queried Fields"]
        POOL["Connection Pooling via Supabase"]
    end
    
    subgraph "Query Optimization"
        COUNT["Use _count Instead of Loading Full Relations"]
        SELECT["Selective Field Queries"]
        BATCH["Batch Operations for Answer Creation"]
    end
    
    subgraph "Client Optimization"
        CTX["React Context for State Management"]
        MEMO["Component Memoization - Prevent Unnecessary Renders"]
    end
    
    IDX --> COUNT
    POOL --> SELECT
    COUNT --> BATCH
    SELECT --> CTX
    BATCH --> MEMO
```

---

## 8. Request Flow Diagram

```mermaid
flowchart LR
    subgraph "Client Request"
        A[User Action]
    end
    
    subgraph "Next.js Layer"
        B[API Route Handler]
        C[Prisma Client]
    end
    
    subgraph "Data Layer"
        D[(PostgreSQL)]
    end
    
    subgraph "External API"
        E[OpenAI API]
    end
    
    A -->|HTTP Request| B
    B -->|Query| C
    C -->|SQL| D
    B -->|API Call| E
    D -->|Data| C
    E -->|JSON| B
    C -->|Response| B
    B -->|JSON Response| A
```

---

## How to Render These Diagrams

### Option 1: GitHub
- Simply push this file to GitHub - Mermaid diagrams render automatically

### Option 2: VS Code
- Install "Markdown Preview Mermaid Support" extension
- Open this file and use Markdown preview

### Option 3: Online Editor
- Copy diagram code to [mermaid.live](https://mermaid.live)
- Export as PNG/SVG for presentations

### Option 4: Documentation Sites
- Docusaurus, GitBook, and many others support Mermaid natively

---

## Notes for Interview Presentation

1. **Start with High-Level Architecture** (Diagram 1) - Shows overall system
2. **Explain AI Integration** (Diagrams 2 & 4) - Key differentiator
3. **Show User Flow** (Diagram 3) - Demonstrates user experience focus
4. **Database Design** (Diagram 5) - Shows data modeling skills
5. **Component Structure** (Diagram 6) - Shows code organization
6. **Performance** (Diagram 7) - Shows optimization thinking

These diagrams can be used in:
- PowerPoint presentations (export as images)
- Live coding demos
- Whiteboard discussions
- Documentation

