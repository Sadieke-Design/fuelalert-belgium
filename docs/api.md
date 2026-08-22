# FuelAlert Belgium API Documentation

**Versie:** 8.6.0  
**Laatste update:** 22 augustus 2026

---

# Scheduler Monitor API

## GET `/api/scheduler-monitor`

Geeft de schedulerhistoriek en monitoringinformatie van de scraperuitvoeringen.

De endpoint wordt gebruikt door de Scheduler Monitor frontend.

### Query parameters

| Parameter | Type | Standaard | Beschrijving |
|---|---|---:|---|
| `page` | number | 1 | Paginanummer |
| `scraper` | string | geen | Filter op één scraper |

Voorbeelden:

```text
/api/scheduler-monitor?page=1
```

```text
/api/scheduler-monitor?scraper=SHELL&page=1
```

```text
/api/scheduler-monitor?scraper=DATS24&page=1
```

```text
/api/scheduler-monitor?scraper=MAES_NETWORK&page=1
```

---

## Response

```json
{
  "success": true,
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

---

## Pagination

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

Voorbeeld:

```json
"pagination": {
  "page": 1,
  "limit": 50,
  "totalRuns": 2,
  "totalPages": 1
}
```

---

# Summary

`summary` bevat de algemene schedulerstatistieken.

Velden:

- `totalRuns`
- `successRuns`
- `failedRuns`
- `averageDuration`
- `lastRun`

Voorbeeld:

```json
{
  "totalRuns": 10,
  "successRuns": 10,
  "failedRuns": 0,
  "averageDuration": 850,
  "lastRun": {
    "id": 3001,
    "scraper": "SHELL",
    "status": "SUCCESS"
  }
}
```

---

# Runs

`runs` bevat de afzonderlijke scraperuitvoeringen.

Iedere run bevat onder andere:

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

# Ondersteunde scraperfilters

De huidige productie-scrapers zijn:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

De Scheduler Monitor kan de historie per scraper afzonderlijk ophalen.

---

# Scheduler Monitor

De endpoint wordt gebruikt door de Scheduler Monitor.

De monitor toont onder andere:

- runs van vandaag
- succesvolle runs
- mislukte runs
- gemiddelde uitvoeringsduur
- laatste scraper-run
- aantal stations
- aantal updates
- aantal fouten
- volledige schedulerhistoriek
- historie per scraper
- pagination

De frontend ververst de gegevens automatisch iedere 30 seconden.

---

# Backend

De route wordt geregistreerd in:

`backend/server.js`

Route:

`/api/scheduler-monitor`

Router:

`backend/routes/schedulerMonitorRoutes.js`

Database repository:

`backend/repositories/SchedulerRunRepository.js`

De gegevens worden opgeslagen in:

`scheduler_runs`

---

# Scheduler Run Flow

```text
Scheduler
    ↓
ScraperManager
    ↓
Active Scraper
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

---

# Foutresponse

Bij een serverfout retourneert de API HTTP status `500`.

Voorbeeld:

```json
{
  "success": false,
  "error": "Database error"
}
```

---

# Opmerking

Smoke tests worden niet geregistreerd in `scheduler_runs`.

Alleen normale scraperuitvoeringen worden als scheduler-run opgeslagen.

Hierdoor bevat de Scheduler Monitor uitsluitend echte schedulerhistoriek
en worden technische smoke tests niet als productie-uitvoering weergegeven.
