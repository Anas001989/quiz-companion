"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Text,
  IconButton,
  Button
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
import { Checkbox } from '@chakra-ui/checkbox';
import FunButton from '@/components/ui/FunButton';

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  options: Option[];
}

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: {
    text: string;
    type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
    options: Array<{ text: string; isCorrect: boolean }>;
  }) => Promise<void>;
  question?: Question | null;
  quizId: string;
}

export default function QuestionForm({
  isOpen,
  onClose,
  onSave,
  question,
  quizId
}: QuestionFormProps) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'SINGLE_CHOICE' | 'MULTI_CHOICE'>('SINGLE_CHOICE');
  const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setQuestionText(question.text);
      setQuestionType(question.type);
      setOptions(
        question.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      );
    } else {
      // Reset form for new question
      setQuestionText('');
      setQuestionType('SINGLE_CHOICE');
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]);
    }
    setError('');
  }, [question, isOpen]);

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    };

    // For SINGLE_CHOICE, ensure only one option is correct
    if (field === 'isCorrect' && value === true && questionType === 'SINGLE_CHOICE') {
      newOptions.forEach((opt, i) => {
        if (i !== index) {
          opt.isCorrect = false;
        }
      });
    }

    setOptions(newOptions);
  };

  const handleTypeChange = (type: 'SINGLE_CHOICE' | 'MULTI_CHOICE') => {
    setQuestionType(type);
    // For SINGLE_CHOICE, ensure only one option is correct
    if (type === 'SINGLE_CHOICE') {
      const newOptions = [...options];
      let foundCorrect = false;
      newOptions.forEach((opt, index) => {
        if (opt.isCorrect && !foundCorrect) {
          foundCorrect = true;
        } else if (opt.isCorrect && foundCorrect) {
          opt.isCorrect = false;
        }
      });
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!questionText.trim()) {
      setError('Please enter a question text');
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    const correctOptions = validOptions.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      setError('Please mark at least one option as correct');
      return;
    }

    if (questionType === 'SINGLE_CHOICE' && correctOptions.length > 1) {
      setError('Single choice questions can only have one correct answer');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        text: questionText.trim(),
        type: questionType,
        options: validOptions
      });
      // Form will be reset by useEffect when question changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay bg="#514b52b8" />
      <ModalContent bg="white" p={0}>
        <form onSubmit={handleSubmit}>
          <ModalHeader p={6} pb={4}>
            {question ? 'Edit Question' : 'Add New Question'}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody p={6} pt={0}>
            <VStack gap={4} align="stretch">
              {error && (
                <Box p={3} bg="red.50" borderRadius="md">
                  <Text color="red.600" fontSize="sm">{error}</Text>
                </Box>
              )}

              <FormControl isRequired>
                <FormLabel>Question Text</FormLabel>
                <Input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Question Type</FormLabel>
                <Box w="full">
                  <select
                    value={questionType}
                    onChange={(e) => handleTypeChange(e.target.value as 'SINGLE_CHOICE' | 'MULTI_CHOICE')}
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
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTI_CHOICE">Multiple Choice</option>
                  </select>
                </Box>
                <FormHelperText>
                  {questionType === 'SINGLE_CHOICE' && 'Students can select only one answer'}
                  {questionType === 'MULTI_CHOICE' && 'Students can select multiple answers'}
                </FormHelperText>
              </FormControl>

              <Box h="1px" bg="gray.200" w="full" />

              <VStack gap={3} align="stretch">
                <HStack justify="space-between">
                  <FormLabel mb={0}>Options</FormLabel>
                  <Button size="sm" onClick={handleAddOption} type="button">
                    + Add Option
                  </Button>
                </HStack>

                {options.map((option, index) => (
                  <HStack key={index} gap={2} align="start">
                    <Checkbox
                      isChecked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                      colorScheme="green"
                      mt={1}
                    />
                    <Input
                      flex={1}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <IconButton
                        aria-label="Remove option"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveOption(index)}
                        type="button"
                      >
                        🗑️
                      </IconButton>
                    )}
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </ModalBody>

          <ModalFooter p={6} pt={4}>
            <HStack gap={3}>
              <FunButton
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                type="button"
              >
                Cancel
              </FunButton>
              <FunButton
                variant="solid"
                type="submit"
                loading={loading}
                loadingText={question ? 'Updating...' : 'Adding...'}
              >
                {question ? 'Update Question' : 'Add Question'}
              </FunButton>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

