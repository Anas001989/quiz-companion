"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";

export default function ExampleQuizResultPage() {
  const router = useRouter();

  return (
    <Container maxW="container.md" py={8}>
      <VStack gap={8} align="stretch">
        {/* Result Card */}
        <Box
          bg="white"
          p={8}
          borderRadius="xl"
          shadow="lg"
          border="1px"
          borderColor="gray.200"
          textAlign="center"
        >
          <VStack gap={6}>
            <Box fontSize="6xl">🎉</Box>
            
            <VStack gap={4}>
              <Heading size="xl" color="blue.700">
                Quiz Completed!
              </Heading>
              <Text fontSize="lg" color="gray.600">
                Great job! You've experienced how Quiz Companion works.
              </Text>
            </VStack>

            <VStack gap={4} w="full">
              <HStack gap={4} justify="center" flexWrap="wrap">
                <Badge colorScheme="green" variant="subtle" px={3} py={1} fontSize="md">
                  ✅ Interactive Questions
                </Badge>
                <Badge colorScheme="blue" variant="subtle" px={3} py={1} fontSize="md">
                  ✅ Character Animations
                </Badge>
                <Badge colorScheme="purple" variant="subtle" px={3} py={1} fontSize="md">
                  ✅ Instant Feedback
                </Badge>
              </HStack>

              <Text color="gray.500" fontSize="sm" maxW="md">
                This was just a preview! Teachers can create unlimited quizzes 
                with custom questions, characters, and themes.
              </Text>
            </VStack>

            <VStack gap={4} w="full">
              <FunButton
                variant="solid"
                size="lg"
                onClick={() => router.push("/plans")}
                w="full"
                py={6}
                fontSize="lg"
                fontWeight="semibold"
              >
                Start Teaching with Quiz Companion
              </FunButton>
              
              <HStack gap={4} w="full">
                <FunButton
                  variant="outline"
                  onClick={() => router.push("/quiz/example/questions")}
                  flex={1}
                >
                  Try Again
                </FunButton>
                <FunButton
                  variant="outline"
                  onClick={() => router.push("/")}
                  flex={1}
                >
                  Back to Home
                </FunButton>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Features Preview */}
        <Box
          bg="gray.50"
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.200"
        >
          <VStack gap={4}>
            <Heading size="md" color="gray.800">
              What Teachers Get with Quiz Companion:
            </Heading>
            
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={4}
              w="full"
            >
              <VStack gap={3} align="start">
                <HStack gap={2}>
                  <Text fontSize="lg">📚</Text>
                  <Text fontSize="sm" color="gray.700">Unlimited quizzes</Text>
                </HStack>
                <HStack gap={2}>
                  <Text fontSize="lg">🎮</Text>
                  <Text fontSize="sm" color="gray.700">Animated characters</Text>
                </HStack>
                <HStack gap={2}>
                  <Text fontSize="lg">📊</Text>
                  <Text fontSize="sm" color="gray.700">Student analytics</Text>
                </HStack>
              </VStack>
              
              <VStack gap={3} align="start">
                <HStack gap={2}>
                  <Text fontSize="lg">🎨</Text>
                  <Text fontSize="sm" color="gray.700">Custom themes</Text>
                </HStack>
                <HStack gap={2}>
                  <Text fontSize="lg">👥</Text>
                  <Text fontSize="sm" color="gray.700">Classroom management</Text>
                </HStack>
                <HStack gap={2}>
                  <Text fontSize="lg">📈</Text>
                  <Text fontSize="sm" color="gray.700">Progress tracking</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
