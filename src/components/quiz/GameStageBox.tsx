"use client";

import React, { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { QuizCharacterBox } from "@/components/animations/QuizCharacterBox";
import { useStudent } from "@/context/StudentContext";

const MotionBox = motion.create(Box);

type Mode = "success" | "sad";

export default function GameStageBox({
  mode,
  action,
  scene,
  onComplete
}: {
  mode: Mode;
  action: string;
  scene?: string; // "forest" | "beach" | "city";
  onComplete: () => void;
}) {
  const { student } = useStudent();

  /*// Random scene
  const chosenScene = useMemo(() => {
    if (scene) return scene;
    const scenes = ["forest", "beach", "city"];
    return scenes[Math.floor(Math.random() * scenes.length)];
  }, [scene]);
*/
const [chosenScene, setChosenScene] = useState<string>();

  // Set random scene on component mount
  useEffect(() => {
   /* if (scene) {
      setChosenScene(scene);
    } else {*/
      const scenes = ["forest", "beach", "city"] as const;
      const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
      setChosenScene(randomScene);
   // }
  }, []);

  const sceneGif =
    chosenScene === "beach"
      ? "/assets/scenes/beach.gif"
      : chosenScene === "city"
      ? "/assets/scenes/city.gif"
      : "/assets/scenes/forest.gif";

  // Character movement
  const startX = mode === "success" ? "-45vw" : "0vw";
  const endX = mode === "success" ? "120vw" : "0vw";
  const transition = { duration: 5 };

  // Trigger onComplete after animation
  useEffect(() => {
    const timeout = setTimeout(() => onComplete(), transition.duration * 1000);
    return () => clearTimeout(timeout);
  }, [onComplete, transition.duration]);

  // Support WebP or Lottie dynamically
  const character = student.selectedCharacter ?? null;
  const basePath = `/lottie/${character?.id}_${action}`;
  const lottiePath = `${basePath}.json`;
  const webpPath = `${basePath}.webp`;
  const animationSrc = character
    ? `${basePath}.${character?.format ?? "json"}`
    : lottiePath;
    
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

      {/* Moving Character */}
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
            character={character}
            actionJson={webpPath} // ✅ use WebP first, fallback handled inside
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
