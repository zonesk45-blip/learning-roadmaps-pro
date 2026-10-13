import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCompare, setCompare } from "@/components/CompareButton";
import { money, roi, type Course } from "@/lib/match";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare Courses — CourseCompass" }, { name: "description", content: "Compare up to three courses side by side on price, time, demand, salary and ROI." }, { property: "og:title", content: "Compare Courses — CourseCompass" }, { property: "og:description", content: "Side-by-side course comparison." }] }),
  component: Compare,
});

const rows: [string, (c: Course) => string | number, "max" | "min" | null][] = [
  ["Provider", (c) => c.provider, null],
  ["Domain", (c) => c.domain, null],
  ["Level", (c) => c.level, null],
  ["Price", (c) => c.price_usd, "min"],
  ["Rating", (c) => Number(c.rating), "max"],
  ["Duration (weeks)", (c) => c.duration_weeks, "min"],
  ["Total hours", (c) => roi(c).hours, "min"],
  ["Learners", (c) => c.students_count, "max"],
  ["Job demand", (c) => c.job_demand, "max"],
  ["Avg. salary", (c) => c.avg_salary_usd, "max"],
  ["ROI index", (c) => roi(c).valueIdx, "max"],
  ["Certificate", (c) => (c.certificate ? "Yes" : "No"), null],
];

function Compare() {
  const ids = useCompare();
  const { data } = useQuery({
    queryKey: ["compare", ids],
    enabled: ids.length > 0,
    queryFn: async () => (await supabase.from("courses").select("*").in("id", ids)).data ?? [],
  });
  const list = ids.length ? data ?? [] : [];

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold">Compare <span className="text-gradient">courses</span></h1>
        <p className="mt-2 text-muted-foreground">Best values in each row are highlighted.</p>
        {list.length === 0 ? (
          <div className="glass-card mt-8 p-10 text-center">
            <p className="text-muted-foreground">No courses selected yet.</p>
            <Button asChild variant="hero" className="mt-4"><Link to="/courses">Browse courses</Link></Button>
          </div>
        ) : (
          <div className="glass-card mt-8 overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left text-muted-foreground">Metric</th>
                  {list.map((c) => (
                    <th key={c.id} className="p-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link to="/courses/$id" params={{ id: c.id }} className="font-display font-semibold hover:text-primary">{c.title}</Link>
                        <button aria-label="Remove" onClick={() => setCompare(ids.filter((x) => x !== c.id))}><X className="size-4" /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get, best]) => {
                  const vals = list.map(get);
                  const nums = vals.filter((v): v is number => typeof v === "number");
                  const target = best === "max" ? Math.max(...nums) : best === "min" ? Math.min(...nums) : null;
                  return (
                    <tr key={label} className="border-t border-border/60">
                      <td className="p-3 text-muted-foreground">{label}</td>
                      {vals.map((v, i) => (
                        <td key={i} className={`p-3 ${target !== null && v === target && list.length > 1 ? "font-bold text-primary" : ""}`}>
                          {label === "Price" ? money(v as number) : label === "Avg. salary" ? `$${(v as number).toLocaleString()}` : typeof v === "number" ? v.toLocaleString() : v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
