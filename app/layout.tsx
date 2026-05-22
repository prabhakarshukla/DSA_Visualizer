import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Visualizer Lite",
  description: "Interactive visualizers for core data structures and algorithms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
