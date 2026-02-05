"use client";

import React, { use, useEffect, useState } from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudent } from "@/context/StudentContext";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function StagePage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params);
  const search = useSearchParams();
  const router = useRouter();
  const { student } = useStudent();
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const isFinal = search?.get("final") === "true";

  useEffect(() => {
    // Fetch quiz info to check attempt policy
    const fetchQuizInfo = async () => {
      try {
        const response = await fetch(`/api/student/quiz/${resolvedParams.quizId}`);
        if (response.ok) {
          const data = await response.json();
          setQuizInfo(data.quiz);
        }
      } catch (error) {
        console.error('Error fetching quiz info:', error);
      }
    };

    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    if (isFinal) {
      fetchQuizInfo();
    }
  }, [isFinal, resolvedParams.quizId]);

  function handleTryAgain() {
    // For unlimited quizzes, go back to the same quiz
    // For single-attempt quizzes, this button won't be shown
    router.push(`/student?quizId=${resolvedParams.quizId}`);
  }

  return (
    <Box p={8} textAlign="center">
      <VStack gap={6}>
        <Heading size="lg">
          {isFinal ? "Final Stage — Results" : "Game Stage 🎮"}
        </Heading>

        {isFinal ? (
          <>
            <Text fontSize="xl">Congratulations, {student.fullName || "Student"}!</Text>
            <Text fontWeight="bold">Your score: {student.attempts?.[resolvedParams.quizId]?.score ?? 0} / (questions)</Text>
            {/* Only show Try Again button for unlimited quizzes */}
            {quizInfo && quizInfo.attemptPolicy !== 'single-attempt' && (
              <FunButton onClick={handleTryAgain} variant="solid">Try Again</FunButton>
            )}
          </>
        ) : (
          <>
            <Text>When you answer a question you'll see the character cross the scene here.</Text>
          </>
        )}
      </VStack>
    </Box>
  );
}
