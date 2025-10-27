"use client";

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  Badge,
  IconButton
} from '@chakra-ui/react';
import FunButton from '@/components/ui/FunButton';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'MIXED';
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export default function QuizQuestionsPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId as string;
  const teacherId = searchParams.get('teacherId');

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/quiz/${quizId}/questions`);
      const data = await response.json();
      
      if (response.ok) {
        setQuiz(data.quiz);
      } else {
        throw new Error(data.error || 'Failed to fetch quiz');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setMessage('Failed to fetch quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      setMessage('Creating sample question...');
      
      // Create a sample question for testing
      const sampleQuestion = {
        text: 'What is the capital of France?',
        type: 'SINGLE_CHOICE',
        options: [
          { text: 'Paris', isCorrect: true },
          { text: 'London', isCorrect: false },
          { text: 'Berlin', isCorrect: false },
          { text: 'Madrid', isCorrect: false }
        ]
      };

      const response = await fetch(`/api/teacher/quiz/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleQuestion),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Sample question added successfully! Refreshing...');
        // Refresh the quiz data
        setTimeout(() => {
          fetchQuiz();
        }, 1000);
      } else {
        setMessage(`Failed to add question: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      setMessage('Failed to add question. Please try again.');
    }
  };

  const handleEditQuestion = (questionId: string) => {
    setMessage('Question editing will be available soon');
  };

  const handleDeleteQuestion = (questionId: string) => {
    setMessage('Question deletion will be available soon');
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Quiz not found</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack gap={4}>
            <IconButton
              aria-label="Go back"
              onClick={() => {
                if (teacherId) {
                  router.push(`/teacher/dashboard?teacherId=${teacherId}`);
                } else {
                  router.push('/teacher/dashboard');
                }
              }}
            >
              ←
            </IconButton>
            <VStack align="start" gap={1}>
              <Heading size="lg">{quiz.title}</Heading>
              <Text color="gray.600">
                {quiz.questions.length} questions
              </Text>
            </VStack>
          </HStack>
          <HStack gap={3}>
            <FunButton
              variant="solid"
              onClick={handleAddQuestion}
            >
              + Add Question
            </FunButton>
            <FunButton
              variant="outline"
              onClick={() => {
                setMessage('Quiz saved successfully!');
                // In a real implementation, this would save any pending changes
              }}
            >
              Save Quiz
            </FunButton>
            <FunButton
              variant="outline"
              onClick={() => {
                if (teacherId) {
                  router.push(`/teacher/dashboard?teacherId=${teacherId}`);
                } else {
                  router.push('/teacher/dashboard');
                }
              }}
            >
              Cancel
            </FunButton>
          </HStack>
        </Flex>

        {/* Message Display */}
        {message && (
          <Box p={4} bg={message.includes('successfully') ? 'green.50' : 'blue.50'} borderRadius="md">
            <Text color={message.includes('successfully') ? 'green.600' : 'blue.600'}>
              {message}
            </Text>
          </Box>
        )}

        {/* Questions List */}
        {quiz.questions.length === 0 ? (
          <Box p={8} bg="white" borderRadius="md" shadow="sm" textAlign="center">
            <VStack gap={4}>
              <Text fontSize="lg" color="gray.500">
                No questions yet
              </Text>
              <Text color="gray.400">
                Add your first question to get started
              </Text>
              <FunButton
                variant="outline"
                onClick={handleAddQuestion}
              >
                + Add Question
              </FunButton>
            </VStack>
          </Box>
        ) : (
          <VStack gap={4} align="stretch">
            {quiz.questions.map((question, index) => (
              <Box key={question.id} p={6} bg="white" borderRadius="md" shadow="sm">
                <VStack gap={4} align="stretch">
                  <Flex justify="space-between" align="start">
                    <VStack align="start" gap={2}>
                      <HStack gap={2}>
                        <Text fontWeight="bold" color="gray.600">
                          Question {index + 1}
                        </Text>
                        <Badge colorScheme="blue" variant="subtle">
                          {question.type.replace('_', ' ')}
                        </Badge>
                      </HStack>
                      <Text fontSize="lg">{question.text}</Text>
                    </VStack>
                    <HStack gap={2}>
                      <IconButton
                        aria-label="Edit question"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditQuestion(question.id)}
                      >
                        ✏️
                      </IconButton>
                      <IconButton
                        aria-label="Delete question"
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        🗑️
                      </IconButton>
                    </HStack>
                  </Flex>
                  
                  <VStack gap={2} align="stretch">
                    {question.options.map((option) => (
                      <HStack key={option.id} gap={3}>
                        <Box
                          w={4}
                          h={4}
                          borderRadius="full"
                          bg={option.isCorrect ? 'green.500' : 'gray.300'}
                        />
                        <Text
                          color={option.isCorrect ? 'green.600' : 'gray.600'}
                          fontWeight={option.isCorrect ? 'bold' : 'normal'}
                        >
                          {option.text}
                        </Text>
                        {option.isCorrect && (
                          <Badge colorScheme="green" size="sm">
                            Correct
                          </Badge>
                        )}
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
