import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Fuel, MapPin, Star, LineChart, Settings } from "lucide-react";

const NAV = [
  { to: "/", icon: Fuel, label: "Prijzen" },
  { to: "/stations", icon: MapPin, label: "Stations" },
  { to: "/favorites", icon: Star, label: "Favorieten" },
  { to: "/history", icon: LineChart, label: "Historiek" },
  { to: "/settings", icon: Settings, label: "Instellingen" },
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0b]/80 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl fa-gradient flex items-center justify-center fa-glow">
              <Fuel className="w-5 h-5 text-black" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-[15px] tracking-tight">FuelAlert</span>
              <span className="block text-[10px] text-amber-400 font-medium tracking-widest uppercase">Belgium</span>
            </div>
          </Link>
         
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-[#0a0a0b]/90 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-2 flex items-center justify-around h-[72px]">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className="flex flex-col items-center gap-1 flex-1 py-2">
                <Icon className={`w-[22px] h-[22px] transition-colors ${active ? "text-amber-400" : "text-white/40"}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-amber-400" : "text-white/40"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}