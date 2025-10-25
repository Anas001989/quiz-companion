"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  VStack,
  Text,
  Stack,
  Button,
} from "@chakra-ui/react";
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

// Temporary mock questions — later we’ll fetch from Supabase
const QUESTIONS = [
  {
    id: 1,
    question: "Which planet is known as the Red Planet?",
    type: "SINGLE_CHOICE",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswers: ["Mars"],
  },
  {
    id: 2,
    question: "Select all prime numbers:",
    type: "MULTI_CHOICE",
    options: ["2", "3", "4", "5"],
    correctAnswers: ["2", "3", "5"],
  },
  {
    id: 3,
    question: "How much is 5 * 4?",
    type: "SINGLE_CHOICE",
    options: ["20", "30", "25", "15"],
    correctAnswers: ["20"],
  },
  {
    id: 4,
    question: "How many trillions of stars are there in the sky?",
    type: "SINGLE_CHOICE",
    options: ["975", "973", "750", "Only God Knows"],
    correctAnswers: ["Only God Knows"],
  },
];

export default function QuestionsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params);
  const { student, quizSettings, recordAttemptProgress } = useStudent();
  const router = useRouter();
  const toast = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showStage, setShowStage] = useState(false);
  const [stageMode, setStageMode] = useState<"success" | "sad">("success");
  const [stageAction, setStageAction] = useState<string>("walk");

  const currentQuestion = QUESTIONS[currentIndex];

  useEffect(() => {
    if (!student.selectedCharacter) {
      // If the student didn’t select a character, redirect them back
      router.push(`/quiz/${resolvedParams.quizId}/select-character`);
    }
  }, [student, router, resolvedParams.quizId]);

  // helper: pick random action among main actions
  const pickRandomAction = () => {
    const actions = ["walk", "run", "jump"];
    return actions[Math.floor(Math.random() * actions.length)];
  };

  function handleSubmit() {
    const isCorrect =
      currentQuestion.correctAnswers.length === answers.length &&
      currentQuestion.correctAnswers.every((ans) => answers.includes(ans));

    // Save attempt progress score increment on correct
    if (isCorrect) {
      // record +1 score
      recordAttemptProgress(resolvedParams.quizId, { score: (student.attempts?.[resolvedParams.quizId]?.score || 0) + 1 });
    }

    
    // Decide based on quizSettings
    const mode = quizSettings?.answerMode ?? "single-pass";

    if (mode === "single-pass") {
      // Always show stage in success mode (but visual can differ)
      setStageMode(isCorrect ? "success" : "sad"); // even incorrect crosses (teacher demanded)
      setStageAction(isCorrect ? pickRandomAction() : "sad");
      setShowStage(true);
    } else {
      // retry-until-correct
      if (isCorrect) {
        setStageMode("success");
        setStageAction(pickRandomAction());
        setShowStage(true);
      } else {
        // show sad animation (no crossing) and then remain on same question
        setStageMode("sad");
        setStageAction("sad"); // map to e.g. bear_sad.json
        setShowStage(true);
      }
    }

    // clear selected answers for next time (we'll reset after stage completes)
    setAnswers([]);
  }

  // Called when GameStageBox finishes
  const handleStageComplete = () => {
    setShowStage(false);

    if (stageMode === "sad" && (quizSettings?.answerMode ?? "single-pass") === "retry-until-correct") {
      // stay on same question (student should try again)
      toast({ title: "Try again!", status: "info", duration: 1200, isClosable: true });
      return;
    }

    // proceed to next question or final stage immediately
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // go to final stage page (no flash)
      router.push(`/quiz/${resolvedParams.quizId}/stage?final=true`);
    }
  };

  // If stage overlay is shown, render only it (modal behavior)
  if (showStage) {
    return (
      <GameStageBox
        mode={stageMode}
        action={stageAction}
        scene={quizSettings?.scene}
        onComplete={handleStageComplete}
      />
    );
  }

  return (
    <Box p={8}>
      <Heading size="lg" mb={6}>
        Quiz: {resolvedParams.quizId}
      </Heading>

      <Box
        bg="white"
        p={6}
        rounded="xl"
        shadow="lg"
        maxW="xl"
        mx="auto"
      >
        <Text fontSize="xl" mb={4} fontWeight="semibold">
          {currentQuestion.question}
        </Text>

        {currentQuestion.type === "SINGLE_CHOICE" ? (
          <RadioGroup value={answers[0]} onChange={(val: string) => setAnswers([val])}>
            <VStack align="start" gap={3}>
              {currentQuestion.options.map((opt) => (
                <Radio key={opt} value={opt} colorScheme="blue">
                  {opt}
                </Radio>
              ))}
            </VStack>
          </RadioGroup>
        ) : (
          <CheckboxGroup value={answers} onChange={(vals) => setAnswers(vals as string[])}>
            <Stack direction="column" gap={3}>
              {currentQuestion.options.map((opt) => (
                <Checkbox key={opt} value={opt} colorScheme="blue">
                  {opt}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        )}

        <Button
          mt={6}
          colorScheme="blue"
          width="full"
          size="lg"
          onClick={handleSubmit}
          disabled={answers.length === 0}
        >
          Submit Answer
        </Button>
      </Box>
    </Box>
  );
}
