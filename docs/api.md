# GET /api/scheduler-monitor

Beschrijving

Geeft een overzicht van alle scheduler-runs.

Response

{
success,
summary,
runs
}

summary bevat

- totalRuns
- successRuns
- failedRuns
- averageDuration
- lastRun

runs bevat

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
# GET /api/scheduler-monitor

Beschrijving

Geeft een overzicht van alle scheduler-runs en wordt gebruikt door de
Scheduler Monitor.

Endpoint:

`/api/scheduler-monitor?page=1`

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