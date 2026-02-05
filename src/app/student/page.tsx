"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Input,
  VStack,
  Text,
  Spinner,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";
import {
  FormControl,
  FormLabel,
} from "@chakra-ui/form-control";
import { useToast } from "@chakra-ui/toast";
import { useStudent } from "@/context/StudentContext";
import { supabase } from "@/lib/supabase/supabaseClient";
import StudentAuth from "@/components/student/StudentAuth";

interface QuizInfo {
  id: string;
  title: string;
  attemptPolicy: string;
  answerMode: string;
  questionCount: number;
}

export default function StudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { setStudent } = useStudent();
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  
  // Only render form after hydration to prevent hydration errors from browser extensions
  useEffect(() => {
    setIsHydrated(true);
    const qId = searchParams.get("quizId");
    const error = searchParams.get("error");
    setQuizId(qId);
    
    // Check if user was redirected here because they already attempted
    if (error === 'already-attempted') {
      setAlreadyAttempted(true);
    }
    
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  // Fetch quiz info when quizId is available
  useEffect(() => {
    if (!quizId || !isHydrated) return;

    const fetchQuizInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/student/quiz/${quizId}`);
        const data = await response.json();
        
        if (response.ok && data.quiz) {
          setQuizInfo(data.quiz);
          
          // If single-attempt and user is authenticated, check if already attempted
          if (data.quiz.attemptPolicy === 'single-attempt' && user) {
            await checkExistingAttempt(data.quiz.id, user.id);
          }
        } else {
          toast({
            title: "Quiz not found",
            description: data.error || "The quiz you're looking for doesn't exist.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error fetching quiz info:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz information. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizInfo();
  }, [quizId, isHydrated, user, toast]);

  const checkExistingAttempt = async (qId: string, userId: string) => {
    try {
      const response = await fetch(`/api/student/attempts/check?quizId=${qId}&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok && data.hasAttempt) {
        setAlreadyAttempted(true);
      }
    } catch (error) {
      console.error('Error checking existing attempt:', error);
    }
  };

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

  const handleAuthSuccess = (userId: string) => {
    // User authenticated, check if already attempted
    if (quizInfo && quizInfo.attemptPolicy === 'single-attempt') {
      checkExistingAttempt(quizInfo.id, userId);
    }
    // Redirect to character selection
    router.push(`/quiz/${quizId}/select-character`);
  };

  // Show loading while checking auth or fetching quiz info
  if (checkingAuth || loading) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-b, blue.50, white)"
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

  // If single-attempt quiz and not authenticated, show email sign-in (magic link)
  if (quizInfo && quizInfo.attemptPolicy === 'single-attempt' && !user) {
    return (
      <StudentAuth
        quizId={quizId!}
        quizTitle={quizInfo.title}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // If single-attempt and already attempted, show blocking message
  if (quizInfo && quizInfo.attemptPolicy === 'single-attempt' && alreadyAttempted) {
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
              Quiz Already Completed
            </Heading>
            <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
              <Text color="blue.700" fontWeight="medium">
                You have already completed this quiz.
              </Text>
            </Box>
            <Text textAlign="center" color="gray.600">
              This quiz allows only one attempt per student. You cannot take it again.
            </Text>
            <FunButton
              variant="outline"
              onClick={() => router.push('/')}
            >
              Go Back
            </FunButton>
          </VStack>
        </Container>
      </Box>
    );
  }

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
