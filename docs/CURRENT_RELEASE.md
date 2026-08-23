# FuelAlert Belgium — Current Release

## Huidige release

**Versie:** 8.7.0  
**Datum:** 23 augustus 2026  
**Status:** Development / Production backend operationeel

---

# 1. Release-overzicht

Deze release vertegenwoordigt de huidige staat van de FuelAlert Belgium
backend na de uitbreiding van de scraperarchitectuur en de integratie van
de scheduler- en monitoringlaag.

De actieve scraperarchitectuur bestaat momenteel uit:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De backend beschikt over een centrale:

```text
ScraperManager
BaseScraper
PersistenceEngine
ValidatorEngine
HealthRegistry
MetricsRegistry
RateLimiter
Scheduler
SchedulerRunRepository
ReportEngine
```

---

# 2. Actieve scrapers

## MAES_NETWORK

Status:

```text
OPERATIONEEL
```

Recente volledige run:

```text
Stations : 275
Updated  : 275
Errors   : 0
```

MAES gebruikt de officiële Maes Mobility-bron en aanvullende stationinformatie
zoals JSON-LD wanneer beschikbaar.

De scraper verwerkt stations via batchverwerking.

---

## DATS24

Status:

```text
OPERATIONEEL
```

Recente volledige run:

```text
Stations : 147
Updated  : 147
Errors   : 0
```

DATS24 gebruikt de officiële stationinformatie en prijsgegevens die door
de scraperlaag worden verzameld.

---

## SHELL

Status:

```text
OPERATIONEEL
```

Recente volledige run:

```text
Stations : 200
Updated  : 200
Errors   : 0
```

De Shell scraper gebruikt het officiële Shell-prijsbestand.

De officiële XLSX-prijsbron wordt automatisch opgehaald en verwerkt.

---

## TEXACO

Status:

```text
OPERATIONEEL
```

Recente volledige run:

```text
Stations : 91
Updated  : 91
Errors   : 0
```

Texaco is volledig opgenomen in:

```text
ScraperManager
PersistenceEngine
Scheduler
SchedulerRunRepository
HealthRegistry
MetricsRegistry
```

---

## Q8

Status:

```text
OPERATIONEEL
```

Recente volledige run:

```text
Stations gevonden : 469
Met prijzen       : 213
Zonder prijzen    : 256
Fouten            : 0
Zonder Q8-code    : 39
```

De Q8 scraper gebruikt:

```text
Q8 sitemap
    ↓
stationpagina
    ↓
Q8 stationcode
    ↓
officiële Q8 price API
    ↓
normalized record
```

### Q8 performance

Een volledige run duurde ongeveer:

```text
538700 ms
```

Dit is ongeveer:

```text
538,7 seconden
≈ 9 minuten
```

Q8 blijft daarom één van de belangrijkste performance-aandachtspunten.

---

# 3. Centrale scraperarchitectuur

De actieve scrapers worden geregistreerd in:

```text
backend/scrapers/registry.js
```

De registry initialiseert:

```javascript
new MaesScraper();
new Dats24Scraper();
new ShellScraper();
new TexacoScraper();
new Q8Scraper();
```

De `ScraperManager` voert de scrapers uit via:

```javascript
Promise.allSettled(...)
```

Hierdoor kan iedere scraper onafhankelijk succesvol of mislukt eindigen.

---

# 4. Uniforme scraperpipeline

Elke scraper gebruikt de gemeenschappelijke `BaseScraper`.

Pipeline:

```text
RateLimiter
    ↓
collectRecords()
    ↓
ValidatorEngine
    ↓
validateRecord()
    ↓
HealthRegistry
    ↓
MetricsRegistry
    ↓
PersistenceEngine
    ↓
SchedulerRunRepository
```

De scraper-output wordt genormaliseerd naar een uniforme structuur.

Belangrijke velden:

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

---

# 5. Scheduler

De productie-scheduler bevat momenteel één job:

```text
Fuel Scrapers
```

Interval:

```text
15 minuten
```

De scheduler wordt gestart vanuit:

```text
backend/server.js
```

Bij het starten van de backend wordt eerst onmiddellijk een scraper-run
gestart.

Daarna wordt iedere 15 minuten een nieuwe run gestart.

Flow:

```text
Backend start
     ↓
Scheduler.start()
     ↓
eerste scraper-run
     ↓
15 minuten
     ↓
volgende scraper-run
     ↓
15 minuten
     ↓
...
```

---

# 6. Scheduler Run registratie

Normale productie-runs worden opgeslagen in:

```text
scheduler_runs
```

Repository:

```text
backend/repositories/SchedulerRunRepository.js
```

Een run bevat:

```text
id
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

Voorbeeld:

```json
{
  "scraper": "Q8",
  "status": "SUCCESS",
  "stations": 469,
  "inserted": 0,
  "updated": 469,
  "skipped": 0,
  "duplicates": 0,
  "errors": 0,
  "duration_ms": 542205
}
```

---

# 7. Smoke tests

Smoke tests worden bewust niet opgeslagen in `scheduler_runs`.

De `ScraperManager` controleert:

```text
if (!smokeTest)
```

Alleen normale productie-uitvoeringen worden dus onderdeel van de
schedulerhistoriek.

Dit voorkomt dat testuitvoeringen de productie-monitoring vervuilen.

---

# 8. Scheduler Monitor API

Endpoint:

```text
GET /api/scheduler-monitor
```

Router:

```text
backend/routes/schedulerMonitorRoutes.js
```

De endpoint ondersteunt:

```text
page
scraper
```

Voorbeeld:

```text
/api/scheduler-monitor?page=1
```

of:

```text
/api/scheduler-monitor?page=1&scraper=Q8
```

De API retourneert:

```text
filter
pagination
summary
runs
```

---

# 9. Scheduler Monitor frontend

De frontend toont:

```text
Laatste scraper-runs
Historiek
Status
Stations
Updated
Errors
Duration
Laatste uitvoering
```

De overview gebruikt de laatste run per scraper.

De historiek kan worden gefilterd op:

```text
MAES NETWORK
DATS24
SHELL
TEXACO
Q8
```

De frontend ververst automatisch iedere:

```text
30 seconden
```

---

# 10. Recente volledige scraper-run

Een recente volledige uitvoering gaf:

| Scraper      | Stations | Updated | Errors |
| ------------ | -------: | ------: | -----: |
| MAES_NETWORK |      275 |     275 |      0 |
| DATS24       |      147 |     147 |      0 |
| SHELL        |      200 |     200 |      0 |
| TEXACO       |       91 |      91 |      0 |
| Q8           |      469 |     469 |      0 |

Totaal bronrecords:

```text
1182
```

Dit is het totaal van de records die door de afzonderlijke bronnen zijn
aangeleverd. Het is niet noodzakelijk het aantal unieke fysieke stations.

---

# 11. Performance

Een recente volledige run liet ongeveer de volgende uitvoeringstijden zien:

```text
MAES_NETWORK : ≈ 348 sec
DATS24       : ≈ 141 sec
SHELL        : ≈ 3 sec
TEXACO       : ≈ 10 sec
Q8           : ≈ 542 sec
```

De exacte duur kan per run verschillen.

Belangrijk:

```text
performance-optimalisatie
        mag nooit
stationdekking of datakwaliteit verminderen
```

---

# 12. Monitoring

## HealthRegistry

De `BaseScraper` registreert na iedere uitvoering onder andere:

```text
status
stations
errors
successRate
duration
```

Bij succes:

```text
ONLINE
```

Bij een exception:

```text
OFFLINE
```

---

## MetricsRegistry

De metricslaag registreert per scraper:

```text
success
stations
duration
lastRun
```

De metrics zijn beschikbaar via:

```text
GET /api/metrics
```

---

# 13. Rate Limiting

De centrale RateLimiter ondersteunt:

```text
delay
retries
timeout
concurrent
```

Huidige geregistreerde configuraties:

### MAES_NETWORK

```text
delay      : 1500 ms
retries    : 3
timeout    : 30000 ms
concurrent : 1
```

### DATS24

```text
delay      : 500 ms
retries    : 3
timeout    : 30000 ms
concurrent : 1
```

Q8 gebruikt daarnaast interne station-worker concurrency.

```text
Smoke test : 5 workers
Volledige run : 8 workers
```

Het werkelijke aantal workers kan lager zijn wanneer minder URLs worden
aangeleverd.

---

# 14. Validation

Iedere scraper passeert de ValidatorEngine.

De validatorlaag controleert onder andere:

```text
stationdata
prijzen
GPS
adres
duplicates
```

Daarnaast controleert `BaseScraper` de aanwezigheid van de verplichte
genormaliseerde velden.

---

# 15. Persistence

De PersistenceEngine verwerkt de genormaliseerde scraperrecords.

De output wordt gebruikt om stations en prijsgegevens te insert/update.

Een normale scheduler-run rapporteert:

```text
inserted
updated
skipped
duplicates
errors
```

De persistence-resultaten worden ook opgeslagen in:

```text
scheduler_runs
```

---

# 16. API-routes

De backend registreert momenteel:

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
/api/scheduler-monitor

/api/metrics
/api/validation
/api/ratelimiter
/api/persistence
```

Daarnaast bestaat:

```text
GET /api/test
```

voor een eenvoudige API/database-test.

---

# 17. Database/API test

Endpoint:

```text
GET /api/test
```

De endpoint voert uit:

```sql
SELECT NOW() AS server_time
```

Bij succes:

```json
{
  "success": true,
  "serverTime": "..."
}
```

---

# 18. Dealer Price Architecture

De dealerprijsarchitectuur is voorbereid en gedocumenteerd.

Prijsprioriteit:

```text
Dealerprijs
    ↓
Dealerkorting
    ↓
Resolved source price
```

De automatische scraperprijs blijft de bronwaarde.

Een dealer override mag deze bronwaarde niet vernietigen.

De uiteindelijke publieke prijs kan daardoor worden opgebouwd uit:

```text
source_price
dealer_override
dealer_discount
final_price
price_origin
```

De volledige dealerportal is nog niet als volledige productiefunctionaliteit
afgerond.

---

# 19. Fail-safe architectuur

Een scraper mag de andere scrapers niet automatisch stoppen.

Daarom gebruikt `ScraperManager`:

```text
Promise.allSettled()
```

Bij een individuele fout wordt:

```text
status = FAILED
```

geregistreerd.

De overige scrapers kunnen vervolgens normaal worden verwerkt.

Ook de automatische scraperprijs blijft beschikbaar als fallback wanneer
een dealer override ongeldig of verlopen is.

---

# 20. Huidige projectstatus

## Operationeel

```text
✓ MAES_NETWORK scraper
✓ DATS24 scraper
✓ SHELL scraper
✓ TEXACO scraper
✓ Q8 scraper
✓ ScraperManager
✓ BaseScraper
✓ PersistenceEngine
✓ ValidatorEngine
✓ HealthRegistry
✓ MetricsRegistry
✓ RateLimiter
✓ Scheduler
✓ Scheduler Run Repository
✓ Scheduler Monitor API
✓ Scheduler Monitor frontend
✓ automatische scraper-run
✓ schedulerhistoriek
```

## Nog verder te ontwikkelen

```text
□ volledige stationdekking verder controleren
□ prijsdekking per bron verbeteren
□ Q8 prijsdekking verbeteren
□ Q8 performance optimaliseren
□ MAES performance optimaliseren
□ DATS24 performance optimaliseren
□ verdere scraperbronnen toevoegen
□ dealerportal
□ dealerverificatie
□ dealerprijzen
□ dealerkortingen
□ uitgebreide audit logging
□ publieke final-price resolver
```

---

# 21. Releasecriteria

Een volgende release mag pas als stabiel worden beschouwd wanneer:

1. Alle actieve scrapers succesvol kunnen uitvoeren.
2. Stationrecords correct worden genormaliseerd.
3. Persistence correct werkt.
4. Scheduler-runs correct worden geregistreerd.
5. Health-status correct wordt bijgewerkt.
6. Metrics correct worden bijgewerkt.
7. Scheduler Monitor correcte data toont.
8. Fouten van individuele scrapers niet de volledige scraper-run stoppen.
9. Geen regressies optreden in bestaande scrapers.
10. Documentatie opnieuw wordt bijgewerkt.

---

# 22. Belangrijk ontwikkelprincipe

FuelAlert Belgium blijft werken volgens:

```text
Official APIs preferred
        ↓
Official data sources
        ↓
Controlled scraping where necessary
        ↓
Normalization
        ↓
Validation
        ↓
Persistence
        ↓
Monitoring
        ↓
Public API
```

De scraperlaag mag nooit rechtstreeks afhankelijk worden gemaakt van
frontendlogica.

De backend blijft de centrale bron voor:

```text
stations
prices
source information
validation
persistence
monitoring
```

---

# 23. Release snapshot

```text
FuelAlert Belgium
Release 8.7.0

Backend:
OPERATIONEEL

Active scrapers:
5

MAES_NETWORK:
275 stations

DATS24:
147 stations

SHELL:
200 stations

TEXACO:
91 stations

Q8:
469 stations

Scheduler:
15 minuten

Scheduler Monitor:
OPERATIONEEL

Persistence:
OPERATIONEEL

Validation:
OPERATIONEEL

Health:
OPERATIONEEL

Metrics:
OPERATIONEEL
```

---

# 24. Volgende prioriteit

De eerstvolgende ontwikkelfocus blijft:

```text
STATIONS VOLLEDIG OP PUNT ZETTEN
```

Daarna:

```text
prijsdekking
cross-source linking
dealerfunctionaliteit
publieke prijsresolutie
```

De stationdata blijft de basis van FuelAlert Belgium. Nieuwe premium- of
dealerfunctionaliteit wordt pas verder uitgebreid wanneer de
stationarchitectuur voldoende stabiel en betrouwbaar is.
