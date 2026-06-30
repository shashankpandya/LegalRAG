import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  // Swap prevents invisible text during font load
  display: "swap",
  // Only load the weights we actually use
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  preload: true,
});

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href="https://qfetgvjgcthtzrhrlmfx.supabase.co" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          richColors
          position="bottom-right"
          toastOptions={{
            style: { fontSize: "0.875rem" },
          }}
        />
      </body>
    </html>
  );
}
