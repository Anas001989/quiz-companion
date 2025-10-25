// src/components/animations/QuizCharacterBox.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import Lottie from "lottie-react";
import type { Character } from "@/context/StudentContext";

export function QuizCharacterBox({
  character,
  actionJson,
  loop = true,
  transparent = false,
}: {
  character: Character | null;
  actionJson?: string | null;
  loop?: boolean;
  transparent?: boolean;
}) {
  const playerRef = useRef<any>(null);
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine file type (.json = Lottie, .webp = animated image)
  const src = actionJson ?? character?.file ?? null;
  const isLottie = src?.toLowerCase().endsWith(".json");
  const isWebP = src?.toLowerCase().endsWith(".webp");

  // Load Lottie JSON dynamically
  useEffect(() => {
    if (!isLottie) {
      setAnimationData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(src!, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load ${src} (${res.status})`);
        const json = await res.json();
        if (!mounted) return;
        setAnimationData(json);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Lottie load error:", err);
        if (mounted) setError(err.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [src, isLottie]);

  if (!character) {
    return (
      <Box
        w="16rem"
        h="16rem"
        bg="gray.100"
        rounded="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        Choose a character
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        w="16rem"
        h="16rem"
        bg="white"
        rounded="md"
        shadow="md"
        p={4}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        w="16rem"
        h="16rem"
        bg="red.50"
        rounded="md"
        shadow="md"
        p={4}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Animation error</div>
          <div style={{ fontSize: 12 }}>{error}</div>
        </div>
      </Box>
    );
  }

  return (
    <Box
      w="16rem"
      h="16rem"
      bg={transparent ? "transparent" : "white"}
      rounded="md"
      shadow={transparent ? "none" : "md"}
      p={transparent ? 0 : 2}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {/* Lottie Animation */}
      {isLottie && animationData ? (
        <Lottie
          lottieRef={playerRef}
          animationData={animationData}
          loop={loop}
          autoplay
          style={{
            width: "100%",
            height: "100%",
            background: transparent ? "transparent" : "white",
          }}
        />
      ) : null}

      {/* Animated WebP */}
      {isWebP && (
        <img
          src={src!}
          alt={character.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            background: "transparent",
          }}
        />
      )}

      {/* Fallback Thumbnail */}
      {!isLottie && !isWebP && (
        <img
          src={character.thumbnail}
          alt={character.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      )}
    </Box>
  );
}
