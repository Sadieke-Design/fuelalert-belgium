/*
|--------------------------------------------------------------------------
| FuelAlert abonnementen
|--------------------------------------------------------------------------
|
| guest    = niet ingelogd
| free     = gratis account
| premium  = betalend account
|
| Voorlopig staat PLAN op "premium" zodat we alles kunnen testen.
| Later wordt dit automatisch uit de database gelezen.
|
*/

export const PLANS = {
  GUEST: "guest",
  FREE: "free",
  PREMIUM: "premium",
};

// ------------------------------------------------------------
// TIJDELIJK
// ------------------------------------------------------------

export const CURRENT_PLAN = PLANS.PREMIUM;

// ------------------------------------------------------------

export const FEATURES = {
  guest: {
    ads: true,
    dashboard: true,
    historyDays: 7,
    favorites: false,
    stations: true,
    map: false,
    alerts: false,
    predictions: false,
  },

  free: {
    ads: true,
    dashboard: true,
    historyDays: 30,
    favorites: true,
    stations: true,
    map: true,
    alerts: true,
    predictions: false,
  },

  premium: {
    ads: false,
    dashboard: true,
    historyDays: 365,
    favorites: true,
    stations: true,
    map: true,
    alerts: true,
    predictions: true,
  },
};
