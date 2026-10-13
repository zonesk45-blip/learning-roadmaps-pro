import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "cc-compare";
export function getCompare(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function setCompare(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("cc-compare"));
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(getCompare());
    sync();
    window.addEventListener("cc-compare", sync);
    return () => window.removeEventListener("cc-compare", sync);
  }, []);
  return ids;
}

export function CompareButton({ id }: { id: string }) {
  const ids = useCompare();
  const on = ids.includes(id);
  return (
    <Button
      size="sm"
      variant={on ? "hero" : "soft"}
      onClick={() => {
        if (on) return setCompare(ids.filter((x) => x !== id));
        if (ids.length >= 3) return toast.error("You can compare up to 3 courses.");
        setCompare([...ids, id]);
        toast.success("Added to compare");
      }}
    >
      <Scale /> {on ? "Added" : "Compare"}
    </Button>
  );
}
