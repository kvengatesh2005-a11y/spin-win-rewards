import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/refer")({
  head: () => ({ meta: [{ title: "Refer & earn — Spin & Win" }, { name: "description", content: "Refer 3 friends to get a free spin." }] }),
  component: ReferPage,
});

function ReferPage() {
  const { data } = useProfile();
  const code = data?.profile?.referral_code ?? "";
  const { data: count = 0 } = useQuery({
    queryKey: ["refcount"],
    queryFn: async () => (await supabase.rpc("referral_count")).data ?? 0,
  });
  const progress = count % 3;
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : "";

  async function share() {
    const text = `Join me on Spin & Win! Use my code ${code}: ${link}`;
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); toast.success("Invite link copied!"); }
  }

  return (
    <AppShell title="Refer & Earn">
      <div className="rounded-3xl bg-royal-grad p-6 text-center text-royal-foreground shadow-card">
        <p className="font-display text-2xl font-extrabold">Refer 3 friends</p>
        <p className="opacity-80">Get 1 free spin on Level 1</p>
        <div className="mx-auto mt-5 w-fit rounded-xl border-2 border-dashed border-gold px-6 py-3 font-display text-3xl font-extrabold tracking-[0.3em] text-gold">{code}</div>
        <div className="mt-5 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex size-12 items-center justify-center rounded-full text-xl ${i < progress ? "bg-gold" : "bg-royal-foreground/20"}`}>{i < progress ? "🙋" : "?"}</div>
          ))}
        </div>
        <p className="mt-2 text-sm opacity-80">{progress}/3 towards your next free spin · {count} total</p>
      </div>
      <Button variant="spin" className="mt-6 h-14 w-full text-lg" onClick={share}><Share2 /> Share invite</Button>
    </AppShell>
  );
}
