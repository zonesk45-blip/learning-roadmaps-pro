import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Sparkles, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { scoreCourse, money, roi, type Course } from "@/lib/match";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — CourseCompass" }, { name: "description", content: "Your personalized course matches and learning stats." }, { property: "og:title", content: "My Dashboard — CourseCompass" }, { property: "og:description", content: "Personalized course matches." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile(user.id);

  const { data: courses } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").limit(500);
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookmarks").select("course_id, courses(*)").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const ranked = (courses ?? [])
    .map((c) => ({ c, ...scoreCourse(c, profile) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 6);
  const bestRoi = [...ranked].sort((a, b) => roi(b.c).valueIdx - roi(a.c).valueIdx)[0];

  if (profile && !profile.onboarded) {
    return (
      <div className="bg-hero grid min-h-[70vh] place-items-center px-6">
        <div className="glass-card max-w-md p-8 text-center">
          <Sparkles className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Let's personalize your matches</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tell us your interests and goals so we can rank thousands of courses for you.</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/onboarding">Set my preferences</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
      <p className="mt-1 text-muted-foreground">Here are your best-fit courses right now.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <Target className="size-5 text-primary" />
          <p className="mt-2 text-2xl font-bold">{top[0] ? `${top[0].score}%` : "—"}</p>
          <p className="text-sm text-muted-foreground">Top match score</p>
        </div>
        <div className="glass-card p-5">
          <Bookmark className="size-5 text-primary" />
          <p className="mt-2 text-2xl font-bold">{bookmarks?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Saved courses</p>
        </div>
        <div className="glass-card p-5">
          <TrendingUp className="size-5 text-primary" />
          <p className="mt-2 text-2xl font-bold">{bestRoi ? money(bestRoi.c.avg_salary_usd) : "—"}</p>
          <p className="text-sm text-muted-foreground">Avg. salary after best-ROI course</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your top matches</h2>
        <Button asChild variant="soft" size="sm"><Link to="/courses">Browse all</Link></Button>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {top.map(({ c, score, reasons }) => <CourseCard key={c.id} course={c} score={score} reasons={reasons} />)}
      </div>

      {(bookmarks?.length ?? 0) > 0 && (
        <>
          <h2 className="mt-12 text-xl font-semibold">Saved courses</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks!.map((b) => {
              const c = b.courses as unknown as Course | null;
              if (!c) return null;
              const { score, reasons } = scoreCourse(c, profile);
              return <CourseCard key={b.course_id} course={c} score={score} reasons={reasons} />;
            })}
          </div>
        </>
      )}

      <div className="glass-card mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h3 className="text-lg font-semibold">Ready for your step-by-step plan?</h3>
          <p className="text-sm text-muted-foreground">Generate a personalized roadmap toward {profile?.career_goal ?? "your dream career"}.</p>
        </div>
        <Button asChild variant="hero"><Link to="/roadmap">Open Roadmap Tracker</Link></Button>
      </div>
    </div>
  );
}
