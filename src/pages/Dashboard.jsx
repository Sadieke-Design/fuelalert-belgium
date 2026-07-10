import React, { useEffect, useState } from "react";
import { FUEL_TYPES } from "@/lib/fuelConfig";
import PriceCard from "@/components/PriceCard";
import { Link } from "react-router-dom";
import { Bell, Crown, ChevronRight } from "lucide-react";
import { hasAds, canUsePredictions, currentPlan } from "@/lib/access";

export default function Dashboard() {
  const [today, setToday] = useState(null);
  const [yesterday, setYesterday] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Haal de laatste brandstofprijzen op uit je eigen API
        const response = await fetch("/api/fuel-prices/latest");
        const result = await response.json();

        console.log("Fuel API:", result);
        if (result.success) {
          setToday(result.data);
          setYesterday(result.yesterday);
        } else {
          console.error("Geen prijsgegevens ontvangen");
        }

        // Meldingen voorlopig leeg
        setNotifs([]);
      } catch (e) {
        console.error("API ERROR", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-white/[0.04] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actuele prijzen</h1>
        <p className="text-sm text-white/40">
          Nationaal gemiddelde ·{" "}
          {today?.price_date?.substring(0, 10) || "vandaag"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FUEL_TYPES.map((f) => (
          <PriceCard
            key={f.key}
            fuel={f}
            price={today?.[f.key]}
            diff={
              today && yesterday
                ? Number(today[f.key]) - Number(yesterday[f.key])
                : null
            }
          />
        ))}
      </div>
      {canUsePredictions() && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="text-xs uppercase tracking-wide text-amber-300">
            Premium
          </div>

          <div className="mt-2 font-semibold">Prijsvoorspellingen</div>

          <div className="mt-1 text-sm text-white/50">
            Binnenkort beschikbaar.
          </div>
        </div>
      )}

      {currentPlan() !== "premium" && (
        <Link
          to="/premium"
          className="block rounded-2xl fa-gradient p-4 fa-glow"
        >
          <div className="flex items-center gap-3 text-black">
            <Crown className="w-6 h-6" />

            <div className="flex-1">
              <div className="font-bold text-sm">
                Word Premium · €2,99/maand
              </div>

              <div className="text-xs opacity-80">
                Geen advertenties · realtime alerts · prijsvoorspellingen
              </div>
            </div>

            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-sm">Recente meldingen</h2>
        </div>
        {notifs.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-5 text-center text-sm text-white/40">
            Nog geen meldingen. Stel je alerts in.
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl bg-white/[0.04] border border-white/5 p-4"
              >
                <div className="font-semibold text-sm">{n.title}</div>
                <div className="text-xs text-white/50 mt-0.5">{n.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free version ad banner */}

      {hasAds() && (
        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
            Advertentie
          </div>

          <div className="text-sm text-white/50">
            Gratis versie · upgrade naar Premium om advertenties te verbergen
          </div>
        </div>
      )}
    </div>
  );
}
