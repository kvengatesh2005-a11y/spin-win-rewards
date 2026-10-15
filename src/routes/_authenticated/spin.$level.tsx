import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Wheel, type Segment } from "@/components/Wheel";
import { Button } from "@/components/ui/button";
import { getLevel } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/spin/$level")({
  head: () => ({ meta: [{ title: "Spin the wheel — Spin & Win" }, { name: "description", content: "Spin to win a product." }] }),
  component: SpinPage,
});

type Result = { won: boolean; product_name: string | null; product_emoji: string | null; order_id: string | null };

function SpinPage() {
  const level = Number(Route.useParams().level);
  const info = getLevel(level);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products", level],
    queryFn: async () => (await supabase.from("products").select("*").eq("level", level).eq("active", true)).data ?? [],
  });

  const segments: Segment[] = useMemo(() => {
    const prizes = products.slice(0, 8).map((p) => ({ label: p.name, emoji: p.emoji, win: true }));
    if (level !== 3) return prizes.length ? prizes : [{ label: "Coming soon", emoji: "⏳", win: false }];
    const out: Segment[] = [];
    prizes.forEach((p) => out.push(p, { label: "Better luck", emoji: "🍀", win: false }));
    return out.length ? out : [{ label: "Better luck", emoji: "🍀", win: false }];
  }, [products, level]);

  async function spin() {
    if (spinning) return;
    setResult(null);
    const { data, error } = await supabase.rpc("spin_wheel", { _level: level });
    if (error) return toast.error(error.message);
    const r = data as unknown as Result;
    let idx = r.won ? segments.findIndex((s) => s.win && s.label === r.product_name) : segments.findIndex((s) => !s.win);
    if (idx < 0) idx = 0;
    const a = 360 / segments.length;
    const target = 360 - (idx * a + a / 2);
    const base = rotation - (rotation % 360);
    setSpinning(true);
    setRotation(base + 360 * 6 + target);
    qc.invalidateQueries({ queryKey: ["profile"] });
    setTimeout(() => { setSpinning(false); setResult(r); }, 4700);
  }

  if (!info) return <AppShell title="Not found"><p>Unknown level.</p></AppShell>;

  return (
    <AppShell title={info.title}>
      <Link to="/home" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-ink"><ArrowLeft className="size-4" /> Back</Link>
      <p className="mb-4 text-center text-sm font-semibold text-ink/80">{info.tag}</p>
      <Wheel segments={segments} rotation={rotation} spinning={spinning} />
      <div className="mt-8 flex justify-center">
        <Button variant="spin" className="h-16 w-56" onClick={spin} disabled={spinning}>
          {spinning ? "Spinning…" : `Spin · ₹${info.cost}`}
        </Button>
      </div>

      {result && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/60 p-6">
          <div className="w-full max-w-sm animate-pop rounded-3xl bg-card p-6 text-center shadow-card">
            <div className="text-7xl">{result.won ? result.product_emoji : "🍀"}</div>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">{result.won ? "You won!" : "Better luck next time"}</h2>
            <p className="mt-1 text-muted-foreground">{result.won ? result.product_name : "Try again — mega prizes are waiting."}</p>
            <div className="mt-5 space-y-2">
              {result.won && result.order_id ? (
                <Button variant="ink" size="xl" className="w-full" onClick={() => navigate({ to: "/claim/$orderId", params: { orderId: result.order_id! } })}>
                  Add delivery address
                </Button>
              ) : null}
              <Button variant="outline" size="xl" className="w-full" onClick={() => setResult(null)}>Spin again</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
