import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award, Calendar, ChevronRight, GraduationCap, MapPin, Sparkles, Star, Target, Route as RouteIcon,
  Building2, Gauge, Scale, Calculator, Brain, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CourseCompass — Find Your Perfect Course & Build Your Dream Career" },
      { name: "description", content: "Thousands of courses across every domain, smart matching, and a personalized AI career roadmap you can track." },
      { property: "og:title", content: "CourseCompass — Smart Academic Course Finder" },
      { property: "og:description", content: "Personalized course matching, colleges, scholarships and AI roadmaps." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Target, t: "Smart Course Matching", d: "Ranks thousands of courses by fit — interests, skills, budget, and goals." },
  { icon: RouteIcon, t: "AI Career Roadmap", d: "Month-by-month plan with milestones and a progress tracker." },
  { icon: Building2, t: "College Directory", d: "Top colleges with fees, ratings, and offered programs." },
  { icon: Award, t: "Scholarships", d: "Curated scholarships matched to your profile and timeline." },
  { icon: Brain, t: "Skill Gap Analysis", d: "See exactly which skills you're missing for your dream career." },
  { icon: Gauge, t: "Readiness Score", d: "Track how career-ready you are as you finish milestones." },
  { icon: Scale, t: "Side-by-side Compare", d: "Compare up to 3 courses on price, time, demand and salary." },
  { icon: Calculator, t: "Career ROI Index", d: "Know which course gives the best salary return per dollar & hour." },
];

function Index() {
  const { data: colleges } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => (await supabase.from("colleges").select("*").order("rating", { ascending: false }).limit(6)).data ?? [],
  });
  const { data: scholarships } = useQuery({
    queryKey: ["scholarships"],
    queryFn: async () => (await supabase.from("scholarships").select("*").order("deadline").limit(4)).data ?? [],
  });
  const { data: count } = useQuery({
    queryKey: ["course-count"],
    queryFn: async () => (await supabase.from("courses").select("id", { count: "exact", head: true })).count ?? 0,
  });

  return (
    <div className="bg-hero">
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-medium shadow-sm">
          <Sparkles className="size-3.5 text-primary" /> AI-powered career roadmap generator
        </span>
        <h1 className="mt-8 text-5xl font-bold leading-[1.05] md:text-7xl">
          Find Your Perfect Course &<br />
          <span className="text-gradient">Build Your Dream Career</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Personalized course, college and scholarship recommendations, plus a step-by-step roadmap you can track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="lg" className="h-12 px-6">
            <Link to="/onboarding">Get Started <ChevronRight /></Link>
          </Button>
          <Button asChild variant="soft" size="lg" className="h-12 px-6">
            <Link to="/roadmap">Open Roadmap Tracker</Link>
          </Button>
        </div>
        <form
          className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full bg-card/80 p-1.5 pl-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            window.location.href = `/courses?q=${encodeURIComponent(String(q ?? ""))}`;
          }}
        >
          <Search className="size-4 text-muted-foreground" />
          <input name="q" placeholder="Search Python, MBA, nursing, guitar…" className="flex-1 bg-transparent text-sm outline-none" />
          <Button type="submit" variant="hero" size="sm">Search</Button>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-4xl font-bold">Recommended <span className="text-gradient">colleges</span></h2>
        <p className="mt-2 text-muted-foreground">Top picks tailored to your profile.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {colleges?.map((c) => (
            <a key={c.id} href={c.url ?? "#"} target="_blank" rel="noreferrer" className="glass-card block p-6 transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><GraduationCap className="size-5" /></span>
                <span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-primary text-primary" />{Number(c.rating).toFixed(1)}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{c.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{c.location}</p>
              <p className="mt-3 text-sm text-muted-foreground">Fees: <span className="font-semibold text-foreground">${c.fees_usd.toLocaleString()}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">{c.programs.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-4xl font-bold">Recommended <span className="text-gradient">scholarships</span></h2>
        <p className="mt-2 text-muted-foreground">Funding opportunities matched to your goals.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {scholarships?.map((s) => (
            <a key={s.id} href={s.url ?? "#"} target="_blank" rel="noreferrer" className="glass-card block p-6 transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><Award className="size-5" /></span>
                <Badge variant="secondary">{s.sponsor}</Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.eligibility}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount: <span className="font-semibold text-primary">{s.amount}</span></span>
                <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="size-4" />{new Date(s.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="glass-card grid grid-cols-2 gap-6 p-8 text-center md:grid-cols-4">
          {[["50K+", "Students Guided"], [count ? `${count.toLocaleString()}+` : "6,000+", "Courses Indexed"], ["22", "Domains Covered"], ["94%", "Match Accuracy"]].map(([n, l]) => (
            <div key={l}><div className="font-display text-4xl font-bold text-gradient">{n}</div><div className="mt-1 text-sm text-muted-foreground">{l}</div></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold">Everything you need to <span className="text-gradient">succeed</span></h2>
          <p className="mt-2 text-muted-foreground">A complete platform for course discovery, planning, and execution.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.t} className="glass-card p-6">
              <span className="grid size-12 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><f.icon className="size-5" /></span>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-4xl font-bold">How it <span className="text-gradient">works</span></h2>
        <p className="mt-2 text-muted-foreground">Three simple steps to your dream course.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[["Tell us about you", "Share your interests, skills, budget, and dreams."], ["Get matched", "See best-fit courses with match % and reasoning."], ["Follow your roadmap", "Month-wise plan with resources and milestones."]].map(([t, d], i) => (
            <div key={t} className="glass-card p-6">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-gradient-brand font-display text-lg font-bold text-primary-foreground">{i + 1}</div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-center text-4xl font-bold">Frequently asked <span className="text-gradient">questions</span></h2>
        <Accordion type="single" collapsible className="mt-8 glass-card px-6">
          {[
            ["How does the AI matching work?", "We score every course on your interests, career goal, skill gaps, budget, weekly time, preferred level, ratings and job-market demand, then explain why each one fits."],
            ["Is CourseCompass free?", "Yes. Browsing, matching, comparing and roadmaps are free."],
            ["Can I update my roadmap later?", "Absolutely — regenerate it anytime and tick off milestones as you go."],
            ["Do you cover international colleges?", "Yes, colleges and scholarships across the US, UK, Europe and Asia."],
          ].map(([q, a]: [string, string]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-8">
        <div className="rounded-[2rem] bg-gradient-brand p-12 text-center text-primary-foreground shadow-glow">
          <h2 className="text-4xl font-bold">Ready to shape your future?</h2>
          <p className="mt-3 opacity-90">Join 50,000+ students who found their path with CourseCompass.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="soft" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get started free</Link></Button>
            <Button asChild variant="soft" size="lg"><Link to="/roadmap">Open Roadmap Tracker</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
