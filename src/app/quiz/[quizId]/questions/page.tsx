"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  VStack,
  Text,
  Stack,
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
import { supabase } from "@/lib/supabase/supabaseClient";

interface Question {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  questionImageUrl?: string | null;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    answerImageUrl?: string | null;
  }>;
}

export default function QuestionsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const resolvedParams = use(params);
  const { student, quizSettings, setQuizSettings, recordAttemptProgress } = useStudent();
  const router = useRouter();
  const toast = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizAnswerMode, setQuizAnswerMode] = useState<string>('retry-until-correct');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<Array<{ questionId: string; optionIds: string[] }>>([]);
  const [showStage, setShowStage] = useState(false);
  const [stageMode, setStageMode] = useState<"success" | "sad">("success");
  const [stageAction, setStageAction] = useState<string>("walk");
  const [isCompletingQuiz, setIsCompletingQuiz] = useState(false);

  // Fetch quiz questions from API
  const hasFetchedRef = React.useRef(false);
  const fetchingRef = React.useRef(false);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      if (fetchingRef.current || hasFetchedRef.current) return;
      
      try {
        fetchingRef.current = true;
        setLoading(true);
        const response = await fetch(`/api/teacher/quiz/${resolvedParams.quizId}/questions`);
        const data = await response.json();
        
        if (response.ok && data.quiz) {
          hasFetchedRef.current = true;
          setQuestions(data.quiz.questions || []);
          setQuizTitle(data.quiz.title || '');
          const answerMode = data.quiz.answerMode || 'retry-until-correct';
          setQuizAnswerMode(answerMode);
          // Update quiz settings with the answerMode from the quiz
          setQuizSettings({ ...quizSettings, answerMode: answerMode as 'single-pass' | 'retry-until-correct' });
        } else {
          toast({
            title: "Failed to load quiz",
            description: data.error || "Please try again later.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: "Error loading quiz",
          description: "Please try again later.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    if (resolvedParams.quizId) {
      fetchQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.quizId]); // Removed 'toast' from dependencies to prevent duplicate calls

  // Check if student has selected a character (must be before any conditional returns)
  useEffect(() => {
    if (!loading && questions.length > 0 && !student.selectedCharacter) {
      // If the student didn't select a character, redirect them back
      router.push(`/quiz/${resolvedParams.quizId}/select-character`);
    }
  }, [student.selectedCharacter, loading, questions.length, router, resolvedParams.quizId]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" mb={6}>
          Loading quiz...
        </Heading>
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" mb={6}>
          No questions found
        </Heading>
        <Text color="gray.600">
          This quiz doesn't have any questions yet.
        </Text>
      </Box>
    );
  }

  const currentQuestion = questions[currentIndex];
  
  // Get correct answers from the options
  const correctAnswers = currentQuestion.options
    .filter(opt => opt.isCorrect)
    .map(opt => opt.text);
  
  // Get options as strings for the UI
  const optionTexts = currentQuestion.options.map(opt => opt.text);

  // helper: pick random action among main actions
  const pickRandomAction = () => {
    const actions = ["walk", "run", "jump"];
    return actions[Math.floor(Math.random() * actions.length)];
  };

  function handleSubmit() {
    const isCorrect =
      correctAnswers.length === answers.length &&
      correctAnswers.every((ans) => answers.includes(ans));

    // Map text answers to option IDs
    const selectedOptionIds: string[] = [];
    answers.forEach(answerText => {
      const option = currentQuestion.options.find(opt => opt.text === answerText);
      if (option) {
        selectedOptionIds.push(option.id);
      }
    });

    // Save answer for this question
    setAllAnswers(prev => {
      // Remove existing answer for this question if any (for retries)
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...filtered, { questionId: currentQuestion.id, optionIds: selectedOptionIds }];
    });

    // Save attempt progress score increment on correct
    if (isCorrect) {
      // record +1 score
      recordAttemptProgress(resolvedParams.quizId, { score: (student.attempts?.[resolvedParams.quizId]?.score || 0) + 1 });
    }

    
    // Decide based on quiz answerMode from database
    const mode = quizAnswerMode || (quizSettings?.answerMode ?? "retry-until-correct");

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

    if (stageMode === "sad" && (quizAnswerMode || (quizSettings?.answerMode ?? "retry-until-correct")) === "retry-until-correct") {
      // stay on same question (student should try again)
      toast({ title: "Try again!", status: "info", duration: 1200, isClosable: true });
      return;
    }

    // proceed to next question or final stage immediately
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Mark as completing to prevent showing the last question again
      setIsCompletingQuiz(true);
      // Save attempt before navigating to final stage
      saveAttempt();
    }
  }

  const saveAttempt = async () => {
    try {
      // Make sure we have answers for all questions (some might be empty if student skipped)
      const completeAnswers = questions.map(q => {
        const answer = allAnswers.find(a => a.questionId === q.id);
        return {
          questionId: q.id,
          optionIds: answer?.optionIds || []
        };
      });

      // Get current user if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const requestBody: any = {
        quizId: resolvedParams.quizId,
        answers: completeAnswers
      };

      // Include userId if authenticated, otherwise include student name for unlimited mode
      if (userId) {
        requestBody.userId = userId;
      } else {
        requestBody.studentFullName = student.fullName;
        requestBody.nickname = student.nickname;
      }

      const response = await fetch('/api/student/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save attempt:', error);
        
        // If it's a conflict (already attempted), show error and redirect
        if (response.status === 409) {
          toast({
            title: "Quiz Already Completed",
            description: error.error || "You have already completed this quiz.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
      toast({
        title: "Error",
        description: "Failed to save your attempt. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
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

  // If quiz is being completed, show loading state instead of the last question
  if (isCompletingQuiz) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" mb={6}>
          Saving your results...
        </Heading>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Heading size="lg" mb={6}>
        {quizTitle || `Quiz: ${resolvedParams.quizId}`}
      </Heading>

      <Box
        bg="white"
        p={6}
        rounded="xl"
        shadow="lg"
        maxW="xl"
        mx="auto"
      >
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" mb={2} fontWeight="semibold">
            {currentQuestion.text}
          </Text>
          
          {currentQuestion.questionImageUrl && (
            <Box>
              <img 
                src={currentQuestion.questionImageUrl} 
                alt="Question" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}

          {currentQuestion.type === "SINGLE_CHOICE" ? (
            <RadioGroup value={answers[0] || ""} onChange={(val: string) => setAnswers([val])}>
              <VStack align="start" gap={3}>
                {currentQuestion.options.map((opt, idx) => (
                  <Box key={idx} w="full" p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                    <Radio value={opt.text} colorScheme="blue" w="full">
                      <VStack align="start" gap={2} ml={2}>
                        <Text>{opt.text}</Text>
                        {opt.answerImageUrl && (
                          <Box>
                            <img 
                              src={opt.answerImageUrl} 
                              alt="Answer option" 
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '150px', 
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
                        )}
                      </VStack>
                    </Radio>
                  </Box>
                ))}
              </VStack>
            </RadioGroup>
          ) : (
            <CheckboxGroup value={answers} onChange={(vals) => setAnswers(vals as string[])}>
              <Stack direction="column" gap={3}>
                {currentQuestion.options.map((opt, idx) => (
                  <Box key={idx} w="full" p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                    <Checkbox value={opt.text} colorScheme="blue" w="full">
                      <VStack align="start" gap={2} ml={2}>
                        <Text>{opt.text}</Text>
                        {opt.answerImageUrl && (
                          <Box>
                            <img 
                              src={opt.answerImageUrl} 
                              alt="Answer option" 
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '150px', 
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
                        )}
                      </VStack>
                    </Checkbox>
                  </Box>
                ))}
              </Stack>
            </CheckboxGroup>
          )}
        </VStack>

        <FunButton
          mt={6}
          variant="solid"
          width="full"
          size="lg"
          onClick={handleSubmit}
          disabled={answers.length === 0}
        >
          Submit Answer
        </FunButton>
      </Box>
    </Box>
  );
}
