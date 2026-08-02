# FuelAlert Belgium - Release Information

# Release

**Versie:** 8.5.0  
**Releasedatum:** 2 augustus 2026  
**Status:** Development Release (V2 Backend)

---

# Projectstatus

FuelAlert Belgium is een modulair platform voor het verzamelen, verwerken en publiceren van Belgische brandstofprijzen.

De backend is opgebouwd rond een uitbreidbare scraperarchitectuur met een uniforme dataflow:

Scraper → Validator Engine → Persistence Engine → Repository → Database → REST API

De oorspronkelijke productieomgeving blijft voorlopig actief terwijl de nieuwe V2-architectuur parallel wordt ontwikkeld en getest.

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
- ✅ Rate Limiter
- ✅ stations_v2 databasepipeline

## Frontend

- ✅ Dashboard
- ✅ Stationspagina
- ✅ Kaart
- ✅ Authenticatie

---

# Ondersteunde databronnen

| Bron | Status |
|------|--------|
| MAES Network | ✅ Productie |
| Fuel Media Service | ⏳ Contact opgenomen |
| Gabriëls | ⏳ Gepland |
| Q8 | ⏸ On Hold |
| Esso | ⏸ On Hold |

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

---

# Resultaten

- ✅ 1740 URLs ontdekt via sitemap.
- ✅ 275 stations succesvol gescrapet.
- ✅ 275 records succesvol gevalideerd.
- ✅ 275 records succesvol opgeslagen.
- ✅ 0 validatiefouten.
- ✅ 0 databasefouten.

---

# Openstaande prioriteiten

1. Gabriëls scraper
2. Fuel Media Service API (indien beschikbaar)
3. Extra brand-scrapers (Shell, Esso, Q8, TotalEnergies, ...)
4. Price History
5. Frontend migreren naar `stations_v2`
6. Oude cronjobs vervangen door Scheduler V2
7. `stations_old` uitfaseren na volledige migratie

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

Daarnaast is het **FuelAlert Master Development Book** de officiële *Single Source of Truth* van het project.

---

# Git

Repository bevat uitsluitend broncode.

Uitgesloten van versiebeheer:

- node_modules/
- dist/
- build/
- logs/
- backend/data/*.osm.pbf

---

# Opmerking

Deze release vormt de eerste volledig werkende V2-backendarchitectuur.

De productieomgeving blijft voorlopig gebruikmaken van de bestaande database en cronjobs, terwijl de nieuwe `stations_v2`-architectuur parallel verder wordt uitgebreid en getest.