"use client";

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  Input,
  IconButton,
  Badge
} from '@chakra-ui/react';
import FunButton from '@/components/ui/FunButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTeacher } from '@/context/TeacherContext';

interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
}

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teacher, logout } = useTeacher();

  useEffect(() => {
    // Get teacher ID from URL params
    const teacherIdFromUrl = searchParams.get('teacherId');
    
    if (teacherIdFromUrl) {
      setTeacherId(teacherIdFromUrl);
      fetchQuizzes(teacherIdFromUrl);
    } else {
      // No teacher ID in URL, redirect to auth
      router.push('/teacher/auth');
    }
  }, [searchParams, router]);

  const fetchQuizzes = async (teacherId: string) => {
    try {
      setLoading(true);
      console.log('Fetching quizzes for teacher ID:', teacherId);
      const response = await fetch(`/api/teacher/quizzes?teacherId=${teacherId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Quizzes fetched successfully:', data.quizzes);
        setQuizzes(data.quizzes);
      } else {
        console.error('Failed to fetch quizzes:', data);
        throw new Error(data.error || 'Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setMessage('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };



  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) {
      setMessage('Please enter a quiz title');
      return;
    }

    if (!teacherId) {
      setMessage('Please create a teacher account first');
      return;
    }

    try {
      setCreatingQuiz(true);
      setMessage(''); // Clear any previous messages
      
      console.log('Creating quiz with:', { title: newQuizTitle, teacherId });
      
      const response = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newQuizTitle,
          teacherId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Quiz created successfully');
        setNewQuizTitle('');
        setShowCreateModal(false);
        // Refresh quiz list
        await fetchQuizzes(teacherId);
        // Redirect to quiz questions page to add questions immediately
        router.push(`/teacher/quiz/${data.quiz.id}/questions?teacherId=${teacherId}`);
      } else {
        console.error('Quiz creation failed:', data);
        setMessage(`Failed to create quiz: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setMessage(`Failed to create quiz: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleQuizClick = (quizId: string) => {
    if (teacherId) {
      router.push(`/teacher/quiz/${quizId}/questions?teacherId=${teacherId}`);
    } else {
      router.push(`/teacher/quiz/${quizId}/questions`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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


  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" gap={2}>
            <Heading size="lg">My Quizzes</Heading>
            <Text color="gray.600">
              Manage your quizzes and track student progress
            </Text>
          </VStack>
          <HStack gap={3}>
            <FunButton
              variant="solid"
              onClick={() => setShowCreateModal(true)}
            >
              + Create New Quiz
            </FunButton>
            <FunButton
              variant="outline"
              onClick={logout}
            >
              Logout
            </FunButton>
          </HStack>
        </Flex>

        {/* Message Display */}
        {message && (
          <Box p={4} bg={message.includes('successfully') ? 'green.50' : 'red.50'} borderRadius="md">
            <Text color={message.includes('successfully') ? 'green.600' : 'red.600'}>
              {message}
            </Text>
          </Box>
        )}

        {/* Quiz Grid */}
        {quizzes.length === 0 ? (
          <Box p={8} bg="white" borderRadius="md" shadow="sm" textAlign="center">
            <VStack gap={4}>
              <Text fontSize="lg" color="gray.500">
                No quizzes yet
              </Text>
              <Text color="gray.400">
                Create your first quiz to get started
              </Text>
              <FunButton
                variant="outline"
                onClick={() => setShowCreateModal(true)}
              >
                + Create Quiz
              </FunButton>
            </VStack>
          </Box>
        ) : (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {quizzes.map((quiz) => (
              <Box
                key={quiz.id}
                p={6}
                bg="white"
                borderRadius="md"
                shadow="sm"
                cursor="pointer"
                _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                onClick={() => handleQuizClick(quiz.id)}
              >
                <VStack gap={4} align="stretch">
                  <Flex justify="space-between" align="start">
                    <Heading size="md" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {quiz.title}
                    </Heading>
                    <IconButton
                      aria-label="Manage quiz"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuizClick(quiz.id);
                      }}
                    >
                      ✏️
                    </IconButton>
                  </Flex>
                  
                  <Text fontSize="sm" color="gray.600">
                    Created: {formatDate(quiz.createdAt)}
                  </Text>
                  
                  <HStack gap={4}>
                    <Badge colorScheme="blue" variant="subtle">
                      {quiz.questionCount} questions
                    </Badge>
                    <Badge colorScheme="green" variant="subtle">
                      {quiz.attemptCount} attempts
                    </Badge>
                  </HStack>

                  <FunButton
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuizClick(quiz.id);
                    }}
                  >
                    Manage Questions
                  </FunButton>
                </VStack>
              </Box>
            ))}
          </Grid>
        )}
      </VStack>

      {/* Create Quiz Form */}
      {showCreateModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box
            bg="white"
            p={8}
            borderRadius="md"
            shadow="lg"
            maxW="md"
            w="full"
            mx={4}
          >
            <VStack gap={4}>
              <Heading size="md">Create New Quiz</Heading>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Enter a title for your new quiz. You can add questions after creating it.
              </Text>
              <Input
                placeholder="Quiz title"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateQuiz();
                  }
                }}
              />
              <HStack gap={3}>
                <FunButton
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewQuizTitle('');
                  }}
                >
                  Cancel
                </FunButton>
                <FunButton
                  variant="solid"
                  onClick={handleCreateQuiz}
                  loading={creatingQuiz}
                >
                  {creatingQuiz ? 'Creating...' : 'Create Quiz'}
                </FunButton>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Container>
  );
}
