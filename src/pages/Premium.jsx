import React from "react";
import { Crown, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  "Geen advertenties",
  "Realtime prijsalerts (push)",
  "Onbeperkte favorieten",
  "Prijsvoorspellingen voor morgen",
  "Volledige 6-maanden historiek",
];

export default function Premium() {
  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50"><ArrowLeft className="w-4 h-4" /> Terug</Link>

      <div className="rounded-3xl fa-gradient p-6 text-black text-center fa-glow">
        <Crown className="w-12 h-12 mx-auto mb-3" />
        <h1 className="text-2xl font-bold">FuelAlert Premium</h1>
        <div className="mt-2 text-4xl font-extrabold">€2,99<span className="text-base font-medium">/maand</span></div>
        <p className="text-sm opacity-80 mt-1">Opzegbaar op elk moment</p>
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-5 space-y-3">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center"><Check className="w-4 h-4 text-amber-400" /></span>
            <span className="text-sm">{f}</span>
          </div>
        ))}
      </div>

      <button className="w-full py-4 rounded-2xl fa-gradient text-black font-bold fa-glow">
        Start Premium voor €2,99/maand
      </button>
      <p className="text-center text-xs text-white/30">Betaling via je app store account.</p>
    </div>
  );
}