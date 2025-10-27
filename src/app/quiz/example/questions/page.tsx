"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Stack,
  Container,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";
import {
  RadioGroup,
  Radio,
} from "@chakra-ui/radio";
import {
  CheckboxGroup,
  Checkbox,
} from "@chakra-ui/checkbox";
import { useToast } from "@chakra-ui/toast";
import { useStudent } from "@/context/StudentContext";
import GameStageBox from "@/components/quiz/GameStageBox";

// Example quiz questions for visitors to try
const EXAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "What is the capital of France?",
    type: "SINGLE_CHOICE",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctAnswers: ["Paris"],
  },
  {
    id: 2,
    question: "Which of the following are programming languages?",
    type: "MULTI_CHOICE",
    options: ["JavaScript", "Python", "HTML", "Java"],
    correctAnswers: ["JavaScript", "Python", "Java"],
  },
  {
    id: 3,
    question: "What is 15 + 27?",
    type: "SINGLE_CHOICE",
    options: ["40", "42", "41", "43"],
    correctAnswers: ["42"],
  },
  {
    id: 4,
    question: "Which of these are primary colors?",
    type: "MULTI_CHOICE",
    options: ["Red", "Blue", "Green", "Yellow"],
    correctAnswers: ["Red", "Blue", "Yellow"],
  },
  {
    id: 5,
    question: "What is the largest planet in our solar system?",
    type: "SINGLE_CHOICE",
    options: ["Earth", "Jupiter", "Saturn", "Neptune"],
    correctAnswers: ["Jupiter"],
  },
];

export default function ExampleQuizPage() {
  const router = useRouter();
  const toast = useToast();
  const { student, setStudent } = useStudent();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showStage, setShowStage] = useState(false);
  const [stageMode, setStageMode] = useState<"success" | "sad">("success");
  const [stageAction, setStageAction] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = EXAMPLE_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === EXAMPLE_QUESTIONS.length - 1;

  // Initialize student data for example quiz
  useEffect(() => {
    if (!student.fullName) {
      setStudent({
        fullName: "Example User",
        nickname: "Demo",
        selectedCharacter: {
          id: "bear",
          name: "Bear",
          thumbnail: "/assets/characters/bear-thumb.png",
          file: "/lottie/bear_idle.json",
          format: "json"
        }
      });
    }
  }, [student, setStudent]);

  const handleAnswerChange = (value: string | string[]) => {
    setSelectedAnswers(Array.isArray(value) ? value : [value]);
  };

  const checkAnswer = (question: any, answers: string[]) => {
    const correctAnswers = question.correctAnswers;
    if (question.type === "SINGLE_CHOICE") {
      return answers.length === 1 && correctAnswers.includes(answers[0]);
    } else {
      // MULTI_CHOICE
      return (
        answers.length === correctAnswers.length &&
        answers.every((answer) => correctAnswers.includes(answer))
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) {
      toast({
        title: "Please select an answer",
        description: "Choose at least one option before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    const isCorrect = checkAnswer(currentQuestion, selectedAnswers);

    // Show character animation
    setStageMode(isCorrect ? "success" : "sad");
    setStageAction(isCorrect ? "jump" : "sad");
    setShowStage(true);

    // Hide stage after animation
    setTimeout(() => {
      setShowStage(false);
      setIsSubmitting(false);

      if (isCorrect) {
        toast({
          title: "Correct! 🎉",
          description: "Great job! Moving to the next question.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Not quite right",
          description: "Don't worry, let's try the next question!",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      }

      if (isLastQuestion) {
        // Quiz completed
        setTimeout(() => {
          router.push("/quiz/example/result");
        }, 1000);
      } else {
        // Move to next question
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswers([]);
      }
    }, 3000);
  };

  if (showStage) {
    return (
      <GameStageBox
        mode={stageMode}
        action={stageAction}
        scene="forest"
        onComplete={() => setShowStage(false)}
      />
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" color="blue.700" mb={2}>
            Example Quiz
          </Heading>
          <Text color="gray.600">
            Question {currentQuestionIndex + 1} of {EXAMPLE_QUESTIONS.length}
          </Text>
        </Box>

        {/* Progress Bar */}
        <Box w="full" bg="gray.200" borderRadius="full" h={2}>
          <Box
            bg="blue.500"
            h="full"
            borderRadius="full"
            w={`${((currentQuestionIndex + 1) / EXAMPLE_QUESTIONS.length) * 100}%`}
            transition="width 0.3s ease"
          />
        </Box>

        {/* Question Card */}
        <Box
          bg="white"
          p={8}
          borderRadius="xl"
          shadow="lg"
          border="1px"
          borderColor="gray.200"
        >
          <VStack gap={6} align="stretch">
            <Heading size="md" color="gray.800" textAlign="center">
              {currentQuestion.question}
            </Heading>

            {currentQuestion.type === "SINGLE_CHOICE" ? (
              <RadioGroup
                value={selectedAnswers[0] || ""}
                onChange={(value) => handleAnswerChange(value)}
              >
                <Stack gap={3}>
                  {currentQuestion.options.map((option, index) => (
                    <Radio key={index} value={option} size="lg">
                      <Text fontSize="md">{option}</Text>
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            ) : (
              <CheckboxGroup
                value={selectedAnswers}
                onChange={(value) => handleAnswerChange(value)}
              >
                <Stack gap={3}>
                  {currentQuestion.options.map((option, index) => (
                    <Checkbox key={index} value={option} size="lg">
                      <Text fontSize="md">{option}</Text>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            )}

            <FunButton
              variant="solid"
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Checking..."
              w="full"
              py={6}
              fontSize="lg"
              fontWeight="semibold"
            >
              {isLastQuestion ? "Finish Quiz" : "Submit Answer"}
            </FunButton>
          </VStack>
        </Box>

        {/* Navigation */}
        <HStack justify="space-between">
          <FunButton
            variant="outline"
            onClick={() => router.push("/")}
            size="md"
          >
            ← Back to Home
          </FunButton>
          <Text color="gray.500" fontSize="sm">
            Try our example quiz to see how it works!
          </Text>
        </HStack>
      </VStack>
    </Container>
  );
}
