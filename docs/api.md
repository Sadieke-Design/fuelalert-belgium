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
