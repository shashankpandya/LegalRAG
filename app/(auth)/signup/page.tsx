"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SignupSchema } from "@/lib/api/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scale, Loader2, MailCheck } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = SignupSchema.safeParse({ email, password, fullName: fullName || undefined });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          full_name: result.data.fullName,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      // Handle rate limit errors with a user-friendly message
      if (error.message.includes("rate limit")) {
        toast.error("Too many signup attempts. Please wait a few minutes and try again.");
      } else if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    // Check if email confirmation is required
    // When Supabase has "Confirm email" enabled, the session will be null
    // When it's disabled, the user is immediately signed in
    if (data.session) {
      // Email confirmation disabled — user is signed in immediately
      toast.success("Account created! Redirecting...");
      router.push("/dashboard");
      router.refresh();
    } else {
      // Email confirmation enabled — show "check your email" screen
      setEmailSent(true);
      setLoading(false);
    }
  }

  // Show "check your email" state after successful signup with email confirmation
  if (emailSent) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to <strong>{email}</strong>.
            Click the link in the email to activate your account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground text-center">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setEmailSent(false)}
              className="text-primary underline-offset-4 hover:underline"
            >
              try again
            </button>
            .
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Already confirmed?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scale className="h-6 w-6" />
          <span className="text-xl font-semibold">LegalRAG</span>
        </div>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name (optional)</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Shashank Pandya"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
