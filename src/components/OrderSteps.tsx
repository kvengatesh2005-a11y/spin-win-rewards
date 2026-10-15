import { ORDER_STEPS } from "@/lib/game";

export function OrderSteps({ status }: { status: string }) {
  const cur = ORDER_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="mt-3 flex items-center">
      {ORDER_STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <div className={`h-1 flex-1 ${i === 0 ? "opacity-0" : i <= cur ? "bg-success" : "bg-muted"}`} />
            <div className={`size-4 rounded-full ${i <= cur ? "bg-success" : "bg-muted"}`} />
            <div className={`h-1 flex-1 ${i === ORDER_STEPS.length - 1 ? "opacity-0" : i < cur ? "bg-success" : "bg-muted"}`} />
          </div>
          <span className={`mt-1 text-[10px] font-bold ${i <= cur ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
