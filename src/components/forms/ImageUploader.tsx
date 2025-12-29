"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Image,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

interface ImageUploaderProps {
  imageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  onFileChange?: (file: File | null) => void; // New: for storing file before upload
  type: 'question' | 'answer';
  disabled?: boolean;
}

export default function ImageUploader({
  imageUrl,
  onImageChange,
  onFileChange,
  type,
  disabled = false
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For local file preview
  const [localFile, setLocalFile] = useState<File | null>(null); // Store file locally
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setError('');
    
    // Store file locally and create preview
    setLocalFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Notify parent component about the file (but don't upload yet)
    if (onFileChange) {
      onFileChange(file);
    }
    
    // Clear the input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (!prompt.trim()) {
      setError('Please provide a prompt for image generation');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          type
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.details || 'Failed to generate image';
        console.error('Image generation API error:', data);
        throw new Error(errorMsg);
      }

      // If image generation is successful, update the image URL
      if (data.url) {
        // Validate that it's actually a URL, not just text
        if (data.url.startsWith('http://') || data.url.startsWith('https://')) {
          onImageChange(data.url);
        } else {
          console.error('Invalid URL returned from API:', data.url);
          throw new Error('Invalid image URL returned from server');
        }
      } else {
        console.error('No URL in API response:', data);
        throw new Error('No image URL returned from server');
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = () => {
    // Clean up preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setLocalFile(null);
    onImageChange(null);
    if (onFileChange) {
      onFileChange(null);
    }
    setError('');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Clean up preview URL when component unmounts or imageUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset preview when imageUrl is set externally (e.g., from existing question)
  useEffect(() => {
    if (imageUrl && !previewUrl) {
      // If we have an imageUrl but no preview, clear local file
      setLocalFile(null);
      // Validate URL format
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.warn('Invalid image URL format:', imageUrl);
        setError('Invalid image URL format');
      } else {
        setError(''); // Clear any previous errors
      }
    }
  }, [imageUrl, previewUrl]);

  return (
    <VStack gap={2} align="stretch" w="full">
      {error && (
        <Alert status="error" size="sm" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      )}

      {(imageUrl || previewUrl) ? (
        <Box position="relative" w="full">
          <Image
            src={previewUrl || imageUrl || ''}
            alt={`${type} image`}
            maxH="200px"
            w="auto"
            mx="auto"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            onError={(e) => {
              console.error('Failed to load image:', previewUrl || imageUrl);
              setError('Failed to load image. URL may be invalid or image may have been deleted.');
            }}
          />
          <HStack mt={2} justify="center" gap={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUploadClick}
              disabled={disabled || uploading}
              bg="rgba(255, 255, 255, 1)"
              borderColor="gray.300"
              display="flex"
              alignItems="center"
              _hover={{
                bg: "rgba(255, 255, 255, 1)",
                borderColor: "gray.400"
              }}
              _active={{
                bg: "rgba(255, 255, 255, 1)",
                borderColor: "gray.500"
              }}
            >
              <Text fontSize="lg" mr={1} lineHeight="1" height="25px" display="inline-flex" alignItems="start">📷</Text>
              Replace
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={handleDelete}
              disabled={disabled}
            >
              Delete
            </Button>
          </HStack>
        </Box>
      ) : (
        <VStack gap={2} align="stretch">
          <HStack gap={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUploadClick}
              disabled={disabled || uploading}
              bg="rgba(255, 255, 255, 1)"
              borderColor="gray.300"
              display="flex"
              alignItems="center"
              _hover={{
                bg: "rgba(255, 255, 255, 1)",
                borderColor: "gray.400"
              }}
              _active={{
                bg: "rgba(255, 255, 255, 1)",
                borderColor: "gray.500"
              }}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" mr={2} />
                  Uploading...
                </>
              ) : (
                <>
                  <Text fontSize="xl" mr={1} lineHeight="1" height="25px" display="inline-flex" alignItems="start">📷</Text>
                  Upload Image
                </>
              )}
            </Button>
          </HStack>
        </VStack>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />
    </VStack>
  );
}

