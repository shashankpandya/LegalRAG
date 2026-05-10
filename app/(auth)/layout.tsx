/**
 * Auth layout — minimal centered layout with no sidebar or dashboard chrome.
 * Used for /login and /signup pages.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
