"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Input,
  VStack,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";
import {
  FormControl,
  FormLabel,
} from "@chakra-ui/form-control";
import { useToast } from "@chakra-ui/toast";
import { useStudent } from "@/context/StudentContext";

export default function StudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { setStudent } = useStudent();
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Only render form after hydration to prevent hydration errors from browser extensions
  useEffect(() => {
    setIsHydrated(true);
    setQuizId(searchParams.get("quizId"));
  }, [searchParams]);

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

    // Save student info to context
    setStudent({
      fullName: fullName.trim(),
      nickname: nickname.trim() || undefined,
      selectedCharacter: null,
    });

    // Redirect to quiz if quizId is provided, otherwise to demo quiz
    const targetQuizId = quizId || "demo-quiz";
    router.push(`/quiz/${targetQuizId}/select-character`);
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

          <div suppressHydrationWarning>
            {isHydrated ? (
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

                  <FunButton
                    type="submit"
                    variant="solid"
                    width="full"
                    size="lg"
                    className="font-semibold"
                  >
                    Start Quiz
                  </FunButton>
                </VStack>
              </form>
            ) : (
              <div style={{ minHeight: "200px" }} aria-hidden="true" />
            )}
          </div>
        </VStack>
      </Container>
    </Box>
  );
}
