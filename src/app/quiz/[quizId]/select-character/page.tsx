"use client";

import React, { use, useEffect, useState } from "react";
import { Box, Heading, Spinner, VStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CharacterPicker from "@/components/quiz/CharacterPicker";
import { useStudent } from "@/context/StudentContext";
import { supabase } from "@/lib/supabase/supabaseClient";

const CHARACTERS = [
  { id: "bear", name: "Bear", thumbnail: "/assets/characters/bear-thumb.png", lottie: "/lottie/bear_idle.json", format:"webp" },
  { id: "cat", name: "Cat", thumbnail: "/assets/characters/cat-thumb.png", lottie: "/lottie/cat_idle.json", format:"json"},
  { id: "robot", name: "Robot", thumbnail: "/assets/characters/robot-thumb.png", lottie: "/lottie/robot_idle.json", format:"json"},
];

export default function SelectCharacterPage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { selectCharacter, student, setStudent } = useStudent();
  const [user, setUser] = useState<any>(null);
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const hasFetchedRef = React.useRef(false);
  const fetchingRef = React.useRef(false);

  // Check auth state and quiz policy
  useEffect(() => {
    // Prevent duplicate calls
    if (hasFetchedRef.current || fetchingRef.current) return;
    
    const checkAuthAndQuiz = async () => {
      fetchingRef.current = true;
      try {
        // Wait a bit for Supabase to process the redirect token
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check authentication
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setUser(session?.user ?? null);

        // Fetch quiz info to check policy (only once)
        let currentQuizInfo = quizInfo;
        if (!hasFetchedRef.current) {
          const response = await fetch(`/api/student/quiz/${resolvedParams.quizId}`);
          if (response.ok) {
            const data = await response.json();
            currentQuizInfo = data.quiz;
            setQuizInfo(data.quiz);
            hasFetchedRef.current = true;
          }
        }

        // If authenticated user, set student info from user email
        if (session?.user?.email && session?.user?.id) {
          setStudent({
            fullName: session.user.email.split('@')[0] || 'Student',
            nickname: undefined,
            selectedCharacter: null,
          });

          // Check if user has already attempted this quiz (for single-attempt quizzes)
          if (currentQuizInfo?.attemptPolicy === 'single-attempt') {
            const attemptCheck = await fetch(`/api/student/attempts/check?quizId=${resolvedParams.quizId}&userId=${session.user.id}`);
            const attemptData = await attemptCheck.json();
            
            if (attemptData.hasAttempt) {
              // User already attempted, redirect to student page with error message
              const params = new URLSearchParams({ 
                quizId: resolvedParams.quizId,
                error: 'already-attempted'
              });
              router.push(`/student?${params.toString()}`);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth/quiz:', error);
      } finally {
        setChecking(false);
        fetchingRef.current = false;
      }
    };

    checkAuthAndQuiz();

    // Listen for auth state changes (in case user just clicked magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        if (session.user.email && session.user.id) {
          setStudent({
            fullName: session.user.email.split('@')[0] || 'Student',
            nickname: undefined,
            selectedCharacter: null,
          });

          // Check if user has already attempted this quiz (fetch quiz info first if needed)
          const checkAttempt = async () => {
            if (!quizInfo) {
              const quizResponse = await fetch(`/api/student/quiz/${resolvedParams.quizId}`);
              if (quizResponse.ok) {
                const quizData = await quizResponse.json();
                setQuizInfo(quizData.quiz);
                
                if (quizData.quiz?.attemptPolicy === 'single-attempt') {
                  const attemptCheck = await fetch(`/api/student/attempts/check?quizId=${resolvedParams.quizId}&userId=${session.user.id}`);
                  const attemptData = await attemptCheck.json();
                  
                  if (attemptData.hasAttempt) {
                    const params = new URLSearchParams({ 
                      quizId: resolvedParams.quizId,
                      error: 'already-attempted'
                    });
                    router.push(`/student?${params.toString()}`);
                    return;
                  }
                }
              }
            } else if (quizInfo.attemptPolicy === 'single-attempt') {
              const attemptCheck = await fetch(`/api/student/attempts/check?quizId=${resolvedParams.quizId}&userId=${session.user.id}`);
              const attemptData = await attemptCheck.json();
              
              if (attemptData.hasAttempt) {
                const params = new URLSearchParams({ 
                  quizId: resolvedParams.quizId,
                  error: 'already-attempted'
                });
                router.push(`/student?${params.toString()}`);
                return;
              }
            }
            setChecking(false);
          };
          
          checkAttempt().catch(() => setChecking(false));
        } else {
          setChecking(false);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setChecking(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.quizId]); // Only depend on quizId to prevent duplicate calls

  // Redirect logic based on quiz policy
  useEffect(() => {
    if (checking) return;

    const isSingleAttempt = quizInfo?.attemptPolicy === 'single-attempt';
    
    if (isSingleAttempt) {
      // Single-attempt: require authentication
      if (!user) {
        const params = new URLSearchParams({ quizId: resolvedParams.quizId });
        router.push(`/student?${params.toString()}`);
      }
    } else {
      // Unlimited: require fullName (traditional flow)
      if (!student.fullName) {
        const params = new URLSearchParams({ quizId: resolvedParams.quizId });
        router.push(`/student?${params.toString()}`);
      }
    }
  }, [checking, user, student.fullName, quizInfo, resolvedParams.quizId, router]);

  if (checking) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap={4}>
          <Spinner size="xl" />
          <Text>Loading...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={8} textAlign="center">
      <Heading size="lg" mb={6}>
        Choose Your Character 🧑‍🚀
      </Heading>

      <CharacterPicker
        characters={CHARACTERS}
        onSelect={selectCharacter}
        quizId={resolvedParams.quizId}
      />
    </Box>
  );
}
