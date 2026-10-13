import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, ExternalLink, Star, Briefcase, TrendingUp, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CompareButton } from "@/components/CompareButton";
import { CourseCard } from "@/components/CourseCard";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { money, roi, scoreCourse } from "@/lib/match";

export const Route = createFileRoute("/courses/$id")({
  head: () => ({ meta: [{ title: "Course details — CourseCompass" }, { name: "description", content: "Course details, career outcomes, ROI and learner reviews." }, { property: "og:title", content: "Course details — CourseCompass" }, { property: "og:description", content: "Career outcomes, ROI and reviews." }] }),
  component: CourseDetail,
});

function CourseDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const qc = useQueryClient();
  const { data: c, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await supabase.from("courses").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: similar } = useQuery({
    queryKey: ["similar", c?.topic],
    enabled: !!c,
    queryFn: async () => (await supabase.from("courses").select("*").eq("topic", c!.topic).neq("id", id).order("rating", { ascending: false }).limit(3)).data ?? [],
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("course_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: bookmarked } = useQuery({
    queryKey: ["bookmark", id, user?.id],
    enabled: !!user,
    queryFn: async () => !!(await supabase.from("bookmarks").select("id").eq("course_id", id).maybeSingle()).data,
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Loading…</div>;
  if (!c) return <div className="p-20 text-center">Course not found. <Link to="/courses" className="text-primary">Browse courses</Link></div>;
  const m = scoreCourse(c, profile);
  const r = roi(c);

  async function toggleBookmark() {
    if (!user) return toast.error("Sign in to save courses");
    if (bookmarked) await supabase.from("bookmarks").delete().eq("course_id", id).eq("user_id", user.id);
    else await supabase.from("bookmarks").insert({ course_id: id, user_id: user.id });
    qc.invalidateQueries({ queryKey: ["bookmark", id] });
    qc.invalidateQueries({ queryKey: ["bookmarks"] });
  }
  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("reviews").upsert({ course_id: id, user_id: user.id, rating, comment, author_name: profile?.full_name ?? "Learner" }, { onConflict: "user_id,course_id" });
    if (error) return toast.error(error.message);
    setComment("");
    toast.success("Review posted");
    qc.invalidateQueries({ queryKey: ["reviews", id] });
  }

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="glass-card p-8">
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">{c.domain}</Badge><Badge variant="secondary">{c.topic}</Badge><Badge variant="secondary">{c.level}</Badge><Badge variant="secondary">{c.format}</Badge></div>
          <h1 className="mt-4 text-4xl font-bold">{c.title}</h1>
          <p className="mt-2 text-muted-foreground">{c.provider}{c.institution ? ` · ${c.institution}` : ""} · {c.language}</p>
          <p className="mt-4 max-w-3xl">{c.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {c.url && <Button asChild variant="hero"><a href={c.url} target="_blank" rel="noreferrer">Go to course <ExternalLink /></a></Button>}
            <Button variant="soft" onClick={toggleBookmark}>{bookmarked ? <BookmarkCheck /> : <Bookmark />} {bookmarked ? "Saved" : "Save"}</Button>
            <CompareButton id={c.id} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat icon={Star} label="Rating" value={`${Number(c.rating).toFixed(1)} (${c.reviews_count.toLocaleString()})`} />
          <Stat icon={Clock} label="Time" value={`${c.duration_weeks} wks · ${r.hours}h total`} />
          <Stat icon={Award} label="Price" value={money(c.price_usd)} />
          <Stat icon={TrendingUp} label="ROI index" value={String(r.valueIdx)} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <h3 className="font-semibold">Your fit</h3>
            <div className="mt-2 font-display text-5xl font-bold text-gradient">{m.score}%</div>
            {!profile?.onboarded && <p className="mt-2 text-xs text-muted-foreground"><Link to="/onboarding" className="text-primary">Set preferences</Link> for a personal score.</p>}
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{m.reasons.map((x) => <li key={x}>✓ {x}</li>)}</ul>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-semibold">Skills you'll gain</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.skills.map((s) => {
                const have = profile?.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase());
                return <Badge key={s} variant={have ? "outline" : "secondary"}>{have ? "✓ " : "+ "}{s}</Badge>;
              })}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 font-semibold"><Briefcase className="size-4" />Career outcomes</h3>
            <ul className="mt-3 space-y-1 text-sm">{c.careers.map((k) => <li key={k}>{k}</li>)}</ul>
            <p className="mt-3 text-sm text-muted-foreground">Avg. salary <span className="font-semibold text-foreground">${c.avg_salary_usd.toLocaleString()}</span></p>
            <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-brand" style={{ width: `${c.job_demand}%` }} /></div>
            <p className="mt-1 text-xs text-muted-foreground">Job demand {c.job_demand}/100</p>
          </div>
        </div>

        <div className="glass-card mt-6 p-6">
          <h3 className="font-semibold">Learner reviews</h3>
          {user ? (
            <form onSubmit={submitReview} className="mt-4 space-y-3">
              <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)}><Star className={`size-5 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button>)}</div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" />
              <Button variant="hero" size="sm">Post review</Button>
            </form>
          ) : <p className="mt-2 text-sm text-muted-foreground"><Link to="/auth" className="text-primary">Sign in</Link> to write a review.</p>}
          <div className="mt-6 space-y-4">
            {reviews?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}
            {reviews?.map((rv) => (
              <div key={rv.id} className="border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold">{rv.author_name}<span className="flex">{Array.from({ length: rv.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-primary text-primary" />)}</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{rv.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {similar && similar.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold">Alternatives for <span className="text-gradient">{c.topic}</span></h2>
            <div className="mt-4 grid gap-6 md:grid-cols-3">{similar.map((s) => <CourseCard key={s.id} c={s} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="glass-card flex items-center gap-3 p-4">
      <span className="grid size-10 place-items-center rounded-full bg-accent text-primary"><Icon className="size-4" /></span>
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>
    </div>
  );
}
