import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart To-Do · Weather-aware tasks",
  description:
    "A weather-aware smart to-do list with cinematic animated weather scenes, AQI monitoring, streak tracking, and natural-language task parsing.",
  keywords: ["to-do", "todo", "weather", "tasks", "AQI", "Next.js", "Tailwind", "framer-motion"],
  authors: [{ name: "Smart To-Do" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Smart To-Do · Weather-aware tasks",
    description: "Cinematic weather animations + smart task management",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
