import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Map, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { scoreCourse, money, type Course } from "@/lib/match";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap Tracker — CourseCompass" }, { name: "description", content: "Your personalized step-by-step learning roadmap." }, { property: "og:title", content: "Roadmap Tracker — CourseCompass" }, { property: "og:description", content: "Track your personalized learning roadmap." }] }),
  component: RoadmapPage,
});

type Step = { title: string; detail: string; course_id?: string; weeks: number; done: boolean };

const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "Professional"];

function buildSteps(profile: NonNullable<ReturnType<typeof useProfile>["data"]>, courses: Course[]): Step[] {
  const ranked = courses
    .map((c) => ({ c, score: scoreCourse(c, profile).score }))
    .sort((a, b) => b.score - a.score);
  const picked: Course[] = [];
  for (const lvl of LEVEL_ORDER) {
    const inLevel = ranked.filter((r) => r.c.level === lvl && !picked.includes(r.c));
    if (inLevel[0]) picked.push(inLevel[0].c);
    if (picked.length >= 4) break;
  }
  for (const r of ranked) {
    if (picked.length >= 5) break;
    if (!picked.includes(r.c)) picked.push(r.c);
  }
  const goal = profile.career_goal ?? "your dream career";
  const steps: Step[] = [
    { title: "Foundation check", detail: `Review your current skills (${profile.skills.slice(0, 3).join(", ") || "none listed"}) and set aside ${profile.hours_per_week}h/week for learning.`, weeks: 1, done: false },
    ...picked.map((c) => ({
      title: c.title,
      detail: `${c.provider} · ${c.level} · ${money(c.price_usd)} · ~${c.duration_weeks} weeks. Skills: ${c.skills.slice(0, 3).join(", ")}.`,
      course_id: c.id,
      weeks: c.duration_weeks,
      done: false,
    })),
    { title: "Portfolio project", detail: `Build a real project that demonstrates your new skills to employers targeting ${goal}.`, weeks: 3, done: false },
    { title: `Launch toward ${goal}`, detail: "Update your resume and profiles, collect certificates, and start applying.", weeks: 2, done: false },
  ];
  return steps;
}

function RoadmapPage() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile(user.id);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").limit(500);
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: roadmap } = useQuery({
    queryKey: ["roadmap", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const steps = (roadmap?.steps as unknown as Step[] | undefined) ?? null;
  const doneCount = steps?.filter((s) => s.done).length ?? 0;
  const pct = steps?.length ? Math.round((doneCount / steps.length) * 100) : 0;

  async function generate() {
    if (!profile || !courses) return;
    setBusy(true);
    const newSteps = buildSteps(profile, courses);
    const payload = {
      user_id: user.id,
      title: `Roadmap to ${profile.career_goal ?? "your dream career"}`,
      goal: profile.career_goal,
      summary: `A ${newSteps.reduce((a, s) => a + s.weeks, 0)}-week plan built from your preferences and top course matches.`,
      steps: newSteps as unknown as Record<string, never>,
      updated_at: new Date().toISOString(),
    };
    const { error } = roadmap
      ? await supabase.from("roadmaps").update(payload).eq("id", roadmap.id)
      : await supabase.from("roadmaps").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["roadmap", user.id] });
    toast.success("Roadmap generated");
  }

  async function toggle(i: number) {
    if (!roadmap || !steps) return;
    const next = steps.map((s, j) => (j === i ? { ...s, done: !s.done } : s));
    const { error } = await supabase.from("roadmaps").update({ steps: next as unknown as Record<string, never>, updated_at: new Date().toISOString() }).eq("id", roadmap.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["roadmap", user.id] });
  }

  return (
    <div className="bg-hero min-h-[70vh]">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Roadmap <span className="text-gradient">Tracker</span></h1>
            <p className="mt-2 text-muted-foreground">A step-by-step plan from where you are to where you want to be.</p>
          </div>
          <Button variant="hero" onClick={generate} disabled={busy || !profile || !courses}>
            {steps ? <><RefreshCw className={busy ? "animate-spin" : ""} /> Regenerate</> : <><Map /> Generate my roadmap</>}
          </Button>
        </div>

        {!profile?.onboarded && (
          <div className="glass-card mt-8 p-6 text-center">
            <p className="text-muted-foreground">Set your preferences first so the roadmap fits you.</p>
            <Button asChild variant="hero" className="mt-4"><Link to="/onboarding">Set preferences</Link></Button>
          </div>
        )}

        {steps && (
          <>
            <div className="glass-card mt-8 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{roadmap?.title}</span>
                <span className="text-muted-foreground">{doneCount}/{steps.length} steps · {pct}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent">
                <div className="h-full bg-gradient-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
              {roadmap?.summary && <p className="mt-3 text-sm text-muted-foreground">{roadmap.summary}</p>}
            </div>
            <ol className="mt-8 space-y-4">
              {steps.map((s, i) => (
                <li key={i} className={`glass-card flex gap-4 p-5 transition ${s.done ? "opacity-70" : ""}`}>
                  <button onClick={() => toggle(i)} aria-label={s.done ? "Mark not done" : "Mark done"} className="mt-0.5 shrink-0 text-primary">
                    {s.done ? <CheckCircle2 className="size-6" /> : <Circle className="size-6" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">STEP {i + 1} · ~{s.weeks}w</span>
                      {s.course_id && <Link to="/courses/$id" params={{ id: s.course_id }} className="text-xs text-primary underline">View course</Link>}
                    </div>
                    <h3 className={`mt-1 font-semibold ${s.done ? "line-through" : ""}`}>{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
