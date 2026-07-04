import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Bell, Crown, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";

const TOGGLES = [
  { key: "benzine_rise", label: "Benzine stijgt" },
  { key: "benzine_drop", label: "Benzine daalt" },
  { key: "diesel_rise", label: "Diesel stijgt" },
  { key: "diesel_drop", label: "Diesel daalt" },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [setting, setSetting] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      const list = await base44.entities.AlertSetting.list().catch(() => []);
      if (list.length) setSetting(list[0]);
      else {
        const created = await base44.entities.AlertSetting.create({ benzine_rise: true, benzine_drop: true, diesel_rise: true, diesel_drop: true, threshold: 0.03 });
        setSetting(created);
      }
    })();
  }, []);

  const update = async (patch) => {
    setSaving(true);
    const next = { ...setting, ...patch };
    setSetting(next);
    await base44.entities.AlertSetting.update(setting.id, patch);
    setSaving(false);
  };

  if (!setting) return <div className="h-40 rounded-2xl bg-white/[0.04] animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-sm text-white/40">Beheer je account en meldingen</p>
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full fa-gradient flex items-center justify-center"><UserIcon className="w-5 h-5 text-black" /></div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{user?.full_name || "Gast"}</div>
          <div className="text-xs text-white/40 truncate">{user?.email || "Niet ingelogd"}</div>
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-white/5 text-white/50">Gratis</span>
      </div>

      <Link to="/premium" className="block rounded-2xl fa-gradient p-4">
        <div className="flex items-center gap-3 text-black">
          <Crown className="w-6 h-6" />
          <div className="flex-1"><div className="font-bold text-sm">Upgrade naar Premium</div><div className="text-xs opacity-80">Realtime alerts & geen advertenties</div></div>
        </div>
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-amber-400" /><h2 className="font-semibold text-sm">Push notificaties</h2></div>
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 divide-y divide-white/5">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between p-4">
              <span className="text-sm">{t.label}</span>
              <Switch checked={!!setting[t.key]} onCheckedChange={(v) => update({ [t.key]: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
        <div className="flex items-center justify-between text-sm mb-3">
          <span>Drempelwaarde</span>
          <span className="font-bold text-amber-400">€{Number(setting.threshold).toFixed(2)} / L</span>
        </div>
        <input type="range" min="0.01" max="0.15" step="0.01" value={setting.threshold}
          onChange={(e) => update({ threshold: +e.target.value })} className="w-full accent-amber-400" />
        <p className="text-xs text-white/40 mt-2">Je ontvangt een melding zodra het verschil groter is dan deze waarde.</p>
      </div>

      {user && (
        <button onClick={() => base44.auth.logout()} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-white/60 text-sm font-medium">
          <LogOut className="w-4 h-4" /> Uitloggen
        </button>
      )}
      {saving && <p className="text-center text-xs text-white/30">Opslaan…</p>}
    </div>
  );
}