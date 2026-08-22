# Changelog

---

## 2026-07-25

### MAES Network Scraper

- Nieuwe batchverwerking toegevoegd.
- Parallelle verwerking vervangen door batches van 20 requests.
- Volledige scraper succesvol getest.
- 1740 URLs ontdekt via sitemap.
- 275 stations succesvol verwerkt.
- 0 fouten tijdens volledige run.

### Fase 8.2.1 — MAES Network afgerond

- Batch processing toegevoegd.
- JSON-LD adresdetectie toegevoegd.
- Uniforme scraper-output.
- 275 stations succesvol verwerkt.
- Slechts 1 uitzonderingspagina zonder bruikbaar JSON-LD.
- Productie gereed verklaard.

---

## 2026-07-26

### Official Fuel Data Sources

- Onderzoek naar officiële Belgische brandstofprijsdatabronnen afgerond.
- Fuel Media Service onderzocht.
- CARBU API onderzocht.
- Fuel Media Service gecontacteerd voor commerciële API-toegang.
- Bevestigd dat FuelAlert een hybride multi-source architectuur volgt.

---

# v8.4.0

## Nieuw

- Capability Registry toegevoegd.
- Nieuw endpoint `/api/capabilities`.
- Scrapers registreren automatisch hun mogelijkheden.
- Eerste implementatie voor MAES Network.
- Eerste bouwsteen van de DataSource Engine gerealiseerd.

---

# v8.4.1

## Nieuw

- Capability Registry geïmplementeerd.
- Nieuw endpoint `/api/capabilities`.
- Health Registry toegevoegd.
- Nieuw endpoint `/api/health`.
- Scheduler Engine toegevoegd.
- Nieuw endpoint `/api/scheduler`.
- MAES scraper draait automatisch via de Scheduler.
- Eerste automatische Health-monitoring geïmplementeerd.
- Fundament van de DataSource Engine gerealiseerd.

---

# v8.5.0

## Core Backend

- Validator Engine volledig geïmplementeerd.
- Uniform validator-framework toegevoegd.
- Price Validator toegevoegd.
- GPS Validator toegevoegd.
- Address Validator toegevoegd.
- Duplicate Validator toegevoegd.

## Persistence Layer

- Persistence Engine toegevoegd.
- Repository Pattern geïmplementeerd.
- Station Repository toegevoegd.
- Nieuwe `stations_v2` databasepipeline gebouwd.
- Insert- en update-mechanisme geïmplementeerd.
- Eerste succesvolle end-to-end persistence uitgevoerd.

## Monitoring

- Metrics Registry geïntegreerd.
- Health Registry geïntegreerd.
- Report Engine uitgebreid.
- Rate Limiter geïntegreerd.

## MAES Network

- MAES Network volledig geïntegreerd in de nieuwe V2-architectuur.
- Uniforme scraper-output geïmplementeerd.
- Volledige validatie vóór opslag.
- Automatische opslag via Persistence Engine.

## Resultaat

- Eerste volledige end-to-end V2-pipeline succesvol afgerond.
- 275 stations succesvol gescrapet.
- 275 records succesvol gevalideerd.
- 275 records succesvol opgeslagen in `stations_v2`.
- 0 databasefouten.
- 0 validatiefouten.
- Nieuwe backend-architectuur operationeel.

---

# v8.5.x — Scheduler Monitor

## Nieuw

- Scheduler Monitor toegevoegd.
- `SchedulerRunRepository` toegevoegd.
- `scheduler_runs` database toegevoegd.
- Live monitoring toegevoegd.
- Schedulerhistoriek toegevoegd.
- Automatische refresh toegevoegd.
- Schedulerstatistieken toegevoegd.
- API endpoint `/api/scheduler-monitor` toegevoegd.

## Monitoring

De Scheduler Monitor registreert iedere normale scraper-run afzonderlijk.

Per run worden onder andere bijgehouden:

- scraper
- status
- stations
- inserted
- updated
- skipped
- duplicates
- errors
- duration
- starttijd
- eindtijd

De monitor ondersteunt pagination en historie per scraper.

---

# v8.6.0 — Multi-Source Production Architecture

**Releasedatum:** 22 augustus 2026

## Scrapers

### MAES Network

- MAES Network volledig actief binnen de V2-architectuur.
- 275 stations verwerkt.
- Automatische updates via de Scheduler.
- Schedulerhistoriek actief.
- Monitoring actief.

### DATS24

- DATS24 scraper volledig geïntegreerd in de productiearchitectuur.
- 147 stations verwerkt.
- Stationgegevens en prijzen worden automatisch verzameld.
- GPS- en adresgegevens worden verwerkt.
- Automatische updates via de Scheduler.
- Schedulerhistoriek actief.
- Monitoring actief.

### SHELL

- Nieuwe officiële Shell scraper toegevoegd.
- Shell stationdata geïntegreerd.
- Officiële Shell prijsdata via Shell XLSX-bron geïntegreerd.
- 200 stations verwerkt.
- Uniforme scraper-output.
- Persistence via `PersistenceEngine`.
- Automatische updates via de Scheduler.
- Schedulerhistoriek actief.
- Monitoring actief.
- 0 errors tijdens volledige productie-run.

## Scheduler

- `MAES_NETWORK`, `DATS24` en `SHELL` toegevoegd aan de actieve scraper registry.
- Alle actieve scrapers worden door dezelfde `ScraperManager` uitgevoerd.
- Schedulerinterval: 15 minuten.
- Eerste uitvoering gebeurt bij backend-startup.
- Iedere normale scraper-run wordt geregistreerd in `scheduler_runs`.

## Scheduler Monitor

- Scheduler Monitor uitgebreid met scraperfiltering.
- Historie kan per scraper worden opgevraagd.
- Pagination toegevoegd.
- Totalen worden aangepast op basis van het geselecteerde scraperfilter.
- Ondersteuning toegevoegd voor `SHELL`.
- Live monitoring van runs, stations, updates en fouten.
- Automatische refresh blijft actief.

## Smoke Tests

- Smoke tests worden niet langer geregistreerd als scheduler-run.
- `smokeTest = true` voorkomt registratie in `scheduler_runs`.
- Hierdoor blijft de schedulerhistoriek beperkt tot echte scraperuitvoeringen.

## Cross-Source Station Matching

- `station_source_links` toegevoegd voor relaties tussen dezelfde fysieke
  stations uit verschillende databronnen.
- Cross-source stationkoppelingen kunnen afstand en confidence bevatten.
- Shell-stations kunnen worden gekoppeld aan overeenkomstige MAES-stations.

## StationPriceResolver

- `StationPriceResolver` toegevoegd.
- Centrale prijsresolutie voor stations met meerdere databronnen.
- Ondersteuning voor bronprioriteit en fallback.
- Ondersteuning voor gekoppelde live prijsbronnen.
- Officiële bronprijzen kunnen als fallback worden gebruikt wanneer een
  gekoppelde bron geen prijs levert.

## Monitoring en Persistence

- `SchedulerRunRepository` gebruikt voor registratie van scraper-runs.
- `StationSourceLinkRepository` gebruikt voor cross-source relaties.
- `PersistenceEngine` verwerkt alle actieve scraper-output.
- `StationRepository` verzorgt de database persistence.
- `HealthRegistry` en `MetricsRegistry` blijven centraal werken voor alle
  actieve bronnen.

## Resultaat

De V2-backendarchitectuur ondersteunt nu meerdere actieve productiebronnen
via dezelfde centrale infrastructuur:

```text
MAES_NETWORK
DATS24
SHELL
    ↓
ScraperManager
    ↓
Validator Engine
    ↓
PersistenceEngine
    ↓
StationRepository
    ↓
stations_v2
```

Monitoring:

```text
Scheduler
    ↓
ScraperManager
    ↓
scheduler_runs
    ↓
Scheduler Monitor
```

Cross-source prijsresolutie:

```text
Station
    ↓
station_source_links
    ↓
StationPriceResolver
    ↓
Beste beschikbare prijsbron
```

---

# Huidige productiebronnen

| Bron | Stations | Status |
|---|---:|---|
| MAES Network | 275 | ✅ Production Ready |
| DATS24 | 147 | ✅ Production Ready |
| SHELL | 200 | ✅ Production Ready |

---

# Volgende ontwikkelfase

De volgende grote ontwikkelfase blijft gericht op het volledig afronden van
de stationsarchitectuur en de frontendmigratie naar `stations_v2`.

Geplande onderdelen:

- Frontend migreren naar `stations_v2`.
- Stationsmodule volledig afronden.
- Verdere cross-source station matching.
- Price History.
- Verdere databronnen zoals Gabriëls, TotalEnergies en Q8.
- Evaluatie en eventuele integratie van Fuel Media Service.
- Verdere uitfasering van de oude productiearchitectuur.
