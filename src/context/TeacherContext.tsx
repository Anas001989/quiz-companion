"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

type TeacherContextType = {
  teacher: Teacher | null;
  setTeacher: (teacher: Teacher | null) => void;
  logout: () => void;
  isLoggedIn: boolean;
};

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export function TeacherProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacherState] = useState<Teacher | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for teacher ID in URL params on mount
  useEffect(() => {
    const teacherId = searchParams.get('teacherId');
    if (teacherId) {
      // Store teacher ID in localStorage for persistence
      localStorage.setItem('teacherId', teacherId);
      // We could fetch teacher details here, but for now we'll just store the ID
      setTeacherState({ 
        id: teacherId, 
        firstName: 'Teacher', 
        lastName: '', 
        username: '', 
        email: '' 
      });
    } else {
      // Check localStorage for existing teacher
      const storedTeacherId = localStorage.getItem('teacherId');
      if (storedTeacherId) {
        setTeacherState({ 
          id: storedTeacherId, 
          firstName: 'Teacher', 
          lastName: '', 
          username: '', 
          email: '' 
        });
      }
    }
  }, [searchParams]);

  const setTeacher = (teacher: Teacher | null) => {
    setTeacherState(teacher);
    if (teacher) {
      localStorage.setItem('teacherId', teacher.id);
    } else {
      localStorage.removeItem('teacherId');
    }
  };

  const logout = () => {
    setTeacherState(null);
    localStorage.removeItem('teacherId');
    router.push('/teacher/auth');
  };

  const isLoggedIn = !!teacher;

  return (
    <TeacherContext.Provider value={{ teacher, setTeacher, logout, isLoggedIn }}>
      {children}
    </TeacherContext.Provider>
  );
}

export function useTeacher() {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within TeacherProvider');
  }
  return context;
}
