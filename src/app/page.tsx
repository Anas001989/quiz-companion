"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: "🧠",
      title: "Smart Learning",
      description: "Multiple question types with intelligent feedback systems"
    },
    {
      icon: "🎮",
      title: "Gamified Experience", 
      description: "Animated characters and engaging visual feedback"
    },
    {
      icon: "📊",
      title: "Progress Tracking",
      description: "Monitor student performance and learning outcomes"
    },
    {
      icon: "👥",
      title: "Classroom Ready",
      description: "Perfect for schools, tutoring centers, and homeschooling"
    }
  ];

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Hero Section */}
      <Box
        bg="linear-gradient(135deg, #3182ce 0%, #805ad5 100%)"
        color="white"
        py={20}
      >
        <Container maxW="container.xl">
          <VStack gap={8} textAlign="center">
            <VStack gap={4}>
              <Heading size="4xl" fontWeight="bold">
                Quiz Companion
              </Heading>
              <Text fontSize="xl" maxW="2xl" opacity={0.9}>
                Transform learning with interactive, gamified quizzes that engage students 
                through animated character feedback and smart progress tracking.
              </Text>
            </VStack>
            
            <HStack gap={4} flexWrap="wrap" justify="center">
              <FunButton
                size="lg"
                variant="solid"
                onClick={() => router.push('/plans')}
                px={8}
                py={6}
                fontSize="lg"
              >
                Start Teaching
              </FunButton>
              <FunButton
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                _hover={{ bg: "white", color: "blue.600" }}
                onClick={() => router.push('/quiz/example/questions')}
                px={8}
                py={6}
                fontSize="lg"
                fontWeight="semibold"
              >
                Start Quiz
              </FunButton>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20}>
        <Container maxW="container.xl">
          <VStack gap={16}>
            <VStack gap={4} textAlign="center">
              <Heading size="2xl" color="gray.800">
                Why Choose Quiz Companion?
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Our platform combines cutting-edge technology with proven educational 
                methods to create an engaging learning experience for students of all ages.
              </Text>
            </VStack>

            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
              gap={8}
            >
              {features.map((feature, index) => (
                <VStack
                  key={index}
                  p={6}
                  bg="white"
                  borderRadius="xl"
                  shadow="md"
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                  textAlign="center"
                >
                  <Text fontSize="4xl" mb={4}>
                    {feature.icon}
                  </Text>
                  <Heading size="md" color="gray.800">
                    {feature.title}
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    {feature.description}
                  </Text>
                </VStack>
              ))}
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Video Section */}
      <Box py={20} bg="white">
        <Container maxW="container.xl">
          <VStack gap={8}>
            <VStack gap={4} textAlign="center">
              <Heading size="2xl" color="gray.800">
                See Quiz Companion in Action
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Watch how our animated characters and interactive features 
                make learning fun and engaging for students.
              </Text>
            </VStack>

            <Box
              w="full"
              maxW="4xl"
              h="400px"
              bg="gray.100"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="2px dashed"
              borderColor="gray.300"
            >
              <VStack gap={4}>
                <Box fontSize="6xl" color="gray.400">
                  ▶️
                </Box>
                <Text color="gray.500" fontSize="lg">
                  YouTube Video Placeholder
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Demo video coming soon
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20} bg="linear-gradient(90deg, #3182ce 0%, #805ad5 100%)" color="white">
        <Container maxW="container.xl">
          <VStack gap={8} textAlign="center">
            <VStack gap={4}>
              <Heading size="2xl">
                Ready to Transform Learning?
              </Heading>
              <Text fontSize="lg" opacity={0.9} maxW="2xl">
                Join thousands of educators who are already using Quiz Companion 
                to create engaging, interactive learning experiences.
              </Text>
            </VStack>

            <HStack gap={4} flexWrap="wrap" justify="center">
              <FunButton
                size="lg"
                variant="solid"
                onClick={() => router.push('/plans')}
                px={8}
                py={6}
                fontSize="lg"
              >
                Get Started as Teacher
              </FunButton>
              <FunButton
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                borderWidth="2px"
                _hover={{ 
                  bg: "white", 
                  color: "purple.600"
                }}
                onClick={() => router.push('/quiz/example/questions')}
                px={8}
                py={6}
                fontSize="lg"
              >
                Try as Student
              </FunButton>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={8} bg="gray.800" color="white">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={2}>
              <Heading size="md">Quiz Companion</Heading>
              <Text fontSize="sm" color="gray.400">
                Making learning fun and engaging
              </Text>
            </VStack>
            <HStack gap={6}>
              <Badge colorScheme="green" variant="subtle">
                ✅ Character Animations
              </Badge>
              <Badge colorScheme="blue" variant="subtle">
                ✅ Progress Tracking
              </Badge>
              <Badge colorScheme="purple" variant="subtle">
                ✅ Classroom Ready
              </Badge>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}