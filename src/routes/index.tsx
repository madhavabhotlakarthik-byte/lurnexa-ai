import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { LandingNav } from "@/components/lurnexa/nav";
import { GradientButton, GradientLink, SectionLabel } from "@/components/lurnexa/primitives";
import { ArrowRight, BookOpen, Brain, ClipboardCheck, MessageCircle, Image as ImageIcon, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const AGENTS = [
  { name: "Curriculum Agent", icon: BookOpen, desc: "Sequences modules and learning objectives from your goal." },
  { name: "Content Agent", icon: Brain, desc: "Writes lessons in warm, plain language with concrete examples." },
  { name: "Assessment Agent", icon: ClipboardCheck, desc: "Builds quizzes and flashcards that check real understanding." },
  { name: "Tutor Agent", icon: MessageCircle, desc: "Answers your questions Socratically as you learn." },
  { name: "Media Agent", icon: ImageIcon, desc: "Sources diagrams and visual aids that make ideas click." },
];

const STEPS = [
  { title: "Describe your goal", body: "One sentence. Your language. What you actually want to learn." },
  { title: "Agents plan your course", body: "A team of specialists divides the work and builds it live in front of you." },
  { title: "Review & start learning", body: "Curriculum, lessons, quizzes — all yours to explore or refine." },
  { title: "Track your progress", body: "Mastery, streaks, and a tutor that remembers where you are." },
];

function Landing() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const startFromLanding = () => {
    if (prompt.trim()) sessionStorage.setItem("lurnexa:seed", prompt.trim());
    navigate({ to: "/create" });
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <div className="grid gap-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel>AI-Powered Learning</SectionLabel>
            <h1 className="mt-5 text-5xl leading-[1.05] tracking-tight md:text-6xl">
              Learning,{" "}
              <span className="text-gradient-accent">Reimagined</span>
              <br />by AI Agents
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Type a single learning goal. A team of specialist agents plans your curriculum, writes your lessons, and tutors you through them — assembled live, tailored to you.
            </p>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startFromLanding()}
                placeholder="I want to learn conversational Spanish in 6 weeks…"
                className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <GradientButton onClick={startFromLanding}>
                Start learning <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Free to start. No credit card.</p>
          </motion.div>

          {/* Hero graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative aspect-square"
          >
            <div className="absolute inset-6 rounded-full border border-dashed border-[#0052FF]/25 animate-spin-slow" />
            <div className="absolute inset-16 rounded-full bg-gradient-accent opacity-10 blur-3xl" />
            {AGENTS.slice(0, 4).map((a, i) => {
              const positions = [
                "top-4 left-8",
                "top-10 right-4",
                "bottom-12 left-4",
                "bottom-4 right-10",
              ];
              return (
                <motion.div
                  key={a.name}
                  className={`absolute w-48 rounded-xl border bg-card p-3 shadow-lg ${positions[i]}`}
                  style={{ animationDelay: `${i * 0.4}s` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-accent text-white">
                      <a.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs font-medium">{a.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#0052FF]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0052FF]" />
                        Working
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW — inverted */}
      <section id="how" className="relative bg-foreground text-background">
        <div className="absolute inset-0 dot-pattern opacity-70" />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <SectionLabel>The process</SectionLabel>
            <h2 className="mt-5 text-4xl tracking-tight md:text-5xl">Watch your course build itself.</h2>
            <p className="mt-4 text-white/70">No spinners hiding the work. Every agent's step is visible so you know exactly what's happening.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-gradient-accent font-mono text-sm">{i + 1}</div>
                <div className="text-lg font-medium">{s.title}</div>
                <p className="mt-2 text-sm text-white/60">{s.body}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#4D7CFF] md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <SectionLabel>Meet the team</SectionLabel>
          <h2 className="mt-5 text-4xl tracking-tight md:text-5xl">Five specialists. One learner. You.</h2>
          <p className="mt-4 text-muted-foreground">Instead of one generic AI, Lurnexa uses a team where each agent has one job — and does it well.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {AGENTS.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border bg-card p-6 transition hover:shadow-xl"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-accent text-white">
                <a.icon className="h-5 w-5" />
              </span>
              <div className="mt-4 text-lg font-medium">{a.name}</div>
              <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <SectionLabel>Loved by learners</SectionLabel>
            <h2 className="mt-5 text-4xl tracking-tight md:text-5xl">The way learning should feel.</h2>
          </div>
          <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
            {[
              { q: "I asked for a 4-week Rust track. It built one that actually respected my time.", n: "Maya, engineer" },
              { q: "Watching the agents work made me trust the output. It didn't feel like a black box.", n: "Ethan, med student", featured: true },
              { q: "The tutor asked me questions instead of just handing me answers. Real learning.", n: "Priya, designer" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-2xl border bg-card p-6 ${t.featured ? "md:-translate-y-6 shadow-xl ring-1 ring-[#0052FF]/20" : ""}`}
              >
                <p className="text-base">"{t.q}"</p>
                <div className="mt-4 text-xs text-muted-foreground">— {t.n}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-5 text-4xl tracking-tight md:text-5xl">Simple, honest pricing.</h2>
        </div>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {[
            { name: "Free", price: "$0", features: ["1 active course", "All 5 agents", "Basic progress tracking"] },
            { name: "Pro", price: "$12", features: ["Unlimited courses", "Priority orchestration", "Deep tutor conversations", "Export & share"], featured: true },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-2xl border bg-card p-8 ${p.featured ? "shadow-2xl ring-2 ring-[#0052FF]/40" : ""}`}>
              {p.featured && (
                <div className="absolute -top-3 left-8 rounded-full bg-gradient-accent px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white">Popular</div>
              )}
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-display">{p.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-[#0052FF]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/auth" className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-medium ${p.featured ? "bg-gradient-accent text-white" : "border"}`}>
                  Get started
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 dot-pattern opacity-70" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-4xl tracking-tight md:text-5xl">What do you want to <span className="text-gradient-accent">learn</span> next?</h2>
          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startFromLanding()}
              placeholder="Prep me for the AWS Solutions Architect exam…"
              className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/50"
            />
            <GradientButton onClick={startFromLanding}>Start <ArrowRight className="h-4 w-4" /></GradientButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Lurnexa</div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#agents" className="hover:text-foreground">Agents</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// silence unused
void GradientLink;
