import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import hero from "@/assets/wheel-hero.png";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({
    meta: [
      { title: "Spin & Win — Spin the wheel, win real products" },
      { name: "description", content: "Spin the wheel from ₹20 and win products delivered to your door." },
      { property: "og:title", content: "Spin & Win" },
      { property: "og:description", content: "Spin the wheel and win products delivered to your door." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(ref ? "signup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(ref ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref) localStorage.setItem("spin_ref", ref);
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/home" }));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/home" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, ref]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { name, ref: code.trim() } },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-6">
      <img src={hero} alt="Prize wheel" width={816} height={816} className="mx-auto w-64 animate-float" />
      <div className="ticket mx-auto -mt-4 w-full px-8 py-5 text-center shadow-card">
        <h1 className="text-5xl font-extrabold text-ink">{mode === "login" ? "Login" : "Sign up"}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Sign in to continue." : "Get 500 free demo coins!"}
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Name"><Input variant="game" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        )}
        <Field label="Email"><Input variant="game" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input variant="game" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {mode === "signup" && (
          <Field label="Referral code (optional)"><Input variant="game" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></Field>
        )}
        <Button type="submit" variant="ink" size="xl" className="w-full" disabled={busy}>
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
        <Button type="button" variant="outline" size="xl" className="w-full" onClick={google}>
          Continue with Google
        </Button>
      </form>
      <button className="mt-6 text-center font-semibold text-ink" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "New here? Sign up!" : "Have an account? Log in"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink">{label}</span>
      {children}
    </label>
  );
}
