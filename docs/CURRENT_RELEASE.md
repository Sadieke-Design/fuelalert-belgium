# FuelAlert Belgium - Release Information

# Release

**Versie:** 8.6.0
**Releasedatum:** 22 augustus 2026
**Status:** Development Release

---

# Projectstatus

FuelAlert Belgium is een modulair platform voor het verzamelen, verwerken en publiceren van Belgische brandstofprijzen.

De backend is opgebouwd rond een uitbreidbare scraperarchitectuur met een uniforme dataflow:

Scraper → Validator Engine → Persistence Engine → Repository → Database → REST API

De oorspronkelijke productieomgeving blijft voorlopig actief terwijl de nieuwe V2-architectuur parallel wordt ontwikkeld en getest.
De V2-architectuur is inmiddels operationeel voor de actieve databronnen en wordt via de centrale Scheduler automatisch uitgevoerd.

De huidige actieve productie-scrapers zijn:

- MAES Network
- DATS24
- SHELL

De volledige dataflow is:

Scraper → Validator Engine → Persistence Engine → Repository → Database → REST API

Daarnaast ondersteunt de V2-architectuur cross-source station linking en centrale prijsresolutie via `StationPriceResolver`.

---

# Belangrijkste onderdelen

## Backend

- ✅ Express REST API
- ✅ Modulaire Scraper Framework
- ✅ ScraperManager
- ✅ BaseScraper
- ✅ Capability Registry
- ✅ Validator Engine
- ✅ Price Validator
- ✅ GPS Validator
- ✅ Address Validator
- ✅ Duplicate Validator
- ✅ Persistence Engine
- ✅ Station Repository
- ✅ Metrics Registry
- ✅ Health Registry
- ✅ Report Engine
- ✅ Scheduler
- ✅ SchedulerRunRepository
- ✅ Scheduler Monitor
- ✅ StationSourceLinkRepository
- ✅ Station Source Linking
- ✅ StationPriceResolver
- ✅ Rate Limiter
- ✅ stations_v2 databasepipeline

## Frontend

- ✅ Dashboard
- ✅ Stationspagina
- ✅ Kaart
- ✅ Authenticatie

---

# Ondersteunde databronnen

| Bron               | Status               |
| ------------------ | -------------------- |
| MAES Network       | ✅ Actief            |
| DATS24             | ✅ Actief            |
| SHELL              | ✅ Actief            |
| Fuel Media Service | ⏳ Contact opgenomen |
| Gabriëls           | ⏳ Gepland           |
| Q8                 | ⏸ On Hold            |
| Esso               | ⏸ On Hold            |
| TotalEnergies      | ⏳ Gepland           |

---

# Belangrijkste wijzigingen in deze release

- Validator Framework volledig geïmplementeerd.
- Uniforme validatorinterface ingevoerd.
- Persistence Layer volledig gebouwd.
- Repository Pattern geïmplementeerd.
- Metrics Registry toegevoegd.
- Health Registry toegevoegd.
- Report Engine uitgebreid.
- Rate Limiter geïntegreerd.
- Nieuwe database `stations_v2` toegevoegd.
- MAES Network volledig geïntegreerd in de nieuwe architectuur.
- Eerste succesvolle end-to-end V2-import uitgevoerd.
- SchedulerRunRepository toegevoegd.
- Scheduler Monitor API (`/api/scheduler-monitor`) toegevoegd.
- Realtime Scheduler Monitor frontend gebouwd.
- Automatische logging van iedere scraper-run naar `scheduler_runs`.
- Historiek van scheduler-runs beschikbaar.
- Live statistieken (Runs, Success, Failed, Gemiddelde duur).
- Laatste uitgevoerde scraper-run zichtbaar.
- Automatische refresh van de monitor iedere 30 seconden.
- DATS24 volledig geïntegreerd in de centrale scraperarchitectuur.
- SHELL volledig geïntegreerd in de centrale scraperarchitectuur.
- SHELL toegevoegd aan de actieve scraper registry.
- SHELL toegevoegd aan de automatische Scheduler.
- Officiële SHELL prijsfeed geïntegreerd.
- `station_source_links` toegevoegd voor cross-source station matching.
- `StationSourceLinkRepository` toegevoegd.
- MAES Network ↔ SHELL station matching geïmplementeerd.
- Geografische afstand en confidence score opgeslagen voor station-links.
- Uniciteitscontrole uitgevoerd op actieve station-links.
- `StationPriceResolver` toegevoegd voor centrale prijsresolutie.
- Gekoppelde MAES live prijzen kunnen voor officiële SHELL-stations worden gebruikt.
- Officiële SHELL-prijzen blijven beschikbaar als fallback.
- Prijsresolutie gebeurt per brandstoftype.
- Scheduler Monitor ondersteunt filtering per scraper.
- Scheduler Monitor ondersteunt scraper-specifieke pagination.
- Smoke tests schrijven geen records naar `scheduler_runs`.

---

# Resultaten

## Actieve scraper-bronnen

- ✅ MAES Network: 275 stations
- ✅ DATS24: 147 stations
- ✅ SHELL: 200 stations

## Scheduler

De drie actieve scrapers worden automatisch uitgevoerd via de centrale Scheduler.

Iedere succesvolle run wordt geregistreerd in `scheduler_runs`.

Voor de huidige actieve scrapers zijn succesvolle scheduler-runs getest voor:

- MAES Network
- DATS24
- SHELL

## SHELL station linking

- ✅ 200 officiële SHELL-stations beschikbaar
- ✅ 78 MAES Network SHELL-stations onderzocht
- ✅ 35 betrouwbare geografische matches opgeslagen
- ✅ 43 MAES SHELL-locaties zonder officiële SHELL-match behouden als zelfstandige stations
- ✅ Geen officiële SHELL-stations met meerdere actieve MAES-koppelingen gevonden

## Price Resolution

- ✅ Gekoppelde SHELL-stations kunnen MAES live prijzen gebruiken
- ✅ Officiële SHELL-prijzen blijven beschikbaar als fallback
- ✅ Per brandstoftype wordt de beschikbare prijsbron bepaald
- ✅ Niet-gekoppelde stations blijven hun oorspronkelijke prijsbron gebruiken

---

# Openstaande prioriteiten

1. Extra Belgische brandstofdatabronnen onderzoeken en integreren
2. Gabriëls scraper
3. Fuel Media Service API (indien beschikbaar)
4. Q8 scraper/API opnieuw onderzoeken
5. Esso scraper/API onderzoeken
6. TotalEnergies scraper/API onderzoeken
7. Overige relevante Belgische brandstofnetwerken onderzoeken
8. Stationsmodule volledig valideren
9. Station zoeken en filteren volledig valideren
10. Price History
11. Frontend volledig migreren naar `stations_v2`
12. Oude cronjobs uitfaseren na volledige V2-migratie
13. `stations_old` uitfaseren na volledige migratie

---

# Documentatie

De volledige projectdocumentatie staat in de map `docs/`.

Belangrijkste documenten:

- PROJECT_VISION.md
- System Architecture.md
- database.md
- scrapers.md
- roadmap.md
- changelog.md
- decision_log.md
- api.md

Daarnaast is het **FuelAlert Master Development Book** de officiële _Single Source of Truth_ van het project.

---

# Git

Repository bevat uitsluitend broncode.

Uitgesloten van versiebeheer:

- node_modules/
- dist/
- build/
- logs/
- backend/data/\*.osm.pbf

---

# Opmerking

Deze release vormt een belangrijke uitbreiding van de V2-backendarchitectuur.

De V2 scraperarchitectuur is inmiddels operationeel met MAES Network, DATS24 en SHELL als actieve databronnen.

De centrale Scheduler voert de actieve scrapers automatisch uit en registreert iedere run in `scheduler_runs`.

Daarnaast ondersteunt de architectuur cross-source station linking via `station_source_links` en centrale prijsresolutie via `StationPriceResolver`.

De stationsmodule wordt verder gevalideerd en uitgebreid voordat de overige applicatiemodules volledig worden afgewerkt.
