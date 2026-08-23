# Changelog

Alle belangrijke functionele, architecturale en scraperwijzigingen van
FuelAlert Belgium worden hieronder bijgehouden.

---

# 2026-08-23

## Scheduler & Monitoring

### Scheduler Monitor operationeel

- Scheduler Monitor API toegevoegd via:
  - `GET /api/scheduler-monitor`
- Scraperfilter toegevoegd via query parameter:
  - `scraper`
- Pagination toegevoegd.
- Summary-statistieken toegevoegd:
  - `totalRuns`
  - `successRuns`
  - `failedRuns`
  - `averageDuration`
  - `lastRun`
- Historiek per scraper beschikbaar.
- Scheduler-runs worden opgeslagen in `scheduler_runs`.
- Smoke tests worden niet als normale scheduler-runs geregistreerd.
- Frontend Scheduler Monitor toegevoegd/geïntegreerd.
- Frontend ververst automatisch iedere 30 seconden.
- Laatste run per scraper wordt in het overzicht getoond.
- Historiek kan per scraper worden gefilterd.

### Actieve scraperlijst

De centrale scraper registry bevat momenteel:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

Registry:

```text
backend/scrapers/registry.js
```

### Scheduler

De productie-scheduler voert de actieve scraper registry automatisch uit.

Huidige job:

```text
Fuel Scrapers
```

Interval:

```text
15 minuten
```

De eerste uitvoering wordt bij backend-startup onmiddellijk gestart.

De scheduler gebruikt dezelfde `ScraperManager` als handmatige en
diagnostische scraperuitvoeringen.

### Scheduler Run registratie

Normale scraperuitvoeringen worden geregistreerd in:

```text
scheduler_runs
```

Per run worden onder andere opgeslagen:

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

### Scheduler Run resultaat

Een recente volledige productie-run leverde:

| Scraper | Stations | Updated | Errors |
|---|---:|---:|---:|
| MAES_NETWORK | 275 | 275 | 0 |
| DATS24 | 147 | 147 | 0 |
| SHELL | 200 | 200 | 0 |
| TEXACO | 91 | 91 | 0 |
| Q8 | 469 | 469 | 0 |

Totaal aantal bronrecords:

```text
1182
```

Dit aantal staat niet gelijk aan het aantal unieke fysieke stations,
omdat hetzelfde fysieke station door meerdere bronnen kan worden
aangeleverd.

---

# 2026-08-23 — Q8

## Q8 scraper volledig operationeel

Q8 is opnieuw geïntegreerd als actieve productie-scraper.

De Q8 scraper gebruikt:

```text
Q8 officiële sitemap
        ↓
Q8 stationpagina's
        ↓
Q8 stationcode
        ↓
Q8 officiële prijs-API
        ↓
genormaliseerde FuelAlert records
```

### Q8 station discovery

Een volledige productie-run leverde:

```text
469 Q8 stations gevonden
```

### Q8 prijsdekking

Tijdens dezelfde run:

```text
213 Q8 stations met prijzen
256 Q8 stations zonder prijzen
```

### Q8 technische resultaten

```text
Q8 fouten: 0
```

Er waren:

```text
39 stations zonder Q8-code
```

Deze stations worden niet als bruikbaar genormaliseerd record opgeslagen.

### Q8 performance

Volledige run:

```text
≈ 538700 ms
```

oftewel ongeveer:

```text
538,7 seconden
≈ 9 minuten
```

Q8 is daarmee functioneel geïntegreerd, maar prijsdekking en performance
blijven aandachtspunten.

### Q8 parallel processing

De Q8 scraper verwerkt stationpagina's parallel.

Configuratie:

```text
Smoke test: 5 workers
Volledige run: 8 workers
```

Het werkelijke aantal workers kan lager zijn wanneer minder URLs worden
aangeleverd.

---

# 2026-08-23 — TEXACO

## Texaco scraper actief

Texaco is toegevoegd aan de centrale scraper registry en draait mee in
dezelfde productiearchitectuur.

Texaco is geïntegreerd met:

- `ScraperManager`
- `BaseScraper`
- `PersistenceEngine`
- `StationRepository`
- `HealthRegistry`
- `MetricsRegistry`
- `Scheduler`
- `SchedulerRunRepository`
- `Scheduler Monitor`

Een recente volledige run leverde:

```text
91 stations
91 updates
0 errors
```

---

# 2026-08-23 — ScraperManager

## Multi-source uitvoering

De `ScraperManager` voert de actieve scrapers uit via:

```javascript
Promise.allSettled(...)
```

Hierdoor kan een fout bij één scraper afzonderlijk worden geregistreerd
zonder automatisch de volledige scraperketen te stoppen.

Per scraper wordt een resultaat opgebouwd met:

```text
source
success
station_count
inserted
updated
skipped
duplicates
duration
errors
```

Bij een normale productie-run wordt daarnaast een record aangemaakt in:

```text
scheduler_runs
```

Smoke tests worden hiervan uitgesloten.

---

# 2026-08-23 — BaseScraper

## Uniforme scraperpipeline

De gemeenschappelijke `BaseScraper` verzorgt de centrale scraperflow:

```text
RateLimiter
    ↓
collectRecords()
    ↓
ValidatorEngine
    ↓
record validation
    ↓
HealthRegistry
    ↓
MetricsRegistry
    ↓
genormaliseerde records
```

De uniforme recordstructuur bevat onder andere:

```text
station_id
brand
name
address
city
postal_code
latitude
longitude
prices
currency
updated_at
source
```

Hierdoor kunnen verschillende databronnen via dezelfde
PersistenceEngine worden opgeslagen.

---

# 2026-08-23 — Rate Limiting

## Centrale RateLimiter

De centrale `RateLimiter` ondersteunt per bron:

```text
delay
retries
timeout
concurrent
```

Momenteel geregistreerde configuraties zijn onder andere:

### MAES_NETWORK

```text
delay: 1500 ms
retries: 3
timeout: 30000 ms
concurrent: 1
```

### DATS24

```text
delay: 500 ms
retries: 3
timeout: 30000 ms
concurrent: 1
```

De rate limiter blijft onderdeel van de centrale scraperarchitectuur.

---

# 2026-08-23 — Scheduler History

## SchedulerRunRepository

Repository toegevoegd/geïntegreerd voor schedulerhistoriek:

```text
backend/repositories/SchedulerRunRepository.js
```

Ondersteunde methodes:

```text
getSummary()
getRuns()
getTotalRuns()
create()
```

De repository leest en schrijft naar:

```text
scheduler_runs
```

De monitor gebruikt deze gegevens voor:

- actuele runstatus
- historische runs
- pagination
- scraperfilters
- runtimegegevens
- foutstatistieken

---

# 2026-08-23 — Dealer Price Architecture

## Dealer Price Override

Een nieuwe architectuurlaag voor geverifieerde dealerprijzen en
dealerkortingen is gedocumenteerd.

Prijsprioriteit:

```text
Dealerprijs
    ↓
Dealerkorting
    ↓
Resolved scraper/source price
```

Belangrijke regels:

- De oorspronkelijke scraperprijs blijft behouden.
- Een expliciete dealerprijs heeft voorrang op een dealerkorting.
- Een dealerkorting heeft voorrang op de resolved source price.
- Een verwijderde of verlopen override valt terug op de bronprijs.
- Een ongeldige dealer override mag de scraperlaag niet beschadigen.
- Dealerrechten worden beperkt tot geautoriseerde stations.
- Dealerwijzigingen moeten traceerbaar zijn via audit logging.

De dealerportal zelf is nog geen volledig productieonderdeel.

De ontwikkelvolgorde blijft:

```text
Brondata verzamelen
    ↓
Stations correct identificeren
    ↓
Scraperprijzen opslaan
    ↓
Cross-source linking
    ↓
Price resolution
    ↓
Dealerverificatie
    ↓
Dealerportal
    ↓
Dealerprijzen / kortingen
    ↓
Publieke final price
```

---

# 2026-08-22 — v8.6.0

## SHELL scraper

- SHELL scraper volledig toegevoegd aan de actieve scraper registry.
- 200 officiële Shell-stations succesvol verzameld.
- Officieel Shell XLSX-prijsbestand geïntegreerd.
- Shell geïntegreerd met `ScraperManager`.
- Shell geïntegreerd met `PersistenceEngine`.
- Shell geïntegreerd met `StationRepository`.
- Shell records succesvol opgeslagen in `stations_v2`.
- Shell toegevoegd aan schedulerhistoriek.
- Scheduler Monitor uitgebreid met Shell-historiek.
- Scheduler Monitor ondersteunt filtering per scraper.

## Shell ↔ MAES station linking

- Cross-source station matching uitgebreid.
- `station_source_links` gebruikt voor fysieke stationkoppelingen.
- Shell/MAES matching gevalideerd.
- 35 actieve Shell/MAES koppelingen beschikbaar.

---

# 2026-07-26

## Official Fuel Data Sources

- Onderzoek naar officiële Belgische brandstofprijsdatabronnen afgerond.
- Fuel Media Service onderzocht.
- CARBU API onderzocht.
- Fuel Media Service gecontacteerd voor commerciële API-toegang.
- Bevestigd dat FuelAlert een hybride multi-source architectuur volgt.

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

MAES leverde tijdens de gecontroleerde volledige run:

```text
275 stations
0 fouten
```

---

# v8.4.1

## Scheduler & Health

- Capability Registry geïmplementeerd.
- Endpoint `/api/capabilities` toegevoegd.
- Health Registry toegevoegd.
- Endpoint `/api/health` toegevoegd.
- Scheduler Engine toegevoegd.
- Endpoint `/api/scheduler` toegevoegd.
- MAES scraper draait automatisch via de Scheduler.
- Eerste automatische Health-monitoring geïmplementeerd.
- Fundament van de DataSource Engine gerealiseerd.

---

# v8.4.0

## DataSource Engine

- Capability Registry toegevoegd.
- Nieuw endpoint `/api/capabilities`.
- Scrapers registreren automatisch hun mogelijkheden.
- Eerste implementatie voor MAES Network.
- Eerste bouwsteen van de DataSource Engine gerealiseerd.

---

# 2026-07-25

## MAES Network Scraper

- Nieuwe batchverwerking toegevoegd.
- Parallelle verwerking vervangen door batches van 20 requests.
- Volledige scraper succesvol getest.
- 1740 URLs ontdekt via sitemap.
- 275 stations succesvol verwerkt.
- 0 fouten tijdens volledige run.

## Fase 8.2.1 — MAES Network afgerond

- Batch processing toegevoegd.
- JSON-LD adresdetectie toegevoegd.
- Uniforme scraper-output.
- 275 stations succesvol verwerkt.
- Slechts 1 uitzonderingspagina zonder bruikbaar JSON-LD.
- Productie gereed verklaard.

---

# v8.3.0

## Projectdocumentatie

- Officiële start van het Master Development Book.
- Nieuwe visie: DataSource Engine.
- Onderzoek naar aanvullende databronnen gepland.
- Master Checklist ingevoerd.
- Decision Log ingevoerd.
- Documentatie-first werkwijze vastgelegd.

---

# Historische wijzigingen

## Scraperarchitectuur

- Backend omgezet naar ES Modules.
- `ScraperManager` geïntroduceerd.
- `BaseScraper` geïntroduceerd.
- Centrale scraper registry geïntroduceerd.
- Logger toegevoegd.
- Retry-infrastructuur toegevoegd.
- Normalisatie toegevoegd.
- Gemeenschappelijke HTTP-client toegevoegd.
- Browser-rendering via Playwright geïntegreerd.

## Q8 historische ontwikkeling

In een eerdere fase was Q8 technisch aanwezig maar nog niet operationeel
voor volledige prijsdekking.

De huidige status is aanzienlijk verder:

```text
Q8 station discovery       OPERATIONEEL
Q8 persistence              OPERATIONEEL
Q8 scheduler                OPERATIONEEL
Q8 monitoring               OPERATIONEEL
Q8 price coverage           IN ONTWIKKELING
```

---

# Releaseprincipes

Iedere belangrijke release moet minimaal:

1. Code en documentatie synchroniseren.
2. Een releaseversie krijgen.
3. Belangrijke architectuurbeslissingen documenteren.
4. Nieuwe scrapers aan de centrale registry toevoegen.
5. Schedulerintegratie controleren.
6. Persistence controleren.
7. Schedulerhistoriek controleren.
8. Monitoring controleren.
9. Volledige scraperresultaten testen.
10. Een ZIP-back-up van de release bewaren.

---

# Huidige ontwikkelstatus

De scraper- en monitoringarchitectuur is momenteel operationeel voor:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De belangrijkste actuele aandachtspunten zijn:

```text
1. volledige stationdekking
2. prijsdekking
3. Q8 performance
4. MAES performance
5. DATS24 performance
6. verdere scraperuitbreiding
7. stations/frontend stabilisatie
```

Performance van recente volledige run:

```text
Q8       ≈ 542 sec
MAES     ≈ 348 sec
DATS24   ≈ 141 sec
TEXACO   ≈ 10 sec
SHELL    ≈ 3 sec
```

Performance-optimalisatie mag nooit ten koste gaan van stationdekking of
datakwaliteit.
