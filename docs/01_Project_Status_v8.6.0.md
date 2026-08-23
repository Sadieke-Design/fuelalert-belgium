# FuelAlert Belgium — Project Status

**Versie:** 8.7.0  
**Laatste update:** 23 augustus 2026  
**Status:** Development Release

---

# Backend

- ✅ Scheduler
- ✅ Scheduler run-lock tegen overlappende runs
- ✅ Monitoring
- ✅ Health Registry
- ✅ Repository Layer
- ✅ Persistence Engine
- ✅ Scheduler Monitor API
- ✅ Pagination
- ✅ ScraperManager
- ✅ Validator Engine
- ✅ Metrics Registry
- ✅ Report Engine
- ✅ Rate Limiter
- ✅ `stations_v2` databasepipeline
- ✅ `scheduler_runs`
- ✅ `station_source_links`
- ✅ `StationPriceResolver`
- ✅ Linked live price resolution
- ✅ Fallback naar officiële bronprijzen
- ✅ Deployment

---

# Scrapers

| Scraper       | Stations | Status                                    |
| ------------- | -------: | ----------------------------------------- |
| MAES Network  |      275 | ✅ Operationeel                           |
| DATS24        |      147 | ✅ Operationeel                           |
| SHELL         |      200 | ✅ Operationeel                           |
| TEXACO        |       91 | ✅ Operationeel                           |
| Q8            |      469 | ⚠️ Operationeel — prijsdekking verbeteren |
| Gabriëls      |        - | ⏳ Gepland                                |
| Esso          |        - | ⏳ Gepland                                |
| TotalEnergies |        - | ⏳ Gepland                                |
| Lukoil        |        - | ⏳ Gepland                                |

---

# Scraperarchitectuur

De actieve scrapers worden centraal geregistreerd in:

```text
backend/scrapers/registry.js
```

De huidige actieve scraperlijst:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

Iedere scraper gebruikt de centrale scraperarchitectuur:

```text
Scraper
    ↓
BaseScraper
    ↓
ValidatorEngine
    ↓
PersistenceEngine
    ↓
stations_v2
```

De volledige schedulerketen:

```text
Scheduler
    ↓
ScraperManager
    ↓
Alle actieve scrapers
    ↓
BaseScraper
    ↓
ValidatorEngine
    ↓
PersistenceEngine
    ↓
stations_v2
    ↓
scheduler_runs
    ↓
Scheduler Monitor
```

---

# MAES Network

De MAES Network scraper is operationeel.

Huidige stationset:

```text
275 stations
275 updated
0 errors
```

---

# DATS24

De DATS24 scraper is operationeel.

Huidige stationset:

```text
147 stations
147 updated
0 errors
```

---

# SHELL

De SHELL scraper is operationeel.

Huidige stationset:

```text
200 stations
200 updated
0 errors
```

De scraper gebruikt de officiële Shell-stationbron en de officiële
brandstofprijsbron.

---

# TEXACO

De TEXACO scraper is operationeel.

Huidige stationset:

```text
91 stations
91 updated
0 errors
```

---

# Q8

De Q8 scraper is operationeel en kan de volledige huidige Q8-stationset
verwerken.

Een volledige Q8-run leverde:

```text
469 Q8 stations gevonden
213 Q8 stations met prijzen
256 Q8 stations zonder prijzen
0 scraper errors
39 stations zonder gevonden Q8-code
```

De Q8-scraper gebruikt:

```text
Q8 officiële sitemap
        ↓
Q8 stationpagina's
        ↓
Q8 stationcode
        ↓
Q8 officiële prijs-API
        ↓
genormaliseerde FuelAlert records
```

De stationdiscovery is operationeel voor de volledige gevonden stationset.

De prijsdekking is momenteel nog niet volledig.

```text
STATION DISCOVERY:  OPERATIONEEL
STATION PERSISTENCE: OPERATIONEEL
SCHEDULER:           OPERATIONEEL
MONITORING:          OPERATIONEEL
PRICE COVERAGE:      IN DEVELOPMENT
```

---

# Huidige productiegegevens

De huidige actieve scraperbronnen leveren:

| Scraper                | Stations |
| ---------------------- | -------: |
| MAES Network           |      275 |
| DATS24                 |      147 |
| SHELL                  |      200 |
| TEXACO                 |       91 |
| Q8                     |      469 |
| **Totaal bronrecords** | **1182** |

**Let op:** 1182 bronrecords betekent niet automatisch 1182 unieke fysieke
tankstations. Eenzelfde fysiek tankstation kan door meerdere databronnen
worden aangeleverd.

---

# Scheduler

De actieve productie-scrapers worden automatisch uitgevoerd via de centrale
Scheduler.

**Interval:**

```text
15 minuten
```

De eerste uitvoering wordt automatisch gestart bij backend-startup.

De actieve scraperlijst:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

Iedere normale scraper-run wordt geregistreerd in:

```text
scheduler_runs
```

Smoke tests worden bewust niet geregistreerd in `scheduler_runs`.

---

# Scheduler Run-Lock

De Scheduler bevat een beveiliging tegen overlappende scraper-runs.

Wanneer een nieuwe geplande uitvoering plaatsvindt terwijl de vorige
uitvoering van dezelfde scheduler-job nog bezig is, wordt de nieuwe uitvoering
overgeslagen.

Dit voorkomt dat meerdere volledige scraperketens tegelijkertijd worden
gestart wanneer een scraper-run langer duurt dan het ingestelde interval.

---

# Scheduler Runs

Iedere normale scraper-run wordt opgeslagen in:

```text
scheduler_runs
```

Een run bevat onder andere:

- `scraper`
- `status`
- `stations`
- `inserted`
- `updated`
- `skipped`
- `duplicates`
- `errors`
- `duration_ms`
- `started_at`
- `finished_at`

Recente volledige run:

| Scraper      | Stations | Updated | Errors |
| ------------ | -------: | ------: | -----: |
| MAES Network |      275 |     275 |      0 |
| DATS24       |      147 |     147 |      0 |
| SHELL        |      200 |     200 |      0 |
| TEXACO       |       91 |      91 |      0 |
| Q8           |      469 |     469 |      0 |

---

# Scheduler Monitor

De Scheduler Monitor is operationeel.

Beschikbare functionaliteit:

- ✅ Laatste run per scraper
- ✅ Success-status
- ✅ Stations per run
- ✅ Updated records
- ✅ Errors
- ✅ Uitvoeringsduur
- ✅ Laatste uitvoertijd
- ✅ Historiek
- ✅ Pagination
- ✅ Filter per scraper
- ✅ Automatische refresh iedere 30 seconden
- ✅ Afzonderlijke scraperhistoriek

De monitor haalt de schedulerhistoriek uit:

```text
scheduler_runs
```

Het probleem waarbij Q8 in de Scheduler Monitor als `0` werd weergegeven
terwijl de scraper daadwerkelijk stations verwerkte, is opgelost.

Q8 wordt nu correct geregistreerd als:

```text
469 stations
469 updated
0 errors
```

---

# Monitoring

- ✅ Scheduler Monitor
- ✅ Live refresh iedere 30 seconden
- ✅ Success/Failed statistieken
- ✅ Gemiddelde uitvoeringsduur
- ✅ Laatste uitgevoerde run
- ✅ Historiek van scraper-runs
- ✅ Pagination
- ✅ Filteren per scraper
- ✅ Afzonderlijke scraperhistoriek

---

# Frontend

De huidige frontend bevat:

- ✅ Dashboard
- ✅ Stations
- ✅ Scheduler Monitor
- ⏳ Station Detail
- ⏳ Historiek per station
- ⏳ Kaartoptimalisatie
- ⏳ Volledige frontendmigratie naar `stations_v2`

De frontend is momenteel niet de eerste ontwikkelprioriteit.

De prioriteit ligt eerst bij het volledig bouwen, testen en stabiliseren van
alle scrapers.

---

# Admin

De PHP Admin bestaat en wordt apart verder ontwikkeld.

Nog verder uit te werken:

- ⏳ Admin Dashboard
- ⏳ Schedulerbeheer
- ⏳ Users
- ⏳ Analytics
- ⏳ Logs

---

# Cross-Source Architectuur

De backend bevat een centrale cross-source architectuur voor het koppelen van
stations uit verschillende databronnen.

Aanwezig:

- ✅ `station_source_links`
- ✅ Cross-source station matching
- ✅ Confidence score
- ✅ Afstandscontrole
- ✅ `StationPriceResolver`
- ✅ Linked live price resolution
- ✅ Fallback naar officiële bronprijzen

---

# Stationsdatabase

De stations worden verwerkt via de centrale `stations_v2` pipeline.

De scraperoutput wordt eerst genormaliseerd en gevalideerd.

Daarna:

```text
Scraper
    ↓
Normalized Record
    ↓
ValidatorEngine
    ↓
PersistenceEngine
    ↓
stations_v2
```

De persistence-laag registreert onder andere:

```text
inserted
updated
skipped
duplicates
errors
```

---

# Huidige ontwikkelstrategie

De ontwikkelvolgorde is bewust:

```text
SCRAPERS
    ↓
DATAKWALITEIT
    ↓
CROSS-SOURCE MATCHING
    ↓
STATIONSDATA
    ↓
API
    ↓
FRONTEND
```

De frontend mag geen onvolledige scraperlaag proberen te compenseren.

Daarom worden eerst de databronnen en scraperlaag afgewerkt.

---

# Volgende ontwikkelfase

## Alle scrapers volledig afronden

Huidige status:

1. ✅ MAES Network
2. ✅ DATS24
3. ✅ SHELL
4. ✅ TEXACO
5. ⚠️ Q8 — prijsdekking verbeteren
6. ⏳ Gabriëls
7. ⏳ Esso
8. ⏳ TotalEnergies
9. ⏳ Lukoil
10. ⏳ Overige relevante Belgische brandstofnetwerken

Per scraper moet worden gecontroleerd:

- station discovery
- station identifiers
- naam
- merk
- adres
- postcode
- stad
- latitude
- longitude
- brandstoftypes
- prijzen
- prijsdatum
- bron
- foutafhandeling
- rate limiting
- deduplicatie
- normalisatie
- validatie
- persistence
- scheduler registratie
- monitoring
- historische runs

Een scraper wordt pas als volledig afgerond beschouwd wanneer de volledige
keten betrouwbaar werkt.

---

# Daarna: Stationsmodule

Nadat de scraperlaag voldoende compleet en stabiel is, wordt de
Stationsmodule verder afgewerkt.

Daarna:

1. Volledige frontendmigratie naar `stations_v2`
2. Station Detail
3. Historiek per station
4. Kaartoptimalisatie
5. Favorieten
6. Prijsvergelijking
7. Verdere databronnen
8. Adminfunctionaliteiten
9. Premium functies

---

# Belangrijke architectuurregel

FuelAlert Belgium wordt verder ontwikkeld volgens:

```text
BRONNEN
   ↓
SCRAPERS
   ↓
NORMALISATIE
   ↓
VALIDATIE
   ↓
PERSISTENCE
   ↓
CROSS-SOURCE MATCHING
   ↓
STATIONSDATA
   ↓
API
   ↓
FRONTEND
```

De frontend mag geen onvolledige of onbetrouwbare scraperdata proberen te
compenseren.

---

# Huidige projectprioriteit

## PRIORITEIT 1

**Alle scrapers volledig operationeel en betrouwbaar maken.**

## PRIORITEIT 2

**Prijsdekking en datakwaliteit per scraper verbeteren.**

## PRIORITEIT 3

**Stationsdata en cross-source matching controleren en stabiliseren.**

## PRIORITEIT 4

**Stationsmodule en frontend volledig migreren naar de definitieve
stationsarchitectuur.**

## PRIORITEIT 5

**Historiek, kaart, favorieten en overige gebruikersfunctionaliteit.**

## PRIORITEIT 6

**Admin en premiumfunctionaliteiten.**
