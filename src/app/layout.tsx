import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofKind",
  description: "Owner-curated professional proof with a candid public fit advisor."
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

