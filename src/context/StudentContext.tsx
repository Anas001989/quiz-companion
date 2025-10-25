"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Character = {
  id: string;
  name: string;
  thumbnail: string;
  file?: string | null;
  format: string;
};

export type QuizSettings = {
  // "single-pass" => always move to stage after answer
  // "retry-until-correct" => show sad action & stay on same question on incorrect
  answerMode: "single-pass" | "retry-until-correct";
  scene?: "forest" | "beach" | "city";
};

type Student = {
  fullName: string;
  nickname?: string;
  selectedCharacter?: Character | null;
  // store progress per quiz id
  attempts?: Record<string, { currentIndex: number; score: number }>;
};

type StudentContextType = {
  student: Student;
  setStudent: (partial: Partial<Student>) => void;
  selectCharacter: (c: Character) => void;
  // quiz settings for current quiz session (in real app come from Quiz model)
  quizSettings: QuizSettings;
  setQuizSettings: (s: QuizSettings) => void;
  recordAttemptProgress: (quizId: string, patch: Partial<{ currentIndex: number; score: number }>) => void;
};

const defaultStudent: Student = { fullName: "", nickname: "", selectedCharacter: null, attempts: {} };

const defaultQuizSettings: QuizSettings = { answerMode: "retry-until-correct", scene: "forest" };

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudentState] = useState<Student>(defaultStudent);
  const [quizSettings, setQuizSettingsState] = useState<QuizSettings>(defaultQuizSettings);

  const setStudent = useCallback((partial: Partial<Student>) =>
    setStudentState((prev) => ({ ...prev, ...partial })), []);

  const selectCharacter = useCallback((c: Character) =>
    setStudentState((prev) => ({ ...prev, selectedCharacter: c })), []);

  const setQuizSettings = useCallback((s: QuizSettings) => setQuizSettingsState(s), []);

  const recordAttemptProgress = useCallback((quizId: string, patch: Partial<{ currentIndex: number; score: number }>) => {
    setStudentState(prev => {
      const attempts = { ...(prev.attempts || {}) };
      const cur = attempts[quizId] || { currentIndex: 0, score: 0 };
      attempts[quizId] = { ...cur, ...patch };
      return { ...prev, attempts };
    });
  }, []);

  return (
    <StudentContext.Provider value={{ student, setStudent, selectCharacter, quizSettings, setQuizSettings, recordAttemptProgress }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
