import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog Admin",
  description: "AI-powered blog management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
