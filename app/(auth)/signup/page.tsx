"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SignupSchema, type SignupInput } from "@/lib/api/schemas/auth";
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
import { Scale, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          full_name: result.data.fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Redirecting...");
    router.push("/");
    router.refresh();
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
