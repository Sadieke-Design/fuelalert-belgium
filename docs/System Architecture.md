# FuelAlert Belgium - System Architecture

Version: 2.1
Status: Living Document
Last Updated: 2026-08-10

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

---

# Overview

FuelAlert Belgium is built as a modular data platform for collecting,
validating, storing and distributing Belgian fuel price information.

Instead of treating every scraper as an isolated component, every data
source is integrated into a common DataSource Engine.

The platform focuses on:

- Reliability
- Scalability
- Maintainability
- Modularity
- Extensibility

Current production data sources:

- MAES Network
- DATS24

---

# High Level Architecture

                    Frontend (React + Vite)

                               │

                       REST API (Express)

                               │

                 Authentication / Authorization

                               │

                        Business Services

                               │

                      DataSource Engine

                               │

        ┌──────────────┬──────────────┬──────────────┐
        │              │              │              │
   Capability      Scheduler        Health        Metrics
   Registry         Engine          Engine         Engine
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘

                         Scraper Manager

                               │

              ┌────────────────┴────────────────┐
              │                                 │
         MAES Network                         DATS24

              │                                 │
              └────────────────┬────────────────┘

                         Uniform Output

                               │

                       Persistence Engine

                               │

                       Station Repository

                               │

                             MySQL

                               │

                          REST Endpoints

                               │

                            Frontend

---

# DataSource Engine

The DataSource Engine is the heart of FuelAlert.

Every data source automatically integrates with the same infrastructure.

Current modules:

## Capability Registry

Describes what each data source supports.

Examples:

- Fuel prices
- Stations
- Coordinates
- Opening hours
- EV charging
- Promotions
- Services

---

## Scheduler Engine

Automatically executes registered data sources.

Responsibilities:

- Job scheduling
- Periodic execution
- Startup execution
- Background processing

Current production interval:

- 15 minutes
- First execution immediately after startup

Endpoint:

/api/scheduler

---

## Health Engine

Continuously monitors all data sources.

Tracks:

- Status
- Number of stations
- Errors
- Success rate

Current statuses:

- ONLINE
- OFFLINE

Endpoint:

/api/health

---

## Metrics Engine

Collects scraper execution information.

Tracks:

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

/api/metrics

---

## Validator Engine

Responsible for:

- Missing prices
- Invalid coordinates
- Duplicate stations
- Suspicious prices
- Invalid addresses
- Data quality scoring

Status:

Development / further expansion

---

## Cache Engine

Responsible for:

- Temporary storage
- Reduced website load
- Faster updates
- Cached API responses

Status:

Planned

---

## Rate Limiter

Protects external data sources.

Responsibilities:

- Delay requests
- Retry strategy
- Prevent blocking
- Respect source limitations
- Control concurrent requests
- Configure request timeouts

Status:

Active

---

## DataSource Manager

Acts as the intelligence layer.

Chooses the best available data source based on:

1. Official APIs
2. Commercial providers
3. Official websites
4. Verified station owners
5. Community reports

Status:

Planned
---

# Backend Layers

FuelAlert separates every responsibility into independent layers.

## API Layer

- Authentication
- Authorization
- REST endpoints
- Validation
- Responses

## Business Layer

- Business rules
- Scheduling
- Orchestration
- Notifications

## DataSource Layer

- Source management
- Source prioritisation
- Source selection

## Scraper Layer

Every scraper implements BaseScraper.

Current production scrapers:

- MAES Network
- DATS24

Development scrapers:

- Q8
- ESSO Network

## Validation Layer

- Data validation
- Duplicate detection
- Quality control

## Persistence Layer

- Database writes
- Inserts
- Updates
- Station upsert
- History

---

# Scraper Registry

Active scrapers are registered in:

backend/scrapers/registry.js

Current active production scrapers:

- MAES_NETWORK
- DATS24

New scrapers can be activated by registering them in the scraper registry.

---

# Scraper Manager

The ScraperManager is responsible for executing all active scrapers.

File:

backend/scrapers/ScraperManager.js

Responsibilities:

- Execute active scrapers
- Process scraper results
- Handle scraper failures
- Update Health Registry
- Pass records to PersistenceEngine
- Generate execution summaries
- Register scheduler run results

Scrapers are executed through the common ScraperManager architecture.

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

Fuel naming differences between sources are normalized by the
persistence layer.

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

---

# Persistence Architecture

Scrapers do not write directly to MySQL.

Architecture:

Scraper
   │
   ▼
ScraperManager
   │
   ▼
PersistenceEngine
   │
   ▼
StationRepository
   │
   ▼
stations_v2

Files:

backend/persistence/PersistenceEngine.js

backend/repositories/StationRepository.js

---

# PersistenceEngine

The Persistence Engine processes all scraper records.

For every record it calls:

StationRepository.upsert()

The result is counted as:

- inserted
- updated
- errors

The execution duration is recorded.

---

# StationRepository

The StationRepository is responsible for storing station data.

Database table:

stations_v2

The station identifier is:

station_id

station_id is unique.

The repository performs:

Find station
     │
     ├── Not found → INSERT
     │
     └── Found     → UPDATE

---

# Database

The primary station table is:

stations_v2

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

Fuel-specific fields may contain NULL when a particular station does
not provide that fuel.

---

# Brandstof Mapping

The persistence layer supports different naming conventions used by
individual data sources.

DATS24:

e95 → benzine95

e98 → benzine98

MAES:

benzine95 → benzine95

benzine98 → benzine98

This allows multiple scrapers to use the same persistence architecture.

---

# Scheduler Flow

Scheduler

↓

Registered Job

↓

Scraper Manager

↓

Active Scrapers

↓

Persistence Engine

↓

Station Repository

↓

MySQL

↓

Health Registry

↓

Scheduler Run Repository

↓

Reports / Monitoring

---

# Scheduler

The Scheduler is responsible for automatically executing all active
scrapers.

File:

backend/scheduler/Scheduler.js

Current production interval:

900000 ms

This equals:

15 minutes

At backend startup:

1. Scheduler starts.
2. First execution runs immediately.
3. Subsequent executions run every 15 minutes.

Current scheduler job:

Fuel Scrapers

The scheduler starts the ScraperManager, which executes:

- MAES_NETWORK
- DATS24
---

# Capability Registry

Every scraper registers its own capabilities.

Current production sources provide:

MAES:

- Prices
- Stations
- Coordinates

DATS24:

- Prices
- Stations
- Coordinates

Future sources may additionally support:

- Opening hours
- Promotions
- EV charging
- Carwash
- Shop
- Restaurant

Endpoint:

/api/capabilities

---

# Health Engine

The Health Engine provides live monitoring.

Current status:

- ONLINE
- OFFLINE

Tracked information:

- Status
- Number of stations
- Errors
- Success rate

Endpoint:

/api/health

---

# Metrics Engine

Metrics include:

- Total executions
- Failed executions
- Average runtime
- Processed stations
- Inserted records
- Updated records
- Skipped records
- Duplicate records
- Errors
- Historical performance

Endpoint:

/api/metrics

---

# Reports

Every execution can generate reports.

Examples:

- Validation Report
- Health Report
- Performance Report
- Import Report
- Scheduler Run Report

---

# Scheduler Run Repository

Every scraper execution is registered in:

scheduler_runs

File:

backend/repositories/SchedulerRunRepository.js

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

---

# Scheduler Monitor

The Scheduler Monitor is a realtime dashboard for scraper execution
monitoring.

Backend route:

backend/routes/schedulerMonitorRoutes.js

Repository:

backend/repositories/SchedulerRunRepository.js

Frontend:

src/pages/SchedulerMonitor.jsx

Functionaliteiten:

- Live refresh every 30 seconds
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
- Separate scraper history

Available scraper histories:

- MAES_NETWORK
- DATS24

---

# Data Flow

External Source

↓

Scraper

↓

Uniform Output

↓

ScraperManager

↓

PersistenceEngine

↓

StationRepository

↓

MySQL

↓

REST API

↓

Frontend

Monitoring flow:

Scheduler
    │
    ▼
ScraperManager
    │
    ▼
Scraper
    │
    ▼
SchedulerRunRepository
    │
    ▼
scheduler_runs
    │
    ▼
Scheduler Monitor API
    │
    ▼
React Scheduler Monitor

---

# Scalability

Adding a new data source should require:

1. New scraper
2. Registration
3. Configuration
4. Validation
5. Activation

The existing architecture handles:

- Scraper execution
- Persistence
- Health monitoring
- Metrics
- Scheduler monitoring

automatically.

---

# Current Production Sources

| Source | Status | Stations | Method |
|---|---|---:|---|
| MAES Network | ✅ Production Ready | 275 | Sitemap + HTML + embedded data |
| DATS24 | ✅ Production Ready | 147 | HTML + embedded station data |
| Q8 | 🚧 Development | - | Playwright |
| ESSO Network | 🚧 Development | - | Pending validation |

---

# Official Data Sources

FuelAlert supports both scraper-based and official API integrations.

Current status:

| Source | Status |
|---|---|
| MAES | ✅ Working |
| DATS24 | ✅ Working |
| ESSO | ⛔ No official public API found |
| Fuel Media Service | ⏳ Contacted |
| CARBU API | Commercial |

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

---

# Guiding Principle

FuelAlert is no longer developed as a collection of independent scrapers.

FuelAlert is a modular DataSource Platform where every data source
automatically integrates with the same architecture.

Every architectural decision must improve:

- Reliability
- Maintainability
- Scalability
- Extensibility
- Reusability