# FuelAlert Belgium API Documentation

**Versie:** 8.7.0  
**Laatste update:** 23 augustus 2026

---

# 1. API-overzicht

FuelAlert Belgium gebruikt een Express/Node.js backend voor:

- brandstofprijzen
- stations
- authenticatie
- scraper-capabilities
- health monitoring
- scheduler monitoring
- metrics
- validatie
- rate limiting
- persistence

De API draait standaard op poort `3001`.

Basis:

```text
http://localhost:3001
```

Productie gebruikt de geconfigureerde FuelAlert API-host.

---

# 2. Dealer Price Override API

FuelAlert ondersteunt naast automatische scraperprijzen ook geverifieerde
dealerprijzen en dealerkortingen.

De dealerlaag staat bovenop de automatische prijslaag.

De prijsvolgorde is:

```text
Dealerprijs
    ↓
Dealerkorting
    ↓
Resolved scraper/source price
```

Een dealerwijziging overschrijft de oorspronkelijke scraperprijs niet.
De scraperprijs blijft beschikbaar als bronwaarde.

De uiteindelijke prijs die aan de frontend wordt aangeboden wordt door
de prijsresolver bepaald.

## Dealerbevoegdheid

Een dealer mag alleen prijsinformatie aanpassen voor stations waarvoor het
account geautoriseerd is.

De API moet daarom altijd de relatie controleren tussen:

- ingelogde dealer
- station
- dealerrechten
- brandstof
- actieve override

Een dealer mag nooit de prijs van een station van een andere dealer wijzigen.

## Dealerprijs

Een dealer kan een expliciete prijs instellen voor een brandstof.

Conceptueel:

```text
dealerprijs = 1.620
```

De uiteindelijke prijs wordt dan:

```text
final_price = 1.620
```

De oorspronkelijke scraperprijs blijft behouden.

## Dealerkorting

Een dealer kan ook een korting instellen.

Bijvoorbeeld:

```text
source_price = 1.650
dealer_discount = 0.030
```

De uiteindelijke prijs wordt:

```text
final_price = 1.620
```

## Prioriteit

Wanneer zowel een dealerprijs als een dealerkorting bestaan, heeft de
expliciete dealerprijs voorrang.

```text
dealerprijs
    >
dealerkorting
    >
resolved source price
```

De korting wordt dus niet nogmaals toegepast wanneer een expliciete
dealerprijs actief is.

## Dealer override verwijderen

Wanneer een dealer zijn override verwijdert of deactiveert, valt de API
automatisch terug op de actuele resolved scraper/source price.

```text
Dealer override verwijderd
        ↓
Resolved source price
        ↓
Final price
```

Een dealeroverride mag nooit als `0` worden geïnterpreteerd wanneer de
dealer deze heeft verwijderd.

## Vervaldatum

Dealerprijzen en kortingen kunnen een geldigheidsperiode hebben.

Wanneer:

```text
valid_until < current_time
```

is de override niet langer actief.

De resolver gebruikt dan opnieuw de beschikbare bronprijs.

## API response prijsinformatie

De prijs-API moet de herkomst van de uiteindelijke prijs kunnen onderscheiden.

Conceptueel kan een station bijvoorbeeld teruggeven:

```json
{
  "source_price": 1.65,
  "source": "MAES_NETWORK",
  "dealer_override": 1.62,
  "dealer_discount": null,
  "final_price": 1.62,
  "price_origin": "dealer_override"
}
```

Bij een dealerkorting:

```json
{
  "source_price": 1.65,
  "source": "MAES_NETWORK",
  "dealer_override": null,
  "dealer_discount": 0.03,
  "final_price": 1.62,
  "price_origin": "dealer_discount"
}
```

Zonder dealeroverride:

```json
{
  "source_price": 1.65,
  "source": "MAES_NETWORK",
  "dealer_override": null,
  "dealer_discount": null,
  "final_price": 1.65,
  "price_origin": "source"
}
```

## Voorgestelde dealer-endpoints

De exacte routes worden vastgelegd wanneer de dealerportal wordt
geïmplementeerd.

De API-architectuur moet minimaal ruimte bieden voor:

```text
GET    /api/dealer/stations
GET    /api/dealer/stations/:stationId/prices
POST   /api/dealer/stations/:stationId/prices
PUT    /api/dealer/stations/:stationId/prices/:fuelType
DELETE /api/dealer/stations/:stationId/prices/:fuelType
```

Deze routes zijn architecturale doelroutes en mogen niet als
productie-endpoints worden beschouwd zolang de dealerportal nog niet is
geïmplementeerd.

## Publieke prijs-API

De bestaande publieke station- en prijs-API's moeten uiteindelijk de
`final_price` beschikbaar maken.

Intern moet de API daarnaast de bron kunnen onderscheiden:

```text
source_price
dealer_override
dealer_discount
final_price
price_origin
```

Hierdoor kan FuelAlert zowel de actuele publieksprijs tonen als de herkomst
van die prijs controleren.

## Audit

Dealerprijswijzigingen moeten traceerbaar zijn.

De backend moet daarom uiteindelijk kunnen registreren:

- station
- dealer
- brandstof
- oude waarde
- nieuwe waarde
- type wijziging
- tijdstip
- actieve status

De auditfunctionaliteit wordt gekoppeld aan de dealer override-database
die in de Database-documentatie is beschreven.

## Fail-safe

Een fout in de dealerlaag mag de scraperlaag niet beschadigen.

Wanneer een dealeroverride ongeldig is:

```text
Dealer override
      ↓
ongeldig
      ↓
Resolved source price
```

De scraperprijs blijft daardoor altijd de automatische basis en fallback
van FuelAlert.

---

# 3. Scheduler Monitor API

## GET `/api/scheduler-monitor`

Geeft de schedulerhistoriek en monitoringinformatie van de
scraperuitvoeringen.

De endpoint wordt gebruikt door de Scheduler Monitor frontend.

De route wordt geregistreerd in:

```text
backend/server.js
```

Router:

```text
backend/routes/schedulerMonitorRoutes.js
```

Repository:

```text
backend/repositories/SchedulerRunRepository.js
```

Database:

```text
scheduler_runs
```

---

## Query parameters

| Parameter | Type   | Standaard | Beschrijving          |
| --------- | ------ | --------: | --------------------- |
| `page`    | number |         1 | Paginanummer          |
| `scraper` | string |      geen | Filter op één scraper |

Voorbeelden:

```text
/api/scheduler-monitor?page=1
```

```text
/api/scheduler-monitor?scraper=Q8&page=1
```

```text
/api/scheduler-monitor?scraper=SHELL&page=1
```

```text
/api/scheduler-monitor?scraper=TEXACO&page=1
```

```text
/api/scheduler-monitor?scraper=DATS24&page=1
```

```text
/api/scheduler-monitor?scraper=MAES_NETWORK&page=1
```

De scraperfilter wordt intern genormaliseerd naar uppercase.

---

# 4. Scheduler Monitor Response

De endpoint retourneert:

```json
{
  "success": true,
  "filter": {
    "scraper": "Q8"
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalRuns": 0,
    "totalPages": 1
  },
  "summary": {},
  "runs": []
}
```

Wanneer geen scraperfilter wordt gebruikt:

```json
{
  "success": true,
  "filter": {
    "scraper": null
  },
  "pagination": {},
  "summary": {},
  "runs": []
}
```

---

# 5. Pagination

De API gebruikt pagination voor de schedulerhistoriek.

Standaard:

```text
limit = 50
```

De response bevat:

- `page`
- `limit`
- `totalRuns`
- `totalPages`

Voorbeeld:

```json
"pagination": {
  "page": 1,
  "limit": 50,
  "totalRuns": 2998,
  "totalPages": 60
}
```

Wanneer een scraperfilter wordt gebruikt, worden de totalen beperkt tot
de geselecteerde scraper.

---

# 6. Scheduler Summary

`summary` bevat de schedulerstatistieken voor de geselecteerde scraper.

Velden:

- `totalRuns`
- `successRuns`
- `failedRuns`
- `averageDuration`
- `lastRun`

De huidige repository berekent de runstatistieken voor **vandaag**.

Conceptueel:

```text
COUNT(*)                         → totalRuns
SUM(status = SUCCESS)            → successRuns
SUM(status = FAILED)             → failedRuns
AVG(duration_ms)                 → averageDuration
```

De `lastRun` wordt bepaald als de meest recente run van de geselecteerde
scraper.

Voorbeeld:

```json
{
  "totalRuns": 10,
  "successRuns": 10,
  "failedRuns": 0,
  "averageDuration": 850,
  "lastRun": {
    "id": 3001,
    "scraper": "Q8",
    "status": "SUCCESS"
  }
}
```

---

# 7. Scheduler Runs

`runs` bevat de afzonderlijke scraperuitvoeringen.

Iedere run bevat:

- `id`
- `scraper`
- `status`
- `stations`
- `inserted`
- `updated`
- `skipped`
- `duplicates`
- `errors`
- `duration_ms`
- `started_at`
- `finished_at`

Voorbeeld:

```json
{
  "id": 3001,
  "scraper": "SHELL",
  "status": "SUCCESS",
  "stations": 200,
  "inserted": 0,
  "updated": 200,
  "skipped": 0,
  "duplicates": 0,
  "errors": 0,
  "duration_ms": 856,
  "started_at": "2026-08-22T16:06:26.000Z",
  "finished_at": "2026-08-22T16:06:26.000Z"
}
```

---

# 8. Huidige actieve scrapers

De huidige registry bevat vijf actieve scrapers:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De actieve registry staat in:

```text
backend/scrapers/registry.js
```

De registry initialiseert momenteel:

```text
MaesScraper
Dats24Scraper
ShellScraper
TexacoScraper
Q8Scraper
```

---

# 9. Huidige scraper-output

De huidige productiegegevens tonen dat de scrapers daadwerkelijk
scheduler-runs registreren.

Een recente volledige run bevatte:

| Scraper      | Stations | Updated | Errors |
| ------------ | -------: | ------: | -----: |
| MAES_NETWORK |      275 |     275 |      0 |
| DATS24       |      147 |     147 |      0 |
| SHELL        |      200 |     200 |      0 |
| TEXACO       |       91 |      91 |      0 |
| Q8           |      469 |     469 |      0 |

De Q8-scraper leverde tijdens een volledige run:

```text
469 Q8 stations gevonden
213 Q8 stations met prijzen
256 Q8 stations zonder prijzen
0 fouten
39 stations zonder Q8-code
```

De volledige Q8-run duurde ongeveer:

```text
538700 ms
```

Dit is ongeveer:

```text
538,7 seconden
≈ 9 minuten
```

Deze waarden zijn runtime-resultaten van de huidige scraper en moeten
niet als vaste aantallen in de applicatielogica worden beschouwd.

---

# 10. Scheduler

De scheduler wordt geregistreerd in:

```text
backend/server.js
```

De huidige scheduler bevat één job:

```text
Fuel Scrapers
```

Het huidige interval is:

```text
15 * 60 * 1000
```

oftewel:

```text
15 minuten
```

Bij het starten van de API wordt de eerste uitvoering onmiddellijk gestart.

Daarna wordt de job volgens het interval opnieuw uitgevoerd.

Flow:

```text
API start
    ↓
Scheduler.start()
    ↓
Eerste scraper-run onmiddellijk
    ↓
15 minuten wachten
    ↓
Volgende scraper-run
    ↓
15 minuten wachten
    ↓
...
```

---

# 11. Scheduler API

Naast de scheduler-monitor bestaat een algemene scheduler-status endpoint.

## GET `/api/scheduler`

Deze endpoint retourneert de geregistreerde schedulerjobs.

Route:

```text
backend/routes/scheduler.js
```

De endpoint gebruikt:

```text
Scheduler.getJobs()
```

Voorbeeld:

```json
[
  {
    "name": "Fuel Scrapers",
    "interval": 900000,
    "running": true,
    "lastRun": "2026-08-23T16:00:00.000Z"
  }
]
```

`interval` wordt in milliseconden geretourneerd.

```text
900000 ms = 15 minuten
```

---

# 12. Scheduler Run Flow

De normale flow is:

```text
Scheduler
    ↓
ScraperManager
    ↓
Active Scrapers
    ↓
BaseScraper
    ↓
ValidatorEngine
    ↓
PersistenceEngine
    ↓
SchedulerRunRepository
    ↓
scheduler_runs
    ↓
Scheduler Monitor API
    ↓
Frontend
```

De `ScraperManager` voert de actieve scrapers parallel uit via
`Promise.allSettled()`.

Een fout in één scraper verhindert daardoor niet automatisch dat de
andere scrapers worden verwerkt.

---

# 13. Scheduler Run registratie

Na een succesvolle normale scraperuitvoering wordt een record aangemaakt
via:

```text
SchedulerRunRepository.create()
```

Een succesvolle run wordt opgeslagen met:

```text
status = SUCCESS
```

Een mislukte scraperuitvoering wordt opgeslagen met:

```text
status = FAILED
```

De registratie bevat onder andere:

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

---

# 14. Smoke Tests

Smoke tests worden bewust niet geregistreerd in `scheduler_runs`.

In `ScraperManager.run()` wordt gecontroleerd:

```text
if (!smokeTest)
```

Alleen wanneer `smokeTest` false is, wordt een scheduler-run opgeslagen.

Hierdoor bevatten de schedulerhistoriek en Scheduler Monitor alleen echte
productie-uitvoeringen en geen technische testuitvoeringen.

---

# 15. BaseScraper en timing

Elke scraper wordt uitgevoerd via `BaseScraper`.

De scraperflow bevat:

```text
RateLimiter.wait()
        ↓
collectRecords()
        ↓
ValidatorEngine.validate()
        ↓
validateRecord()
        ↓
HealthRegistry.update()
        ↓
MetricsRegistry.record()
        ↓
return records
```

De uitvoeringstijd wordt gemeten vanaf het begin van `scrape()`.

Deze duur wordt gebruikt voor:

```text
HealthRegistry
MetricsRegistry
ReportEngine
SchedulerRunRepository
```

---

# 16. Rate Limiting

De scrapers gebruiken de centrale `RateLimiter`.

Momenteel zijn onder andere de volgende configuraties geregistreerd:

### MAES_NETWORK

```text
delay:      1500 ms
retries:    3
timeout:    30000 ms
concurrent: 1
```

### DATS24

```text
delay:      500 ms
retries:    3
timeout:    30000 ms
concurrent: 1
```

De Q8 scraper gebruikt daarnaast intern parallelle stationverwerking.

Bij een volledige Q8-run:

```text
8 workers
```

Bij een smoke test:

```text
5 workers
```

Het effectieve aantal actieve workers kan lager uitvallen wanneer het aantal
te verwerken URLs kleiner is dan de ingestelde concurrency.

---

# 17. Publieke API-routes

De backend registreert momenteel onder andere:

```text
GET /api/fuel-prices
GET /api/stations
GET /api/capabilities
GET /api/health

POST/GET /api/auth/register
GET /api/auth/verify-email
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password

GET /api/scheduler
GET /api/scheduler-monitor

GET /api/metrics
GET /api/validation
GET /api/ratelimiter
GET /api/persistence
```

De exacte HTTP-methodes van individuele auth- en functionele routes worden
bepaald door de betreffende routerbestanden.

---

# 18. API health test

De backend bevat een eenvoudige database/API-test:

## GET `/api/test`

Deze endpoint voert uit:

```sql
SELECT NOW() AS server_time
```

Bij succes:

```json
{
  "success": true,
  "serverTime": "2026-08-23T16:00:00.000Z"
}
```

Bij een databasefout:

```json
{
  "success": false,
  "error": "Database error"
}
```

HTTP-status:

```text
500
```

---

# 19. Foutresponse Scheduler Monitor

Bij een server- of databasefout retourneert de Scheduler Monitor:

```json
{
  "success": false,
  "error": "Database error"
}
```

met HTTP status:

```text
500
```

De frontend moet bij een fout een lege/fallback monitoringstatus kunnen
weergeven.

---

# 20. Scheduler Monitor frontend

De Scheduler Monitor frontend gebruikt:

```text
GET /api/scheduler-monitor
```

De frontend haalt twee datasets op:

### Gefilterde dataset

Voor de geselecteerde scraper:

```text
/api/scheduler-monitor?page=1&scraper=Q8
```

Deze dataset wordt gebruikt voor:

- summary
- historiek
- pagination

### Overview dataset

Zonder scraperfilter:

```text
/api/scheduler-monitor?page=1
```

Deze dataset wordt gebruikt om de meest recente run per scraper te tonen.

De frontend ververst automatisch iedere:

```text
30 seconden
```

---

# 21. Belangrijke interpretatie van `duration_ms`

`duration_ms` is de gemeten duur van de scraperuitvoering.

Voorbeeld:

```text
503503 ms
```

betekent ongeveer:

```text
503,5 seconden
≈ 8 minuten 23 seconden
```

De duur van een scraper kan sterk verschillen per bron.

Vooral Q8 kan aanzienlijk langer duren omdat:

1. de sitemap station-URLs oplevert;
2. stationpagina's afzonderlijk worden verwerkt;
3. de officiële Q8-prijs-API per station wordt aangesproken;
4. meerdere stations parallel worden verwerkt;
5. rate limiting actief blijft.

---

# 22. Fail-safe gedrag

Een scraperfout mag de andere scrapers niet stoppen.

`ScraperManager` gebruikt:

```text
Promise.allSettled()
```

Daardoor wordt per scraper afzonderlijk bepaald:

```text
SUCCESS
```

of:

```text
FAILED
```

Een gefaalde scraper wordt geregistreerd en de overige scrapers kunnen
verdergaan.

Ook de persistence- en monitoringlagen zijn gescheiden van de scraperlaag.

---

# 23. Database

Scheduler-runs worden opgeslagen in:

```text
scheduler_runs
```

De repository is:

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

De data wordt gebruikt door de Scheduler Monitor API.

---

# 24. Architectuur

De scheduler-monitoringarchitectuur is:

```text
                    ┌──────────────────┐
                    │    Scheduler     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ ScraperManager   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
           MAES           DATS24          SHELL
              │              │              │
              └──────────────┼──────────────┘
                             │
                       TEXACO / Q8
                             │
                             ▼
                    ┌──────────────────┐
                    │ PersistenceEngine│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ scheduler_runs   │
                    └────────┬─────────┘
                             │
                             ▼
                 ┌────────────────────────┐
                 │ Scheduler Monitor API  │
                 └────────────┬───────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Monitor Frontend │
                    └──────────────────┘
```

---

# 25. Huidige status

De scheduler-monitoringlaag is operationeel.

De huidige backend registreert normale scraperuitvoeringen in
`scheduler_runs`.

De huidige actieve scraperregistry bevat:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De Scheduler Monitor API ondersteunt:

```text
✓ globale schedulerhistoriek
✓ scraperfilter
✓ pagination
✓ success/failed statistieken
✓ gemiddelde duur
✓ laatste run
✓ stations
✓ inserted
✓ updated
✓ skipped
✓ duplicates
✓ errors
✓ duration
✓ starttijd
✓ eindtijd
✓ automatische frontend refresh
```

De monitoring moet steeds worden geïnterpreteerd als runtime-informatie:
stationaantallen, duur en prijsdekking kunnen per uitvoering wijzigen.

---

# 26. Toekomstige uitbreidingen

Mogelijke toekomstige uitbreidingen:

- authenticated admin access voor scheduler-monitoring
- handmatige scraper-run vanuit admin
- individuele scraper starten
- individuele scraper stoppen
- scheduler pauzeren
- live progress per scraper
- actuele workerstatus
- laatste foutmelding per scraper
- historische grafieken
- dagelijkse/wekelijkse run-statistieken
- alerts bij meerdere opeenvolgende failures
- scraper performance monitoring
- prijsdekking per scraper
- stationdekking per scraper
- uitgebreide audit logging

Deze onderdelen zijn niet automatisch productiefunctionaliteit zolang de
betreffende modules niet geïmplementeerd zijn.
