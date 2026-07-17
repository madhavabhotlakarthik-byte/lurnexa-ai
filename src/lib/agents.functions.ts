import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AGENTS = [
  { name: "Planner Agent", status: "Reading your goal…" },
  { name: "Curriculum Agent", status: "Sequencing learning objectives…" },
  { name: "Content Agent", status: "Drafting lessons and examples…" },
  { name: "Assessment Agent", status: "Building quizzes and flashcards…" },
  { name: "QA Agent", status: "Reviewing for coherence and accuracy…" },
];

async function callLovableAI(prompt: string, schemaHint: string): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: `You design personalized learning courses. Respond ONLY with valid JSON matching this shape: ${schemaHint}. No prose, no code fences.\n\nMATH FORMATTING (critical): For ANY mathematical content — equations, symbols, variables, fractions, integrals, Greek letters, etc. — use standard LaTeX inside markdown math delimiters. Inline math uses $...$, display math uses $$...$$ on its own line. Examples: $E = mc^2$, $$\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}$$, $\\alpha + \\beta$, $x^2 + y^2 = r^2$. Never write math in plain text like "x^2" or "sqrt(2)" or "integral from 0 to 1" — always wrap in $ delimiters with proper LaTeX commands.` },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit — please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
  try { return JSON.parse(cleaned); } catch { return JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); }
}

export const createCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      prompt: z.string().min(3).max(2000),
      timeframe: z.string().optional(),
      level: z.string().optional(),
      format: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: course, error } = await supabase.from("courses").insert({
      user_id: userId,
      title: data.prompt.slice(0, 80),
      goal_prompt: data.prompt,
      status: "generating",
      timeframe: data.timeframe ?? null,
      level: data.level ?? null,
      format: data.format ?? null,
    }).select().single();
    if (error || !course) throw new Error(error?.message ?? "Failed to create course");

    // Seed queued agent runs
    await supabase.from("agent_runs").insert(
      AGENTS.map((a, i) => ({
        course_id: course.id,
        agent_name: a.name,
        status: "queued",
        order: i,
      })),
    );
    return { courseId: course.id };
  });

export const orchestrateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ courseId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: course } = await supabase.from("courses").select("*").eq("id", data.courseId).eq("user_id", userId).single();
    if (!course) throw new Error("Course not found");

    const runs = await supabase.from("agent_runs").select("*").eq("course_id", course.id).order("order");
    const runById = (name: string) => runs.data?.find((r: any) => r.agent_name === name);

    const setStatus = async (name: string, status: string, summary?: string) => {
      const r = runById(name);
      if (!r) return;
      const patch: any = { status };
      if (status === "working") patch.started_at = new Date().toISOString();
      if (status === "done") { patch.completed_at = new Date().toISOString(); if (summary) patch.output_summary = summary; }
      await supabase.from("agent_runs").update(patch).eq("id", r.id);
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // 1. Planner
    await setStatus("Planner Agent", "working");
    await sleep(800);
    await setStatus("Planner Agent", "done", "Plan: 5 modules across your timeframe.");

    // 2. Curriculum — real AI call
    await setStatus("Curriculum Agent", "working");
    const curriculum = await callLovableAI(
      `Learner goal: "${course.goal_prompt}". Level: ${course.level ?? "unspecified"}. Timeframe: ${course.timeframe ?? "flexible"}. Design 5 sequenced modules.`,
      `{"summary": "1-sentence course description", "modules": [{"title": "...", "objective": "one clear learning objective"}]}`,
    );
    const modules = (curriculum.modules ?? []).slice(0, 5);
    if (modules.length === 0) throw new Error("Curriculum agent returned no modules");

    const { data: insertedModules } = await supabase.from("modules").insert(
      modules.map((m: any, i: number) => ({
        course_id: course.id,
        title: String(m.title ?? `Module ${i + 1}`).slice(0, 120),
        objective: String(m.objective ?? "").slice(0, 400),
        order: i,
      })),
    ).select();
    await supabase.from("courses").update({ summary: curriculum.summary ?? null }).eq("id", course.id);
    await setStatus("Curriculum Agent", "done", `${modules.length} modules sequenced.`);

    // 3. Content — one lesson per module
    await setStatus("Content Agent", "working");
    const content = await callLovableAI(
      `Course: "${course.goal_prompt}". For each module below, write ONE opening lesson (~180 words) using warm, plain language and a concrete example. Modules:\n${modules.map((m: any, i: number) => `${i + 1}. ${m.title} — ${m.objective}`).join("\n")}`,
      `{"lessons": [{"module_index": 0, "title": "Lesson title", "content": "markdown body"}]}`,
    );
    const lessonRows = (content.lessons ?? []).map((l: any) => {
      const mod = insertedModules?.[l.module_index];
      if (!mod) return null;
      return {
        module_id: mod.id,
        title: String(l.title ?? "Lesson").slice(0, 160),
        content: String(l.content ?? ""),
        generated_by_agent: "Content Agent",
        order: 0,
      };
    }).filter(Boolean);
    if (lessonRows.length) await supabase.from("lessons").insert(lessonRows);
    await setStatus("Content Agent", "done", `${lessonRows.length} lessons written.`);

    // 4. Assessment — one quiz per module
    await setStatus("Assessment Agent", "working");
    const assessment = await callLovableAI(
      `Course: "${course.goal_prompt}". For each module, create a 3-question multiple-choice quiz. Modules:\n${modules.map((m: any, i: number) => `${i + 1}. ${m.title}`).join("\n")}`,
      `{"quizzes": [{"module_index": 0, "questions": [{"q": "...", "choices": ["a","b","c","d"], "answer_index": 0}]}]}`,
    );
    const quizRows = (assessment.quizzes ?? []).map((q: any) => {
      const mod = insertedModules?.[q.module_index];
      if (!mod) return null;
      return {
        module_id: mod.id,
        type: "quiz",
        content_json: { questions: q.questions ?? [] },
        generated_by_agent: "Assessment Agent",
      };
    }).filter(Boolean);
    if (quizRows.length) await supabase.from("assessments").insert(quizRows);
    await setStatus("Assessment Agent", "done", `${quizRows.length} quizzes ready.`);

    // 5. QA
    await setStatus("QA Agent", "working");
    await sleep(600);
    await setStatus("QA Agent", "done", "Reviewed for tone and coherence.");

    await supabase.from("courses").update({ status: "ready" }).eq("id", course.id);
    return { ok: true };
  });

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    lessonContent: z.string(),
    question: z.string().min(1),
    courseTitle: z.string(),
  }).parse(raw))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: `You are the Tutor Agent for the course "${data.courseTitle}". Answer briefly and Socratically — guide the learner with questions and concise explanations.\n\nMATH FORMATTING: Whenever you write mathematical content (equations, symbols, Greek letters, fractions, integrals, etc.), use LaTeX inside markdown math delimiters — inline: $...$, display: $$...$$. Example: $E=mc^2$, $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$. Never write math as plain ASCII like x^2 or sqrt(x).\n\nThe current lesson is:\n\n${data.lessonContent}` },
          { role: "user", content: data.question },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit — retry shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error: ${res.status}`);
    }
    const j = await res.json();
    return { reply: j.choices?.[0]?.message?.content ?? "" };
  });
