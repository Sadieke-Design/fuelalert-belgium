import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FUEL_TYPES } from "@/lib/fuelConfig";
import { Shield, Save, Send, Database, BarChart3, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  const [tab, setTab] = useState("prices");
  const [latest, setLatest] = useState(null);
  const [form, setForm] = useState({});
  const [stations, setStations] = useState([]);
  const [campaign, setCampaign] = useState({ title: "", body: "" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    const p = await base44.entities.FuelPrice.list("-date", 1);
    setLatest(p[0] || null);
    setForm(p[0] || {});
    const s = await base44.entities.FuelStation.list();
    setStations(s);
  };
  useEffect(() => { load(); }, []);

  const savePrices = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = { date: today, benzine95: +form.benzine95, benzine98: +form.benzine98, diesel: +form.diesel, lpg: +form.lpg };
    if (latest?.date === today) await base44.entities.FuelPrice.update(latest.id, payload);
    else await base44.entities.FuelPrice.create(payload);
    setMsg("Prijzen opgeslagen ✓");
    setTimeout(() => setMsg(""), 2500);
    load();
  };

  const sendCampaign = async () => {
    if (!campaign.title || !campaign.body) return;
    await base44.entities.Notification.create({ title: campaign.title, body: campaign.body });
    setCampaign({ title: "", body: "" });
    setMsg("Campagne verzonden ✓");
    setTimeout(() => setMsg(""), 2500);
  };

  const TABS = [
    { key: "prices", label: "Prijzen", icon: Database },
    { key: "campaigns", label: "Meldingen", icon: Send },
    { key: "stats", label: "Statistieken", icon: BarChart3 },
    { key: "api", label: "API", icon: Link2 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        </div>
        <Link to="/" className="text-sm text-white/50">Sluiten</Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab === t.key ? "bg-amber-400 text-black" : "bg-white/5 text-white/50"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {msg && <div className="rounded-xl bg-green-500/15 text-green-400 text-sm p-3 text-center">{msg}</div>}

      {tab === "prices" && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 space-y-3">
          <p className="text-xs text-white/40">Nationale gemiddelde prijzen voor vandaag bewerken.</p>
          {FUEL_TYPES.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{f.label}</span>
              <input type="number" step="0.001" value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-right tabular-nums" />
            </div>
          ))}
          <button onClick={savePrices} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl fa-gradient text-black font-semibold text-sm">
            <Save className="w-4 h-4" /> Opslaan
          </button>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 space-y-3">
          <p className="text-xs text-white/40">Stuur een notificatie-campagne naar alle gebruikers.</p>
          <input placeholder="Titel" value={campaign.title} onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="Bericht" rows={3} value={campaign.body} onChange={(e) => setCampaign({ ...campaign, body: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
          <button onClick={sendCampaign} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl fa-gradient text-black font-semibold text-sm">
            <Send className="w-4 h-4" /> Verzenden
          </button>
        </div>
      )}

      {tab === "stats" && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Tankstations" value={stations.length} />
          <Stat label="Actieve stations" value={stations.filter(s => s.is_active).length} />
          <Stat label="Goedkoopste diesel" value={"€" + Math.min(...stations.map(s => s.price_diesel || 9)).toFixed(3)} />
          <Stat label="Gem. benzine 95" value={"€" + (stations.reduce((a, s) => a + (s.price_benzine95 || 0), 0) / (stations.length || 1)).toFixed(3)} />
        </div>
      )}

      {tab === "api" && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 space-y-3">
          <p className="text-xs text-white/40">API-koppelingen voor officiële brandstofdata.</p>
          <ApiRow name="FOD Economie / Energia" status="Verbonden" />
          <ApiRow name="CarbuFlash prijsfeed" status="Verbonden" />
          <ApiRow name="Google Maps Places" status="Niet verbonden" off />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="text-xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function ApiRow({ name, status, off }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
      <span className="text-sm">{name}</span>
      <span className={`text-xs font-semibold ${off ? "text-white/40" : "text-green-400"}`}>{status}</span>
    </div>
  );
}