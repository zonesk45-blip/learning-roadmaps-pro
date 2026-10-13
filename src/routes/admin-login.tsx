import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Portal — CourseCompass" }, { name: "description", content: "Administrator sign-in for CourseCompass." }, { property: "og:title", content: "Admin Portal — CourseCompass" }, { property: "og:description", content: "Administrator sign-in." }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    setBusy(false);
    if (!ok) { await supabase.auth.signOut(); return toast.error("This account does not have admin access."); }
    navigate({ to: "/admin" });
  }
  return (
    <div className="bg-hero grid min-h-[80vh] place-items-center px-6 py-16">
      <form onSubmit={submit} className="glass-card w-full max-w-md space-y-4 p-8">
        <span className="grid size-12 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><Shield className="size-5" /></span>
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <p className="text-sm text-muted-foreground">Restricted to CourseCompass administrators.</p>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button variant="hero" className="w-full" disabled={busy}>Sign in as admin</Button>
      </form>
    </div>
  );
}
