import { Link } from "@tanstack/react-router";
import { Coins, Gift, Home, Shield, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { data } = useProfile();
  const nav = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/orders", label: "My Gifts", icon: Gift },
    { to: "/refer", label: "Refer", icon: Users },
    ...(data?.isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ] as const;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 pb-3 pt-5">
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-bold text-ink-foreground">
          <Coins className="size-4 text-gold" />
          {data?.profile?.coins ?? "—"}
        </div>
      </header>
      <main className="flex-1 px-5 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around rounded-t-3xl bg-ink px-2 py-3 text-ink-foreground">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-0.5 px-3 text-xs font-semibold opacity-70"
            activeProps={{ className: "!opacity-100 text-gold" }}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
