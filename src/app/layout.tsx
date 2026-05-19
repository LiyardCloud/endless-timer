import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EndlessTimer",
  description: "A minimalist endless activity timer."
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
