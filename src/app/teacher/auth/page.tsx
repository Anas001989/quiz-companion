"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTeacher } from "@/context/TeacherContext";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";

export default function TeacherAuthPage() {
  const router = useRouter();
  const { setTeacher } = useTeacher();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setMessage("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      
      // Find teacher by email
      const response = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Teacher exists, set in context and redirect to dashboard
        setTeacher(data.teacher);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => router.push(`/teacher/dashboard?teacherId=${data.teacher.id}`), 1000);
      } else {
        // Teacher doesn't exist, show registration option
        setMessage("Account not found. Please register for a new account.");
        setIsLogin(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage("Please enter your name and email");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/teacher/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set teacher in context and redirect to dashboard
        setTeacher(data.teacher);
        setMessage("Registration successful! Welcome to Quiz Companion!");
        setTimeout(() => router.push(`/teacher/dashboard?teacherId=${data.teacher.id}`), 1000);
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="xl" shadow="lg">
          <VStack gap={8}>
            {/* Header */}
            <VStack gap={2} textAlign="center">
              <Heading size="lg" color="blue.700">
                Teacher Portal
              </Heading>
              <Text color="gray.600">
                {isLogin ? "Sign in to your account" : "Create your teacher account"}
              </Text>
            </VStack>

            {/* Message Display */}
            {message && (
              <Box p={4} bg={message.includes('successful') ? 'green.50' : 'red.50'} borderRadius="md">
                <Text color={message.includes('successful') ? 'green.600' : 'red.600'} fontSize="sm">
                  {message}
                </Text>
              </Box>
            )}

            {/* Form */}
            <Box w="full">
              {isLogin ? (
                <form onSubmit={handleLogin}>
                  <VStack gap={4}>
                    <VStack gap={2} align="start" w="full">
                      <Text fontSize="sm" fontWeight="medium">Email</Text>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                      />
                    </VStack>

                    <FunButton
                      type="submit"
                      variant="solid"
                      size="lg"
                      w="full"
                      loading={loading}
                      loadingText="Signing in..."
                    >
                      Sign In
                    </FunButton>
                  </VStack>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <VStack gap={4}>
                    <VStack gap={2} align="start" w="full">
                      <Text fontSize="sm" fontWeight="medium">Full Name</Text>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </VStack>

                    <VStack gap={2} align="start" w="full">
                      <Text fontSize="sm" fontWeight="medium">Email</Text>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                      />
                    </VStack>

                    <VStack gap={2} align="start" w="full">
                      <Text fontSize="sm" fontWeight="medium">Password</Text>
                      <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a password"
                        required
                      />
                    </VStack>

                    <VStack gap={2} align="start" w="full">
                      <Text fontSize="sm" fontWeight="medium">Confirm Password</Text>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        required
                      />
                    </VStack>

                    <FunButton
                      type="submit"
                      variant="solid"
                      size="lg"
                      w="full"
                      loading={loading}
                      loadingText="Creating account..."
                    >
                      Create Account
                    </FunButton>
                  </VStack>
                </form>
              )}
            </Box>

            {/* Toggle between login and register */}
            <VStack gap={4} w="full">
              <Box w="full" h="1px" bg="gray.200" />
              <HStack gap={2}>
                <Text color="gray.600" fontSize="sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </Text>
                <FunButton
                  variant="ghost"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                    setMessage("");
                  }}
                >
                  {isLogin ? "Register" : "Sign In"}
                </FunButton>
              </HStack>
            </VStack>

            {/* Demo info */}
            <Box p={4} bg="blue.50" borderRadius="md" w="full">
              <Text fontSize="sm" color="blue.700" textAlign="center">
                <strong>Demo Mode:</strong> For testing, you can use any email to sign in. 
                If the account doesn't exist, you'll be prompted to register.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}