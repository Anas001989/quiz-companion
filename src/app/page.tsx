"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  VStack,
} from "@chakra-ui/react";
import {
  FormControl,
  FormLabel,
} from "@chakra-ui/form-control";
import { useToast } from "@chakra-ui/toast";

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: "Full name required.",
        description: "Please enter your full name to start the quiz.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const quizId = "demo-quiz";
    const params = new URLSearchParams({ fullName, nickname });
    router.push(`/quiz/${quizId}/select-character/?${params.toString()}`);
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, blue.50, white)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container
        maxW="md"
        bg="white"
        boxShadow="xl"
        rounded="2xl"
        p={8}
        border="1px"
        borderColor="gray.100"
      >
        <VStack gap={6}>
          <Heading
            as="h1"
            size="lg"
            textAlign="center"
            color="blue.700"
            className="font-bold"
          >
            Welcome to Quiz Companion 🧠
          </Heading>

          <form onSubmit={handleSubmit} className="w-full">
            <VStack gap={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  _focus={{ borderColor: "blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Nickname (optional)</FormLabel>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter a nickname"
                  _focus={{ borderColor: "blue.400" }}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                size="lg"
                className="font-semibold"
              >
                Start Quiz
              </Button>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
}
