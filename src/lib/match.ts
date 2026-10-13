import type { Database } from "@/integrations/supabase/types";

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const DOMAINS = [
  "Computer Science", "Data Science & AI", "Cloud & DevOps", "Cybersecurity", "IT & Networking",
  "Business & Finance", "Marketing", "Design", "Engineering", "Healthcare & Medicine",
  "Science & Mathematics", "Law", "Humanities", "Social Sciences", "Psychology",
  "Education & Teaching", "Languages", "Arts & Music", "Environment & Sustainability",
  "Personal Development", "Blockchain & Web3", "Hospitality & Culinary",
];
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

const norm = (s: string) => s.toLowerCase().trim();

/** Weighted fit score 0-100 with human-readable reasons. */
export function scoreCourse(c: Course, p: Profile | null | undefined) {
  if (!p) return { score: Math.round(Number(c.rating) * 18), reasons: [] as string[] };
  const reasons: string[] = [];
  let s = 0;
  const interests = p.interests.map(norm);
  if (interests.includes(norm(c.domain))) { s += 30; reasons.push(`Matches your interest in ${c.domain}`); }
  if (p.career_goal && c.careers.some((k) => norm(p.career_goal!).includes(norm(k)) || norm(k).includes(norm(p.career_goal!)))) {
    s += 20; reasons.push(`Leads toward ${p.career_goal}`);
  }
  const mySkills = new Set(p.skills.map(norm));
  const newSkills = c.skills.filter((k) => !mySkills.has(norm(k)));
  const known = c.skills.length - newSkills.length;
  if (newSkills.length) { s += Math.min(12, newSkills.length * 3); reasons.push(`Teaches ${newSkills.slice(0, 2).join(", ")}`); }
  if (known > 0) s += 4;
  if (c.price_usd <= p.budget_usd) { s += 12; if (c.price_usd === 0) reasons.push("Free"); else reasons.push("Within budget"); }
  else s -= Math.min(15, Math.round((c.price_usd - p.budget_usd) / 50));
  if (p.preferred_level && p.preferred_level === c.level) { s += 10; reasons.push(`${c.level} level`); }
  if (c.hours_per_week <= p.hours_per_week) s += 6; else s -= 4;
  if (p.preferred_format && p.preferred_format !== "Any" && p.preferred_format === c.format) s += 4;
  s += (Number(c.rating) - 4) * 10;
  s += c.job_demand / 20;
  return { score: Math.max(5, Math.min(99, Math.round(s))), reasons };
}

/** Return on investment: expected salary uplift per dollar & hour. */
export function roi(c: Course) {
  const hours = c.duration_weeks * c.hours_per_week;
  const valueIdx = Math.round((c.avg_salary_usd / 1000) * (c.job_demand / 100) / Math.max(1, Math.log10(c.price_usd + 10)));
  return { hours, valueIdx };
}

export const money = (n: number) => (n === 0 ? "Free" : `$${n.toLocaleString()}`);
