import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s.mode === "signup" ? ("signup" as const) : undefined }),
  head: () => ({ meta: [{ title: "Sign in — CourseCompass" }, { name: "description", content: "Log in or create your CourseCompass account." }, { property: "og:title", content: "Sign in — CourseCompass" }, { property: "og:description", content: "Access your personalized course dashboard." }] }),
  component: AuthPage,
});

export function AuthForm({ title, subtitle, after }: { title: string; subtitle: string; after: string }) {
  const { mode } = Route.useSearch();
  const [signup, setSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + after, data: { full_name: name } } });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (!data.session) return toast.success("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
    }
    navigate({ to: after });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return toast.error(r.error.message ?? "Google sign-in failed");
    if (r.redirected) return;
    navigate({ to: after });
  }

  return (
    <div className="bg-hero grid min-h-[80vh] place-items-center px-6 py-16">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <Button variant="soft" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
        <div className="my-5 text-center text-xs text-muted-foreground">or with email</div>
        <form onSubmit={submit} className="space-y-4">
          {signup && <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>}
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button variant="hero" className="w-full" disabled={busy}>{signup ? "Create account" : "Sign in"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-primary" onClick={() => setSignup(!signup)}>
          {signup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

function AuthPage() {
  return <AuthForm title="Welcome to CourseCompass" subtitle="Sign in to get matches and your AI roadmap." after="/dashboard" />;
}
