# scheduler_runs

Wordt gebruikt voor monitoring en historiek van alle scraper-runs.

## Kolommen

- id
- scraper
- status
- stations
- inserted
- updated
- skipped
- duplicates
- errors
- duration_ms
- started_at
- finished_at

## Gebruik

Deze tabel bewaart de historiek van iedere uitgevoerde scraper-run.

Elke actieve scraper wordt afzonderlijk geregistreerd. Momenteel zijn dit:

- MAES_NETWORK
- DATS24

Een run wordt door de `ScraperManager` geregistreerd via
`SchedulerRunRepository`.

Bij een succesvolle run wordt onder andere opgeslagen:

- aantal gevonden stations
- aantal nieuwe stations
- aantal bijgewerkte stations
- aantal overgeslagen records
- aantal duplicaten
- aantal fouten
- totale uitvoeringsduur
- starttijd
- eindtijd

Bij een mislukte scraper-run wordt eveneens een record opgeslagen met
status `FAILED` en de beschikbare foutinformatie.

## Gebruikt door

- Scheduler Monitor
- Health Monitoring
- Statistieken
- Debugging
- Historiek van scraper-uitvoeringen

## Scheduler Monitor

De tabel wordt uitgelezen via:

`backend/routes/schedulerMonitorRoutes.js`

De database-interactie gebeurt via:

`backend/repositories/SchedulerRunRepository.js`

De gegevens worden weergegeven in:

`src/pages/SchedulerMonitor.jsx`

De monitor toont onder andere:

- runs van vandaag
- succesvolle runs
- mislukte runs
- gemiddelde uitvoeringsduur
- laatste scraper-run
- volledige scraper-historiek
- resultaten per scraper

De Scheduler Monitor ververst automatisch iedere 30 seconden.