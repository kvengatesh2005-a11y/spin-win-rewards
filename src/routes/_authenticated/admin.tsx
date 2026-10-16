import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { ORDER_STEPS } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Spin & Win" }, { name: "description", content: "Manage prizes and deliveries." }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: me } = useProfile();
  const [tab, setTab] = useState<"orders" | "products">("orders");
  if (me && !me.isAdmin) return <AppShell title="Admin"><p>Admins only.</p></AppShell>;
  return (
    <AppShell title="Admin">
      <div className="mb-4 flex rounded-xl bg-card p-1">
        {(["orders", "products"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg py-2 font-bold capitalize ${tab === t ? "bg-ink text-ink-foreground" : ""}`}>{t}</button>
        ))}
      </div>
      {tab === "orders" ? <Orders /> : <Products />}
    </AppShell>
  );
}

function Orders() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }
  if (!data.length) return <p className="text-center text-muted-foreground">No orders yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((o) => (
        <div key={o.id} className="rounded-2xl bg-card p-4 shadow-card">
          <p className="font-extrabold">{o.product_emoji} {o.product_name}</p>
          {o.full_name ? (
            <p className="mt-1 text-sm">{o.full_name} · {o.phone}<br />{o.address_line}, {o.city} – {o.pincode}</p>
          ) : <p className="mt-1 text-sm text-muted-foreground">Waiting for winner's address</p>}
          <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-2 text-sm font-semibold">
            {ORDER_STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function Products() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [level, setLevel] = useState(1);
  const { data = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*").order("level")).data ?? [],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); };
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("products").insert({ name, emoji, level });
    if (error) { toast.error(error.message); return; }
    setName(""); refresh();
  }
  async function toggle(id: string, active: boolean) { await supabase.from("products").update({ active }).eq("id", id); refresh(); }
  async function remove(id: string) { await supabase.from("products").delete().eq("id", id); refresh(); }
  return (
    <>
      <form onSubmit={add} className="mb-4 space-y-2 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex gap-2">
          <Input className="w-16 text-center text-xl" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          <Input placeholder="Product name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="flex-1 rounded-md border bg-background px-2 text-sm">
            <option value={1}>Level 1 (₹20)</option><option value={2}>Level 2 (₹50)</option><option value={3}>Level 3 (₹100)</option>
          </select>
          <Button variant="ink">Add</Button>
        </div>
      </form>
      <div className="space-y-2">
        {data.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-card p-3">
            <span className="text-2xl">{p.emoji}</span>
            <div className="flex-1"><p className="font-bold">{p.name}</p><p className="text-xs text-muted-foreground">Level {p.level}</p></div>
            <Button size="sm" variant="outline" onClick={() => toggle(p.id, !p.active)}>{p.active ? "On" : "Off"}</Button>
            <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 /></Button>
          </div>
        ))}
      </div>
    </>
  );
}
