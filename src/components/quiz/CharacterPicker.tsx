"use client";

import React from "react";
import { Box, Text, SimpleGrid } from "@chakra-ui/react";
import Lottie from "lottie-react";
import type { Character } from "@/context/StudentContext";
import { useRouter } from "next/navigation";

interface Props {
  characters: Character[];
  onSelect: (char: Character) => void;
  quizId?: string;
}

export default function CharacterPicker({ characters, onSelect, quizId }: Props) {
  const router = useRouter();

  function handleSelect(c: Character) {
    onSelect(c);
    if (quizId) {
      // Go directly to the first question page
      router.push(`/quiz/${quizId}/questions`);
    }
  }

  return (
    <SimpleGrid columns={[1, 2, 3]} gap={8} w="full">
      {characters.map((char) => (
        <Box
          key={char.id}
          p={4}
          bg="white"
          rounded="lg"
          shadow="md"
          textAlign="center"
          cursor="pointer"
          _hover={{ transform: "scale(1.05)" }}
          transition="all 0.2s ease"
          onClick={() => handleSelect(char)}
        >
          <Box w="8rem" h="8rem" mx="auto">
            <Lottie
              animationData={require(`@/../public/lottie/${char.id}_idle.json`)}
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
          <Text mt={2} fontWeight="semibold" color="blue.700">
            {char.name}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}
