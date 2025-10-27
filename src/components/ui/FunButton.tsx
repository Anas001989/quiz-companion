"use client";

import { Button, ButtonProps } from "@chakra-ui/react";
import { forwardRef } from "react";

interface FunButtonProps extends ButtonProps {
  variant?: "solid" | "outline" | "ghost";
}

const FunButton = forwardRef<HTMLButtonElement, FunButtonProps>(
  ({ variant = "solid", children, ...props }, ref) => {
    const getStyles = () => {
      switch (variant) {
        case "solid":
          return {
            bg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            color: "white",
            fontWeight: "semibold",
            transition: "all 0.2s ease",
            _hover: {
              bg: "linear-gradient(135deg, #db2777 0%, #7c3aed 100%)",
              transform: "translateY(-2px)",
              shadow: "lg",
            },
          };
        case "outline":
          return {
            bg: "transparent",
            color: "gray.600",
            borderColor: "gray.300",
            borderWidth: "1px",
            fontWeight: "semibold",
            transition: "all 0.2s ease",
            _hover: {
              bg: "purple.50",
              color: "purple.600",
              borderColor: "purple.300",
              transform: "translateY(-2px)",
              shadow: "lg",
            },
          };
        case "ghost":
          return {
            bg: "transparent",
            color: "gray.600",
            fontWeight: "semibold",
            transition: "all 0.2s ease",
            _hover: {
              bg: "purple.50",
              color: "purple.600",
            },
          };
        default:
          return {};
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        {...getStyles()}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FunButton.displayName = "FunButton";

export default FunButton;
