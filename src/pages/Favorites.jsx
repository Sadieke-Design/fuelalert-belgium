import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import StationCard from "@/components/StationCard";
import { FUEL_TYPES } from "@/lib/fuelConfig";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  const [stations, setStations] = useState([]);
  const [fuelKey, setFuelKey] = useState("diesel");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const f = await base44.entities.Favorite.list().catch(() => []);
    const s = await base44.entities.FuelStation.list();
    setFavs(f); setStations(s); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleFav = async (station) => {
    const existing = favs.find((f) => f.station_id === station.id);
    if (existing) await base44.entities.Favorite.delete(existing.id);
    const f = await base44.entities.Favorite.list();
    setFavs(f);
  };

  const favStations = favs
    .map((f) => stations.find((s) => s.id === f.station_id))
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Favorieten</h1>
        <p className="text-sm text-white/40">Je opgeslagen tankstations</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FUEL_TYPES.map((f) => (
          <button key={f.key} onClick={() => setFuelKey(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${fuelKey === f.key ? "bg-amber-400 text-black" : "bg-white/5 text-white/50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />)}</div>
      ) : favStations.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-8 text-center">
          <Star className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/50 mb-4">Nog geen favorieten opgeslagen.</p>
          <Link to="/stations" className="inline-block px-4 py-2 rounded-xl fa-gradient text-black text-sm font-semibold">Tankstations zoeken</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {favStations.map((s) => (
            <StationCard key={s.id} station={s} fuelKey={fuelKey} isFav onToggleFav={toggleFav} />
          ))}
        </div>
      )}
    </div>
  );
}