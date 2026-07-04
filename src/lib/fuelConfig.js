export const FUEL_TYPES = [
  { key: "benzine95", label: "Benzine 95", short: "B95", color: "#22c55e", emoji: "⛽" },
  { key: "benzine98", label: "Benzine 98", short: "B98", color: "#3b82f6", emoji: "⛽" },
  { key: "diesel", label: "Diesel", short: "Diesel", color: "#f59e0b", emoji: "🛢️" },
  { key: "lpg", label: "LPG", short: "LPG", color: "#a855f7", emoji: "🔋" },
];

export const FUEL_MAP = FUEL_TYPES.reduce((a, f) => ((a[f.key] = f), a), {});

export function fmtEur(v) {
  if (v === undefined || v === null) return "—";
  return "€" + Number(v).toFixed(3);
}

export function fmtDiff(v) {
  if (v === undefined || v === null) return "";
  const sign = v > 0 ? "+" : "";
  return sign + (v * 100).toFixed(1) + " ct";
}