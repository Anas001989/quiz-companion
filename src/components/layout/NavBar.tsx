"use client";

import { useState } from "react";
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
  const { teacher, logout, isLoggedIn } = useTeacher();

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
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ item, isMobile = false }: { item: any; isMobile?: boolean }) => (
    <FunButton
      variant={isActive(item.href) ? "solid" : "ghost"}
      onClick={() => {
        router.push(item.href);
        if (isMobile) setIsOpen(false);
      }}
      size={isMobile ? "lg" : "md"}
      w={isMobile ? "full" : "auto"}
      justifyContent={isMobile ? "flex-start" : "center"}
    >
      {item.label}
    </FunButton>
  );

  return (
    <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
      <Container maxW="container.xl">
        <Flex h={16} align="center" justify="space-between">
          {/* Logo */}
          <HStack gap={2} cursor="pointer" onClick={() => router.push("/")}>
            <Text fontSize="2xl">🧠</Text>
            <Heading size="md" color="blue.700">
              Quiz Companion
            </Heading>
          </HStack>

          {/* Desktop Navigation */}
          <HStack gap={2} display={{ base: "none", md: "flex" }}>
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </HStack>

          {/* Mobile Menu Button */}
          <IconButton
            display={{ base: "flex", md: "none" }}
            onClick={() => setIsOpen(true)}
            variant="ghost"
            aria-label="Open menu"
            fontSize="xl"
          >
            ☰
          </IconButton>
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
                  <Heading size="md" color="blue.700">
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
