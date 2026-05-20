import type { Metadata, Viewport } from "next";

import { PwaProvider } from "@/components/pwa-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "EndlessTimer",
  description: "A minimalist endless activity timer.",
  manifest: "/manifest.webmanifest",
  applicationName: "EndlessTimer",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EndlessTimer"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/apple-icon"
  }
};

export const viewport: Viewport = {
  themeColor: "#090c14",
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
