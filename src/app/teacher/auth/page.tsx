"use client";

import { useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    emailOrUsername: "",
    password: "",
    confirmPassword: ""
  });

  // Prevent hydration mismatch from browser extensions
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.emailOrUsername.trim()) {
      setMessage("Please enter your email or username");
      return;
    }

    if (!formData.password.trim()) {
      setMessage("Please enter your password");
      return;
    }

    try {
      setLoading(true);
      
      // Find teacher by email or username and verify password
      const response = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Teacher authenticated, set in context and redirect to dashboard
        setTeacher(data.teacher);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => router.push(`/teacher/dashboard?teacherId=${data.teacher.id}`), 1000);
      } else {
        // Invalid credentials
        setMessage(data.error || "Invalid email/username or password. Please try again.");
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
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage("Please enter your first and last name");
      return;
    }

    if (!formData.username.trim()) {
      setMessage("Please enter a username");
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      setMessage("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (!formData.email.trim()) {
      setMessage("Please enter your email");
      return;
    }

    if (!formData.password.trim()) {
      setMessage("Please enter a password");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters long");
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
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
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

  // Prevent hydration mismatch - only render form after mount
  if (!mounted) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Box bg="white" p={8} borderRadius="xl" shadow="lg">
            <VStack gap={8}>
              <VStack gap={2} textAlign="center">
                <Heading size="lg" color="blue.700">
                  Teacher Portal
                </Heading>
                <Text color="gray.600">Loading...</Text>
              </VStack>
            </VStack>
          </Box>
        </Container>
      </Box>
    );
  }

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
                      <Text fontSize="sm" fontWeight="medium">Email or Username</Text>
                      <Input
                        type="text"
                        name="emailOrUsername"
                        value={formData.emailOrUsername}
                        onChange={handleInputChange}
                        placeholder="Enter your email or username"
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
                        placeholder="Enter your password"
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
                    <HStack gap={4} w="full">
                      <VStack gap={2} align="start" w="full">
                        <Text fontSize="sm" fontWeight="medium">First Name</Text>
                        <Input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="First name"
                          required
                        />
                      </VStack>

                      <VStack gap={2} align="start" w="full">
                        <Text fontSize="sm" fontWeight="medium">Last Name</Text>
                        <Input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Last name"
                          required
                        />
                      </VStack>
                    </HStack>

                    <VStack gap={2} align="start" w="full">
                      <Text fontSize="sm" fontWeight="medium">Username</Text>
                      <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a username"
                        required
                      />
                      <Text fontSize="xs" color="gray.500">
                        Letters, numbers, and underscores only
                      </Text>
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
                    setFormData({ 
                      firstName: "", 
                      lastName: "", 
                      username: "", 
                      email: "", 
                      emailOrUsername: "",
                      password: "", 
                      confirmPassword: "" 
                    });
                    setMessage("");
                  }}
                >
                  {isLogin ? "Register" : "Sign In"}
                </FunButton>
              </HStack>
            </VStack>

          </VStack>
        </Box>
      </Container>
    </Box>
  );
}