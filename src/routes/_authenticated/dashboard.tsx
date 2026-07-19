import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/lurnexa/nav";
import { SectionLabel } from "@/components/lurnexa/primitives";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BookOpen, Flame, Trophy, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lurnexa" }] }),
  component: DashboardPage,
});

type Course = { id: string; title: string; status: string; created_at: string };
type Progress = { id: string; mastery_score: number | null; updated_at: string; lesson_id: string | null };
type AgentRun = { id: string; agent: string; status: string; created_at: string; duration_ms: number | null };

const COLORS = ["#0052FF", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? null);
      const [c, p, r] = await Promise.all([
        supabase.from("courses").select("id,title,status,created_at").order("created_at", { ascending: false }),
        supabase.from("progress").select("id,mastery_score,updated_at,lesson_id").order("updated_at", { ascending: false }),
        supabase.from("agent_runs").select("id,agent,status,created_at,duration_ms").order("created_at", { ascending: false }).limit(200),
      ]);
      setCourses((c.data as Course[]) ?? []);
      setProgress((p.data as Progress[]) ?? []);
      setRuns((r.data as AgentRun[]) ?? []);
      setLoading(false);
    })();
  }, []);

  // ---- Derived metrics ----
  const totalCourses = courses.length;
  const totalLessonsTouched = progress.length;
  const mastered = progress.filter((p) => (p.mastery_score ?? 0) >= 100).length;
  const avgMastery = progress.length
    ? Math.round(progress.reduce((s, p) => s + (p.mastery_score ?? 0), 0) / progress.length)
    : 0;

  // Streak (based on distinct progress dates)
  const streak = useMemo(() => {
    const days = new Set(progress.map((p) => new Date(p.updated_at).toDateString()));
    let s = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [progress]);

  // Activity last 14 days
  const activity = useMemo(() => {
    const arr: { day: string; lessons: number; courses: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      arr.push({
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        lessons: progress.filter((p) => new Date(p.updated_at).toDateString() === key).length,
        courses: courses.filter((c) => new Date(c.created_at).toDateString() === key).length,
      });
    }
    return arr;
  }, [progress, courses]);

  // Streak calendar heatmap – last 12 weeks
  const heatmap = useMemo(() => {
    const days = new Map<string, number>();
    progress.forEach((p) => {
      const k = new Date(p.updated_at).toDateString();
      days.set(k, (days.get(k) ?? 0) + 1);
    });
    const cells: { date: Date; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      cells.push({ date: d, count: days.get(d.toDateString()) ?? 0 });
    }
    return cells;
  }, [progress]);

  // Agent performance
  const agentStats = useMemo(() => {
    const map = new Map<string, { agent: string; runs: number; avgMs: number; total: number }>();
    runs.forEach((r) => {
      const s = map.get(r.agent) ?? { agent: r.agent, runs: 0, avgMs: 0, total: 0 };
      s.runs += 1;
      s.total += r.duration_ms ?? 0;
      s.avgMs = Math.round(s.total / s.runs);
      map.set(r.agent, s);
    });
    return Array.from(map.values());
  }, [runs]);

  // Course status distribution
  const statusDist = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c) => map.set(c.status, (map.get(c.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [courses]);

  return (
    <div className="min-h-screen bg-background">
      <AppNav email={email} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <SectionLabel>Overview</SectionLabel>
        <div className="mt-3 flex items-end justify-between">
          <h1 className="text-4xl font-display">Your dashboard</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {loading ? "loading…" : `${totalCourses} courses · ${totalLessonsTouched} lessons`}
          </span>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<BookOpen className="h-4 w-4 text-[#0052FF]" />} label="Courses" value={totalCourses} />
          <StatCard icon={<Trophy className="h-4 w-4 text-amber-500" />} label="Modules mastered" value={mastered} />
          <StatCard icon={<Target className="h-4 w-4 text-emerald-500" />} label="Avg mastery" value={`${avgMastery}%`} />
          <StatCard icon={<Flame className="h-4 w-4 text-orange-500" />} label="Day streak" value={streak} />
        </div>

        {/* Activity chart */}
        <Card className="mt-8">
          <CardHeader title="Learning activity" subtitle="Lessons opened in the last 14 days" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0052FF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0052FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="lessons" stroke="#0052FF" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Agent performance */}
          <Card>
            <CardHeader title="Agent performance" subtitle="Average execution time (ms)" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="agent" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Bar dataKey="avgMs" radius={[8, 8, 0, 0]}>
                    {agentStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Course status */}
          <Card>
            <CardHeader title="Course status" subtitle="Distribution across your library" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Streak heatmap */}
        <Card className="mt-6">
          <CardHeader title="Streak map" subtitle="Last 12 weeks of learning activity" icon={<Flame className="h-4 w-4 text-orange-500" />} />
          <div className="flex gap-1 overflow-x-auto pb-1">
            {Array.from({ length: 12 }).map((_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, d) => {
                  const cell = heatmap[w * 7 + d];
                  if (!cell) return <div key={d} className="h-4 w-4" />;
                  const intensity = Math.min(cell.count, 4);
                  const bg = [
                    "hsl(var(--muted))",
                    "#BFDBFE",
                    "#60A5FA",
                    "#3B82F6",
                    "#0052FF",
                  ][intensity];
                  return (
                    <div
                      key={d}
                      title={`${cell.date.toDateString()} · ${cell.count} lesson${cell.count === 1 ? "" : "s"}`}
                      className="h-4 w-4 rounded-[3px]"
                      style={{ background: bg }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Less</span>
            {["hsl(var(--muted))", "#BFDBFE", "#60A5FA", "#3B82F6", "#0052FF"].map((c, i) => (
              <div key={i} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </Card>

        {/* Recent courses table */}
        <Card className="mt-6">
          <CardHeader title="Recent courses" subtitle="Your latest generations" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 pr-4 font-medium">{c.title}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase">{c.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Link
                        to="/courses/$id"
                        params={{ id: c.id }}
                        className="text-[#0052FF] hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No courses yet. <Link to="/create" className="text-[#0052FF] hover:underline">Create one</Link>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 text-3xl font-display">{value}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-6 ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-display">{title}</h3>
      </div>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
