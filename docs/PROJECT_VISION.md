# FuelAlert Belgium - Project Vision

Version: 1.0  
Status: Living Document  
Last Updated: 2026-07-26

---

# Vision

FuelAlert Belgium aims to become the most reliable and comprehensive fuel information platform in Belgium.

Rather than being only a fuel price comparison application, FuelAlert is designed as a scalable platform that combines multiple data sources, historical analysis, intelligent notifications and future premium services.

The long-term goal is to provide Belgian drivers with the most accurate, transparent and useful fuel information available.

---

# Mission

FuelAlert helps motorists save money by providing reliable, up-to-date and intelligent fuel price information.

Our focus is:

- Accuracy
- Reliability
- Transparency
- Speed
- User Experience

---

# Core Principles

## Official data first

Whenever official APIs are available, they are preferred over web scraping.

Priority:

1. Official APIs
2. Commercial Data Providers
3. Internal Scrapers

---

## Multi-source Architecture

FuelAlert never depends on a single data provider.

Every fuel price contains information about its origin.

Example:

- Source
- Confidence
- Last Update
- Validation Status

This makes the platform resilient against outages or website changes.

---

## Modular Design

Every component must be replaceable without affecting the rest of the system.

Examples:

- Scrapers
- Cache
- Scheduler
- Validators
- Notification Engine

Each module has a single responsibility.

---

## Scalability

New fuel brands should require minimal development effort.

The backend must support:

- New Scrapers
- New APIs
- New Fuel Types
- New Countries (future)

without architectural redesign.

---

# Product Roadmap

## Phase 8

Backend Stabilization

- Modular scraper framework
- Validation
- Scheduler
- Cache
- Reports
- Multi-source architecture

---

## Phase 9

User Experience

- Station search
- Interactive map
- Favorites
- Price history
- Filters

---

## Phase 10

Premium Platform

- Intelligent alerts
- Historical analytics
- Personal savings
- Market statistics

---

## Phase 11

Platform Expansion

- Public API
- Fleet Management
- White Label Solutions
- Business Dashboard

---

# Long-Term Vision

FuelAlert should evolve from a simple application into a national fuel information platform.

Future capabilities may include:

- Route-based fuel recommendations
- Price forecasting
- Fleet management
- EV charging information
- Consumption tracking
- Open developer API
- White-label platform
- AI-powered recommendations

---

# Quality Standards

Every new feature should satisfy the following principles:

- Maintainable
- Documented
- Tested
- Modular
- Scalable

Short-term shortcuts that compromise long-term maintainability should be avoided whenever possible.

---

# Technical Philosophy

The architecture should always prioritize:

Reliability over speed.

Maintainability over complexity.

Extensibility over shortcuts.

A feature implemented correctly once is preferable to repeatedly rewriting unstable implementations.

---

# Success Criteria

FuelAlert will be considered successful when it provides:

- Reliable nationwide station coverage
- Accurate fuel prices
- Stable update infrastructure
- Excellent mobile experience
- Intelligent fuel-saving features
- Sustainable architecture for future expansion

---

# Guiding Principle

FuelAlert is not built to become the largest fuel app.

FuelAlert is built to become the most trusted fuel platform in Belgium.

## Verified Station Portal (Future)

### Visie

FuelAlert Belgium zal in een latere fase een officieel partnerportaal aanbieden voor geverifieerde tankstationhouders en netwerkbeheerders.

Het doel is om een directe samenwerking met de Belgische tankstationsector op te bouwen, zodat actuele en betrouwbare informatie rechtstreeks door de eigenaar of netwerkbeheerder kan worden beheerd.

### Doelstellingen

- Stationhouders kunnen zelf hun actuele brandstofprijzen beheren.
- Prijswijzigingen worden onmiddellijk zichtbaar in FuelAlert.
- Geverifieerde prijzen krijgen een hogere betrouwbaarheidsscore dan gebruikersmeldingen.
- Eigenaars kunnen bijkomende informatie over hun station beheren.
- Netwerkbeheerders kunnen meerdere stations vanuit één account beheren.

### Mogelijke functionaliteiten

#### Brandstof

- Brandstofprijzen
- Beschikbare brandstoffen
- Tijdelijke promoties

#### Stationinformatie

- Openingsuren
- Contactgegevens
- Foto's
- Diensten
- Carwash
- Shop
- Restaurant
- Truck parking
- Toiletten
- Luchtpomp

#### Alternatieve brandstoffen

- EV-laders
- AdBlue
- HVO100
- CNG
- LNG
- Waterstof

#### Meldingen

- Tijdelijke sluiting
- Werken aan het station
- Defecte pompen
- Tijdelijke acties
- Belangrijke mededelingen

### Authenticatie

Toegang tot het portaal gebeurt uitsluitend na verificatie.

Mogelijke verificatiemethoden:

- Bedrijfsregistratie
- BTW-validatie
- Controle door FuelAlert
- Admin-goedkeuring

Een gebruiker krijgt uitsluitend toegang tot de stations waarvoor hij eigenaar of gemachtigde beheerder is.

### Prioriteit van databronnen

FuelAlert gebruikt steeds de meest betrouwbare beschikbare databron.

1. Officiële API's
2. Geverifieerde netwerkbeheerders
3. Geverifieerde stationhouders
4. Eigen scrapers
5. Gebruikersmeldingen

### Langetermijnvisie

FuelAlert Belgium wil uitgroeien tot het meest complete platform voor Belgische tankstationinformatie.

Naast actuele brandstofprijzen zal het platform ook uitgebreide stationinformatie, officiële partnerschappen en een professioneel beheerportaal aanbieden voor de Belgische tankstationsector.
