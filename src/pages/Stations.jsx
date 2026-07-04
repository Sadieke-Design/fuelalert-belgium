import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FUEL_TYPES } from "@/lib/fuelConfig";
import StationCard from "@/components/StationCard";
import StationMap from "@/components/StationMap";
import { Map as MapIcon, List } from "lucide-react";

// Brussels city center as reference for distance
const REF = { lat: 50.8466, lng: 4.3528 };
function dist(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [favs, setFavs] = useState([]);
  const [fuelKey, setFuelKey] = useState("diesel");
  const [maxDist, setMaxDist] = useState(200);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const s = await base44.entities.FuelStation.filter({ is_active: true });
    setStations(s);
    const f = await base44.entities.Favorite.list().catch(() => []);
    setFavs(f);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleFav = async (station) => {
    const existing = favs.find((f) => f.station_id === station.id);
    if (existing) {
      await base44.entities.Favorite.delete(existing.id);
    } else {
      await base44.entities.Favorite.create({ station_id: station.id, station_name: station.name });
    }
    const f = await base44.entities.Favorite.list();
    setFavs(f);
  };

  const enriched = useMemo(() => {
    return stations
      .map((s) => ({ ...s, _d: dist(REF, { lat: s.lat, lng: s.lng }) }))
      .filter((s) => s._d <= maxDist && s[`price_${fuelKey}`] != null)
      .sort((a, b) => a[`price_${fuelKey}`] - b[`price_${fuelKey}`]);
  }, [stations, fuelKey, maxDist]);

  const favIds = new Set(favs.map((f) => f.station_id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tankstations</h1>
          <p className="text-sm text-white/40">Goedkoopste eerst</p>
        </div>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button onClick={() => setView("list")} className={`p-2 rounded-lg ${view === "list" ? "bg-amber-400 text-black" : "text-white/50"}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setView("map")} className={`p-2 rounded-lg ${view === "map" ? "bg-amber-400 text-black" : "text-white/50"}`}><MapIcon className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FUEL_TYPES.map((f) => (
          <button key={f.key} onClick={() => setFuelKey(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${fuelKey === f.key ? "bg-amber-400 text-black" : "bg-white/5 text-white/50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-white/50">Max. afstand</span>
          <span className="font-semibold text-amber-400">{maxDist} km</span>
        </div>
        <input type="range" min="5" max="200" step="5" value={maxDist} onChange={(e) => setMaxDist(+e.target.value)}
          className="w-full accent-amber-400" />
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />)}</div>
      ) : view === "map" ? (
        <StationMap stations={enriched} fuelKey={fuelKey} />
      ) : (
        <div className="space-y-2">
          {enriched.map((s, i) => (
            <div key={s.id} className="relative">
              {i === 0 && <span className="absolute -top-1 left-3 z-10 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full fa-gradient text-black">Goedkoopste</span>}
              <StationCard station={s} fuelKey={fuelKey} distance={s._d} isFav={favIds.has(s.id)} onToggleFav={toggleFav} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}