import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { GradientButton, SectionLabel } from "@/components/lurnexa/primitives";
import { LurnexaLogo } from "@/components/lurnexa/nav";
import authBgAsset from "@/assets/auth-bg-formulas.jpg.asset.json";
const authBg = authBgAsset.url;
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Lurnexa" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/courses" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        toast.success("Account created. Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/courses" });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally { setLoading(false); }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message); return; }
    if (result.redirected) return;
    navigate({ to: "/courses" });
  };

  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Left panel — visual */}
      <div
        className="relative hidden overflow-hidden bg-cover bg-center lg:block"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,20,80,0.78) 0%, rgba(0,82,255,0.72) 55%, rgba(77,124,255,0.68) 100%), url(${authBg})`,
        }}
      >
        <div className="absolute inset-0 dot-pattern opacity-60" />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#4D7CFF]/40 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <LurnexaLogo />
          <div className="max-w-md">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/70">
              Learning, reimagined
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-white">
              A team of AI agents, building your course in real time.
            </h2>
            <p className="mt-4 text-sm text-white/80">
              Type one goal. Watch a curriculum, lessons, quizzes, and a Socratic tutor come to life — just for you.
            </p>
            <div className="mt-8 flex items-center gap-6 text-xs text-white/70">
              <div><div className="font-display text-2xl text-white">5</div>Specialist agents</div>
              <div className="h-8 w-px bg-white/20" />
              <div><div className="font-display text-2xl text-white">15+</div>Quiz questions</div>
              <div className="h-8 w-px bg-white/20" />
              <div><div className="font-display text-2xl text-white">∞</div>Topics</div>
            </div>
          </div>
          <p className="font-mono text-xs text-white/50">© Lurnexa · Survay Cops</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex min-h-screen flex-col">
        {/* Mobile subtle background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.06] lg:hidden"
          style={{ backgroundImage: `url(${authBg})` }}
        />

        <div className="relative flex items-center justify-between px-6 py-4 lg:px-10">
          <div className="lg:hidden"><LurnexaLogo /></div>
          <div className="hidden lg:block" />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 lg:px-10">
          <div className="w-full max-w-sm">
            <SectionLabel>{mode === "signin" ? "Welcome back" : "Get started"}</SectionLabel>
            <h1 className="mt-4 font-display text-4xl leading-tight">
              {mode === "signin" ? "Sign in to Lurnexa" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Your agent team is waiting.</p>

            <button
              onClick={google}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition hover:border-[#0052FF]/40 hover:shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.9 6.2C12.3 13.5 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.7-.2-3.3-.5-4.9H24v9.3h12.7c-.6 3-2.3 5.5-4.9 7.2l7.7 6c4.5-4.2 7-10.3 7-17.6z"/><path fill="#FBBC05" d="M10.4 28.5c-.6-1.7-.9-3.5-.9-5.5s.3-3.8.9-5.5l-7.9-6.2C.8 15.2 0 19.5 0 24s.8 8.8 2.5 12.7l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.7-6c-2.1 1.4-4.8 2.3-7.3 2.3-6.4 0-11.7-4-13.6-9.6l-7.9 6.2C6.5 42.6 14.6 48 24 48z"/></svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or with email <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition focus:border-[#0052FF]/40 focus:ring-2 focus:ring-[#0052FF]/30" />
              )}
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition focus:border-[#0052FF]/40 focus:ring-2 focus:ring-[#0052FF]/30" />
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition focus:border-[#0052FF]/40 focus:ring-2 focus:ring-[#0052FF]/30" />
              <GradientButton type="submit" disabled={loading} className="w-full">
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </GradientButton>
            </form>

            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-6 block w-full text-center text-sm text-muted-foreground hover:text-foreground">
              {mode === "signin" ? "New to Lurnexa? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
