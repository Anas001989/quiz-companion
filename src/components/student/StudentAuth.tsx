"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Input,
  VStack,
  Text,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";
import {
  FormControl,
  FormLabel,
} from "@chakra-ui/form-control";
import { useToast } from "@chakra-ui/toast";
import { supabase } from "@/lib/supabase/supabaseClient";

interface StudentAuthProps {
  quizId: string;
  quizTitle?: string;
  onAuthSuccess: (userId: string) => void;
}

export default function StudentAuth({ quizId, quizTitle, onAuthSuccess }: StudentAuthProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const toast = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to continue.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Check if this email has already attempted this quiz BEFORE sending magic link
      const checkResponse = await fetch(`/api/student/attempts/check-email?quizId=${quizId}&email=${encodeURIComponent(email.trim())}`);
      
      if (!checkResponse.ok) {
        console.error('Failed to check email attempt status');
        // Continue anyway - fail open
      } else {
        const checkData = await checkResponse.json();
        
        if (checkData.hasAttempt) {
          setMessage("You have already completed this quiz. Only one attempt is allowed per student.");
          toast({
            title: "Already Completed",
            description: "You have already taken this quiz. Only one attempt is allowed.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }
      }

      // Check if user already exists, if not sign them up
      const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/quiz/${quizId}/select-character`,
        },
      });

      if (authError) {
        throw authError;
      }

      setMessage(
        "Check your email! We've sent you a magic link to sign in. Click the link in the email to continue."
      );
      
      toast({
        title: "Email sent!",
        description: "Please check your email and click the magic link to sign in.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Listen for auth state changes (when user clicks magic link)
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          onAuthSuccess(session.user.id);
        }
      });
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      setMessage(error.message || "Failed to send magic link. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, blue.50, white)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container
        maxW="md"
        bg="white"
        boxShadow="xl"
        rounded="2xl"
        p={8}
        border="1px"
        borderColor="gray.100"
      >
        <VStack gap={6}>
          <Heading
            as="h1"
            size="lg"
            textAlign="center"
            color="blue.700"
            className="font-bold"
          >
            Sign In Required
          </Heading>

          <Text textAlign="center" color="gray.600" fontSize="sm">
            {quizTitle ? (
              <>
                This quiz <strong>"{quizTitle}"</strong> allows only one attempt per student.
              </>
            ) : (
              "This quiz allows only one attempt per student."
            )}
          </Text>
          <Text textAlign="center" color="gray.600" fontSize="sm">
            You must sign in with your email to continue.
          </Text>

          {message && (
            <Box
              p={4}
              bg={message.includes("Check your email") ? "green.50" : "red.50"}
              borderRadius="md"
              border="1px solid"
              borderColor={message.includes("Check your email") ? "green.200" : "red.200"}
              w="full"
            >
              <Text
                color={message.includes("Check your email") ? "green.700" : "red.700"}
                fontWeight="medium"
              >
                {message}
              </Text>
            </Box>
          )}

          <form onSubmit={handleSignIn} className="w-full">
            <VStack gap={4}>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  _focus={{ borderColor: "blue.400" }}
                  disabled={loading}
                />
              </FormControl>

              <FunButton
                type="submit"
                variant="solid"
                width="full"
                size="lg"
                className="font-semibold"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </FunButton>

              <Text fontSize="xs" color="gray.500" textAlign="center">
                We'll send you a secure link to sign in. No password needed!
              </Text>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
}

