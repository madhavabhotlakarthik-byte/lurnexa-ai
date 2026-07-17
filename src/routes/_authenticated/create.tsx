import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppNav } from "@/components/lurnexa/nav";
import { GradientButton, SectionLabel } from "@/components/lurnexa/primitives";
import { useServerFn } from "@tanstack/react-start";
import { createCourse, orchestrateCourse } from "@/lib/agents.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Check, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({ meta: [{ title: "Create a course — Lurnexa" }] }),
  component: CreatePage,
});

type Run = {
  id: string;
  agent_name: string;
  status: "queued" | "working" | "done";
  output_summary: string | null;
  order: number;
};

const STATUS_LINES: Record<string, string> = {
  "Planner Agent": "Reading your goal and shaping the plan…",
  "Curriculum Agent": "Sequencing learning objectives…",
  "Content Agent": "Writing lessons and examples…",
  "Assessment Agent": "Building quizzes and flashcards…",
  "QA Agent": "Reviewing tone and coherence…",
};

function CreatePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [format, setFormat] = useState("");
  const [showRefine, setShowRefine] = useState(false);
  const [starting, setStarting] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const create = useServerFn(createCourse);
  const orchestrate = useServerFn(orchestrateCourse);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const seed = sessionStorage.getItem("lurnexa:seed");
    if (seed) { setPrompt(seed); sessionStorage.removeItem("lurnexa:seed"); }
  }, []);

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current); }, []);

  const start = async () => {
    if (!prompt.trim()) return;
    setStarting(true);
    try {
      const { courseId } = await create({ data: { prompt: prompt.trim(), level: level || undefined, timeframe: timeframe || undefined, format: format || undefined } });
      setCourseId(courseId);
      const { data: seed } = await supabase.from("agent_runs").select("*").eq("course_id", courseId).order("order");
      setRuns((seed as Run[]) ?? []);

      const ch = supabase.channel(`runs:${courseId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "agent_runs", filter: `course_id=eq.${courseId}` }, (payload) => {
          setRuns((prev) => {
            const next = [...prev];
            const idx = next.findIndex((r) => r.id === (payload.new as any).id);
            if (idx >= 0) next[idx] = payload.new as Run;
            return next.sort((a, b) => a.order - b.order);
          });
        })
        .subscribe();
      channelRef.current = ch;

      orchestrate({ data: { courseId } })
        .then(() => {
          toast.success("Your course is ready!");
          setTimeout(() => navigate({ to: "/courses/$id", params: { id: courseId } }), 900);
        })
        .catch((e) => toast.error(e.message ?? "Orchestration failed"));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start");
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav email={email} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <AnimatePresence mode="wait">
          {!courseId ? (
            <motion.div key="form" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionLabel>Start a course</SectionLabel>
              <h1 className="mt-4 text-4xl md:text-5xl">What do you want to learn?</h1>
              <p className="mt-3 text-muted-foreground">One clear sentence. Your agent team handles the rest.</p>

              <div className="mt-8 rounded-2xl border bg-card p-4 shadow-sm">
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Help me learn conversational Spanish for a trip in 6 weeks…"
                  className="w-full resize-none rounded-xl bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground"
                />
                <div className="mt-2 border-t pt-3">
                  <button onClick={() => setShowRefine((s) => !s)} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <ChevronDown className={`h-3 w-3 transition ${showRefine ? "rotate-180" : ""}`} />
                    Refine your goal (optional)
                  </button>
                  {showRefine && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Select label="Current level" value={level} onChange={setLevel} options={["Beginner", "Intermediate", "Advanced"]} />
                      <Select label="Timeframe" value={timeframe} onChange={setTimeframe} options={["1 week", "1 month", "3 months", "Ongoing"]} />
                      <Select label="Format" value={format} onChange={setFormat} options={["Reading", "Interactive", "Project-based"]} />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <GradientButton onClick={start} disabled={!prompt.trim() || starting}>
                  {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : <>Assemble my course <ArrowRight className="h-4 w-4" /></>}
                </GradientButton>
              </div>
            </motion.div>
          ) : (
            <motion.div key="pipe" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <SectionLabel>Live orchestration</SectionLabel>
              <h1 className="mt-4 text-4xl">Your agents are building your course.</h1>
              <p className="mt-3 text-muted-foreground max-w-xl">Watch each specialist do their part. When they're done, we'll drop you into your course.</p>

              <div className="mt-10 space-y-3">
                {runs.map((r, i) => <AgentRow key={r.id} run={r} index={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentRow({ run, index }: { run: Run; index: number }) {
  const isDone = run.status === "done";
  const isWorking = run.status === "working";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 rounded-2xl border bg-card p-5 transition ${isWorking ? "ring-2 ring-[#0052FF]/40 shadow-lg" : ""}`}
    >
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${isDone ? "bg-gradient-accent text-white" : isWorking ? "bg-[#0052FF]/10 text-[#0052FF]" : "bg-muted text-muted-foreground"}`}>
        {isDone ? <Check className="h-5 w-5" /> : isWorking ? <Sparkles className="h-5 w-5 animate-pulse" /> : <span className="font-mono text-xs">{index + 1}</span>}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{run.agent_name}</span>
          {isWorking && <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#0052FF]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0052FF]" /> Working</span>}
          {isDone && <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600">Done</span>}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {isDone && run.output_summary ? run.output_summary : isWorking ? STATUS_LINES[run.agent_name] ?? "Working…" : "Queued"}
        </div>
      </div>
    </motion.div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0052FF]/40">
        <option value="">Any</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
