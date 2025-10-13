"use client";

import React, { use } from "react";
import { Box, Heading, Text, VStack, Button } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudent } from "@/context/StudentContext";

export default function StagePage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params);
  const search = useSearchParams();
  const router = useRouter();
  const { student } = useStudent();

  const isFinal = search?.get("final") === "true";

  function handlePlayAgain() {
    // reset student progress for this quiz and go to root
    router.push("/");
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
            <Button onClick={handlePlayAgain} colorScheme="blue">Play Again</Button>
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
