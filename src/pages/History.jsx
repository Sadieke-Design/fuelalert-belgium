import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FUEL_TYPES, FUEL_MAP } from "@/lib/fuelConfig";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const RANGES = [
  { key: 7, label: "7 dagen" },
  { key: 30, label: "30 dagen" },
  { key: 180, label: "6 maanden" },
];

export default function History() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState(30);
  const [fuelKey, setFuelKey] = useState("diesel");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const prices = await base44.entities.FuelPrice.list("-date", 200);
      setData(prices.reverse());
      setLoading(false);
    })();
  }, []);

  const chartData = useMemo(() => {
    const sliced = data.slice(-range);
    return sliced.map((d) => ({ date: d.date?.slice(5), value: d[fuelKey] }));
  }, [data, range, fuelKey]);

  const fuel = FUEL_MAP[fuelKey];
  const first = chartData[0]?.value, last = chartData[chartData.length - 1]?.value;
  const change = first && last ? last - first : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historiek</h1>
        <p className="text-sm text-white/40">Prijsverloop nationaal gemiddelde</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FUEL_TYPES.map((f) => (
          <button key={f.key} onClick={() => setFuelKey(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${fuelKey === f.key ? "bg-amber-400 text-black" : "bg-white/5 text-white/50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-white/40">{fuel.label} · {RANGES.find(r => r.key === range)?.label}</div>
            <div className="text-xl font-bold tabular-nums">€{last?.toFixed(3) ?? "—"}</div>
          </div>
          <div className={`text-sm font-semibold ${change > 0 ? "text-red-400" : change < 0 ? "text-green-400" : "text-white/40"}`}>
            {change > 0 ? "+" : ""}{(change * 100).toFixed(1)} ct
          </div>
        </div>
        {loading ? (
          <div className="h-56 bg-white/[0.03] rounded-xl animate-pulse" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} minTickGap={30} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#fff" }} formatter={(v) => ["€" + Number(v).toFixed(3), fuel.label]} />
                <Line type="monotone" dataKey="value" stroke={fuel.color} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium ${range === r.key ? "bg-amber-400 text-black" : "bg-white/5 text-white/50"}`}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}