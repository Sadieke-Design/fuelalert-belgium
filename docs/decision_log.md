# Decision Log

---

## 2026-07-25

### DEC-001 — MAES Batch Processing

**Beslissing**

De MAES scraper verwerkt niet langer alle URLs gelijktijdig.

**Reden**

- Minder geheugenverbruik.
- Minder kans op rate limiting.
- Betere stabiliteit.
- Schaalbaar voor grote netwerken.

**Implementatie**

- Batch processing.
- Batchgrootte: 20 requests.

---

## 2026-07-26

### DEC-002 — Official Fuel Data Sources

**Context**

FuelAlert vereist betrouwbare Belgische brandstofprijzen.

Onderzocht:

- Eigen scrapers
- Officiële API's
- Commerciële databronnen

**Onderzoek**

Geanalyseerd:

- Esso Belgium
- ExxonMobil
- CARBU
- Fuel Media Service

**Beslissing**

FuelAlert blijft een multi-source platform.

Prioriteit:

1. Officiële API's
2. Eigen scrapers
3. Commerciële databronnen

Geen verdere reverse engineering zolang Fuel Media Service nog in gesprek is.

Status:

- Wacht op antwoord Fuel Media Service.

---

## DEC-003 — Modulaire DataSource Engine

De DataSource Engine wordt volledig modulair opgebouwd.

Nieuwe componenten worden eerst generiek ontwikkeld voordat nieuwe scrapers worden toegevoegd.

Volgorde:

1. Capability Registry
2. Scheduler
3. Health Registry
4. Metrics Registry
5. Validator Engine
6. Persistence Engine
7. Repository Pattern
8. Rate Limiter
9. DataSource Manager

---

## DEC-004 — Uniform Scraper Output

Alle scrapers leveren exact hetzelfde recordformaat aan.

Hierdoor blijven validators, persistence en rapportage volledig generiek.

Scrapers bevatten geen databasespecifieke logica.

---

## DEC-005 — Validator Framework

Iedere validator implementeert dezelfde interface.

```javascript
{
    total,
    valid,
    invalid,
    success
}
```

Hierdoor kan ValidatorEngine volledig generiek werken.

---

## DEC-006 — Repository Pattern

Databasebewerkingen verlopen uitsluitend via StationRepository.

Scrapers communiceren nooit rechtstreeks met MySQL.

---

## DEC-007 — Persistence Layer

Alle opslag verloopt uitsluitend via PersistenceEngine.

PersistenceEngine bepaalt:

- insert
- update
- foutafhandeling
- statistieken
- rapportage

---

## DEC-008 — stations_v2

De nieuwe backend gebruikt uitsluitend `stations_v2`.

De bestaande tabel `stations` blijft voorlopig actief voor productie totdat alle scrapers zijn gemigreerd.

Hierdoor kunnen oud en nieuw parallel blijven draaien zonder risico.

---

## DEC-009 — V2 Migratiestrategie

De migratie gebeurt gefaseerd.

Fase 1

- Nieuwe scraperarchitectuur
- Validators
- Persistence
- Monitoring

Fase 2

- Alle scrapers migreren

Fase 3

- Frontend laten werken op `stations_v2`

Fase 4

- Oude cronjobs uitschakelen

Fase 5

- `stations` uit productie halen