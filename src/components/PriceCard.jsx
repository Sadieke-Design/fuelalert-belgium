import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fmtEur } from "@/lib/fuelConfig";

export default function PriceCard({ fuel, price, diff }) {
  const up = diff > 0.0005;
  const down = diff < -0.0005;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const tone = up ? "text-red-400" : down ? "text-green-400" : "text-white/40";
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/50">{fuel.label}</span>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: fuel.color }} />
      </div>
      <div className="text-2xl font-bold tracking-tight tabular-nums">{fmtEur(price)}</div>
      <div className="text-[10px] text-white/30 mb-2">per liter</div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${tone}`}>
        <Icon className="w-3.5 h-3.5" />
        {diff === null || diff === undefined ? "—" : `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(1)} ct vs gisteren`}
      </div>
    </div>
  );
}