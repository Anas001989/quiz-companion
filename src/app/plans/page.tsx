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

export default function PlansPage() {
  const router = useRouter();

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for individual teachers getting started",
      features: [
        "Up to 5 quizzes",
        "Basic character animations",
        "Student progress tracking",
        "Email support",
        "Standard question types"
      ],
      cta: "Get Started Free",
      popular: false,
      color: "gray"
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "Ideal for active teachers and small classrooms",
      features: [
        "Unlimited quizzes",
        "Advanced character animations",
        "Detailed analytics dashboard",
        "Priority support",
        "All question types",
        "Custom quiz themes",
        "Export student reports"
      ],
      cta: "Start Pro Trial",
      popular: true,
      color: "blue"
    },
    {
      name: "School",
      price: "$29",
      period: "per month",
      description: "Perfect for schools and educational institutions",
      features: [
        "Everything in Pro",
        "Multi-teacher accounts",
        "Classroom management",
        "Admin dashboard",
        "Custom branding",
        "API access",
        "Dedicated support",
        "Bulk student import"
      ],
      cta: "Contact Sales",
      popular: false,
      color: "purple"
    }
  ];

  const handlePlanSelect = (planName: string) => {
    if (planName === "Starter" || planName === "Pro") {
      router.push('/teacher/dashboard');
    } else {
      // For School plan, could redirect to contact form
      router.push('/teacher/dashboard');
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" shadow="sm" py={4}>
        <Container maxW="container.xl">
          <VStack gap={8} textAlign="center" py={16}>
            <VStack gap={4}>
              <Heading size="2xl" color="gray.800">
                Choose Your Plan
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Start teaching with Quiz Companion today. Pick the plan that's right for you 
                and your students.
              </Text>
            </VStack>
          </VStack>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Box py={20}>
        <Container maxW="container.xl">
          <Box
            display="grid"
            gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
            gap={8}
            maxW="6xl"
            mx="auto"
          >
            {plans.map((plan, index) => (
              <Box
                key={index}
                position="relative"
                bg="white"
                borderRadius="xl"
                p={6}
                shadow={plan.popular ? "xl" : "md"}
                border={plan.popular ? "2px" : "1px"}
                borderColor={plan.popular ? `${plan.color}.500` : "gray.200"}
                _hover={{ shadow: "xl", transform: "translateY(-4px)" }}
                transition="all 0.2s"
              >
                {plan.popular && (
                  <Badge
                    position="absolute"
                    top={-3}
                    left="50%"
                    transform="translateX(-50%)"
                    colorScheme={plan.color}
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    Most Popular
                  </Badge>
                )}
                
                <VStack gap={6} align="stretch">
                  <VStack gap={2} textAlign="center">
                    <Heading size="lg" color="gray.800">
                      {plan.name}
                    </Heading>
                    <HStack gap={1} align="baseline">
                      <Text fontSize="4xl" fontWeight="bold" color={`${plan.color}.600`}>
                        {plan.price}
                      </Text>
                      <Text color="gray.500" fontSize="sm">
                        {plan.period}
                      </Text>
                    </HStack>
                    <Text color="gray.600" fontSize="sm">
                      {plan.description}
                    </Text>
                  </VStack>

                  <VStack gap={6} align="stretch">
                    <VStack gap={3} align="stretch">
                      {plan.features.map((feature, featureIndex) => (
                        <HStack key={featureIndex} gap={3}>
                          <Box
                            w={4}
                            h={4}
                            borderRadius="full"
                            bg={`${plan.color}.500`}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="white" fontSize="xs">✓</Text>
                          </Box>
                          <Text fontSize="sm" color="gray.700">
                            {feature}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    <FunButton
                      variant="solid"
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name)}
                      w="full"
                      py={6}
                      fontSize="md"
                      fontWeight="semibold"
                    >
                      {plan.cta}
                    </FunButton>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={16} bg="white">
        <Container maxW="container.xl">
          <VStack gap={12}>
            <VStack gap={4} textAlign="center">
              <Heading size="xl" color="gray.800">
                Frequently Asked Questions
              </Heading>
            </VStack>

            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={8}
              maxW="4xl"
              mx="auto"
            >
              <VStack gap={6} align="stretch">
                <Box>
                  <Heading size="md" color="gray.800" mb={2}>
                    Can I change plans anytime?
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Yes! You can upgrade or downgrade your plan at any time. 
                    Changes take effect immediately.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" color="gray.800" mb={2}>
                    Is there a free trial?
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    The Starter plan is free forever. Pro and School plans 
                    come with a 14-day free trial.
                  </Text>
                </Box>
              </VStack>

              <VStack gap={6} align="stretch">
                <Box>
                  <Heading size="md" color="gray.800" mb={2}>
                    What payment methods do you accept?
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    We accept all major credit cards, PayPal, and bank transfers 
                    for annual subscriptions.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" color="gray.800" mb={2}>
                    Do you offer student discounts?
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Yes! Students and educators can get 50% off any paid plan 
                    with a valid school email.
                  </Text>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
