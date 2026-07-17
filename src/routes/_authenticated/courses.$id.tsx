import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/lurnexa/nav";
import { AgentTag, SectionLabel, GradientButton } from "@/components/lurnexa/primitives";
import { useServerFn } from "@tanstack/react-start";
import { askTutor } from "@/lib/agents.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Markdown } from "@/components/lurnexa/markdown";

export const Route = createFileRoute("/_authenticated/courses/$id")({
  head: () => ({ meta: [{ title: "Course — Lurnexa" }] }),
  component: CourseDetail,
});

type Course = { id: string; title: string; summary: string | null; goal_prompt: string };
type Module = { id: string; title: string; objective: string; order: number };
type Lesson = { id: string; module_id: string; title: string; content: string; generated_by_agent: string };
type Assessment = { id: string; module_id: string; content_json: any; generated_by_agent: string };

function CourseDetail() {
  const { id } = Route.useParams();
  const [email, setEmail] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    (async () => {
      const { data: c } = await supabase.from("courses").select("*").eq("id", id).single();
      setCourse(c as Course);
      const { data: m } = await supabase.from("modules").select("*").eq("course_id", id).order("order");
      setModules((m as Module[]) ?? []);
      if (m && m.length) setActiveModule(m[0].id);
      const ids = (m ?? []).map((x: any) => x.id);
      if (ids.length) {
        const { data: l } = await supabase.from("lessons").select("*").in("module_id", ids);
        setLessons((l as Lesson[]) ?? []);
        const { data: a } = await supabase.from("assessments").select("*").in("module_id", ids);
        setAssessments((a as Assessment[]) ?? []);
        const { data: p } = await supabase.from("progress").select("module_id,mastery_score").in("module_id", ids);
        const pmap: Record<string, number> = {};
        (p ?? []).forEach((r: any) => { pmap[r.module_id] = Number(r.mastery_score) || 0; });
        setProgress(pmap);
      }
    })();
  }, [id]);

  const currentLesson = lessons.find((l) => l.module_id === activeModule);
  const currentQuiz = assessments.find((a) => a.module_id === activeModule);

  const markMastered = async (moduleId: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("progress").upsert({ user_id: u.user.id, module_id: moduleId, mastery_score: 100, last_activity: new Date().toISOString() });
    setProgress((p) => ({ ...p, [moduleId]: 100 }));
  };

  if (!course) return <div className="min-h-screen bg-background"><AppNav email={email} /><div className="p-12 text-center text-muted-foreground">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <AppNav email={email} />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-1">
          <SectionLabel>Curriculum</SectionLabel>
          <h2 className="mt-3 text-2xl leading-tight">{course.title}</h2>
          {course.summary && <p className="mb-4 mt-2 text-sm text-muted-foreground">{course.summary}</p>}
          <div className="mt-4 space-y-1">
            {modules.map((m, i) => {
              const mastered = (progress[m.id] ?? 0) >= 100;
              const active = m.id === activeModule;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-[#0052FF]/8 ring-1 ring-[#0052FF]/20" : "hover:bg-muted"}`}
                >
                  <div className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-mono ${mastered ? "bg-gradient-accent text-white" : "bg-muted text-muted-foreground"}`}>
                    {mastered ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.objective}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main>
          {currentLesson ? (
            <Tabs defaultValue="lesson" className="w-full">
              <TabsList>
                <TabsTrigger value="lesson">Lesson</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="tutor">Ask the tutor</TabsTrigger>
              </TabsList>
              <TabsContent value="lesson">
                <article className="rounded-2xl border bg-card p-8">
                  <AgentTag agent={currentLesson.generated_by_agent} />
                  <h1 className="mt-3 text-3xl leading-tight">{currentLesson.title}</h1>
                  <Markdown className="prose prose-slate mt-5 max-w-none text-[15px] leading-relaxed">
                    {currentLesson.content}
                  </Markdown>
                  <div className="mt-8 flex justify-end">
                    <GradientButton onClick={() => activeModule && markMastered(activeModule)}>
                      Mark as understood
                    </GradientButton>
                  </div>
                </article>
              </TabsContent>
              <TabsContent value="practice">
                <div className="rounded-2xl border bg-card p-8">
                  {currentQuiz ? <QuizView quiz={currentQuiz} /> : <div className="text-muted-foreground">No practice yet for this module.</div>}
                </div>
              </TabsContent>
              <TabsContent value="tutor">
                <TutorPanel lesson={currentLesson} courseTitle={course.title} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">Your course is still being built — check back in a moment.</div>
          )}
        </main>
      </div>
    </div>
  );
}

function QuizView({ quiz }: { quiz: Assessment }) {
  const qs: Array<{ q: string; choices: string[]; answer_index: number }> = quiz.content_json?.questions ?? [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  return (
    <div>
      <AgentTag agent={quiz.generated_by_agent} />
      <h2 className="mt-3 text-2xl">Quick check</h2>
      <div className="mt-6 space-y-6">
        {qs.map((item, i) => (
          <div key={i}>
            <div className="font-medium flex gap-2"><span>{i + 1}.</span><Markdown>{item.q}</Markdown></div>
            <div className="mt-3 space-y-2">
              {item.choices.map((c, ci) => {
                const isChosen = answers[i] === ci;
                const isCorrect = checked && ci === item.answer_index;
                const isWrong = checked && isChosen && ci !== item.answer_index;
                return (
                  <button key={ci} onClick={() => !checked && setAnswers((a) => ({ ...a, [i]: ci }))}
                    className={`block w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${isCorrect ? "border-emerald-500 bg-emerald-50" : isWrong ? "border-red-400 bg-red-50" : isChosen ? "border-[#0052FF] bg-[#0052FF]/5" : "hover:bg-muted"}`}>
                    <Markdown>{c}</Markdown>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6"><GradientButton onClick={() => setChecked(true)}>Check answers</GradientButton></div>
    </div>
  );
}

function TutorPanel({ lesson, courseTitle }: { lesson: Lesson; courseTitle: string }) {
  const [q, setQ] = useState("");
  const [thread, setThread] = useState<Array<{ role: "user" | "tutor"; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askTutor);

  const send = async () => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setThread((t) => [...t, { role: "user", text: question }]);
    setQ("");
    setLoading(true);
    try {
      const { reply } = await ask({ data: { lessonContent: lesson.content, question, courseTitle } });
      setThread((t) => [...t, { role: "tutor", text: reply }]);
    } catch (e: any) {
      setThread((t) => [...t, { role: "tutor", text: `Sorry — ${e.message ?? "the tutor is unavailable right now."}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border bg-card p-6">
      <AgentTag agent="Tutor Agent" />
      <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-2">
        {thread.length === 0 && <p className="text-sm text-muted-foreground">Ask a question about "{lesson.title}". The tutor guides Socratically — expect questions back.</p>}
        {thread.map((m, i) => (
          <div key={i} className={`rounded-xl px-4 py-3 text-sm ${m.role === "user" ? "ml-auto max-w-[80%] bg-gradient-accent text-white" : "max-w-[85%] bg-muted"}`}>
            {m.role === "tutor" ? <Markdown className="prose prose-sm max-w-none">{m.text}</Markdown> : m.text}
          </div>
        ))}
        {loading && <div className="max-w-[85%] rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> thinking…</div>}
      </div>
      <div className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask a question…" className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0052FF]/40" />
        <GradientButton onClick={send} disabled={loading}><Send className="h-4 w-4" /></GradientButton>
      </div>
    </div>
  );
}
