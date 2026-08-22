# FuelAlert Belgium - System Architecture

Version: 2.2
Status: Living Document
Last Updated: 2026-08-22

---

# Architecture Principles

FuelAlert follows these architectural principles.

1. Modularity
2. Multi-source data collection
3. Official APIs preferred over scraping
4. Fail-safe processing
5. Documentation-first development
6. Plug-and-play data sources
7. Separation of responsibilities
8. Platform before features
9. Source independence
10. Verified source linking
11. Live price resolution
12. Monitoring-first operation

---

# Overview

FuelAlert Belgium is a modular data platform for collecting, validating,
storing, resolving and distributing Belgian fuel price information.

Instead of treating every scraper as an isolated component, every data
source is integrated into a common scraper and persistence architecture.

The platform focuses on:

- Reliability
- Scalability
- Maintainability
- Modularity
- Extensibility
- Source independence
- Data quality
- Continuous monitoring

Current active data sources:

- MAES Network
- DATS24
- Shell

The architecture allows additional sources to be added without changing
the core persistence, monitoring or scheduler infrastructure.

---

# High Level Architecture

                    Frontend (React + Vite)
                               |
                               v
                        REST API (Express)
                               |
                +--------------+--------------+
                |                             |
          Authentication                Business Services
                |                             |
                +--------------+--------------+
                               |
                        Scraper Manager
                               |
          +--------------------+--------------------+
          |                    |                    |
      MAES Network           DATS24              Shell
          |                    |                    |
          +--------------------+--------------------+
                               |
                       Uniform Scraper Output
                               |
                       Validator Framework
                               |
                       Persistence Engine
                               |
                       Station Repository
                               |
                           stations_v2
                               |
                       Station Source Links
                               |
                    Station Price Resolver
                               |
                       REST API / Frontend

Supporting infrastructure:

- Scheduler
- Scheduler Run Repository
- Scheduler Monitor
- Health Registry
- Metrics Registry
- Capability Registry
- Rate Limiter
- Report Engine

---

# Core Data Architecture

FuelAlert separates source collection from station identity and price
resolution.

A scraper is responsible for collecting source-specific data.

The persistence layer stores the source record.

The station linking layer can connect records from different sources
when they represent the same physical station.

The price resolver can then determine which available source should be
used for the displayed price.

The resulting architecture is:

External Source
       |
       v
Scraper
       |
       v
Uniform Output
       |
       v
ScraperManager
       |
       v
Validator Framework
       |
       v
PersistenceEngine
       |
       v
StationRepository
       |
       v
stations_v2
       |
       +-------------> station_source_links
       |
       v
StationPriceResolver
       |
       v
REST API
       |
       v
Frontend

---

# DataSource Engine

The DataSource Engine is the central architecture for integrating
external fuel data sources.

Every active source uses the same execution, persistence, monitoring
and reporting infrastructure.

Current components include:

- Scraper Registry
- ScraperManager
- BaseScraper
- Capability Registry
- Validator Framework
- Persistence Engine
- Station Repository
- Station Source Link Repository
- Station Price Resolver
- Scheduler
- Scheduler Run Repository
- Scheduler Monitor
- Health Registry
- Metrics Registry
- Rate Limiter
- Report Engine

---

# Capability Registry

The Capability Registry describes what each data source supports.

Examples:

- Fuel prices
- Stations
- Coordinates
- Opening hours
- EV charging
- Promotions
- Services

The capability system allows future sources to expose additional
information without changing the core architecture.

Endpoint:

`/api/capabilities`

---

# Scheduler Engine

The Scheduler automatically executes the registered scraper workflow.

Responsibilities:

- Job scheduling
- Periodic execution
- Startup execution
- Background processing
- Starting the ScraperManager

Current production interval:

- 15 minutes
- 900000 ms

The scheduler executes the complete active scraper registry.

Current active scrapers:

- MAES_NETWORK
- DATS24
- SHELL

Endpoint:

`/api/scheduler`

---

# Scheduler Execution Flow

The scheduler executes:

Scheduler
   |
Registered Job
   |
ScraperManager.run()
   |
Active Scrapers
   |
PersistenceEngine
   |
StationRepository
   |
Database
   |
SchedulerRunRepository
   |
scheduler_runs
   |
Scheduler Monitor

The Scheduler does not contain source-specific scraper logic.

Source-specific logic remains inside the individual scraper.

---

# Scraper Registry

Active scrapers are registered in:

`backend/scrapers/registry.js`

Current active production scrapers:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

The registry provides the active scraper collection used by
`ScraperManager`.

Adding a new production scraper requires:

1. Implementing the scraper
2. Validating its output
3. Registering the scraper
4. Testing persistence
5. Testing scheduler execution
6. Activating the scraper

---

# Scraper Manager

The ScraperManager is responsible for executing all active scrapers.

File:

`backend/scrapers/ScraperManager.js`

Responsibilities:

- Execute active scrapers
- Execute scrapers through the common interface
- Handle scraper failures
- Update Health Registry
- Pass records to PersistenceEngine
- Generate execution summaries
- Register scheduler run results
- Prevent smoke tests from creating scheduler history records

Scrapers are executed through the common ScraperManager architecture.

---

# Smoke Test Behaviour

The ScraperManager supports a `smokeTest` mode.

Smoke tests can execute the complete scraper pipeline without creating
persistent scheduler history records.

When:

`smokeTest = true`

the scraper execution can still:

- Execute scrapers
- Validate records
- Persist test data when requested
- Generate execution reports

but does not create records in:

`scheduler_runs`

Normal scheduler executions use:

`smokeTest = false`

and are recorded in the scheduler history.

---

# Uniform Scraper Output

All active scrapers return a common station record structure.

Core fields include:

- station_id
- brand
- name
- address
- postal_code
- city
- latitude
- longitude
- prices
- currency
- source
- updated_at

Fuel naming differences between sources are normalized before or during
persistence.

Examples:

MAES:

- benzine95
- benzine98
- diesel
- lpg

DATS24:

- e95
- e98
- diesel
- lpg
- cng
- adblue

Shell:

- benzine95
- benzine98
- diesel
- lpg
- cng
- adblue

A fuel field may contain `NULL` when the source does not provide that
fuel.

---

# Current Scrapers

## MAES Network

Source identifier:

`MAES_NETWORK`

Status:

Production Ready

Current station coverage:

Approximately 275 records in the active scraper output.

The MAES scraper collects live station information from the MAES
network.

The scraper is integrated into:

- ScraperManager
- PersistenceEngine
- Scheduler
- Health Registry
- Metrics Registry
- Scheduler Monitor

---

## DATS24

Source identifier:

`DATS24`

Status:

Production Ready

Current station coverage:

Approximately 147 stations in the active scraper output.

The DATS24 scraper collects station and fuel price information from
DATS24 station pages and associated station data.

The scraper is integrated into:

- ScraperManager
- PersistenceEngine
- Scheduler
- Health Registry
- Metrics Registry
- Scheduler Monitor

---

## Shell

Source identifier:

`SHELL`

Status:

Production Ready

Current station coverage:

200 official Shell station records.

The Shell scraper retrieves official Shell station information and
official Shell price information.

The Shell scraper is integrated into the same architecture as MAES and
DATS24.

The Shell scraper uses the official Shell Belgium price update source
for its official price dataset.

The current implementation also supports linking Shell stations to
corresponding MAES Network station records when a verified station
match exists.

This allows FuelAlert to use live MAES network prices for a physical
Shell station when the station is represented in both sources.

---

# Shell -> MAES Station Linking

FuelAlert contains a dedicated station source linking mechanism.

Database table:

`station_source_links`

Repository:

`backend/repositories/StationSourceLinkRepository.js`

The purpose of this system is to connect station records from
different data sources that represent the same physical station.

The link contains information such as:

- source_a
- station_id_a
- source_b
- station_id_b
- distance_m
- match_type
- confidence
- active
- created_at
- updated_at

---

# Station Source Matcher

The station source matcher automatically searches for compatible
station records between sources.

The current Shell -> MAES matching process uses geographic station
coordinates as the primary matching mechanism.

The matcher evaluates:

- Geographic distance
- Station identity
- Source
- Station coordinates
- Match confidence

Current Shell matching validation has established:

- 200 official Shell stations
- 78 MAES Shell records
- 35 verified matches
- 43 MAES Shell records without an official Shell match

The verified matches are stored in:

`station_source_links`

A uniqueness check ensures that one official Shell station is not
linked to multiple active MAES records.

---

# StationSourceLinkRepository

File:

`backend/repositories/StationSourceLinkRepository.js`

Responsibilities:

- Find an existing station link
- Create or update links
- Find links for a station
- Find all active links
- Deactivate links

The repository provides the persistence layer for cross-source station
relationships.

Active links can be retrieved using:

`findAllActive()`

Station-specific links can be retrieved using:

`findByStation()`

---

# Station Price Resolver

File:

`backend/services/StationPriceResolver.js`

The Station Price Resolver determines which price source should be
used when a station has multiple available data sources.

This separates:

- Station identity
- Source identity
- Source linking
- Price selection

For a Shell station with a valid MAES link, the resolver can select
the live MAES Network price.

The resolver exposes information about:

- Resolved prices
- Price source
- Price priority
- Linked station
- Source prices
- Fallback usage

---

# Price Resolution Priority

The resolver supports source-aware price selection.

For a linked Shell station:

Linked live source
        |
Official station source
        |
Original stored price

When a valid MAES live link exists, the MAES live price can take
priority for the linked Shell station.

Example:

`price_source = maes_network_live_scraper`

`price_priority = linked_live`

A Shell station without a MAES link uses:

`price_source = shell_official_scraper`

`price_priority = official`

This mechanism prevents unrelated stations from inheriting prices from
other sources.

---

# Fallback Behaviour

If a linked live source does not provide a particular fuel price, the
resolver can retain the corresponding price from the original station
source.

Example:

MAES live:
diesel = value
e95 = value
e98 = NULL

Shell official:
diesel = value
e95 = value
e98 = value

Resolved:

diesel = MAES
e95    = MAES
e98    = Shell fallback

This prevents missing values in one source from unnecessarily removing
available values from another source.

---

# Validator Engine

The Validator Engine is responsible for validating scraper output
before database persistence.

Current validation architecture includes:

- Price Validator
- GPS Validator
- Address Validator
- Duplicate Validator

Validation responsibilities include:

- Missing prices
- Invalid prices
- Invalid coordinates
- Invalid addresses
- Duplicate stations
- Suspicious records
- Data quality checks

The validator framework uses a common validator interface.

The validation layer is designed to be extended with additional
validators without changing the scraper architecture.

---

# Persistence Architecture

Scrapers do not write directly to MySQL.

Architecture:

Scraper
   |
ScraperManager
   |
Validator Framework
   |
PersistenceEngine
   |
StationRepository
   |
stations_v2

Files:

`backend/persistence/PersistenceEngine.js`

`backend/repositories/StationRepository.js`

---

# PersistenceEngine

The Persistence Engine processes scraper records.

For each valid record it calls the StationRepository.

The persistence result is counted as:

- inserted
- updated
- skipped
- duplicates
- errors

The execution duration is also recorded.

The PersistenceEngine provides a common persistence mechanism for all
active data sources.

---

# StationRepository

The StationRepository is responsible for storing station data.

Database table:

`stations_v2`

The station identifier is:

`station_id`

The repository performs:

Find station
     |
     +-- Not found -> INSERT
     |
     +-- Found     -> UPDATE

The repository abstracts direct SQL station persistence from the rest
of the application.

---

# Database

The primary V2 station table is:

`stations_v2`

Important fields include:

- id
- station_id
- brand
- name
- address
- postal_code
- city
- latitude
- longitude
- benzine95
- benzine98
- diesel
- lpg
- cng
- adblue
- currency
- source
- website
- operator
- active
- last_update
- last_price_change
- created_at
- updated_at

Fuel-specific fields may contain `NULL` when a particular station does
not provide that fuel.

---

# Station Source Links Database

Cross-source station relationships are stored separately from
`stations_v2`.

Table:

`station_source_links`

This table prevents source-specific station identifiers from being
mixed into the main station identity.

This architecture allows future sources to be linked without changing
the station table structure.

---

# Brandstof Mapping

The persistence and resolution layers support different naming
conventions used by individual data sources.

DATS24:

`e95 -> benzine95`

`e98 -> benzine98`

MAES:

`benzine95 -> benzine95`

`benzine98 -> benzine98`

Shell:

`benzine95 -> benzine95`

`benzine98 -> benzine98`

This allows multiple scrapers to use the same database structure.

---

# Health Registry

The Health Registry provides live source health information.

The ScraperManager updates the registry after each scraper execution.

Tracked information includes:

- Status
- Number of stations
- Errors
- Success rate

Current statuses:

- ONLINE
- OFFLINE

Endpoint:

`/api/health`

---

# Metrics Registry

The Metrics Registry collects scraper execution information.

Tracked metrics include:

- Runtime
- Average duration
- Total executions
- Failed executions
- Stations processed
- Inserted records
- Updated records
- Skipped records
- Duplicate records
- Errors

Endpoint:

`/api/metrics`

---

# Rate Limiter

The Rate Limiter protects external data sources.

Responsibilities:

- Delay requests
- Retry strategy
- Prevent blocking
- Respect source limitations
- Control concurrent requests
- Configure request timeouts

Current configuration includes:

MAES_NETWORK:

- delay: 1500 ms
- retries: 3
- timeout: 30000 ms
- concurrent: 1

DATS24:

- delay: 500 ms
- retries: 3
- timeout: 30000 ms
- concurrent: 1

The Rate Limiter is designed so additional sources can receive
source-specific configurations.

---

# Report Engine

The Report Engine generates standardized scraper execution reports.

Reports contain:

- Source
- Success status
- Station count
- Inserted records
- Updated records
- Skipped records
- Duplicate records
- Errors
- Duration

This provides a common operational view for all data sources.

---

# Scheduler Run Repository

Every normal scraper execution is registered in:

`scheduler_runs`

File:

`backend/repositories/SchedulerRunRepository.js`

Stored information includes:

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

Smoke-test executions do not create scheduler history records.

---

# Scheduler Monitor

The Scheduler Monitor provides realtime monitoring of scraper
execution.

Backend route:

`backend/routes/schedulerMonitorRoutes.js`

Repository:

`backend/repositories/SchedulerRunRepository.js`

Frontend:

`src/pages/SchedulerMonitor.jsx`

Functionaliteiten:

- Live refresh
- Runs today
- Success statistics
- Failed statistics
- Average duration
- Latest executed run
- Number of stations
- Number of updated records
- Error count
- Scheduler history
- Pagination
- Per-scraper filtering
- Separate scraper history

Current scraper histories:

- MAES_NETWORK
- DATS24
- SHELL

Backend endpoint:

`/api/scheduler-monitor`

The endpoint supports scraper filtering.

Example:

`/api/scheduler-monitor?scraper=SHELL&page=1`

The API returns:

- pagination
- summary
- runs

Pagination includes:

- page
- limit
- totalRuns
- totalPages

---

# Scheduler Monitor Data Flow

Scheduler
    |
ScraperManager
    |
Scraper
    |
PersistenceEngine
    |
SchedulerRunRepository
    |
scheduler_runs
    |
Scheduler Monitor API
    |
React Scheduler Monitor

The monitor reads actual scheduler execution history from the database
rather than relying only on temporary runtime state.

---

# Scheduler History

The scheduler history records complete production scraper executions.

Example:

SHELL
stations: 200
updated: 200
status: SUCCESS

DATS24
stations: 147
updated: 147
status: SUCCESS

MAES_NETWORK
stations: 275
updated: 275
status: SUCCESS

A successful execution is visible independently for every active
source.

---

# Scheduler Configuration

The backend scheduler is initialized when the API server starts.

Current production job:

`Fuel Scrapers`

Interval:

`15 minutes`

The job executes:

- MAES_NETWORK
- DATS24
- SHELL

The scheduler uses the same ScraperManager as manual and diagnostic
executions.

---

# Data Flow

Complete data flow:

External Source
      |
Scraper
      |
Uniform Output
      |
ScraperManager
      |
Validator Framework
      |
PersistenceEngine
      |
StationRepository
      |
stations_v2
      |
StationSourceLinkRepository
      |
StationPriceResolver
      |
REST API
      |
Frontend

Monitoring flow:

Scheduler
      |
ScraperManager
      |
Scraper
      |
PersistenceEngine
      |
SchedulerRunRepository
      |
scheduler_runs
      |
Scheduler Monitor API
      |
React Scheduler Monitor

---

# REST API

Current relevant endpoints include:

`/api/fuel-prices`
`/api/stations`
`/api/capabilities`
`/api/health`
`/api/metrics`
`/api/validation`
`/api/persistence`
`/api/scheduler`
`/api/scheduler-monitor`

Authentication endpoints include:

`/api/auth/register`
`/api/auth/verify-email`
`/api/auth/login`
`/api/auth/forgot-password`
`/api/auth/reset-password`

---

# Frontend Architecture

The frontend communicates with the backend through REST endpoints.

Current frontend components include:

- Dashboard
- Stations
- Map
- Authentication
- Scheduler Monitor

The Scheduler Monitor consumes the scheduler monitor API and displays
the execution history of the active scraper infrastructure.

---

# Scalability

Adding a new data source should require:

1. New scraper
2. Registration
3. Configuration
4. Validation
5. Persistence testing
6. Scheduler testing
7. Monitoring verification
8. Activation

The existing architecture automatically provides:

- Scraper execution
- Persistence
- Health monitoring
- Metrics
- Scheduler history
- Scheduler monitoring
- Reporting

A new source should not require a new persistence architecture.

---

# Current Production Sources

| Source | Status | Stations | Method |
|---|---|---:|---|
| MAES Network | Production Ready | 275 | Sitemap + HTML + embedded data |
| DATS24 | Production Ready | 147 | HTML + embedded station data |
| Shell | Production Ready | 200 | Official Shell station data + official price dataset |

The station counts represent the current scraper output and can change
when source coverage changes.

---

# Source Linking Status

Current cross-source linking:

| Source A | Source B | Status | Matches |
|---|---|---|---:|
| MAES_NETWORK | SHELL | Active | 35 |

The current Shell/MAES matching validation found:

- 200 official Shell stations
- 78 MAES Shell stations
- 35 verified geographic matches
- 43 MAES Shell records without an official Shell match

Active links are stored in:

`station_source_links`

The system also performs a uniqueness check to ensure that an official
Shell station does not have multiple active MAES links.

---

# Official Data Sources

FuelAlert supports both scraper-based and official data integrations.

Current status:

| Source | Status |
|---|---|
| MAES | Working |
| DATS24 | Working |
| Shell | Working |
| ESSO | No official public API found |
| Fuel Media Service | Contacted |
| CARBU API | Commercial |

Official APIs are preferred whenever they are available and suitable
for the required data.

---

# Development Sources

Potential or future sources include:

- Gabriëls
- Q8
- Esso
- TotalEnergies
- Fuel Media Service

A source is not considered production-ready until:

1. Data collection works reliably
2. Output passes validation
3. Persistence works correctly
4. Duplicate behaviour is verified
5. Scheduler execution works
6. Monitoring works
7. Source-specific failure behaviour is tested

---

# Data Quality Strategy

FuelAlert does not assume that all external source data is equally
reliable.

The architecture therefore separates:

- Source collection
- Validation
- Persistence
- Station linking
- Price resolution
- Presentation

This allows the platform to use the most appropriate available source
without losing the original source information.

---

# Source Priority Strategy

FuelAlert distinguishes between:

- Original source data
- Linked live source data
- Official source data
- Fallback data

The StationPriceResolver determines which price should be exposed to
the application.

The original station record remains stored in `stations_v2`.

Cross-source relationships are stored separately in
`station_source_links`.

This ensures that source data remains traceable.

---

# Fail-Safe Architecture

A scraper failure must not bring down the complete scraper system.

ScraperManager executes active scrapers independently.

The architecture uses `Promise.allSettled()` so one failing scraper does
not automatically prevent other scrapers from completing.

A failed scraper:

- Is marked OFFLINE in HealthRegistry
- Generates an error log
- Produces a FAILED execution summary
- Creates a FAILED scheduler history record during normal execution

Other successful scrapers can continue operating.

---

# Monitoring-First Architecture

Every production scraper is expected to provide operational visibility.

The architecture therefore tracks:

- Execution status
- Station count
- Updated records
- Inserted records
- Skipped records
- Duplicate records
- Errors
- Duration
- Historical runs

This allows failures and source degradation to be detected without
manually inspecting scraper code.

---

# Future Modules

Planned additions:

- Verified Station Portal
- Fleet Platform
- Analytics Engine
- Prediction Engine
- AI-assisted Validation
- Developer API
- Premium Services
- Notification Engine
- Price History
- Additional source linking
- Advanced source prioritisation

---

# Migration Strategy

FuelAlert is being migrated toward the V2 architecture.

The V2 architecture uses:

- `stations_v2`
- ScraperManager
- Validator Framework
- PersistenceEngine
- Repository Pattern
- Scheduler
- SchedulerRunRepository
- Scheduler Monitor
- Station Source Links
- Station Price Resolver

The old station/database architecture remains isolated until all
required functionality has been migrated and validated.

The old architecture must not be removed until:

1. All required production scrapers operate on V2
2. Station coverage has been validated
3. Price accuracy has been validated
4. REST endpoints use the new data model
5. Frontend migration is complete
6. Scheduler V2 is fully operational
7. Historical data requirements have been addressed

---

# Guiding Principle

FuelAlert is no longer developed as a collection of independent
scrapers.

FuelAlert is a modular DataSource Platform where every data source
integrates with the same architecture.

Every architectural decision must improve:

- Reliability
- Maintainability
- Scalability
- Extensibility
- Reusability
- Traceability
- Data quality
- Operational visibility
