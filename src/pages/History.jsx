import React, { useEffect, useMemo, useState } from "react";
import { FUEL_TYPES, FUEL_MAP } from "@/lib/fuelConfig";
import { historyDays, currentPlan } from "@/lib/access";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const RANGES = [
  { key: 7, label: "7 dagen" },
  { key: 30, label: "30 dagen" },
  { key: 180, label: "6 maanden" },
  { key: 365, label: "1 jaar" },
];

function formatDate(date) {
  return new Date(date).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
  });
}

function formatEuro(value) {
  if (value === null || value === undefined) return "—";
  return `€${Number(value).toFixed(3)}`;
}

function formatCent(value) {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} ct`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function StatsCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
      <div className="text-xs text-white/40">{title}</div>

      <div className="mt-2 text-2xl font-bold">{value}</div>

      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 shadow-xl">
      <div className="text-xs text-white/40 mb-2">{label}</div>

      <div
        className="font-semibold"
        style={{
          color: payload[0].color,
        }}
      >
        {payload[0].name}
      </div>

      <div className="text-lg font-bold">
        €{Number(payload[0].value).toFixed(3)}
      </div>
    </div>
  );
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const maxDays = historyDays();
  const plan = currentPlan();

  const [range, setRange] = useState(maxDays >= 30 ? 30 : maxDays);

  const [fuelKey, setFuelKey] = useState("diesel");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadHistory(range);
  }, [range]);

  async function loadHistory(days) {
    setLoading(true);

    try {
      const allowedDays = Math.min(days, maxDays);

      const response = await fetch(
        `/api/fuel-prices/history?days=${allowedDays}`,
      );

      const json = await response.json();

      if (json.success) {
        setHistory(json.data);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  const fuel = FUEL_MAP[fuelKey];

  const chartData = useMemo(() => {
    return history.map((row) => ({
      date: formatDate(row.price_date),
      fullDate: row.price_date,

      benzine95: Number(row.benzine95),
      benzine98: Number(row.benzine98),
      diesel: Number(row.diesel),
      lpg: Number(row.lpg),
    }));
  }, [history]);

  const prices = useMemo(() => {
    return chartData
      .map((row) => row[fuelKey])
      .filter((v) => v !== null && v !== undefined);
  }, [chartData, fuelKey]);
  const currentPrice = prices.length > 0 ? prices[prices.length - 1] : null;

  const firstPrice = prices.length > 0 ? prices[0] : null;

  const difference =
    currentPrice !== null && firstPrice !== null
      ? currentPrice - firstPrice
      : null;

  const differencePercent =
    currentPrice !== null && firstPrice !== null && firstPrice !== 0
      ? ((currentPrice - firstPrice) / firstPrice) * 100
      : null;

  const highest = prices.length > 0 ? Math.max(...prices) : null;

  const lowest = prices.length > 0 ? Math.min(...prices) : null;

  const average =
    prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;

  const lastUpdate =
    history.length > 0 ? history[history.length - 1].price_date : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historiek</h1>

        <p className="mt-1 text-sm text-white/40">
          Officiële Belgische maximumprijzen
        </p>
      </div>

      {/* Brandstof selector */}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FUEL_TYPES.map((item) => (
          <button
            key={item.key}
            onClick={() => setFuelKey(item.key)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 ${
              fuelKey === item.key
                ? "bg-amber-400 text-black font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      {/* Statistieken */}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Huidige prijs"
          value={formatEuro(currentPrice)}
          sub={fuel.label}
        />

        <StatsCard title="Hoogste" value={formatEuro(highest)} />

        <StatsCard title="Laagste" value={formatEuro(lowest)} />

        <StatsCard title="Gemiddelde" value={formatEuro(average)} />

        <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
          <div className="text-xs text-white/40">Evolutie</div>

          <div
            className={`mt-2 text-2xl font-bold ${
              difference > 0
                ? "text-red-400"
                : difference < 0
                  ? "text-green-400"
                  : "text-white"
            }`}
          >
            {formatCent(difference)}
          </div>

          <div className="text-xs text-white/40 mt-1">
            {formatPercent(differencePercent)}
          </div>
        </div>
      </div>
      {/* Grafiek */}

      <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm text-white/50">{fuel.label}</div>

            <div className="text-3xl font-bold mt-1">
              {formatEuro(currentPrice)}
            </div>

            <div className="text-xs text-white/40 mt-1">
              Laatste update: {lastUpdate ?? "—"}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-80 rounded-xl bg-white/5 animate-pulse" />
        ) : chartData.length < 2 ? (
          <div className="h-80 flex items-center justify-center text-white/40">
            Nog onvoldoende historische gegevens.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid stroke="#2f2f2f" strokeDasharray="3 3" />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#9ca3af",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#9ca3af",
                    fontSize: 12,
                  }}
                  tickFormatter={(v) => `€${Number(v).toFixed(2)}`}
                  domain={[(min) => min - 0.02, (max) => max + 0.02]}
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey={fuelKey}
                  name={fuel.label}
                  stroke={fuel.color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: fuel.color,
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {plan !== "premium" && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
          <div className="text-lg font-semibold text-amber-400">
            Premium Historiek
          </div>

          <div className="text-sm text-white/60 mt-2">
            Upgrade naar Premium voor onbeperkte historiek, tankstationkaarten
            zonder advertenties, prijsalerts en toekomstige AI voorspellingen.
          </div>

          <button className="mt-4 bg-amber-400 text-black px-5 py-2 rounded-xl font-semibold">
            Upgrade naar Premium
          </button>
        </div>
      )}
      {/* Periode selector */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {RANGES.filter((item) => item.key <= maxDays).map((item) => (
          <button
            key={item.key}
            onClick={() => setRange(item.key)}
            className={`rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
              range === item.key
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
