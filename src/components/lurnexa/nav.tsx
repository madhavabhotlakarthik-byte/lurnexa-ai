import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GradientLink } from "./primitives";
import { Sparkles } from "lucide-react";

export function LurnexaLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-accent text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-lg font-display tracking-tight">Lurnexa</span>
    </Link>
  );
}

export function LandingNav() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <LurnexaLogo />
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#agents" className="text-sm text-muted-foreground hover:text-foreground">The agents</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          {authed ? (
            <GradientLink to="/courses">Open app</GradientLink>
          ) : (
            <>
              <Link to="/auth" className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
              <GradientLink to="/auth">Get started</GradientLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function AppNav({ email }: { email?: string | null }) {
  const initial = (email?.[0] ?? "L").toUpperCase();
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <LurnexaLogo />
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/courses" className="text-sm text-muted-foreground [&.active]:text-foreground [&.active]:font-medium" activeOptions={{ exact: false }}>Courses</Link>
          <Link to="/create" className="text-sm text-muted-foreground [&.active]:text-foreground [&.active]:font-medium">Create</Link>
          <Link to="/profile" className="text-sm text-muted-foreground [&.active]:text-foreground [&.active]:font-medium">Profile</Link>
        </div>
        <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-accent text-sm font-medium text-white">
          {initial}
        </Link>
      </div>
    </nav>
  );
}
