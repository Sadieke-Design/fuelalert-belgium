# Decision Log

## 2026-07-25

### MAES Scraper

Besloten om de scraper niet langer alle URL's gelijktijdig te laten verwerken.

Reden:
- Minder geheugenverbruik.
- Minder kans op rate limiting.
- Betere stabiliteit.
- Schaalbaar voor grote netwerken.

Implementatie:
- Batchverwerking.
- Batchgrootte: 20.

# Decision 008 - Official Fuel Data Sources

Date: 2026-07-26

## Context

FuelAlert requires reliable fuel prices for Belgian fuel stations.

Several approaches were evaluated:

- Own web scrapers
- Official APIs
- Commercial data providers

## Investigation

Research was performed on:

- Esso Belgium
- ExxonMobil locator services
- CARBU
- Fuel Media Service

Results:

- No stable public Esso API was identified.
- Fuel Media Service offers a commercial API.
- Contact has been made with Fuel Media Service requesting technical documentation and licensing information.

## Decision

FuelAlert will remain a multi-source platform.

Priority:

1. Official APIs
2. Own Scrapers
3. Commercial data providers

No additional reverse engineering of Esso or CARBU will be performed unless Fuel Media Service declines cooperation.

Status:
Pending response from Fuel Media Service.