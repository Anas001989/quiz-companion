"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTeacher } from "@/context/TeacherContext";
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  VStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import FunButton from "@/components/ui/FunButton";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { teacher, logout, isLoggedIn } = useTeacher();
  
  // Only render interactive elements after hydration to prevent hydration errors from browser extensions
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Start Quiz", href: "/quiz/example/questions" },
    { label: "Pricing", href: "/plans" },
    { 
      label: isLoggedIn ? "Dashboard" : "Teacher Login", 
      href: isLoggedIn ? (teacher ? `/teacher/dashboard?teacherId=${teacher.id}` : "/teacher/dashboard") : "/teacher/auth" 
    },
  ];

  const isActive = (href: string) => {
    // Extract pathname from href (remove query params)
    const hrefPath = href.split('?')[0];
    
    if (hrefPath === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(hrefPath);
  };

  const NavLink = ({ item, isMobile = false }: { item: any; isMobile?: boolean }) => {
    const active = isActive(item.href);
    return (
      <FunButton
        variant="ghost"
        onClick={() => {
          router.push(item.href);
          if (isMobile) setIsOpen(false);
        }}
        size={isMobile ? "lg" : "md"}
        w={isMobile ? "full" : "auto"}
        justifyContent={isMobile ? "flex-start" : "center"}
        bg={active ? "#fff" : "transparent"}
        color={active ? "#9f40ce" : (!isMobile ? "white" : undefined)}
        _hover={active ? { bg: "#fff", color: "#9f40ce" } : (!isMobile ? { bg: "rgba(255, 255, 255, 0.1)", color: "white" } : undefined)}
      >
        {item.label}
      </FunButton>
    );
  };

  return (
    <Box 
      bg="linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" 
      shadow="md"
      borderBottom="1px" 
      borderColor="rgba(255, 255, 255, 0.1)"
    >
      <Container maxW="container.xl">
        <Flex h={16} align="center" justify="space-between">
          {/* Logo */}
          <HStack gap={2} cursor="pointer" onClick={() => router.push("/")}>
            <Text fontSize="2xl">🧠</Text>
            <Heading size="md" color="white">
              Quiz Companion
            </Heading>
          </HStack>

          {/* Desktop Navigation */}
          <HStack gap={2} display={{ base: "none", md: "flex" }} suppressHydrationWarning>
            {isHydrated && navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </HStack>

          {/* Mobile Menu Button */}
          <div suppressHydrationWarning>
            {isHydrated && (
              <IconButton
                display={{ base: "flex", md: "none" }}
                onClick={() => setIsOpen(true)}
                variant="ghost"
                aria-label="Open menu"
                fontSize="xl"
                color="white"
                _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              >
                ☰
              </IconButton>
            )}
          </div>
        </Flex>
      </Container>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={1000}
          onClick={() => setIsOpen(false)}
        >
          <Box
            position="absolute"
            top={0}
            right={0}
            w="300px"
            h="full"
            bg="white"
            shadow="xl"
            onClick={(e) => e.stopPropagation()}
          >
            <VStack gap={4} p={6} align="stretch">
              {/* Header */}
              <HStack justify="space-between" align="center" mb={4}>
                <HStack gap={2}>
                  <Text fontSize="2xl">🧠</Text>
                  <Heading size="md" color="gray.800">
                    Quiz Companion
                  </Heading>
                </HStack>
                <IconButton
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  aria-label="Close menu"
                  fontSize="xl"
                >
                  ✕
                </IconButton>
              </HStack>

              {/* Navigation Links */}
              <VStack gap={2} align="stretch">
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} isMobile />
                ))}
              </VStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
