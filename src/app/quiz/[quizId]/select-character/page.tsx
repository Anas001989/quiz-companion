"use client";

import React, { use, useEffect } from "react";
import { Box, Heading } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CharacterPicker from "@/components/quiz/CharacterPicker";
import { useStudent } from "@/context/StudentContext";

const CHARACTERS = [
  { id: "bear", name: "Bear", thumbnail: "/assets/characters/bear-thumb.png", lottie: "/lottie/bear_idle.json", format:"webp" },
  { id: "cat", name: "Cat", thumbnail: "/assets/characters/cat-thumb.png", lottie: "/lottie/cat_idle.json", format:"json"},
  { id: "robot", name: "Robot", thumbnail: "/assets/characters/robot-thumb.png", lottie: "/lottie/robot_idle.json", format:"json"},
];

export default function SelectCharacterPage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { selectCharacter, student } = useStudent();

  // Redirect to student login if not logged in
  useEffect(() => {
    if (!student.fullName) {
      const params = new URLSearchParams({ quizId: resolvedParams.quizId });
      router.push(`/student?${params.toString()}`);
    }
  }, [student.fullName, resolvedParams.quizId, router]);

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
