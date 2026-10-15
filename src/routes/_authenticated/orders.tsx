import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { OrderSteps } from "@/components/OrderSteps";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My gifts — Spin & Win" }, { name: "description", content: "Track your won products." }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      return (await supabase.from("orders").select("*").eq("user_id", u.user!.id).order("created_at", { ascending: false })).data ?? [];
    },
  });
  return (
    <AppShell title="My Gifts">
      {isLoading ? null : orders.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center shadow-card">
          <p className="text-5xl">🎁</p>
          <p className="mt-2 font-bold">No gifts yet</p>
          <Button asChild variant="ink" className="mt-4"><Link to="/home">Spin now</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{o.product_emoji}</span>
                <div className="flex-1">
                  <p className="font-extrabold">{o.product_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                {o.status === "awaiting_address" && (
                  <Button asChild size="sm" variant="ink"><Link to="/claim/$orderId" params={{ orderId: o.id }}>Add address</Link></Button>
                )}
              </div>
              <OrderSteps status={o.status} />
              {o.city && <p className="mt-2 text-xs text-muted-foreground">Delivering to {o.full_name}, {o.city} – {o.pincode}</p>}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
