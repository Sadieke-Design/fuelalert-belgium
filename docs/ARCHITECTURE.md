## Architecture Principles

FuelAlert follows five core architectural principles:

1. Modularity
2. Multi-source data collection
3. Official APIs preferred over scraping
4. Fail-safe processing
5. Documentation-first development

# FuelAlert Belgium - Architecture

Version: 1.0
Status: Living Document
Last Updated: 2026-07-26

---

# Overview

FuelAlert Belgium is built as a modular platform designed to collect, validate, store and distribute fuel price information from multiple independent sources.

The architecture focuses on:

- Reliability
- Scalability
- Maintainability
- Modularity

---

# High Level Architecture

                    Frontend (React + Vite)

                             │

                     REST API (Express)

                             │

                    ┌────────┴─────────┐
                    │                  │
              Authentication      Public API

                             │

                     Business Logic

                             │

                    Scraper Manager

                             │

      ┌──────────────┬───────────────┬──────────────┐
      │              │               │              │

 MAES Scraper   Gabriëls     Shell      Fuel Media API

      │              │               │              │

      └──────────────┴───────────────┴──────────────┘

                             │

                        Validation

                             │

                           Cache

                             │

                        Persistence

                             │

                          MySQL

                             │

                        REST Endpoints

                             │

                          Frontend

---

# Backend Layers

FuelAlert separates responsibilities into independent layers.

## API Layer

Responsible for:

- Authentication
- REST endpoints
- Request validation
- Responses

---

## Business Layer

Responsible for:

- Business rules
- Scheduler
- Price updates
- Data orchestration

---

## Scraper Layer

Responsible for collecting data from external sources.

Each scraper implements the same interface.

Example:

BaseScraper

↓

MAES

Gabriëls

Shell

Fuel Media API

---

## Validation Layer

Checks:

- Missing prices
- Invalid stations
- Invalid coordinates
- Suspicious values
- Duplicate stations

---

## Cache Layer

Prevents unnecessary requests.

Responsibilities:

- Cache scraper results
- Reduce website load
- Faster updates

---

## Persistence Layer

Responsible for:

- Database writes
- Updates
- Transactions
- History

---

# Scheduler

The scheduler periodically starts enabled scrapers.

Future flow:

Scheduler

↓

Scraper Manager

↓

Parallel Scrapers

↓

Validation

↓

Persistence

↓

Reports

---

# Scraper Manager

The Scraper Manager is responsible for:

- Loading scrapers
- Starting scrapers
- Error handling
- Metrics
- Logging

Future:

Automatic scraper discovery.

---

# Reports

Each execution generates reports.

Examples:

Validation Report

Health Report

Performance Report

Import Report

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

Database

↓

REST API

↓

Frontend

---

# Future Architecture

Planned modules:

- Notification Engine
- Analytics Engine
- Prediction Engine
- Fleet Platform
- Public API
- Premium Services

---

# Design Principles

Every module must:

- Have one responsibility
- Be independently testable
- Be replaceable
- Be documented

---

# Scalability

The architecture is designed so new fuel brands require minimal implementation.

Adding a new scraper should only require:

- New scraper folder
- Registration
- Configuration

without changing the rest of the system.

---

# Guiding Principle

FuelAlert is designed as a platform rather than a collection of independent scripts.

Every architectural decision should improve:

- Reliability
- Maintainability
- Extensibility