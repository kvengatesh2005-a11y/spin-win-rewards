import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/claim/$orderId")({
  head: () => ({ meta: [{ title: "Delivery address — Spin & Win" }, { name: "description", content: "Where should we deliver your prize?" }] }),
  component: ClaimPage,
});

function ClaimPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await supabase.from("orders").select("*").eq("id", orderId).single()).data,
  });
  const [f, setF] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("submit_address", {
      _order_id: orderId, _full_name: f.name, _phone: f.phone, _address: f.address, _city: f.city, _pincode: f.pincode,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Order confirmed! We'll deliver soon.");
    qc.invalidateQueries({ queryKey: ["orders"] });
    navigate({ to: "/orders" });
  }

  return (
    <AppShell title="Claim prize">
      {order && (
        <div className="mb-5 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card">
          <span className="text-5xl">{order.product_emoji}</span>
          <div><p className="text-xs uppercase text-muted-foreground">You won</p><p className="text-lg font-extrabold">{order.product_name}</p></div>
        </div>
      )}
      {order && order.status !== "awaiting_address" ? (
        <p className="rounded-2xl bg-card p-4 text-center font-semibold">Address already added. Track it in My Gifts.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Input variant="game" placeholder="Full name" required value={f.name} onChange={set("name")} />
          <Input variant="game" placeholder="Mobile number (10 digits)" inputMode="numeric" pattern="[0-9]{10}" required value={f.phone} onChange={set("phone")} />
          <Input variant="game" placeholder="House no, street, area" required value={f.address} onChange={set("address")} />
          <Input variant="game" placeholder="City" required value={f.city} onChange={set("city")} />
          <Input variant="game" placeholder="Pincode (6 digits)" inputMode="numeric" pattern="[0-9]{6}" required value={f.pincode} onChange={set("pincode")} />
          <Button variant="ink" size="xl" className="w-full" disabled={busy}>Confirm delivery</Button>
        </form>
      )}
    </AppShell>
  );
}
