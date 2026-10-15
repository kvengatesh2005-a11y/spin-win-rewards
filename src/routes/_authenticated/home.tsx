import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Lock, Sparkles, Truck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { LEVELS } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — Spin & Win" }, { name: "description", content: "Pick a level and spin." }] }),
  component: HomePage,
});

function HomePage() {
  const { data } = useProfile();
  const p = data?.profile;
  return (
    <AppShell title={`Hi, ${p?.name || "Player"}!`}>
      <div className="mb-5 rounded-2xl bg-royal-grad p-4 text-royal-foreground shadow-card">
        <p className="text-sm opacity-80">Games played</p>
        <p className="font-display text-3xl font-extrabold">{p?.games_played ?? 0}</p>
        {!!p?.free_spins && (
          <p className="mt-1 flex items-center gap-1 text-sm font-bold text-gold">
            <Sparkles className="size-4" /> {p.free_spins} free spin{p.free_spins > 1 ? "s" : ""} on Level 1
          </p>
        )}
        <p className="mt-2 text-xs opacity-70">Demo coins only — no real money is used.</p>
      </div>

      <h2 className="mb-3 text-xl font-extrabold text-ink">Spin & Win</h2>
      <div className="space-y-3">
        {LEVELS.map((l) => {
          const locked = (p?.games_played ?? 0) < l.unlockAfter;
          const left = l.unlockAfter - (p?.games_played ?? 0);
          return (
            <Link
              key={l.level}
              to="/spin/$level"
              params={{ level: String(l.level) }}
              disabled={locked}
              className={`flex items-center justify-between rounded-2xl bg-card p-4 shadow-card ${locked ? "opacity-60" : "animate-pop"}`}
            >
              <div>
                <p className="font-display text-2xl font-extrabold text-ink">{l.title}</p>
                <p className="text-sm text-muted-foreground">{locked ? `Play ${left} more game${left > 1 ? "s" : ""} to unlock` : l.tag}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-gold px-4 py-2 font-display text-lg font-extrabold text-ink">
                {locked && <Lock className="size-4" />}₹{l.cost}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/refer" className="rounded-2xl bg-card p-4 shadow-card">
          <Users className="mb-2 size-6 text-royal" />
          <p className="font-bold">Refer & Earn</p>
          <p className="text-xs text-muted-foreground">3 friends = 1 free spin</p>
        </Link>
        <Link to="/orders" className="rounded-2xl bg-card p-4 shadow-card">
          <Truck className="mb-2 size-6 text-royal" />
          <p className="font-bold">Track your gift</p>
          <p className="text-xs text-muted-foreground">See delivery status</p>
        </Link>
      </div>
      <p className="mt-6 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Gift className="size-3" /> Won products are delivered to your address</p>
    </AppShell>
  );
}
