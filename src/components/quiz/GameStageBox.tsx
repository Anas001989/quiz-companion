"use client";

import React, { useEffect, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { QuizCharacterBox } from "@/components/animations/QuizCharacterBox";
import { useStudent } from "@/context/StudentContext";

const MotionBox = motion(Box);

type Mode = "success" | "sad";

export default function GameStageBox({
  mode,
  action,
  scene,
  onComplete,
}: {
  mode: Mode;
  action: string;
  scene?: "forest" | "beach" | "city";
  onComplete: () => void;
}) {
  const { student } = useStudent();

  // --- (3) RANDOM SCENE SELECTION ---
  const chosenScene = useMemo(() => {
    if (scene) return scene;
    const scenes = ["forest", "beach", "city"];
    return scenes[Math.floor(Math.random() * scenes.length)];
  }, [scene]);

  const sceneGif =
    chosenScene === "beach"
      ? "/assets/scenes/beach.gif"
      : chosenScene === "city"
      ? "/assets/scenes/city.gif"
      : "/assets/scenes/forest.gif";

  // --- (1) LONGER MOVEMENT, LOOPED LOTTIE ---
  // Character moves across the screen slowly (~5s)
  const startX = mode === "success" ? "-45vw" : "0vw";
  const endX = mode === "success" ? "45vw" : "0vw";
  const transition = { duration: 5.5};

  // End the stage after movement finishes
  useEffect(() => {
    const timeout = setTimeout(() => onComplete(), transition.duration * 1000);
    return () => clearTimeout(timeout);
  }, [onComplete, transition.duration]);

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {/* Background Scene */}
      <Box
        position="absolute"
        inset={0}
        backgroundImage={`url(${sceneGif})`}
        backgroundSize="cover"
        backgroundPosition="center"
        filter="brightness(0.95)"
      />

      {/* --- (2) TRANSPARENT LOTTIE CHARACTER --- */}
      <Box
        position="relative"
        width="80%"
        height="360px"
        display="flex"
        alignItems="flex-end"
        justifyContent="flex-start"
        pointerEvents="none"
      >
        <MotionBox
          initial={{ x: startX }}
          animate={{ x: endX }}
          transition={transition}
          style={{
            pointerEvents: "none",
            width: "240px",
            height: "240px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          <QuizCharacterBox
            character={student.selectedCharacter ?? null}
            actionJson={`/lottie/${student.selectedCharacter?.id}_${action}.json`}
            loop
            transparent
          />
        </MotionBox>
      </Box>

      {mode === "sad" && (
        <Text
          position="absolute"
          top="8"
          color="white"
          fontSize="2xl"
          fontWeight="bold"
          textShadow="0 2px 6px rgba(0,0,0,0.6)"
        >
          ❌ Incorrect Answer
        </Text>
      )}
    </Box>
  );
}
