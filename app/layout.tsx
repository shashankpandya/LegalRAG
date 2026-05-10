import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LegalRAG — AI Compliance Co-pilot for Indian Startups",
  description:
    "AI-powered compliance assistant for Indian startup founders. Get answers about company registration, GST, RBI, DPDP Act, and more — with inline citations from official legal documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
