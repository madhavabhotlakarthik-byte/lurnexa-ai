import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/lurnexa/nav";
import { GradientLink, SectionLabel } from "@/components/lurnexa/primitives";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/courses/")({
  head: () => ({ meta: [{ title: "Your courses — Lurnexa" }] }),
  component: CoursesList,
});

type Course = { id: string; title: string; status: string; summary: string | null; created_at: string };

function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    supabase.from("courses").select("id,title,status,summary,created_at").order("created_at", { ascending: false })
      .then(({ data }) => { setCourses((data as Course[]) ?? []); setLoading(false); });
  }, []);

  async function deleteCourse(e: React.MouseEvent, id: string, title: string) {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const prev = courses;
    setCourses((c) => c.filter((x) => x.id !== id));
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      setCourses(prev);
      toast.error("Failed to delete course");
    } else {
      toast.success("Course deleted");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav email={email} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Your library</SectionLabel>
            <h1 className="mt-4 text-4xl md:text-5xl">Courses</h1>
          </div>
          <GradientLink to="/create"><Plus className="h-4 w-4" /> New course</GradientLink>
        </div>

        {loading ? (
          <div className="mt-16 text-center text-muted-foreground">Loading…</div>
        ) : courses.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed p-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-4 text-lg">No courses yet.</div>
            <p className="mt-1 text-sm text-muted-foreground">Give your agent team something to build.</p>
            <div className="mt-6 flex justify-center"><GradientLink to="/create">Create your first course</GradientLink></div>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {courses.map((c, i) => (
              <motion.button
                key={c.id}
                onClick={() => nav({ to: "/courses/$id", params: { id: c.id } })}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-2xl border bg-card p-6 text-left transition hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#0052FF]">
                    {c.status === "ready" ? "Ready" : c.status === "generating" ? "Building…" : c.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 text-xl font-medium leading-snug">{c.title}</div>
                {c.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

void Link;
