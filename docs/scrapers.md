# Fuel Scrapers

| Brand | Status | Method | Stations | Notes |
|--------|--------|---------|---------:|------|
| MAES Network | ✅ Production Ready | Sitemap + HTML | 275 | Batch processing implemented |
| Q8 | 🚧 Development | Playwright | - | Pending validation |
| DATS24 | 🚧 Development | HTML | - | Pending validation |
| Brand | Status | Methode | Stations | Opmerking |
|--------|--------|----------|---------:|-----------|
| MAES Network | ✅ Production Ready | Sitemap + HTML + JSON-LD | 275 | Batch processing + uniforme output |

## Official Data Sources

FuelAlert supports both scraper-based and official API integrations.

Current status:

| Source | Status |
|---------|--------|
| MAES | ✅ Working |
| ESSO | ⛔ No official public API found |
| Fuel Media Service | ⏳ Contacted |
| CARBU API | Commercial |

## Monitoring

Elke scraper-run wordt automatisch geregistreerd.

Per run wordt opgeslagen:

- scraper
- status
- stations
- inserted
- updated
- skipped
- duplicates
- errors
- duration
- started_at
- finished_at

Deze gegevens worden gebruikt door de Scheduler Monitor.