import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/lurnexa/nav";
import { GradientButton, SectionLabel } from "@/components/lurnexa/primitives";
import { toast } from "sonner";
import { LogOut, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Lurnexa" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("beginner");
  const [prefs, setPrefs] = useState("");
  const [courseCount, setCourseCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? null);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      if (p) { setName(p.name ?? ""); setLevel(p.background_level ?? "beginner"); setPrefs((p.learning_preferences as any)?.notes ?? ""); }
      const { count: cc } = await supabase.from("courses").select("*", { count: "exact", head: true });
      setCourseCount(cc ?? 0);
      const { count: mc } = await supabase.from("progress").select("*", { count: "exact", head: true }).gte("mastery_score", 100);
      setMasteredCount(mc ?? 0);
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      name, background_level: level, learning_preferences: { notes: prefs }, updated_at: new Date().toISOString(),
    }).eq("id", u.user.id);
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav email={email} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <SectionLabel>Your profile</SectionLabel>
        <h1 className="mt-4 text-4xl">Hi{name ? `, ${name}` : ""}.</h1>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat label="Courses" value={courseCount} />
          <Stat label="Modules mastered" value={masteredCount} />
          <Stat label="Day streak" value={1} icon={<Flame className="h-4 w-4 text-orange-500" />} />
        </div>

        <div className="mt-10 rounded-2xl border bg-card p-6">
          <h2 className="text-xl">Learning profile</h2>
          <div className="mt-6 space-y-4">
            <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0052FF]/40" /></Field>
            <Field label="Email"><input value={email ?? ""} disabled className="w-full rounded-xl border bg-muted px-4 py-2.5 text-sm text-muted-foreground" /></Field>
            <Field label="Background level">
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0052FF]/40">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Preferences (tell your agents about you)">
              <textarea value={prefs} onChange={(e) => setPrefs(e.target.value)} rows={3} placeholder="I learn best with concrete examples and short daily sessions…" className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0052FF]/40" />
            </Field>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-muted"><LogOut className="h-4 w-4" /> Sign out</button>
            <GradientButton onClick={save} disabled={loading}>{loading ? "Saving…" : "Save changes"}</GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 text-3xl font-display">{value}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}
