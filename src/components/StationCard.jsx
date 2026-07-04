import React from "react";
import { Star, MapPin, Navigation } from "lucide-react";
import { fmtEur, FUEL_MAP } from "@/lib/fuelConfig";

export default function StationCard({ station, fuelKey, distance, isFav, onToggleFav }) {
  const price = station[`price_${fuelKey}`];
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{station.name}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{station.city}</span>
          {distance != null && (
            <span className="flex items-center gap-0.5 ml-1 text-amber-400/80">
              <Navigation className="w-3 h-3" />{distance.toFixed(1)} km
            </span>
          )}
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-white/50">
          {station.brand}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold tabular-nums" style={{ color: FUEL_MAP[fuelKey].color }}>{fmtEur(price)}</div>
        <button
          onClick={() => onToggleFav(station)}
          className={`mt-1 p-1.5 rounded-lg transition-colors ${isFav ? "text-amber-400" : "text-white/30 hover:text-amber-400"}`}
        >
          <Star className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}