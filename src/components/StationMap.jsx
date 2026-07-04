import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fmtEur, FUEL_MAP } from "@/lib/fuelConfig";

function priceIcon(price, color) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#000;font-weight:700;font-size:11px;padding:3px 7px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)">€${Number(price).toFixed(2)}</div>`,
    iconSize: [50, 22],
    iconAnchor: [25, 11],
  });
}

export default function StationMap({ stations, fuelKey }) {
  const color = FUEL_MAP[fuelKey].color;
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 h-[420px]">
      <MapContainer center={[50.85, 4.35]} zoom={8} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {stations.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={priceIcon(s[`price_${fuelKey}`], color)}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong>{s.name}</strong><br />
                {s.brand} · {s.city}<br />
                {FUEL_MAP[fuelKey].label}: <strong>{fmtEur(s[`price_${fuelKey}`])}</strong>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}