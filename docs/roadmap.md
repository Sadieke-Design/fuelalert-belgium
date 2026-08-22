# FuelAlert Belgium - Roadmap

**Versie:** 8.6.0  
**Laatste update:** 22 augustus 2026  
**Status:** Active Development

---

# Phase 8 — DataSource Platform

De oorspronkelijke Phase 8 had als doel de backend om te bouwen naar een
modulaire, uitbreidbare scraperarchitectuur.

Deze fase is inmiddels grotendeels afgerond.

## Backend Platform

- ✅ Modular scraper architecture
- ✅ BaseScraper
- ✅ BrowserScraper
- ✅ ScraperManager
- ✅ Scraper Registry
- ✅ Validation Engine
- ✅ Price Validator
- ✅ GPS Validator
- ✅ Address Validator
- ✅ Duplicate Validator
- ✅ Persistence Engine
- ✅ Station Repository
- ✅ stations_v2
- ✅ Scheduler
- ✅ Health Registry
- ✅ Metrics Registry
- ✅ Report Engine
- ✅ Rate Limiter
- ✅ Capability Registry
- ✅ Scheduler Run Repository
- ✅ Scheduler Monitor
- ✅ station_source_links
- ✅ StationSourceLinkRepository
- ✅ StationPriceResolver

---

# Phase 8.1 — Scraper Architecture

## Voltooid

- ✅ BaseScraper
- ✅ BrowserScraper
- ✅ ScraperManager
- ✅ Scraper Registry
- ✅ Uniforme scraper-output
- ✅ Centrale scraper execution
- ✅ Multi-source architectuur
- ✅ Foutafhandeling
- ✅ Health-integratie
- ✅ Persistence-integratie

---

# Phase 8.2 — Stationsmodule

## Voltooid

- ✅ stations_v2 database
- ✅ StationRepository
- ✅ PersistenceEngine
- ✅ Station bootstrap
- ✅ Station import
- ✅ Station updates
- ✅ GPS-validatie
- ✅ Adresvalidatie
- ✅ Duplicate validatie
- ✅ MAES Network productie-integratie
- ✅ DATS24 productie-integratie
- ✅ SHELL productie-integratie

## Huidige productiegegevens

| Bron | Stations | Status |
|---|---:|---|
| MAES Network | 275 | ✅ Production |
| DATS24 | 147 | ✅ Production |
| SHELL | 200 | ✅ Production |

**Totaal gecontroleerde stations:** 622

---

# Phase 8.3 — Scrapers

## Voltooid

### MAES Network

- ✅ Sitemap discovery
- ✅ HTML parsing
- ✅ JSON-LD / embedded data
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 275 stations

### DATS24

- ✅ HTML station scraping
- ✅ Embedded station data
- ✅ GPS
- ✅ Adresgegevens
- ✅ Brandstofprijzen
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 147 stations

### SHELL

- ✅ Officiële Shell stationdata
- ✅ Officiële Shell XLSX-prijsdata
- ✅ XLSX verwerking
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 200 stations

---

# Phase 8.4 — DataSource Engine

## Voltooid

- ✅ Capability Registry
- ✅ Scheduler
- ✅ Health Engine
- ✅ Metrics Engine
- ✅ Validator Engine
- ✅ Persistence Engine
- ✅ Rate Limiter
- ✅ Report Engine
- ✅ ScraperManager
- ✅ SchedulerRunRepository
- ✅ Scheduler Monitor

## Scheduler

De Scheduler draait momenteel iedere:

**15 minuten**

Actieve scrapers:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

Iedere normale run wordt geregistreerd in:

`scheduler_runs`

Smoke tests worden niet geregistreerd in de schedulerhistoriek.

---

# Phase 8.5 — Cross-Source Station Matching

## Voltooid

- ✅ `station_source_links`
- ✅ `StationSourceLinkRepository`
- ✅ Cross-source station matching
- ✅ Shell ↔ MAES matching
- ✅ Distance calculation
- ✅ Confidence score
- ✅ Link uniciteitscontrole
- ✅ 35 actieve Shell/MAES links

## Resultaat

Van de 200 officiële Shell-stations zijn momenteel 35 betrouwbare
koppelingen met MAES-stations actief.

De matching wordt gebruikt door de prijsresolutie.

---

# Phase 8.6 — Price Resolution

## Voltooid

- ✅ `StationPriceResolver`
- ✅ Linked-live prijsbron
- ✅ Official prijsbron
- ✅ Original prijsbron
- ✅ Per-brandstof fallback
- ✅ Brontransparantie
- ✅ Shell → MAES live prijsresolutie

## Prijsprioriteit

Voor een gekoppeld Shell-station:

`linked_live`

Voor een Shell-station zonder MAES-link:

`official`

Voor een oorspronkelijk station zonder externe koppeling:

`original`

De resolver kan per brandstof terugvallen op de oorspronkelijke
prijsbron wanneer de gekoppelde bron geen waarde levert.

---

# Phase 8.7 — Scheduler Monitoring

## Voltooid

- ✅ scheduler_runs
- ✅ SchedulerRunRepository
- ✅ Scheduler Monitor API
- ✅ Scheduler Monitor frontend
- ✅ Automatische refresh
- ✅ Runs vandaag
- ✅ Success statistics
- ✅ Failed statistics
- ✅ Average duration
- ✅ Laatste run
- ✅ Station count
- ✅ Updated count
- ✅ Error count
- ✅ Pagination
- ✅ Filter per scraper
- ✅ MAES history
- ✅ DATS24 history
- ✅ SHELL history

---

# Phase 8.8 — Smoke Testing

## Voltooid

- ✅ Smoke test mode
- ✅ Volledige scraper smoke test
- ✅ Controle van alle actieve scrapers
- ✅ Controle van PersistenceEngine
- ✅ Controle van scraper output
- ✅ Controle dat smoke tests geen `scheduler_runs` creëren

Smoke tests kunnen worden uitgevoerd zonder de schedulerhistoriek
te vervuilen.

---

# Phase 8.9 — Production Validation

## Voltooid

Laatste volledige gecontroleerde productie-run:

### MAES Network

- 275 stations
- 275 updates
- 0 errors

### DATS24

- 147 stations
- 147 updates
- 0 errors

### SHELL

- 200 stations
- 200 updates
- 0 errors

### Totaal

- 622 stationrecords
- 0 scraper-errors

---

# Phase 9 — Stations Frontend

## Prioriteit: Hoog

De backend stationsarchitectuur is nu stabiel genoeg om de frontend
verder naar `stations_v2` te migreren.

## Te ontwikkelen

- ⏳ Frontend volledig migreren naar `stations_v2`
- ⏳ Station Detail
- ⏳ Verbeterde stationslijst
- ⏳ Filters
- ⏳ Brandfilters
- ⏳ Brandstoffilters
- ⏳ Afstandfilters
- ⏳ Prijsfilters
- ⏳ Kaart optimalisatie
- ⏳ Station status
- ⏳ Live prijsweergave

---

# Phase 10 — Price History

## Te ontwikkelen

- ⏳ Historische brandstofprijzen
- ⏳ Prijswijzigingen opslaan
- ⏳ Historiek per station
- ⏳ Historiek per merk
- ⏳ Historiek per brandstof
- ⏳ Grafieken
- ⏳ Minimumprijs
- ⏳ Maximumprijs
- ⏳ Gemiddelde prijs
- ⏳ Prijsontwikkeling
- ⏳ API voor historische prijzen

---

# Phase 11 — Nieuwe Databronnen

## Prioriteit

### 1. Gabriëls

- ⏳ Brononderzoek
- ⏳ Scraper
- ⏳ Validatie
- ⏳ Persistence
- ⏳ Scheduler
- ⏳ Monitoring
- ⏳ Productie

### 2. Fuel Media Service

- ⏳ Reactie/contact opvolgen
- ⏳ API evalueren
- ⏳ Datakwaliteit testen
- ⏳ Integratiemodel bepalen

### 3. TotalEnergies

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 4. Texaco

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 5. Lukoil

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 6. Gulf

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 7. Avia

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

---

# Phase 12 — Cache & Performance

## Te ontwikkelen

- ⏳ Cache Engine
- ⏳ API response caching
- ⏳ Station caching
- ⏳ Price caching
- ⏳ Database query optimization
- ⏳ Frontend caching
- ⏳ Rate-limit optimalisatie

---

# Phase 13 — DataSource Manager

## Status

⏳ Planned

De DataSource Manager wordt de intelligente laag boven de verschillende
databronnen.

Doel:

Automatisch bepalen welke bron voor een bepaald gegeven de beste
beschikbare informatie levert.

Prioriteit:

1. Officiële API
2. Commerciële databron
3. Officiële website
4. Geverifieerde stationhouder
5. Communitydata

De bestaande `StationPriceResolver` vormt een eerste stap in deze
richting.

---

# Phase 14 — Frontend Functionaliteit

## Te ontwikkelen

- ⏳ Favorieten
- ⏳ Prijsalerts
- ⏳ Historiek
- ⏳ Premium
- ⏳ Persoonlijke instellingen
- ⏳ Pushnotificaties
- ⏳ Routeplanning
- ⏳ Geavanceerde filters

---

# Phase 15 — Admin Platform

## Te ontwikkelen

- ⏳ Admin dashboard
- ⏳ Gebruikersbeheer
- ⏳ Scraperbeheer
- ⏳ Schedulerbeheer
- ⏳ Databronbeheer
- ⏳ Health monitoring
- ⏳ Metrics
- ⏳ Logs
- ⏳ Handmatige scraper-run
- ⏳ Stationcorrecties
- ⏳ Linkbeheer
- ⏳ Price override

---

# Phase 16 — Premium Platform

## Te ontwikkelen

- ⏳ Premium abonnementen
- ⏳ Prijsalerts
- ⏳ Geavanceerde historiek
- ⏳ Favorieten
- ⏳ Persoonlijke prijsanalyse
- ⏳ Routeoptimalisatie
- ⏳ Fleet functionaliteit
- ⏳ Bedrijfsaccounts

---

# Phase 17 — Publieke API

## Te ontwikkelen

- ⏳ Developer API
- ⏳ API authentication
- ⏳ API keys
- ⏳ Rate limiting
- ⏳ Usage statistics
- ⏳ API documentation
- ⏳ Premium API plans

---

# Phase 18 — Verified Station Portal

## Te ontwikkelen

Tankstationhouders kunnen in de toekomst:

- ⏳ Station claimen
- ⏳ Stationsgegevens beheren
- ⏳ Prijzen controleren
- ⏳ Services beheren
- ⏳ Openingstijden beheren
- ⏳ Foto's toevoegen
- ⏳ Promoties publiceren
- ⏳ Tijdelijke meldingen plaatsen

---

# Phase 19 — Advanced Platform

## Lange termijn

- ⏳ Analytics Engine
- ⏳ Prediction Engine
- ⏳ AI-assisted validation
- ⏳ Prijsvoorspelling
- ⏳ Automatische anomaliedetectie
- ⏳ Fleet Platform
- ⏳ EV charging data
- ⏳ HVO100
- ⏳ AdBlue
- ⏳ Carwash
- ⏳ Shopinformatie
- ⏳ Restaurantinformatie

---

# Huidige Prioriteiten

De huidige prioriteiten zijn:

1. **Stationsmodule volledig afronden**
2. **Frontend migreren naar `stations_v2`**
3. **Station Detail**
4. **Price History**
5. **Kaart en filters**
6. **Gabriëls scraper**
7. **Fuel Media Service**
8. **Extra databronnen**
9. **Cache Engine**
10. **DataSource Manager**

---

# Roadmap Principe

FuelAlert wordt gefaseerd ontwikkeld.

De volgorde blijft:

```text
Platform
    ↓
Databronnen
    ↓
Validatie
    ↓
Persistence
    ↓
Monitoring
    ↓
Stations
    ↓
Historiek
    ↓
Frontend
    ↓
Premium
    ↓
API
    ↓
Advanced Platform
Een nieuwe scraper wordt pas als Production Ready beschouwd wanneer:

de bron betrouwbaar werkt
de data gevalideerd is
de persistence werkt
de Scheduler werkt
monitoring werkt
de resultaten gecontroleerd zijn
de documentatie is bijgewerkt
Current Status — v8.6.0
Productie
✅ MAES Network — 275
✅ DATS24 — 147
✅ SHELL — 200
✅ ScraperManager
✅ Scheduler
✅ PersistenceEngine
✅ Validation Engine
✅ Health Registry
✅ Metrics Registry
✅ Rate Limiter
✅ Scheduler Monitor
✅ scheduler_runs
✅ station_source_links
✅ StationPriceResolver
Volgende grote mijlpaal

Stationsmodule volledig afronden en frontend migreren naar
stations_v2.
