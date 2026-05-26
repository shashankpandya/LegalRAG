import Link from "next/link";
import { Scale } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-center border-b px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LegalRAG</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
