import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StudentProvider } from '@/context/StudentContext';
import { TeacherProvider } from '@/context/TeacherContext';
import ChakraWrapper from "@/lib/chakra-provider";
import NavBar from "@/components/layout/NavBar";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiz Companion",
  description: "AI-powered quiz platform for teachers and students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChakraWrapper>
          <StudentProvider>
            <TeacherProvider>
              <NavBar />
              {children}
            </TeacherProvider>
          </StudentProvider>
        </ChakraWrapper>
      </body>
    </html>
  );
}
