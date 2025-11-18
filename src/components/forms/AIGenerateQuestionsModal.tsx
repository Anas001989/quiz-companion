"use client";

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Text,
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
import {
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/form-control';
import FunButton from '@/components/ui/FunButton';

interface GeneratedQuestion {
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  options: Array<{ text: string; isCorrect: boolean }>;
}

interface AIGenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
}

export default function AIGenerateQuestionsModal({
  isOpen,
  onClose,
  quizId,
  onQuestionsGenerated
}: AIGenerateQuestionsModalProps) {
  const [description, setDescription] = useState('');
  const [singleChoiceCount, setSingleChoiceCount] = useState(5);
  const [multiChoiceCount, setMultiChoiceCount] = useState(5);
  const [answerCount, setAnswerCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a quiz description');
      return;
    }

    if (singleChoiceCount < 0 || multiChoiceCount < 0 || answerCount < 2) {
      setError('Invalid question or answer counts');
      return;
    }

    if (singleChoiceCount + multiChoiceCount === 0) {
      setError('At least one question type must be specified');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setGeneratedQuestions(null);

      const response = await fetch(`/api/teacher/quiz/${quizId}/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          singleChoiceCount,
          multiChoiceCount,
          answerCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || 'Failed to generate questions';
        
        // Handle specific OpenAI quota/billing errors
        if (data.code === 'insufficient_quota' || data.details?.includes('quota') || data.details?.includes('429')) {
          errorMsg = 'OpenAI API quota exceeded. Please check your OpenAI account billing and credits. You may need to add credits or upgrade your plan.';
        } else if (data.details) {
          errorMsg = `${data.error}: ${data.details}`;
        }
        
        throw new Error(errorMsg);
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      setGeneratedQuestions(data.questions);
    } catch (err: any) {
      console.error('Error generating questions:', err);
      const errorMessage = err?.message || err?.toString() || 'Failed to generate questions. Please check your OpenAI API key and try again.';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedQuestions(null);
    handleGenerate();
  };

  const handleSave = () => {
    if (generatedQuestions && generatedQuestions.length > 0) {
      onQuestionsGenerated(generatedQuestions);
      handleClose();
    }
  };

  const handleClose = () => {
    if (!generating) {
      setDescription('');
      setSingleChoiceCount(5);
      setMultiChoiceCount(5);
      setAnswerCount(4);
      setGeneratedQuestions(null);
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay bg="#514b52b8" />
      <ModalContent bg="white" p={0} maxH="90vh" overflowY="auto">
        <ModalHeader p={6} pb={4}>Generate Questions With AI</ModalHeader>
        <ModalCloseButton top={4} right={4} />
        <ModalBody p={6} pt={0}>
          <VStack gap={4} align="stretch">
            {error && (
              <Box p={3} bg="red.50" borderRadius="md">
                <Text color="red.600" fontSize="sm">{error}</Text>
              </Box>
            )}

            {!generatedQuestions ? (
              <>
                <FormControl isRequired>
                  <FormLabel>Quiz Description</FormLabel>
                  <Box
                    as="textarea"
                    value={description}
                    onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                    placeholder="Describe the topic and scope of your quiz. For example: 'A quiz about JavaScript fundamentals covering variables, functions, and DOM manipulation.'"
                    rows={4}
                    w="full"
                    p={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'blue.500',
                      outline: 'none',
                      boxShadow: '0 0 0 1px #3182ce'
                    }}
                    resize="vertical"
                  />
                  <FormHelperText>
                    Provide a detailed description of the quiz topic and content
                  </FormHelperText>
                </FormControl>

                <HStack gap={4}>
                  <FormControl isRequired>
                    <FormLabel>Single Choice Questions</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      value={singleChoiceCount}
                      onChange={(e) => setSingleChoiceCount(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Multi Choice Questions</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      value={multiChoiceCount}
                      onChange={(e) => setMultiChoiceCount(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Answers per Question</FormLabel>
                    <Input
                      type="number"
                      min="2"
                      value={answerCount}
                      onChange={(e) => setAnswerCount(parseInt(e.target.value) || 2)}
                    />
                  </FormControl>
                </HStack>

                {generating && (
                  <Flex justify="center" align="center" py={8}>
                    <VStack gap={4}>
                      <Spinner size="lg" />
                      <Text color="gray.600">Generating questions...</Text>
                    </VStack>
                  </Flex>
                )}
              </>
            ) : (
              <Box>
                <Text fontWeight="bold" mb={4}>
                  Generated {generatedQuestions.length} questions:
                </Text>
                <VStack gap={3} align="stretch" maxH="400px" overflowY="auto">
                  {generatedQuestions.map((q, idx) => (
                    <Box key={idx} p={3} bg="gray.50" borderRadius="md">
                      <Text fontWeight="medium" mb={2}>
                        {idx + 1}. {q.text}
                      </Text>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Type: {q.type === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multi Choice'}
                      </Text>
                      <VStack align="start" gap={1}>
                        {q.options.map((opt, optIdx) => (
                          <Text key={optIdx} fontSize="sm" color={opt.isCorrect ? 'green.600' : 'gray.700'}>
                            {opt.isCorrect ? '✓' : '○'} {opt.text}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <HStack gap={3}>
            {generatedQuestions ? (
              <>
                <FunButton
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={generating}
                >
                  Regenerate
                </FunButton>
                <FunButton
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </FunButton>
                <FunButton
                  variant="solid"
                  onClick={handleSave}
                >
                  Save Questions
                </FunButton>
              </>
            ) : (
              <>
                <FunButton
                  variant="outline"
                  onClick={handleClose}
                  disabled={generating}
                >
                  Cancel
                </FunButton>
                <FunButton
                  variant="solid"
                  onClick={handleGenerate}
                  loading={generating}
                  loadingText="Generating..."
                >
                  Generate Questions
                </FunButton>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

