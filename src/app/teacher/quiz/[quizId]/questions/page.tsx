"use client";

import React, { useEffect, useState, useRef } from 'react';
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
  IconButton,
  useDisclosure
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
import QuestionForm from '@/components/forms/QuestionForm';
import AIGenerateQuestionsModal from '@/components/forms/AIGenerateQuestionsModal';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  questionImageUrl?: string | null;
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  answerImageUrl?: string | null;
}

interface Quiz {
  id: string;
  title: string;
  answerMode?: string;
  questions: Question[];
}

export default function QuizQuestionsPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { open: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { open: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { open: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { open: isAIGenerateOpen, onOpen: onAIGenerateOpen, onClose: onAIGenerateClose } = useDisclosure();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId as string;
  const teacherId = searchParams.get('teacherId');
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (quizId && !hasFetchedRef.current && !fetchingRef.current) {
      hasFetchedRef.current = true;
      fetchingRef.current = true;
      fetchQuiz().finally(() => {
        fetchingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]); // Only depend on quizId to prevent duplicate calls

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await fetch(`/api/teacher/quiz/${quizId}/questions`);
      const data = await response.json();
      
      if (response.ok) {
        setQuiz(data.quiz);
      } else {
        const errorMsg = data.error || 'Failed to fetch quiz';
        const details = data.details || '';
        const hint = data.hint || '';
        
        if (errorMsg === 'Quiz not found') {
          setMessage(`Quiz not found. The quiz ID "${quizId}" doesn't exist. Please go back to the dashboard and select a valid quiz.`);
        } else if (errorMsg === 'Failed to fetch quiz questions') {
          setMessage(`Database Error: ${details || errorMsg}${hint ? ` - ${hint}` : ''}`);
        } else {
          setMessage(`Error: ${errorMsg}${details ? ` - ${details}` : ''}`);
        }
        console.error('Error fetching quiz:', data);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setMessage(`Failed to fetch quiz: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    onFormOpen();
  };

  const handleEditQuestion = (questionId: string) => {
    const question = quiz?.questions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestion(question);
      onFormOpen();
    }
  };

  const handleSaveQuestion = async (questionData: {
    text: string;
    type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
    questionImageUrl?: string | null;
    options: Array<{ text: string; isCorrect: boolean; answerImageUrl?: string | null }>;
  }) => {
    try {
      if (editingQuestion) {
        // Update existing question
        const response = await fetch(`/api/teacher/quiz/${quizId}/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Question updated successfully!');
          onFormClose();
          setEditingQuestion(null);
          await fetchQuiz();
        } else {
          throw new Error(data.error || 'Failed to update question');
        }
      } else {
        // Create new question
        const response = await fetch(`/api/teacher/quiz/${quizId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Question added successfully!');
          onFormClose();
          await fetchQuiz();
        } else {
          throw new Error(data.error || 'Failed to add question');
        }
      }
    } catch (error) {
      console.error('Error saving question:', error);
      throw error;
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setDeletingQuestionId(questionId);
    onDeleteOpen();
  };

  const confirmDeleteQuestion = async () => {
    if (!deletingQuestionId) return;

    try {
      const response = await fetch(`/api/teacher/quiz/${quizId}/questions/${deletingQuestionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Question deleted successfully!');
        onDeleteClose();
        setDeletingQuestionId(null);
        await fetchQuiz();
      } else {
        setMessage(`Failed to delete question: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage('Failed to delete question. Please try again.');
    }
  };

  const getQuizUrl = () => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      return `${baseUrl}/student?quizId=${quizId}`;
    }
    return '';
  };

  const handleCopyToClipboard = async () => {
    const url = getQuizUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setMessage('Quiz link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      setMessage('Failed to copy URL to clipboard');
    }
  };

  const handleShareQuiz = () => {
    setCopied(false);
    onShareOpen();
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

  if (!quiz && !loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack gap={4} align="stretch">
          <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text color="red.600" fontWeight="bold" mb={2}>Quiz Not Found</Text>
            <Text color="red.600" mb={4}>
              {message || `The quiz with ID "${quizId}" could not be found. This might happen if:`}
            </Text>
            <VStack align="start" gap={2} color="red.700">
              <Text>• The quiz was deleted</Text>
              <Text>• The quiz ID in the URL is incorrect</Text>
              <Text>• You don't have access to this quiz</Text>
            </VStack>
          </Box>
          <FunButton
            variant="solid"
            onClick={() => {
              if (teacherId) {
                router.push(`/teacher/dashboard?teacherId=${teacherId}`);
              } else {
                router.push('/teacher/dashboard');
              }
            }}
          >
            ← Back to Dashboard
          </FunButton>
        </VStack>
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
              onClick={onAIGenerateOpen}
              colorScheme="purple"
            >
              🤖 Generate Questions With AI
            </FunButton>
            <FunButton
              variant="solid"
              onClick={handleAddQuestion}
            >
              + Add Question
            </FunButton>
            <FunButton
              variant="outline"
              onClick={handleShareQuiz}
            >
              🔗 Share Quiz
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
          <Box p={4} bg={message.includes('successfully') ? 'green.50' : message.includes('Failed') ? 'red.50' : 'blue.50'} borderRadius="md">
            <Text color={message.includes('successfully') ? 'green.600' : message.includes('Failed') ? 'red.600' : 'blue.600'}>
              {message}
            </Text>
          </Box>
        )}

        {/* Answer Mode Settings */}
        <Box p={6} bg="white" borderRadius="md" shadow="sm">
          <VStack gap={4} align="stretch">
            <Text fontWeight="bold" fontSize="lg">Quiz Settings</Text>
            <HStack gap={4}>
              <Text fontWeight="medium">Answer Mode:</Text>
              <HStack gap={2}>
                <FunButton
                  variant={quiz?.answerMode === 'single-pass' ? 'solid' : 'outline'}
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/teacher/quiz/${quizId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ answerMode: 'single-pass' })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setQuiz(prev => prev ? { ...prev, answerMode: 'single-pass' } : null);
                        setMessage('Answer mode updated successfully!');
                      } else {
                        setMessage(`Failed to update answer mode: ${data.error || data.details || 'Unknown error'}`);
                      }
                    } catch (error: any) {
                      console.error('Error updating answer mode:', error);
                      setMessage(`Failed to update answer mode: ${error?.message || 'Network error'}`);
                    }
                  }}
                >
                  Single Pass
                </FunButton>
                <FunButton
                  variant={quiz?.answerMode === 'retry-until-correct' ? 'solid' : 'outline'}
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/teacher/quiz/${quizId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ answerMode: 'retry-until-correct' })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setQuiz(prev => prev ? { ...prev, answerMode: 'retry-until-correct' } : null);
                        setMessage('Answer mode updated successfully!');
                      } else {
                        setMessage(`Failed to update answer mode: ${data.error || data.details || 'Unknown error'}`);
                      }
                    } catch (error: any) {
                      console.error('Error updating answer mode:', error);
                      setMessage(`Failed to update answer mode: ${error?.message || 'Network error'}`);
                    }
                  }}
                >
                  Retry Until Correct
                </FunButton>
              </HStack>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              {quiz?.answerMode === 'single-pass' 
                ? 'Students can only answer each question once. They will move to the next question regardless of correctness.'
                : 'Students must answer correctly before moving to the next question. They can retry incorrect answers.'}
            </Text>
          </VStack>
        </Box>

        {/* Question Form Modal */}
        <QuestionForm
          isOpen={isFormOpen}
          onClose={() => {
            onFormClose();
            setEditingQuestion(null);
          }}
          onSave={handleSaveQuestion}
          question={editingQuestion}
          quizId={quizId}
        />

        {/* AI Generate Questions Modal */}
        <AIGenerateQuestionsModal
          isOpen={isAIGenerateOpen}
          onClose={onAIGenerateClose}
          quizId={quizId}
          onQuestionsGenerated={async (questions) => {
            try {
              // Save all generated questions in a single batch API call
              const response = await fetch(`/api/teacher/quiz/${quizId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions })
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to save questions');
              }
              
              setMessage(`Successfully added ${questions.length} questions!`);
              fetchQuiz();
            } catch (error: any) {
              console.error('Error saving generated questions:', error);
              setMessage(`Failed to save generated questions: ${error?.message || 'Unknown error'}`);
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md" isCentered>
          <ModalOverlay bg="#514b52b8" />
          <ModalContent bg="white" p={0}>
            <ModalHeader fontSize="lg" fontWeight="bold" p={6} pb={4}>
              Delete Question
            </ModalHeader>
            <ModalCloseButton top={4} right={4} />
            <ModalBody p={6} pt={0}>
              <Text>
                Are you sure you want to delete this question? This action cannot be undone.
              </Text>
            </ModalBody>
            <ModalFooter p={6} pt={4}>
              <HStack gap={3}>
                <FunButton onClick={onDeleteClose} variant="outline">
                  Cancel
                </FunButton>
                <FunButton
                  onClick={confirmDeleteQuestion}
                  variant="solid"
                  bg="red.500"
                  color="white"
                  _hover={{ bg: "red.600" }}
                >
                  Delete
                </FunButton>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Share Quiz Modal */}
        {quiz && (
          <Modal isOpen={isShareOpen} onClose={onShareClose} size="md" isCentered>
          <ModalOverlay bg="#514b52b8" />
          <ModalContent bg="white" p={0}>
              <ModalHeader p={6} pb={4}>Share Quiz: {quiz.title}</ModalHeader>
              <ModalCloseButton top={4} right={4} />
              <ModalBody p={6} pt={0}>
                <VStack gap={4} align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    Share this link with your students to let them take the quiz:
                  </Text>
                  <Box
                    p={3}
                    bg="gray.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    w="full"
                  >
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      wordBreak="break-all"
                      color="gray.700"
                    >
                      {getQuizUrl()}
                    </Text>
                  </Box>
                  <FunButton
                    variant="solid"
                    w="full"
                    onClick={handleCopyToClipboard}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Link'}
                  </FunButton>
                </VStack>
              </ModalBody>
              <ModalFooter p={6} pt={4}>
                <FunButton variant="outline" onClick={onShareClose}>
                  Close
                </FunButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
                      {question.questionImageUrl && (
                        <Box mt={2}>
                          <img 
                            src={question.questionImageUrl} 
                            alt="Question" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                          />
                        </Box>
                      )}
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
                        <VStack align="start" gap={1} flex={1}>
                          <Text
                            color={option.isCorrect ? 'green.600' : 'gray.600'}
                            fontWeight={option.isCorrect ? 'bold' : 'normal'}
                          >
                            {option.text}
                          </Text>
                          {option.answerImageUrl && (
                            <img 
                              src={option.answerImageUrl} 
                              alt="Answer" 
                              style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: '4px' }}
                            />
                          )}
                        </VStack>
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
