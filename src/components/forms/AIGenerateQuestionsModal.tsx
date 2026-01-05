"use client";

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Text,
  Spinner,
  Flex,
  IconButton,
  Badge,
  Button
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@chakra-ui/modal';
import {
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/form-control';
import FunButton from '@/components/ui/FunButton';

type GenerationMode = 'teacher-controlled' | 'ai-controlled';
type ImageMode = 'none' | 'question-only' | 'answer-only' | 'both';

interface QuestionSet {
  id: string;
  count: number;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  answerCount: number;
  imageMode: ImageMode;
}

interface GeneratedQuestion {
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  questionImageUrl?: string | null;
  options: Array<{ text: string; isCorrect: boolean; answerImageUrl?: string | null }>;
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
  const [mode, setMode] = useState<GenerationMode>('teacher-controlled');
  const [description, setDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([
    { id: '1', count: 5, type: 'SINGLE_CHOICE', answerCount: 4, imageMode: 'none' }
  ]);
  const [imageProvider, setImageProvider] = useState<'openai' | 'gemini'>('openai');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState('');

  const addQuestionSet = () => {
    const newSet: QuestionSet = {
      id: Date.now().toString(),
      count: 3,
      type: 'SINGLE_CHOICE',
      answerCount: 4,
      imageMode: 'none'
    };
    setQuestionSets([...questionSets, newSet]);
  };

  const removeQuestionSet = (id: string) => {
    if (questionSets.length > 1) {
      setQuestionSets(questionSets.filter(set => set.id !== id));
    }
  };

  const updateQuestionSet = (id: string, field: keyof QuestionSet, value: any) => {
    setQuestionSets(questionSets.map(set => 
      set.id === id ? { ...set, [field]: value } : set
    ));
  };

  const handlePreview = () => {
    if (mode === 'teacher-controlled') {
      const total = questionSets.reduce((sum, set) => sum + set.count, 0);
      if (total === 0) {
        setError('At least one question must be specified');
        return;
      }
    } else {
      if (!description.trim()) {
        setError('Please enter a quiz description');
        return;
      }
      if (totalQuestions < 1) {
        setError('Total questions must be at least 1');
        return;
      }
    }
    setError('');
    setPreviewMode(true);
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setGeneratedQuestions(null);

      let requestBody: any;

      if (mode === 'teacher-controlled') {
        // Teacher-controlled mode: send question sets
        requestBody = {
          mode: 'teacher-controlled',
          questionSets: questionSets.map(set => ({
            count: set.count,
            type: set.type,
            answerCount: set.answerCount,
            imageMode: set.imageMode
          })),
          description: description || 'General quiz questions',
          imageProvider
        };
      } else {
        // AI-controlled mode: send description and total count
        requestBody = {
          mode: 'ai-controlled',
          description,
          totalQuestions,
          imageProvider
        };
      }

      const response = await fetch(`/api/teacher/quiz/${quizId}/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || 'Failed to generate questions';
        
        if (data.code === 'insufficient_quota' || data.details?.includes('quota') || data.details?.includes('429')) {
          errorMsg = 'OpenAI API quota exceeded. Please check your OpenAI account billing and credits.';
        } else if (data.details) {
          errorMsg = `${data.error}: ${data.details}`;
        }
        
        throw new Error(errorMsg);
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      setGeneratedQuestions(data.questions);
      setPreviewMode(false);
    } catch (err: any) {
      console.error('Error generating questions:', err);
      const errorMessage = err?.message || err?.toString() || 'Failed to generate questions.';
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
      setTotalQuestions(10);
      setQuestionSets([{ id: '1', count: 5, type: 'SINGLE_CHOICE', answerCount: 4, imageMode: 'none' }]);
      setImageProvider('openai');
      setGeneratedQuestions(null);
      setPreviewMode(false);
      setError('');
      onClose();
    }
  };

  const getTotalQuestionsPreview = () => {
    if (mode === 'teacher-controlled') {
      return questionSets.reduce((sum, set) => sum + set.count, 0);
    }
    return totalQuestions;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay bg="#514b52b8" />
      <ModalContent bg="white" p={0} position="relative">
        <ModalHeader 
          pt={20} 
          pb={20} 
          pr={32} 
          pl={32}
          fontSize="18px"
          fontWeight={700}
          color="var(--background)"
          bg="linear-gradient(90deg, rgba(209, 81, 225, 1) 0%, rgba(255, 255, 255, 1) 100%)"
        >
          Generate Questions With AI
        </ModalHeader>
        <IconButton
          aria-label="Close modal"
          position="absolute"
          top={4}
          right={4}
          size="md"
          variant="ghost"
          onClick={handleClose}
          disabled={generating}
          borderRadius="md"
          fontSize="xl"
          color="gray.600"
          _hover={{
            bg: "gray.100",
            color: "gray.800"
          }}
          _active={{
            bg: "gray.200"
          }}
          zIndex={10}
        >
          ✕
        </IconButton>
        <ModalBody 
          pt={10}
          pb={10}
          pr={25}
          pl={25}
          maxH="70vh"
          overflowY="auto"
          bg="rgba(248, 247, 248, 1)"
        >
          <VStack gap={4} align="stretch">
            {error && (
              <Box p={3} bg="red.50" borderRadius="md">
                <Text color="red.600" fontSize="sm">{error}</Text>
              </Box>
            )}

            {!generatedQuestions ? (
              <>
                {/* Image Provider Selection */}
                <FormControl>
                  <FormLabel>Image Generation Provider</FormLabel>
                  <Box w="full">
                    <select
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value as 'openai' | 'gemini')}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        fontSize: '1rem'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3182ce';
                        e.target.style.outline = 'none';
                        e.target.style.boxShadow = '0 0 0 1px #3182ce';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                      }}
                    >
                      <option value="openai">OpenAI (Fast – Recommended)</option>
                      <option value="gemini">Gemini (Slower – Better for complex images like math/diagrams)</option>
                    </select>
                  </Box>
                  <FormHelperText>
                    Choose the AI service for generating images. OpenAI is faster, while Gemini is better for complex diagrams and geometry.
                  </FormHelperText>
                </FormControl>

                {/* Generation Mode Selection */}
                <FormControl>
                  <FormLabel>Generation Mode</FormLabel>
                  <Box w="full">
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as GenerationMode)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        fontSize: '1rem'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3182ce';
                        e.target.style.outline = 'none';
                        e.target.style.boxShadow = '0 0 0 1px #3182ce';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                      }}
                    >
                      <option value="teacher-controlled">Teacher-Controlled (You define question sets)</option>
                      <option value="ai-controlled">AI-Controlled (AI decides everything)</option>
                    </select>
                  </Box>
                  <FormHelperText>
                    {mode === 'teacher-controlled' 
                      ? 'You control the number of questions, types, and image settings'
                      : 'AI automatically decides question types, counts, and whether images are needed'}
                  </FormHelperText>
                </FormControl>

                {mode === 'teacher-controlled' ? (
                  <>
                    <FormControl>
                      <FormLabel>Quiz Description (Optional)</FormLabel>
                      <Box
                        as="textarea"
                        value={description}
                        onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                        placeholder="Describe the topic and scope of your quiz..."
                        rows={3}
                        w="full"
                        p={2}
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.300"
                        bg="white"
                      />
                    </FormControl>

                    <VStack gap={3} align="stretch">
                      <HStack justify="space-between">
                        <FormLabel mb={0}>Question Sets</FormLabel>
                        <Button 
                          size="sm" 
                          onClick={addQuestionSet}
                          bg="linear-gradient(135deg, rgba(219, 39, 119, 1) 0%, rgba(124, 58, 237, 1) 100%)"
                          color="white"
                          _hover={{
                            bg: "linear-gradient(135deg, rgba(219, 39, 119, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)",
                            transform: "translateY(-2px)",
                            shadow: "lg"
                          }}
                          transition="all 0.2s ease"
                        >
                          + Add Set
                        </Button>
                      </HStack>

                      {questionSets.map((set, idx) => (
                        <Box key={set.id} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                          <VStack gap={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Set {idx + 1}</Text>
                              {questionSets.length > 1 && (
                                <IconButton
                                  aria-label="Remove set"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeQuestionSet(set.id)}
                                >
                                  🗑️
                                </IconButton>
                              )}
                            </HStack>

                            <HStack gap={3}>
                              <FormControl>
                                <FormLabel fontSize="sm">Count</FormLabel>
                                <Input
                                  type="number"
                                  min="1"
                                  value={set.count}
                                  onChange={(e) => updateQuestionSet(set.id, 'count', parseInt(e.target.value) || 1)}
                                  size="sm"
                                  bg="white"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm">Type</FormLabel>
                                <Box w="full">
                                  <select
                                    value={set.type}
                                    onChange={(e) => updateQuestionSet(set.id, 'type', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '0.375rem',
                                      borderRadius: '0.375rem',
                                      border: '1px solid #e2e8f0',
                                      backgroundColor: 'white',
                                      fontSize: '0.875rem'
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = '#3182ce';
                                      e.target.style.outline = 'none';
                                      e.target.style.boxShadow = '0 0 0 1px #3182ce';
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = '#e2e8f0';
                                      e.target.style.boxShadow = 'none';
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = '#cbd5e0';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (document.activeElement !== e.currentTarget) {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                      }
                                    }}
                                  >
                                    <option value="SINGLE_CHOICE">Single Choice</option>
                                    <option value="MULTI_CHOICE">Multiple Choice</option>
                                  </select>
                                </Box>
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm">Answers</FormLabel>
                                <Input
                                  type="number"
                                  min="2"
                                  value={set.answerCount}
                                  onChange={(e) => updateQuestionSet(set.id, 'answerCount', parseInt(e.target.value) || 2)}
                                  size="sm"
                                  bg="white"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm">Image Mode</FormLabel>
                                <Box w="full">
                                  <select
                                    value={set.imageMode}
                                    onChange={(e) => updateQuestionSet(set.id, 'imageMode', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '0.375rem',
                                      borderRadius: '0.375rem',
                                      border: '1px solid #e2e8f0',
                                      backgroundColor: 'white',
                                      fontSize: '0.875rem'
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = '#3182ce';
                                      e.target.style.outline = 'none';
                                      e.target.style.boxShadow = '0 0 0 1px #3182ce';
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = '#e2e8f0';
                                      e.target.style.boxShadow = 'none';
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = '#cbd5e0';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (document.activeElement !== e.currentTarget) {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                      }
                                    }}
                                  >
                                    <option value="none">No images</option>
                                    <option value="question-only">Question image only</option>
                                    <option value="answer-only">Answer images only</option>
                                    <option value="both">Question + Answer images</option>
                                  </select>
                                </Box>
                              </FormControl>
                            </HStack>
                          </VStack>
                        </Box>
                      ))}

                      <Box p={3} bg="blue.50" borderRadius="md">
                        <Text fontSize="sm" fontWeight="bold" mb={1}>
                          Preview: {getTotalQuestionsPreview()} total questions
                        </Text>
                        {questionSets.map((set, idx) => (
                          <Text key={set.id} fontSize="xs" color="gray.600">
                            • {set.count} {set.type === 'SINGLE_CHOICE' ? 'Single choice' : 'Multiple choice'} | {set.answerCount} answers | {set.imageMode.replace('-', ' ')}
                          </Text>
                        ))}
                      </Box>
                    </VStack>
                  </>
                ) : (
                  <>
                    <FormControl isRequired>
                      <FormLabel>Quiz Description</FormLabel>
                      <Box
                        as="textarea"
                        value={description}
                        onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                        placeholder="Describe the topic and scope of your quiz. For example: 'A math geometry quiz covering triangles, circles, and polygons.'"
                        rows={4}
                        w="full"
                        p={2}
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.300"
                      />
                      <FormHelperText>
                        AI will analyze this description to determine if images are needed and what question types to create
                      </FormHelperText>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Total Number of Questions</FormLabel>
                      <Input
                        type="number"
                        min="1"
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
                      />
                      <FormHelperText>
                        AI will decide how to distribute these questions across different types
                      </FormHelperText>
                    </FormControl>
                  </>
                )}

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
                      {q.questionImageUrl && (
                        <Box mb={2}>
                          <img 
                            src={q.questionImageUrl} 
                            alt="Question" 
                            style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px' }}
                          />
                        </Box>
                      )}
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Type: {q.type === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multi Choice'}
                      </Text>
                      <VStack align="start" gap={1}>
                        {q.options.map((opt, optIdx) => (
                          <HStack key={optIdx} gap={2}>
                            <Text fontSize="sm" color={opt.isCorrect ? 'green.600' : 'gray.700'}>
                              {opt.isCorrect ? '✓' : '○'} {opt.text}
                            </Text>
                            {opt.answerImageUrl && (
                              <img 
                                src={opt.answerImageUrl} 
                                alt="Answer" 
                                style={{ maxWidth: '100px', maxHeight: '75px', borderRadius: '4px' }}
                              />
                            )}
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter pt={4} pb={6} pr={25} pl={25}>
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
