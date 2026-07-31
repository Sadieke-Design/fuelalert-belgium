# FuelAlert Belgium - System Architecture

Version: 2.0
Status: Living Document
Last Updated: 2026-07-31

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

Capability      Scheduler      Health      Metrics

Registry         Engine        Engine       Engine

       │              │              │              │

       └──────────────┴──────────────┴──────────────┘

                      DataSource Manager

                                   │

                          Scraper Manager

                                   │

        ┌─────────────┬──────────────┬───────────────┐
        │             │              │               │

     MAES        Gabriëls      TotalEnergies   Fuel Media

                                   │

                            Validation Engine

                                   │

                             Cache Engine

                                   │

                            Persistence Layer

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

✅ Capability Registry

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

✅ Scheduler Engine

Automatically executes registered data sources.

Responsibilities:

- Job scheduling
- Periodic execution
- Startup execution
- Background processing

Endpoint:

/api/scheduler

---

✅ Health Engine

Continuously monitors all data sources.

Tracks:

- Status
- Last execution
- Number of stations
- Errors
- Success rate

Endpoint:

/api/health

---

⏳ Metrics Engine

Will collect:

- Runtime
- Average duration
- Total executions
- Failed executions
- Stations processed
- Historical performance

Future endpoint:

/api/metrics

---

⏳ Validator Engine

Responsible for:

- Missing prices
- Invalid coordinates
- Duplicate stations
- Suspicious prices
- Invalid addresses
- Data quality scoring

---

⏳ Cache Engine

Responsible for:

- Temporary storage
- Reduced website load
- Faster updates
- Cached API responses

---

⏳ Rate Limiter

Protects external data sources.

Responsibilities:

- Delay requests
- Retry strategy
- Prevent blocking
- Respect source limitations

---

⏳ DataSource Manager

Acts as the intelligence layer.

Chooses the best available data source based on:

1. Official APIs
2. Commercial providers
3. Official websites
4. Verified station owners
5. Community reports

---

# Backend Layers

FuelAlert separates every responsibility into independent layers.

API Layer

- Authentication
- Authorization
- REST endpoints
- Validation
- Responses

Business Layer

- Business rules
- Scheduling
- Orchestration
- Notifications

DataSource Layer

- Source management
- Source prioritisation
- Source selection

Scraper Layer

Every scraper implements BaseScraper.

Examples:

- MAES Network
- Gabriëls
- TotalEnergies
- Fuel Media API

Validation Layer

- Data validation
- Duplicate detection
- Quality control

Persistence Layer

- Database writes
- Updates
- Transactions
- History

---

# Scheduler Flow

Scheduler

↓

Registered Job

↓

Scraper Manager

↓

Parallel Scrapers

↓

Validation Engine

↓

Persistence Layer

↓

Health Engine

↓

Metrics Engine

↓

Reports

---

# Capability Registry

Every scraper registers its own capabilities.

Example:

MAES

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

Future information:

- Last run
- Next run
- Duration
- Average duration
- Success rate
- Error count

---

# Metrics Engine

Future metrics include:

- Total executions
- Failed executions
- Average runtime
- Processed stations
- Historical trends

---

# Reports

Every execution can generate reports.

Examples:

- Validation Report
- Health Report
- Performance Report
- Import Report

---

# Data Flow

External Source

↓

Scraper

↓

Validation

↓

Cache

↓

Persistence

↓

Health

↓

Metrics

↓

REST API

↓

Frontend

---

# Scalability

Adding a new data source should require only:

1. New scraper
2. Registration
3. Configuration

Everything else is handled automatically by the DataSource Engine.

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