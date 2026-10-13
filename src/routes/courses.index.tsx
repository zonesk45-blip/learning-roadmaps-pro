import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard } from "@/components/CourseCard";
import { CompareButton } from "@/components/CompareButton";
import { supabase } from "@/integrations/supabase/client";
import { DOMAINS, LEVELS } from "@/lib/match";
import { useState } from "react";

type S = { q?: string; domain?: string; level?: string; price?: string; sort?: string; page?: number };
const PAGE = 24;

export const Route = createFileRoute("/courses/")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s.q === "string" ? s.q : undefined,
    domain: typeof s.domain === "string" ? s.domain : undefined,
    level: typeof s.level === "string" ? s.level : undefined,
    price: typeof s.price === "string" ? s.price : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    page: Number(s.page) > 0 ? Number(s.page) : undefined,
  }),
  head: () => ({ meta: [{ title: "Explore 6,000+ Courses — CourseCompass" }, { name: "description", content: "Search and filter thousands of courses across 22 domains from Coursera, edX, Udemy, NPTEL and more." }, { property: "og:title", content: "Explore Courses — CourseCompass" }, { property: "og:description", content: "Thousands of courses in every domain." }] }),
  component: Courses,
});

function Courses() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/courses/" });
  const [q, setQ] = useState(s.q ?? "");
  const page = s.page ?? 1;
  const set = (patch: Partial<S>) => navigate({ search: (p) => ({ ...p, ...patch, page: patch.page }) });

  const { data, isFetching } = useQuery({
    queryKey: ["courses", s],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let qb = supabase.from("courses").select("*", { count: "exact" });
      if (s.q) qb = qb.or(`title.ilike.%${s.q}%,topic.ilike.%${s.q}%,provider.ilike.%${s.q}%,domain.ilike.%${s.q}%`);
      if (s.domain) qb = qb.eq("domain", s.domain);
      if (s.level) qb = qb.eq("level", s.level);
      if (s.price === "free") qb = qb.eq("price_usd", 0);
      if (s.price === "u50") qb = qb.lte("price_usd", 50);
      if (s.price === "u200") qb = qb.lte("price_usd", 200);
      const sort = s.sort ?? "popular";
      if (sort === "rating") qb = qb.order("rating", { ascending: false });
      else if (sort === "price") qb = qb.order("price_usd");
      else if (sort === "salary") qb = qb.order("avg_salary_usd", { ascending: false });
      else if (sort === "demand") qb = qb.order("job_demand", { ascending: false });
      else qb = qb.order("featured", { ascending: false }).order("students_count", { ascending: false });
      const { data, count, error } = await qb.range((page - 1) * PAGE, page * PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl font-bold">Explore <span className="text-gradient">courses</span></h1>
        <p className="mt-2 text-muted-foreground">{data ? `${data.count.toLocaleString()} courses found` : "Loading…"} across {DOMAINS.length} domains.</p>

        <div className="glass-card mt-6 grid gap-3 p-4 md:grid-cols-[1fr_180px_160px_150px_170px]">
          <form onSubmit={(e) => { e.preventDefault(); set({ q: q || undefined }); }} className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topic, provider, skill…" className="pl-9" />
          </form>
          <Filter value={s.domain} onChange={(v) => set({ domain: v })} placeholder="All domains" items={DOMAINS} />
          <Filter value={s.level} onChange={(v) => set({ level: v })} placeholder="All levels" items={LEVELS} />
          <Filter value={s.price} onChange={(v) => set({ price: v })} placeholder="Any price" items={[["free", "Free"], ["u50", "Under $50"], ["u200", "Under $200"]]} />
          <Filter value={s.sort} onChange={(v) => set({ sort: v })} placeholder="Most popular" items={[["popular", "Most popular"], ["rating", "Top rated"], ["price", "Lowest price"], ["salary", "Highest salary"], ["demand", "Job demand"]]} />
        </div>

        <div className={`mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
          {data?.rows.map((c) => <CourseCard key={c.id} c={c} action={<CompareButton id={c.id} />} />)}
        </div>
        {data && data.rows.length === 0 && <p className="mt-12 text-center text-muted-foreground">No courses match. Try different filters.</p>}

        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="soft" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="soft" disabled={page >= pages} onClick={() => set({ page: page + 1 })}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function Filter({ value, onChange, placeholder, items }: { value?: string; onChange: (v?: string) => void; placeholder: string; items: (string | [string, string])[] }) {
  return (
    <Select value={value ?? "all"} onValueChange={(v) => onChange(v === "all" ? undefined : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {items.map((i) => { const [v, l] = Array.isArray(i) ? i : [i, i]; return <SelectItem key={v} value={v}>{l}</SelectItem>; })}
      </SelectContent>
    </Select>
  );
}
