import type { Metadata } from "next";
import { AppToaster } from "@/components/AppToaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow AI",
  description: "AI task orchestration dashboard",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/brand/taskflow-logo-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
