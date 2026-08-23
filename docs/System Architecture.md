# FuelAlert Belgium — Architecture

**Versie:** 1.1  
**Datum:** 23 augustus 2026  
**Status:** Actieve ontwikkelarchitectuur

---

# 1. Doel

FuelAlert Belgium is opgebouwd als een modulaire backend- en frontendarchitectuur
waarbij officiële databronnen waar mogelijk worden gebruikt voor
tankstationinformatie en brandstofprijzen.

De architectuur is ontworpen rond:

1. Modularity
2. Multi-source data collection
3. Official APIs preferred over scraping
4. Fail-safe processing
5. Documentation-first development

---

# 2. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │   Official Sources   │
                    │                      │
                    │ MAES / DATS24 / Q8  │
                    │ SHELL / TEXACO / ... │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Scrapers       │
                    │                      │
                    │ BaseScraper          │
                    │ Source-specific      │
                    │ implementations     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  ValidatorEngine     │
                    │                      │
                    │ Normalization        │
                    │ Validation           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  PersistenceEngine   │
                    │                      │
                    │ Insert / Update      │
                    │ Deduplication        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      stations_v2     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Cross-source layer   │
                    │                      │
                    │ station_source_links │
                    │ StationPriceResolver │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │         API          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Frontend        │
                    └──────────────────────┘
```

---

# 3. Backend Components

De backend bestaat uit afzonderlijke verantwoordelijkheden.

```text
backend/
├── config/
├── health/
├── metrics/
├── persistence/
├── ratelimiter/
├── repositories/
├── reporting/
├── routes/
├── scheduler/
├── scrapers/
├── utils/
└── validator/
```

De architectuur vermijdt zoveel mogelijk dat één component meerdere
onafhankelijke verantwoordelijkheden krijgt.

---

# 4. Scraper Layer

De scraperlaag is verantwoordelijk voor het ophalen en normaliseren van
gegevens uit externe bronnen.

Iedere bron heeft zijn eigen scraper.

Actieve scrapers:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

Toekomstige scrapers worden toegevoegd zonder de centrale
`ScraperManager` fundamenteel te wijzigen.

---

# 5. Scraper Registry

Alle actieve scrapers worden geregistreerd in:

```text
backend/scrapers/registry.js
```

De registry initialiseert de scraperinstances:

```text
MaesScraper
Dats24Scraper
ShellScraper
TexacoScraper
Q8Scraper
```

De registry vormt daarmee de centrale lijst van bronnen die door
`ScraperManager` worden uitgevoerd.

---

# 6. BaseScraper

De centrale basisklasse bevindt zich in:

```text
backend/scrapers/BaseScraper.js
```

De BaseScraper verzorgt gemeenschappelijke functionaliteit.

Belangrijkste verantwoordelijkheden:

- bronidentificatie
- rate limiting
- uitvoeren van `collectRecords()`
- validatie
- HealthRegistry-updates
- MetricsRegistry-updates
- foutafhandeling
- logging
- uniforme scraperoutput

De source-specifieke scraper hoeft daardoor alleen de
bron-specifieke verzamelingslogica te implementeren.

---

# 7. Uniform Record Model

Iedere scraper moet uiteindelijk records opleveren in dezelfde structuur.

Minimale velden:

```text
station_id
brand
name
address
city
postal_code
prices
currency
updated_at
source
```

Aanvullende stationinformatie kan bevatten:

```text
latitude
longitude
```

Een voorbeeld van een genormaliseerd record:

```json
{
  "station_id": "00BE109523",
  "brand": "Q8",
  "name": "Q8 easy Anderlecht",
  "address": "Drevé Olympique 15",
  "city": "Anderlecht",
  "postal_code": "1070",
  "latitude": 50.8193744,
  "longitude": 4.2806991,
  "prices": {
    "diesel": 1.973,
    "e95": 1.592,
    "e98": 2.094,
    "lpg": null,
    "cng": null,
    "adblue": null
  },
  "currency": "EUR",
  "updated_at": "2026-08-23T15:45:26.346Z",
  "source": "q8_official_scraper"
}
```

---

# 8. ValidatorEngine

Na het verzamelen van de records worden de records gecontroleerd door:

```text
ValidatorEngine
```

De validatiecontroleert of de scraperoutput voldoet aan het verwachte
uniforme model.

De BaseScraper voert daarnaast een verplichte controle uit op de minimale
velden.

Bij ontbrekende verplichte velden wordt een fout gegenereerd.

---

# 9. PersistenceEngine

De PersistenceEngine bevindt zich in de persistence-laag.

De verantwoordelijkheid is:

```text
normalized records
        ↓
database persistence
```

De engine rapporteert:

```text
inserted
updated
skipped
duplicates
errors
duration
```

Hierdoor kan de scraperlaag onafhankelijk blijven van de exacte SQL-
implementatie.

---

# 10. Database Architecture

De centrale stationspipeline gebruikt:

```text
stations_v2
```

De architectuur ondersteunt daarnaast cross-source koppelingen via:

```text
station_source_links
```

Schedulerhistoriek wordt opgeslagen in:

```text
scheduler_runs
```

---

# 11. Cross-Source Matching

Een tankstation kan door meerdere bronnen worden aangeleverd.

Daarom mag de bronidentifier niet automatisch worden beschouwd als de
uiteindelijke globale stationidentifier.

De cross-source architectuur gebruikt:

```text
station_source_links
```

om relaties tussen bronnen te bewaren.

Het systeem kan daardoor bijvoorbeeld onderscheid maken tussen:

```text
Q8 station ID
MAES station ID
OSM station ID
```

die betrekking kunnen hebben op hetzelfde fysieke tankstation.

---

# 12. StationPriceResolver

Voor live prijsresolutie wordt een centrale resolver gebruikt:

```text
StationPriceResolver
```

De resolver kan gekoppelde broninformatie gebruiken om de meest geschikte
prijsbron te bepalen.

De architectuur ondersteunt:

```text
Live official source
        ↓
Station source link
        ↓
Price resolver
        ↓
Resolved price
```

Wanneer een directe live bron niet beschikbaar is, kan de architectuur
terugvallen op beschikbare officiële bronprijzen.

---

# 13. Scheduler

De scheduler bevindt zich in:

```text
backend/scheduler/Scheduler.js
```

Een job wordt geregistreerd met:

```text
name
interval
job
```

De scheduler:

- registreert jobs
- start jobs
- voert de eerste run uit bij startup
- voert daarna periodieke runs uit
- houdt de laatste run bij
- kan jobs stoppen
- exposeert jobinformatie via de scheduler API

De huidige productiejob is:

```text
Fuel Scrapers
```

met een interval van:

```text
15 minuten
```

---

# 14. Scheduler Execution Flow

```text
Server startup
      ↓
Scheduler.start()
      ↓
Fuel Scrapers
      ↓
ScraperManager.run()
      ↓
Promise.allSettled()
      ↓
MAES
DATS24
SHELL
TEXACO
Q8
      ↓
BaseScraper
      ↓
Validation
      ↓
Persistence
      ↓
SchedulerRunRepository
```

---

# 15. ScraperManager

De centrale manager bevindt zich in:

```text
backend/scrapers/ScraperManager.js
```

De manager:

- haalt de actieve scrapers uit de registry
- voert alle scrapers uit
- gebruikt `Promise.allSettled()`
- behandelt successen en fouten afzonderlijk
- voert persistence uit
- registreert healthinformatie
- registreert schedulerhistoriek
- genereert een centraal scraperreport

Het gebruik van `Promise.allSettled()` voorkomt dat één scraperfout de
volledige scraper-run automatisch afbreekt.

---

# 16. Fail-Safe Behaviour

Een individuele scraperfout mag de andere scrapers niet blokkeren.

Daarom:

```text
MAES     → SUCCESS
DATS24   → SUCCESS
SHELL    → SUCCESS
TEXACO   → FAILED
Q8       → SUCCESS
```

kan nog steeds een geldige totale scheduler-run opleveren.

De fout wordt afzonderlijk geregistreerd.

---

# 17. Scheduler Run Logging

Iedere normale scraperuitvoering wordt opgeslagen via:

```text
SchedulerRunRepository
```

Repository:

```text
backend/repositories/SchedulerRunRepository.js
```

De repository ondersteunt:

```text
getSummary()
getRuns()
getTotalRuns()
create()
```

De schedulerhistoriek bevat onder andere:

```text
scraper
status
stations
inserted
updated
skipped
duplicates
errors
duration_ms
started_at
finished_at
```

Smoke tests worden niet als productie scheduler-run geregistreerd.

---

# 18. Scheduler Monitor API

Route:

```text
/api/scheduler-monitor
```

De endpoint ondersteunt:

```text
?page=1
?scraper=Q8
```

De response bevat:

```text
filter
pagination
summary
runs
```

De backend kan daardoor zowel:

- een scraper-specifieke historiek
- als een algemene runhistoriek

aanleveren.

---

# 19. Health Registry

De HealthRegistry bewaart de actuele gezondheid van scraperbronnen.

Per bron wordt onder andere bijgehouden:

```text
status
stations
errors
successRate
duration
```

Bij een succesvolle run:

```text
ONLINE
```

Bij een scraperfout:

```text
OFFLINE
```

---

# 20. Metrics Registry

De MetricsRegistry registreert scraperresultaten.

Voorbeelden:

```text
success
stations
duration
```

De metricslaag staat los van de persistence-laag.

Dat maakt het mogelijk om operationele prestaties te meten zonder de
stationdatabase daarvoor te gebruiken.

---

# 21. Rate Limiter

De RateLimiter bevindt zich in:

```text
backend/ratelimiter/RateLimiter.js
```

Per bron kan configuratie worden geregistreerd:

```text
delay
retries
timeout
concurrent
```

Voorbeelden uit de huidige configuratie:

```text
MAES_NETWORK
delay: 1500
retries: 3
timeout: 30000
concurrent: 1

DATS24
delay: 500
retries: 3
timeout: 30000
concurrent: 1
```

De RateLimiter voorkomt dat externe bronnen onnodig agressief worden
benaderd.

---

# 22. Q8 Architecture

De Q8 scraper gebruikt:

```text
Q8 sitemap
      ↓
station URL discovery
      ↓
rendered station page
      ↓
Q8 station code
      ↓
Q8 official price API
      ↓
normalized record
```

De stationpagina wordt gebruikt om stationinformatie te verkrijgen.

De officiële prijsendpoint wordt gebruikt voor prijsinformatie wanneer die
beschikbaar is.

De Q8-prijs-API levert niet voor iedere ontdekte stationcode noodzakelijk
prijsinformatie op.

Daarom mogen:

```text
station gevonden
```

en:

```text
prijs gevonden
```

niet als dezelfde status worden beschouwd.

---

# 23. Q8 Current Status

Een volledige run heeft aangetoond dat Q8 momenteel:

```text
469 stations gevonden
213 stations met prijzen
256 stations zonder prijzen
39 stations zonder gevonden Q8-code
0 scraper errors
```

De scraper is daarmee functioneel voor station discovery en persistence.

De volgende technische verbetering voor Q8 is het verhogen van de
prijsdekking en het onderzoeken van de stations waarvoor geen prijs wordt
teruggegeven.

---

# 24. Concurrency

De Q8 scraper gebruikt worker-based parallel processing.

De huidige scraperlogica gebruikt:

```text
smokeTest:
5 workers

full run:
8 workers
```

De effectieve externe belasting wordt daarnaast beïnvloed door de
bron-specifieke requests en rate limiting.

De workerarchitectuur voorkomt dat alle stationpagina's strikt sequentieel
worden verwerkt.

---

# 25. Sitemap Handling

De algemene sitemaphelper bevindt zich in:

```text
backend/utils/sitemap.js
```

De helper ondersteunt:

```text
root sitemap
    ↓
child sitemap
    ↓
station URLs
```

De helper:

- haalt `<loc>` waarden uit XML
- detecteert child-sitemaps
- verwerkt recursief child-sitemaps
- voorkomt dubbele verwerking via `visited`
- filtert uiteindelijke URL's
- verwijdert duplicaten

---

# 26. API Layer

De backend gebruikt Express.

Belangrijke routes:

```text
/api/fuel-prices
/api/stations
/api/capabilities
/api/health
/api/auth/register
/api/auth/verify-email
/api/auth/login
/api/auth/forgot-password
/api/auth/reset-password
/api/scheduler
/api/metrics
/api/validation
/api/ratelimiter
/api/persistence
/api/scheduler-monitor
```

---

# 27. Frontend Architecture

De frontend communiceert met de backend via de API.

De Scheduler Monitor gebruikt:

```text
/api/scheduler-monitor
```

De frontend voert iedere:

```text
30 seconden
```

een refresh uit.

Voor de Scheduler Monitor worden twee requests gebruikt:

```text
filtered data
```

en:

```text
overview data
```

De gefilterde data wordt gebruikt voor de scraperhistoriek.

De overview-data wordt gebruikt om de laatste run per scraper te tonen.

---

# 28. Scheduler Monitor Frontend

De monitor toont:

```text
Laatste scraper-runs
```

en:

```text
Historiek
```

De historiek kan worden gefilterd op:

```text
SHELL
DATS24
MAES NETWORK
```

De huidige frontendfilterlijst moet nog worden uitgebreid zodat ook:

```text
Q8
TEXACO
```

zichtbaar en selecteerbaar zijn.

Dit is een frontendverbetering en geen scraperprobleem.

---

# 29. Logging

De backend gebruikt een centrale logger.

Bron-specifieke meldingen bevatten de scrapernaam:

```text
[Q8]
[MAES_NETWORK]
[DATS24]
[SHELL]
[TEXACO]
```

Voorbeelden:

```text
[Q8] 00BE109523 → Q8 easy Anderlecht
[Q8] Prijzen gevonden: 00BE109523
[Q8] Geen prijzen beschikbaar: 00BE109717
```

Hierdoor kan een scraper afzonderlijk worden geanalyseerd.

---

# 30. Error Handling

De scraperlaag gebruikt meerdere foutniveaus.

### Station-level

Een individuele stationpagina kan falen zonder de volledige scraper te stoppen.

### Scraper-level

Een algemene fout binnen een scraper kan de scraperstatus op `OFFLINE`
zetten.

### Manager-level

`Promise.allSettled()` zorgt ervoor dat andere scrapers verder kunnen gaan.

### Scheduler-level

Een fout wordt gelogd en verhindert niet automatisch de volgende geplande
run.

---

# 31. Data Flow

De volledige datastroom is:

```text
External source
      ↓
HTTP / browser / API
      ↓
Source scraper
      ↓
BaseScraper
      ↓
Normalized record
      ↓
ValidatorEngine
      ↓
PersistenceEngine
      ↓
stations_v2
      ↓
station_source_links
      ↓
StationPriceResolver
      ↓
API
      ↓
Frontend
```

---

# 32. Belangrijkste Architectuurregels

## Regel 1 — Scrapers zijn source-specific

Elke externe bron heeft zijn eigen scraper.

---

## Regel 2 — Output is uniform

Alle scrapers leveren hetzelfde genormaliseerde recordmodel.

---

## Regel 3 — Validatie gebeurt centraal

Records worden gevalideerd voordat ze naar persistence gaan.

---

## Regel 4 — Persistence is gescheiden

Scrapers mogen niet rechtstreeks afhankelijk zijn van complexe database
queries.

---

## Regel 5 — Eén bron mag niet de volledige scheduler blokkeren

Scraperfouten worden geïsoleerd.

---

## Regel 6 — Officiële bronnen hebben voorkeur

Wanneer een officiële API beschikbaar is, heeft die de voorkeur boven
HTML-scraping.

---

## Regel 7 — Monitoring is onderdeel van de architectuur

Een scraper is pas operationeel wanneer zijn resultaat ook meetbaar en
controleerbaar is.

---

## Regel 8 — Station en prijs zijn afzonderlijke dataproblemen

Een station kan correct gevonden worden terwijl de prijs ontbreekt.

Daarom moeten station discovery en price discovery afzonderlijk worden
geëvalueerd.

---

# 33. Development Priority

De architectuur wordt verder ontwikkeld volgens:

```text
1. Scraper coverage
2. Price coverage
3. Data quality
4. Cross-source matching
5. Persistence stability
6. API
7. Stations frontend
8. Historiek
9. Favorieten
10. Admin
11. Premium features
```

---

# 34. Current Architecture Status

| Component                  | Status |
| -------------------------- | ------ |
| Scraper registry           | ✅     |
| BaseScraper                | ✅     |
| ScraperManager             | ✅     |
| ValidatorEngine            | ✅     |
| PersistenceEngine          | ✅     |
| HealthRegistry             | ✅     |
| MetricsRegistry            | ✅     |
| RateLimiter                | ✅     |
| Scheduler                  | ✅     |
| Scheduler run logging      | ✅     |
| Scheduler Monitor API      | ✅     |
| Scheduler Monitor frontend | ✅     |
| stations_v2                | ✅     |
| station_source_links       | ✅     |
| StationPriceResolver       | ✅     |
| MAES                       | ✅     |
| DATS24                     | ✅     |
| SHELL                      | ✅     |
| TEXACO                     | ✅     |
| Q8 station discovery       | ✅     |
| Q8 price coverage          | ⚠️     |
| Gabriëls                   | ⏳     |
| Esso                       | ⏳     |
| TotalEnergies              | ⏳     |
| Lukoil                     | ⏳     |

---

# 35. Definition of Done — Scraper

Een scraper is volledig afgerond wanneer:

```text
[ ] Bron onderzocht
[ ] Officiële API gecontroleerd
[ ] Officiële sitemap gecontroleerd
[ ] Station discovery werkt
[ ] Unieke station-ID werkt
[ ] Adres werkt
[ ] GPS werkt
[ ] Brandstofprijzen werken
[ ] Prijsdatum werkt
[ ] Normalisatie werkt
[ ] Validator werkt
[ ] Rate limiting ingesteld
[ ] Foutafhandeling getest
[ ] Deduplicatie getest
[ ] Persistence getest
[ ] Scheduler getest
[ ] scheduler_runs getest
[ ] HealthRegistry getest
[ ] MetricsRegistry getest
[ ] Frontend API gecontroleerd
```

---

# 36. Belangrijke toekomstige verbetering

De huidige scheduler voert de vijf actieve scrapers binnen één schedulerjob
uit.

Voor verdere schaalbaarheid kan later worden overwogen om de bronnen als
afzonderlijke schedulerjobs te registreren.

Bijvoorbeeld:

```text
MAES Scheduler
DATS24 Scheduler
SHELL Scheduler
TEXACO Scheduler
Q8 Scheduler
```

Dit is **niet noodzakelijk voor de huidige werking** en wordt pas overwogen
wanneer de scraperlaag verder is gestabiliseerd.

---

# 37. Samenvatting

FuelAlert Belgium gebruikt een modulaire multi-source architectuur.

De kern bestaat uit:

```text
Registry
   ↓
ScraperManager
   ↓
BaseScraper
   ↓
ValidatorEngine
   ↓
PersistenceEngine
   ↓
stations_v2
   ↓
Cross-source matching
   ↓
Price Resolver
   ↓
API
   ↓
Frontend
```

Daarboven ligt een operationele laag voor:

```text
Scheduler
Health
Metrics
Rate Limiting
Logging
Scheduler Runs
Monitoring
```

De huidige belangrijkste technische aandacht ligt niet meer bij de
basisarchitectuur, maar bij het uitbreiden van scraperdekking,
prijsdekking en datakwaliteit.
