import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NONI",
  description: "Cross-media powerscaling, backed by evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}