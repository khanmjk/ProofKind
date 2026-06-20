import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofKind",
  description: "AI-maintained professional proof with a public profile assistant."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
