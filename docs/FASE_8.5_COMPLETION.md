# FASE 8.5 — COMPLETION

**FuelAlert Belgium**

**Versie:** 1.1  
**Status:** Afgerond / historische fase  
**Laatste update:** 23 augustus 2026

---

# 1. Doel

Fase 8.5 had als doel de backendarchitectuur van FuelAlert Belgium verder
te professionaliseren en de basis te leggen voor een multi-source
scraperplatform.

De fase richtte zich op:

- modulaire scrapers
- uniforme scraper-output
- centrale persistence
- Scheduler
- monitoring
- metrics en health
- V2-databasearchitectuur
- repositories
- API-laag
- frontend-monitoring
- deploybare productiearchitectuur

De stationsmodule en volledige frontendmigratie naar `stations_v2` vallen
niet binnen de afronding van deze fase. Die vormen de basis van de volgende
grote ontwikkelfase.

---

# 2. Wat gebouwd is

Tijdens deze architectuurfase is de scraperlaag omgebouwd naar een centrale
pipeline.

De belangrijkste flow is:

```text
External Source
      ↓
Scraper
      ↓
BaseScraper
      ↓
ValidatorEngine
      ↓
ScraperManager
      ↓
PersistenceEngine
      ↓
StationRepository
      ↓
stations_v2
```

Daarnaast zijn monitoring en schedulerhistoriek toegevoegd:

```text
Scheduler
      ↓
ScraperManager
      ↓
SchedulerRunRepository
      ↓
scheduler_runs
      ↓
Scheduler Monitor
```

De architectuur ondersteunt meerdere databronnen zonder dat iedere scraper
een eigen databaseflow nodig heeft.

---

# 3. Nieuwe architectuur

De scraperarchitectuur gebruikt een gemeenschappelijke `BaseScraper`.

Elke scraper levert uniforme records aan.

De BaseScraper verzorgt onder andere:

- bronidentificatie
- rate limiting
- validatie
- health updates
- metrics
- uniforme foutafhandeling
- logging

De ScraperManager voert de geregistreerde scrapers centraal uit.

Belangrijke componenten:

```text
backend/scrapers/
backend/persistence/
backend/repositories/
backend/validator/
backend/health/
backend/metrics/
backend/scheduler/
backend/ratelimiter/
backend/routes/
```

Deze structuur maakt het mogelijk om nieuwe bronnen toe te voegen zonder de
volledige backend opnieuw te ontwerpen.

---

# 4. Actieve productie-scrapers

De actieve registry bevat momenteel:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

Registry:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De productiearchitectuur is daarmee uitgebreid van de oorspronkelijke
drie bronnen naar vijf actieve bronnen.

---

# 5. Scheduler

De Scheduler voert de actieve scraperpipeline periodiek uit.

Huidige productieconfiguratie:

```text
Interval: 15 minuten
```

Bij het starten van de backend wordt de eerste uitvoering onmiddellijk
gestart.

Daarna wordt de scraperjob volgens het ingestelde interval uitgevoerd.

De Scheduler houdt daarnaast per job onder andere bij:

- naam
- interval
- running-status
- laatste starttijd

Belangrijk bestand:

```text
backend/scheduler/Scheduler.js
```

---

# 6. Scheduler Monitor

Voor persistente schedulerhistoriek is `scheduler_runs` ingevoerd.

De backend beschikt over:

```text
/api/scheduler-monitor
```

De monitor ondersteunt onder andere:

- scraperfilter
- pagination
- total runs
- success runs
- failed runs
- gemiddelde duur
- laatste runs
- historische scheduler-runs

Belangrijke bestanden:

```text
backend/routes/schedulerMonitorRoutes.js
backend/repositories/SchedulerRunRepository.js
```

De frontend bevat een Scheduler Monitor met:

- overzicht van laatste scraper-runs
- scraperselectie
- historische runs
- status
- stations
- updates
- fouten
- duur
- automatische refresh

---

# 7. Nieuwe API's

De architectuur beschikt onder andere over:

```text
/api/fuel-prices
/api/stations
/api/capabilities
/api/health
/api/scheduler
/api/metrics
/api/validation
/api/ratelimiter
/api/persistence
/api/scheduler-monitor
```

Daarnaast bestaan de authentication-routes voor registratie, verificatie,
login en wachtwoordherstel.

De API-laag is daarmee voorbereid op verdere uitbreiding van de frontend.

---

# 8. Nieuwe database

De V2-architectuur gebruikt:

```text
stations_v2
```

Deze tabel is bedoeld als gestandaardiseerde stationlaag voor de
verschillende bronnen.

Daarnaast is de cross-source architectuur opgebouwd rond:

```text
station_source_links
```

Deze tabel maakt het mogelijk om verschillende bronrecords aan hetzelfde
fysieke station te koppelen.

Voor schedulerhistoriek wordt gebruikt:

```text
scheduler_runs
```

De database is daarmee voorbereid op:

- multi-source stations
- source matching
- price resolution
- schedulerhistoriek
- toekomstige dealer overrides
- toekomstige price history

---

# 9. Nieuwe repositories

De persistence- en monitoringlaag gebruikt afzonderlijke repositories.

Belangrijke repositories zijn onder andere:

```text
StationRepository
StationSourceLinkRepository
SchedulerRunRepository
```

De repositories vormen de abstractielaag tussen de applicatielogica en
MySQL.

De SchedulerRunRepository ondersteunt:

- `getSummary()`
- `getRuns()`
- `getTotalRuns()`
- `create()`

---

# 10. Persistence

Scrapers schrijven niet rechtstreeks naar de database.

De centrale flow is:

```text
Scraper
   ↓
ScraperManager
   ↓
PersistenceEngine
   ↓
StationRepository
   ↓
stations_v2
```

De PersistenceEngine houdt onder andere bij:

- inserted
- updated
- skipped
- duplicates
- errors
- duration

Hierdoor blijft de database-logica onafhankelijk van de individuele
scrapers.

---

# 11. Monitoring, Health en Metrics

De backend beschikt over:

```text
HealthRegistry
MetricsRegistry
```

De BaseScraper registreert bij een succesvolle run onder andere:

- status
- aantal stations
- errors
- success rate
- duration

Ook mislukte scraperuitvoeringen worden geregistreerd.

De metrics kunnen via:

```text
/api/metrics
```

worden opgevraagd.

---

# 12. Rate Limiting

De scraperarchitectuur beschikt over een centrale `RateLimiter`.

Per bron kunnen onder andere worden ingesteld:

```text
delay
retries
timeout
concurrent
```

De actieve configuratie is bronafhankelijk.

Voorbeelden uit de huidige backend:

```text
MAES_NETWORK
delay: 1500 ms
retries: 3
timeout: 30000 ms
concurrent: 1

DATS24
delay: 500 ms
retries: 3
timeout: 30000 ms
concurrent: 1
```

Q8 gebruikt daarnaast zijn eigen parallelle verwerking voor stationpagina's,
waarbij de scraper de verwerking begrenst.

---

# 13. Nieuwe frontend

De Scheduler Monitor is als frontendpagina opgebouwd.

De pagina toont:

- laatste refresh
- automatische refresh countdown
- laatste scraper-runs
- status
- stationaantallen
- updates
- fouten
- uitvoeringsduur
- scraperfilter
- historische runs
- pagination

De frontend haalt de data rechtstreeks op via:

```text
/api/scheduler-monitor
```

De monitor is bedoeld als technische beheermodule en niet als publieke
stationsweergave.

---

# 14. Scraperresultaten

De huidige volledige gecontroleerde run leverde:

| Bron         | Stations | Updated | Errors |
| ------------ | -------: | ------: | -----: |
| MAES_NETWORK |      275 |     275 |      0 |
| DATS24       |      147 |     147 |      0 |
| SHELL        |      200 |     200 |      0 |
| TEXACO       |       91 |      91 |      0 |
| Q8           |      469 |     469 |      0 |

Totaal:

**1082 scraperrecords**

## Q8

De volledige Q8-run leverde:

```text
469 stations gevonden
213 stations met prijzen
256 stations zonder beschikbare prijzen
39 stationpagina's zonder gevonden Q8-code
0 scraper-errors
```

Een Q8-station zonder beschikbare prijs wordt niet automatisch als
scraperfout beschouwd. Het stationrecord kan wel correct worden
genormaliseerd en opgeslagen.

---

# 15. Testen

Tijdens deze fase zijn onder andere getest:

- individuele scraperregistratie
- Q8 smoke test
- volledige ScraperManager smoke test
- volledige scraper-run
- persistence
- metrics
- schedulerhistoriek
- scraperfiltering
- scheduler monitor
- database updates
- rate limiting
- uniforme scraper-output

Een smoke test wordt bewust niet opgeslagen als normale
`scheduler_runs`-historiek.

Normale scheduleruitvoeringen worden wel opgeslagen.

---

# 16. Productievalidatie

De gecontroleerde volledige run bevestigde dat de vijf actieve scrapers
door dezelfde centrale pipeline kunnen worden verwerkt.

De resultaten waren:

```text
MAES_NETWORK
275 stations
275 updates
0 errors

DATS24
147 stations
147 updates
0 errors

SHELL
200 stations
200 updates
0 errors

TEXACO
91 stations
91 updates
0 errors

Q8
469 stations
469 updates
0 errors
```

De persistence-resultaten waren voor deze gecontroleerde run:

```text
Inserted: 0
Updated: bronafhankelijk / bestaande records
Skipped: 0
Duplicates: 0
Errors: 0
```

De exacte uitvoeringsduur varieert per run en bron.

---

# 17. Nieuwe deploy

De backend is ingericht voor productie-uitvoering met de bestaande
FuelAlert serveromgeving.

De productieomgeving gebruikt onder andere:

- Ubuntu VPS
- Node.js
- Express
- MySQL
- PM2
- Nginx

De scraperarchitectuur wordt vanuit de backend gestart en de Scheduler
neemt de periodieke uitvoering over.

---

# 18. Openstaande punten

De afronding van deze architectuurfase betekent niet dat FuelAlert als
volledig product klaar is.

Openstaande onderdelen zijn onder andere:

- volledige stationsmodule
- volledige frontendmigratie naar `stations_v2`
- stationdekking verder controleren
- overige relevante databronnen
- Price History
- Cache Engine
- Dealer Price Overrides
- Dealer Portal
- verdere DataSource Manager-uitbouw
- Premium functionaliteit
- Developer API

Fuel Media Service blijft momenteel een externe potentiële databron die
nog wordt geëvalueerd.

Er is nog geen actieve Fuel Media Service-integratie.

---

# 19. Belangrijke architectuurprincipes

De fase heeft de volgende principes vastgelegd:

1. Scrapers schrijven niet rechtstreeks naar de database.
2. Iedere scraper gebruikt uniforme output.
3. Validator Engine controleert scraperdata.
4. PersistenceEngine is de centrale persistence-ingang.
5. Cross-source relaties worden apart opgeslagen.
6. Schedulerhistoriek wordt persistent opgeslagen.
7. Smoke tests worden niet vermengd met productiehistoriek.
8. Rate limiting gebeurt centraal.
9. Health en metrics zijn onderdeel van de scraperpipeline.
10. Nieuwe databronnen moeten dezelfde architectuur kunnen gebruiken.

---

# 20. Volgende fase — 9.0 Stations

De volgende grote ontwikkelfase is:

# FASE 9.0 — STATIONS

De focus ligt eerst volledig op de stationsmodule.

Doel:

**De stationsdata volledig correct, compleet en bruikbaar krijgen voordat
de overige productfunctionaliteit verder wordt uitgebreid.**

Belangrijke onderdelen:

- stations_v2 volledig valideren
- stationdekking controleren
- cross-source matching controleren
- stationidentiteit controleren
- prijzen correct koppelen
- API op `stations_v2` controleren
- frontendstationspagina migreren
- kaartweergave
- stationdetails
- brandstofprijzen
- broninformatie
- openingsuren indien beschikbaar
- stationservices indien beschikbaar
- verdere scraperdekking

De prioriteit blijft:

```text
1. Alle relevante scrapers bouwen
2. Stationsdata volledig controleren
3. stations_v2 stabiliseren
4. Station API stabiliseren
5. Stationsfrontend migreren
6. Daarna pas overige productfeatures
```

---

# 21. Eindstatus Fase 8.5

**FASE 8.5 IS AFGEROND ALS ARCHITECTUURFASE.**

De centrale multi-source scraperarchitectuur, persistence, scheduler,
monitoring, metrics, repositories en V2-databasebasis zijn operationeel.

De huidige productieomgeving heeft vijf actieve scrapers:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De volledige gecontroleerde run verwerkte:

**1082 scraperrecords**

met:

**0 scraper-errors**

De volgende prioriteit is niet opnieuw de architectuur bouwen, maar de
stationslaag verder afwerken en vervolgens gecontroleerd naar de frontend
brengen.

---

**Documentstatus:** Living Document

**Fase:** 8.5 Completion

**Volgende fase:** 9.0 Stations
