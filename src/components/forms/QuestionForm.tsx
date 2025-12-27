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
import ImageUploader from './ImageUploader';

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
  answerImageUrl?: string | null;
}

interface Question {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  questionImageUrl?: string | null;
  options: Option[];
}

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: {
    text: string;
    type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
    questionImageUrl?: string | null;
    options: Array<{ text: string; isCorrect: boolean; answerImageUrl?: string | null }>;
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
  const [questionImageUrl, setQuestionImageUrl] = useState<string | null>(null);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null); // Store file before upload
  const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean; answerImageUrl?: string | null; answerImageFile?: File | null }>>([
    { text: '', isCorrect: false, answerImageUrl: null, answerImageFile: null },
    { text: '', isCorrect: false, answerImageUrl: null, answerImageFile: null }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setQuestionText(question.text);
      setQuestionType(question.type);
      setQuestionImageUrl(question.questionImageUrl || null);
      setOptions(
        question.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          answerImageUrl: opt.answerImageUrl || null
        }))
      );
    } else {
      // Reset form for new question
      setQuestionText('');
      setQuestionType('SINGLE_CHOICE');
      setQuestionImageUrl(null);
      setQuestionImageFile(null);
      setOptions([
        { text: '', isCorrect: false, answerImageUrl: null, answerImageFile: null },
        { text: '', isCorrect: false, answerImageUrl: null, answerImageFile: null }
      ]);
    }
    setError('');
  }, [question, isOpen]);

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false, answerImageUrl: null, answerImageFile: null }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect' | 'answerImageUrl' | 'answerImageFile', value: string | boolean | null | File) => {
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

    // Enforce answer-image consistency rule: if one answer has an image, all must have images
    if (field === 'answerImageUrl' || field === 'answerImageFile') {
      const hasAnyImage = newOptions.some(opt => opt.answerImageUrl || opt.answerImageFile);
      if (hasAnyImage) {
        // Ensure all options have images (set to null if they don't have one yet)
        newOptions.forEach((opt, i) => {
          if (!opt.answerImageUrl && !opt.answerImageFile && i !== index) {
            // Keep existing image if present, otherwise leave as null
            // The validation will catch if they try to save with inconsistent images
          }
        });
      }
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

  const uploadImage = async (file: File, type: 'question' | 'answer'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to upload image';
      const details = data.details || '';
      const hint = data.hint || '';
      
      let fullError = errorMsg;
      if (details && details !== errorMsg) {
        fullError += `: ${details}`;
      }
      if (hint) {
        fullError += ` (${hint})`;
      }
      
      throw new Error(fullError);
    }

    if (!data.url) {
      throw new Error('Upload succeeded but no URL returned');
    }

    return data.url;
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

    // Validate answer-image consistency rule
    const optionsWithImages = validOptions.filter(opt => opt.answerImageUrl || opt.answerImageFile);
    const optionsWithoutImages = validOptions.filter(opt => !opt.answerImageUrl && !opt.answerImageFile);
    
    if (optionsWithImages.length > 0 && optionsWithoutImages.length > 0) {
      setError('If one answer has an image, all answers must have images. Please add images to all answers or remove all answer images.');
      return;
    }

    try {
      setLoading(true);

      // Upload question image if there's a new file
      let finalQuestionImageUrl = questionImageUrl;
      if (questionImageFile) {
        finalQuestionImageUrl = await uploadImage(questionImageFile, 'question');
      }

      // Upload answer images if there are new files
      const finalOptions = await Promise.all(
        validOptions.map(async (opt) => {
          let finalAnswerImageUrl = opt.answerImageUrl;
          if (opt.answerImageFile) {
            finalAnswerImageUrl = await uploadImage(opt.answerImageFile, 'answer');
          }
          return {
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            answerImageUrl: finalAnswerImageUrl || null
          };
        })
      );

      await onSave({
        text: questionText.trim(),
        type: questionType,
        questionImageUrl: finalQuestionImageUrl,
        options: finalOptions
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
      // Reset file states when closing
      setQuestionImageFile(null);
      setOptions(prev => prev.map(opt => ({ ...opt, answerImageFile: null })));
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay bg="#514b52b8" />
      <ModalContent bg="white" p={0} position="relative">
        <form onSubmit={handleSubmit}>
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
            {question ? 'Edit Question' : 'Add New Question'}
          </ModalHeader>
          <IconButton
            aria-label="Close modal"
            position="absolute"
            top={4}
            right={4}
            size="md"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
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
            <VStack gap={4} align="stretch" pb={4}>
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

              <FormControl>
                <FormLabel>Question Image (Optional)</FormLabel>
                <ImageUploader
                  imageUrl={questionImageUrl}
                  onImageChange={setQuestionImageUrl}
                  onFileChange={setQuestionImageFile}
                  type="question"
                  disabled={loading}
                />
                <FormHelperText>
                  Add an optional image to accompany the question
                </FormHelperText>
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
                  <VStack key={index} gap={2} align="stretch" p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                    <HStack gap={2} align="start">
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
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Answer Image (Optional)
                      </Text>
                      <ImageUploader
                        imageUrl={option.answerImageUrl || null}
                        onImageChange={(url) => handleOptionChange(index, 'answerImageUrl', url)}
                        onFileChange={(file) => handleOptionChange(index, 'answerImageFile', file)}
                        type="answer"
                        disabled={loading}
                      />
                    </Box>
                  </VStack>
                ))}
              </VStack>
            </VStack>
          </ModalBody>

          <ModalFooter pt={4} pb={6} pr={25} pl={25}>
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

