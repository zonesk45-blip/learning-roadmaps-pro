import { Link } from "@tanstack/react-router";
import { Clock, Star, Users, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { money, type Course } from "@/lib/match";

export function CourseCard({ c, score, reasons, action }: { c: Course; score?: number; reasons?: string[]; action?: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col p-5 transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-brand text-primary-foreground">
          <BookOpen className="size-5" />
        </span>
        {score !== undefined ? (
          <span className="rounded-full bg-gradient-brand px-3 py-1 text-xs font-bold text-primary-foreground">{score}% match</span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-semibold"><Star className="size-4 fill-primary text-primary" />{Number(c.rating).toFixed(1)}</span>
        )}
      </div>
      <Link to="/courses/$id" params={{ id: c.id }} className="mt-4 font-display text-lg font-semibold leading-snug hover:text-primary">
        {c.title}
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">{c.provider}{c.institution ? ` · ${c.institution}` : ""}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="size-3.5" />{c.duration_weeks} wks · {c.hours_per_week}h/wk</span>
        <span className="flex items-center gap-1"><Users className="size-3.5" />{(c.students_count / 1000).toFixed(0)}k learners</span>
        {score !== undefined && <span className="flex items-center gap-1"><Star className="size-3.5" />{Number(c.rating).toFixed(1)}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary">{c.domain}</Badge>
        <Badge variant="secondary">{c.level}</Badge>
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {reasons.slice(0, 3).map((r) => <li key={r}>✓ {r}</li>)}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="font-semibold text-primary">{money(c.price_usd)}</span>
        {action}
      </div>
    </div>
  );
}
