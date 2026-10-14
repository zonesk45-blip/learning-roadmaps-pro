import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";
import { DOMAINS, LEVELS, money, type Course } from "@/lib/match";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — CourseCompass" }, { name: "description", content: "Manage the CourseCompass course catalog." }, { property: "og:title", content: "Admin Dashboard — CourseCompass" }, { property: "og:description", content: "Course catalog administration." }] }),
  component: AdminPage,
});

const emptyForm = {
  title: "", domain: DOMAINS[0]!, topic: "", provider: "", institution: "", level: LEVELS[0]!,
  price_usd: 0, duration_weeks: 8, hours_per_week: 5, rating: 4.5, format: "Online", language: "English",
  skills: "", careers: "", url: "", description: "", featured: false,
};

function AdminPage() {
  const { user, loading } = useSession();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/admin-login" });
  }, [loading, user, navigate]);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [c, p, r, b] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }),
      ]);
      return { courses: c.count ?? 0, users: p.count ?? 0, reviews: r.count ?? 0, bookmarks: b.count ?? 0 };
    },
  });

  if (loading || adminLoading) return <div className="grid min-h-[70vh] place-items-center text-muted-foreground">Checking access…</div>;
  if (!isAdmin) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6">
        <div className="glass-card max-w-md p-8 text-center">
          <Shield className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">This account doesn't have admin access.</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/">Go home</Link></Button>
        </div>
      </div>
    );
  }

  function startEdit(c: Course) {
    setEditing(c);
    setForm({
      title: c.title, domain: c.domain, topic: c.topic, provider: c.provider, institution: c.institution ?? "",
      level: c.level, price_usd: c.price_usd, duration_weeks: c.duration_weeks, hours_per_week: c.hours_per_week,
      rating: Number(c.rating), format: c.format, language: c.language, skills: c.skills.join(", "),
      careers: c.careers.join(", "), url: c.url ?? "", description: c.description ?? "", featured: c.featured,
    });
    setShowForm(true);
  }

  async function save() {
    const payload = {
      ...form,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      careers: form.careers.split(",").map((s) => s.trim()).filter(Boolean),
      url: form.url || null, description: form.description || null, institution: form.institution || null,
    };
    const { error } = editing
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Course updated" : "Course added");
    setShowForm(false); setEditing(null); setForm(emptyForm);
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
  }

  const filtered = (courses ?? []).filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.domain.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage the course catalog.</p>
        </div>
        <Button variant="hero" onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}><Plus /> Add course</Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {([["Courses", stats?.courses], ["Users", stats?.users], ["Reviews", stats?.reviews], ["Bookmarks", stats?.bookmarks]] as const).map(([label, v]) => (
          <div key={label} className="glass-card p-5">
            <p className="text-2xl font-bold">{v ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="glass-card mt-8 space-y-4 p-6">
          <h2 className="text-lg font-semibold">{editing ? "Edit course" : "New course"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
            <div><Label>Domain</Label>
              <Select value={form.domain} onValueChange={(v) => setForm({ ...form, domain: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
            <div><Label>Institution</Label><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></div>
            <div><Label>Price (USD)</Label><Input type="number" value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: Number(e.target.value) })} /></div>
            <div><Label>Duration (weeks)</Label><Input type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: Number(e.target.value) })} /></div>
            <div><Label>Hours/week</Label><Input type="number" value={form.hours_per_week} onChange={(e) => setForm({ ...form, hours_per_week: Number(e.target.value) })} /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div><Label>Format</Label>
              <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Online", "Hybrid", "In-person"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Course URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          </div>
          <div><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
          <div><Label>Careers (comma separated)</Label><Input value={form.careers} onChange={(e) => setForm({ ...form, careers: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured on homepage
          </label>
          <div className="flex gap-2">
            <Button variant="hero" onClick={save}>{editing ? "Save changes" : "Add course"}</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Catalog ({filtered.length})</h2>
        <Input className="max-w-xs" placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-accent/50 text-left">
            <tr>
              <th className="p-3">Title</th><th className="p-3">Domain</th><th className="p-3">Level</th>
              <th className="p-3">Price</th><th className="p-3">Rating</th><th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{c.title}</td>
                <td className="p-3 text-muted-foreground">{c.domain}</td>
                <td className="p-3 text-muted-foreground">{c.level}</td>
                <td className="p-3 text-muted-foreground">{money(c.price_usd)}</td>
                <td className="p-3 text-muted-foreground">{Number(c.rating).toFixed(1)}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(c)} aria-label="Edit"><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)} aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
