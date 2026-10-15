export const LEVELS = [
  { level: 1, cost: 20, unlockAfter: 0, title: "Level 1", tag: "Sure win — every spin wins a product" },
  { level: 2, cost: 50, unlockAfter: 5, title: "Level 2", tag: "Sure win — bigger products" },
  { level: 3, cost: 100, unlockAfter: 10, title: "Level 3", tag: "Mega prizes — 1 in 10 chance" },
] as const;

export const ORDER_STEPS = [
  { key: "awaiting_address", label: "Add address" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

export function getLevel(n: number) {
  return LEVELS.find((l) => l.level === n);
}
