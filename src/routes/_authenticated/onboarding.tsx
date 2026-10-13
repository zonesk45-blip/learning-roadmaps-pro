import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { DOMAINS, LEVELS } from "@/lib/match";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Your preferences — CourseCompass" }, { name: "description", content: "Tell us your interests, skills, budget and goals." }, { property: "og:title", content: "Your preferences — CourseCompass" }, { property: "og:description", content: "Personalize your course matches." }] }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = Route.useRouteContext();
  const { data: p } = useProfile(user.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState({
    full_name: "", education_level: "Undergraduate", interests: [] as string[], skills: "", career_goal: "",
    budget_usd: 200, hours_per_week: 8, preferred_level: "Beginner", preferred_format: "Any", learning_style: "Project-based", country: "",
  });
  useEffect(() => {
    if (p) setF({
      full_name: p.full_name ?? "", education_level: p.education_level ?? "Undergraduate", interests: p.interests, skills: p.skills.join(", "),
      career_goal: p.career_goal ?? "", budget_usd: p.budget_usd, hours_per_week: p.hours_per_week, preferred_level: p.preferred_level ?? "Beginner",
      preferred_format: p.preferred_format ?? "Any", learning_style: p.learning_style ?? "Project-based", country: p.country ?? "",
    });
  }, [p]);

  async function save() {
    if (f.interests.length === 0) return toast.error("Pick at least one interest");
    const { error } = await supabase.from("profiles").update({
      ...f, skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean), onboarded: true, updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Preferences saved");
    navigate({ to: "/dashboard" });
  }

  const sel = (key: keyof typeof f, items: string[]) => (
    <Select value={String(f[key])} onValueChange={(v) => setF({ ...f, [key]: v })}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold">Tell us about <span className="text-gradient">you</span></h1>
        <p className="mt-2 text-muted-foreground">We use this to rank courses and build your roadmap.</p>
        <div className="glass-card mt-8 space-y-6 p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="e.g. India" /></div>
            <div><Label>Education level</Label>{sel("education_level", ["High School", "Undergraduate", "Graduate", "Working Professional", "Career Switcher"])}</div>
            <div><Label>Dream career</Label><Input value={f.career_goal} onChange={(e) => setF({ ...f, career_goal: e.target.value })} placeholder="e.g. Data Scientist" /></div>
          </div>
          <div>
            <Label>Interests (pick any)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DOMAINS.map((d) => {
                const on = f.interests.includes(d);
                return (
                  <button key={d} type="button" onClick={() => setF({ ...f, interests: on ? f.interests.filter((x) => x !== d) : [...f.interests, d] })}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-transparent bg-gradient-brand text-primary-foreground" : "border-border bg-card hover:bg-accent"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div><Label>Current skills (comma separated)</Label><Input value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} placeholder="Python, Excel, Communication" /></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div><Label>Budget per course: ${f.budget_usd}</Label><Slider className="mt-3" min={0} max={2000} step={10} value={[f.budget_usd]} onValueChange={([v]) => setF({ ...f, budget_usd: v ?? 0 })} /></div>
            <div><Label>Hours per week: {f.hours_per_week}</Label><Slider className="mt-3" min={1} max={40} value={[f.hours_per_week]} onValueChange={([v]) => setF({ ...f, hours_per_week: v ?? 1 })} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Preferred level</Label>{sel("preferred_level", LEVELS)}</div>
            <div><Label>Format</Label>{sel("preferred_format", ["Any", "Online", "Hybrid", "In-person"])}</div>
            <div><Label>Learning style</Label>{sel("learning_style", ["Project-based", "Video lectures", "Reading", "Mentored"])}</div>
          </div>
          <Button variant="hero" size="lg" onClick={save}>Save & see my matches</Button>
        </div>
      </div>
    </div>
  );
}
