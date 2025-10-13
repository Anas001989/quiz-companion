"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        body: {
          bg: { value: "gray.50" },
          color: { value: "gray.800" },
        },
      },
    },
  },
});

export default function ChakraWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
