"use client";

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Flex
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/modal';
import FunButton from '@/components/ui/FunButton';

interface Attempt {
  id: string;
  studentName: string;
  studentNickname: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

interface QuizAttemptsModalProps {
  quizId: string;
  quizTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuizAttemptsModal({
  quizId,
  quizTitle,
  isOpen,
  onClose
}: QuizAttemptsModalProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [topPerformer, setTopPerformer] = useState<Attempt | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchAttempts();
    }
  }, [isOpen, quizId]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/quiz/${quizId}/attempts`);
      const data = await response.json();

      if (response.ok) {
        setAttempts(data.attempts || []);
        setTopPerformer(data.topPerformer || null);
        setTotalAttempts(data.totalAttempts || 0);
        setTotalQuestions(data.totalQuestions || 0);
      } else {
        console.error('Failed to fetch attempts:', data);
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="#514b52b8" />
      <ModalContent bg="white" p={0}>
        <ModalHeader p={6} pb={4}>
          <VStack align="start" gap={2}>
            <Heading size="md">Quiz Attempts</Heading>
            <Text fontSize="sm" color="gray.600">
              {quizTitle}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody p={6} pt={0}>
          {loading ? (
            <Flex justify="center" align="center" py={8}>
              <Spinner size="lg" />
            </Flex>
          ) : attempts.length === 0 ? (
            <Box py={8} textAlign="center">
              <Text color="gray.500">No attempts yet</Text>
              <Text fontSize="sm" color="gray.400" mt={2}>
                Students haven't completed this quiz yet.
              </Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {/* Summary Stats */}
              <HStack gap={4} justify="space-between" p={4} bg="gray.50" borderRadius="md">
                <VStack align="start" gap={1}>
                  <Text fontSize="xs" color="gray.600">Total Attempts</Text>
                  <Text fontSize="lg" fontWeight="bold">{totalAttempts}</Text>
                </VStack>
                <VStack align="start" gap={1}>
                  <Text fontSize="xs" color="gray.600">Total Questions</Text>
                  <Text fontSize="lg" fontWeight="bold">{totalQuestions}</Text>
                </VStack>
                {topPerformer && (
                  <VStack align="start" gap={1}>
                    <Text fontSize="xs" color="gray.600">Top Score</Text>
                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                      {topPerformer.score}/{totalQuestions} ({topPerformer.percentage}%)
                    </Text>
                  </VStack>
                )}
              </HStack>

              {/* Top Performer Highlight */}
              {topPerformer && (
                <Box p={4} bg="yellow.50" border="2px solid" borderColor="yellow.200" borderRadius="md">
                  <HStack gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="bold" color="yellow.800">
                      🏆 Top Performer
                    </Text>
                  </HStack>
                  <Text fontWeight="semibold">
                    {topPerformer.studentName}
                    {topPerformer.studentNickname && ` (${topPerformer.studentNickname})`}
                  </Text>
                  <HStack gap={2} mt={1}>
                    <Badge colorScheme="green" variant="solid">
                      {topPerformer.score}/{totalQuestions}
                    </Badge>
                    <Badge colorScheme="blue" variant="subtle">
                      {topPerformer.percentage}%
                    </Badge>
                  </HStack>
                </Box>
              )}

              {/* Attempts List */}
              <Box 
                maxH="500px" 
                overflowY="auto" 
                overflowX="hidden"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  },
                }}
              >
                {/* Header */}
                <HStack
                  p={3}
                  bg="gray.100"
                  borderRadius="md"
                  mb={2}
                  position="sticky"
                  top={0}
                  zIndex={1}
                  fontWeight="bold"
                  fontSize="sm"
                >
                  <Box flex={2}>Student</Box>
                  <Box flex={1} textAlign="right">Score</Box>
                  <Box flex={1} textAlign="right">%</Box>
                  <Box flex={1.5} textAlign="right">Completed</Box>
                </HStack>

                {/* Attempts */}
                <VStack gap={2} align="stretch">
                  {attempts.map((attempt, index) => (
                    <Box
                      key={attempt.id}
                      p={3}
                      borderRadius="md"
                      bg={
                        topPerformer && attempt.id === topPerformer.id
                          ? 'yellow.50'
                          : index % 2 === 0
                          ? 'gray.50'
                          : 'white'
                      }
                      border={
                        topPerformer && attempt.id === topPerformer.id
                          ? '2px solid'
                          : '1px solid'
                      }
                      borderColor={
                        topPerformer && attempt.id === topPerformer.id
                          ? 'yellow.200'
                          : 'gray.200'
                      }
                    >
                      <HStack gap={2} align="center">
                        <Box flex={2}>
                          <VStack align="start" gap={0}>
                            <Text fontWeight="medium" fontSize="sm">
                              {attempt.studentName}
                            </Text>
                            {attempt.studentNickname && (
                              <Text fontSize="xs" color="gray.500">
                                {attempt.studentNickname}
                              </Text>
                            )}
                          </VStack>
                        </Box>
                        <Box flex={1} textAlign="right">
                          <Badge
                            colorScheme={
                              attempt.percentage >= 80
                                ? 'green'
                                : attempt.percentage >= 60
                                ? 'blue'
                                : attempt.percentage >= 40
                                ? 'yellow'
                                : 'red'
                            }
                            variant="subtle"
                            fontSize="xs"
                          >
                            {attempt.score}/{attempt.totalQuestions}
                          </Badge>
                        </Box>
                        <Box flex={1} textAlign="right">
                          <Text fontWeight="medium" fontSize="sm">
                            {attempt.percentage}%
                          </Text>
                        </Box>
                        <Box flex={1.5} textAlign="right">
                          <Text fontSize="xs" color="gray.600">
                            {formatDate(attempt.completedAt)}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <FunButton variant="outline" onClick={onClose}>
            Close
          </FunButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

