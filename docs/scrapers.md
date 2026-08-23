# Fuel Scrapers

FuelAlert Belgium gebruikt een modulaire scraperarchitectuur waarbij iedere scraper dezelfde uniforme recordstructuur teruggeeft.

De scrapers worden beheerd door de `ScraperManager` en automatisch uitgevoerd door de Scheduler.

Iedere actieve scraper maakt gebruik van dezelfde infrastructuur:

Scheduler
↓
ScraperManager
↓
Scraper
↓
Uniforme output
↓
Validator Engine
↓
PersistenceEngine
↓
StationRepository
↓
stations_v2

Iedere normale scraper-run wordt bovendien geregistreerd in:

`scheduler_runs`

Smoke tests worden bewust niet geregistreerd in `scheduler_runs`.

---

# Scraper Status

| Brand | Status | Methode | Stations | Opmerking |
|---|---|---|---:|---|
| MAES Network | ✅ Production Ready | Sitemap + HTML + JSON-LD | 275 | Batch processing + uniforme output |
| DATS24 | ✅ Production Ready | HTML + embedded station JSON | 147 | Live prijzen, GPS en adresgegevens |
| SHELL | ✅ Production Ready | Officiële stationdata + Shell XLSX | 200 | Officiële prijzen + uniforme output |
| TEXACO | ✅ Production Ready | Officiële stationdata | 91 | Officiële station discovery + uniforme output |
| Q8 | ✅ Production Ready | Playwright + officiële Q8 prijs API | 469 | 213 stations met prijzen; 256 zonder beschikbare prijsdata |
| ESSO Network | ⏸ On Hold | - | - | Niet actief in registry |
| Gabriëls | ⏳ Planned | - | - | Nog niet ontwikkeld |
| Fuel Media Service | ⏳ Planned | API / externe bron | - | Nog niet geïmplementeerd |

---

# MAES Network

MAES Network is volledig geïntegreerd in de productiearchitectuur.

## Eigenschappen

- 275 stations gevonden
- 275 unieke station IDs
- Batch processing
- Sitemap discovery
- HTML parsing
- JSON-LD / embedded data waar beschikbaar
- Uniforme scraper-output
- Prijzen worden via de `PersistenceEngine` opgeslagen
- Automatische updates via de Scheduler
- Monitoring via de Scheduler Monitor
- Historiek via `scheduler_runs`

De scraper ondersteunt het MAES-netwerk en de merken die via het
MAES-netwerk worden aangeboden.

## Productievalidatie

De huidige productie-run levert:

- 275 stations
- 275 updates
- 0 inserts
- 0 skipped
- 0 duplicates
- 0 errors

MAES wordt automatisch uitgevoerd door de Scheduler.

---

# DATS24

DATS24 is volledig gevalideerd en actief in de productieomgeving.

## Eigenschappen

- 147 stations gevonden
- 147 unieke station IDs
- 147 stations met GPS
- 147 stations met volledig adres
- 146 stations met E95
- 146 stations met E98
- 146 stations met diesel
- 92 stations met CNG
- 87 stations met AdBlue
- 0 stations met LPG aangetroffen tijdens de validatierun
- Geen scraper-errors tijdens de validatierun
- 147 records succesvol naar `stations_v2` verwerkt
- Automatische updates via de Scheduler
- Monitoring via de Scheduler Monitor
- Historiek via `scheduler_runs`

## DATS24 Data

DATS24 publiceert de stationgegevens rechtstreeks in de HTML van de
stationpagina's.

De scraper leest onder andere:

- station ID
- naam
- straat
- huisnummer
- postcode
- gemeente
- latitude
- longitude
- beschikbaarheid
- operator
- brandstofprijzen

De gevonden gegevens worden omgezet naar de uniforme FuelAlert
stationstructuur.

## Voorbeeld uniforme output

```json
{
  "station_id": "108",
  "brand": "DATS24",
  "name": "Waregem",
  "address": "Gentseweg 568A",
  "city": "Waregem",
  "postal_code": "8793",
  "latitude": 50.90183,
  "longitude": 3.40718,
  "prices": {
    "diesel": 2.057,
    "e95": 1.726,
    "e98": 1.906,
    "lpg": null,
    "cng": 1.949,
    "adblue": 0.995
  },
  "currency": "EUR",
  "source": "dats24_live_scraper"
}
```

## Productievalidatie

De huidige gecontroleerde productie-run levert:

- 147 stations
- 147 updates
- 0 inserts
- 0 skipped
- 0 duplicates
- 0 errors

---

# TEXACO

Texaco is toegevoegd aan de actieve productie-scraperregistry.

## Eigenschappen

- 91 Belgische stations gevonden
- 91 uniforme stationrecords verwerkt
- Integratie met `PersistenceEngine`
- Integratie met `StationRepository`
- Automatische uitvoering via de Scheduler
- Monitoring via de Scheduler Monitor
- Historiek via `scheduler_runs`

## Productievalidatie

De huidige gecontroleerde productie-run levert:

- 91 stations
- 91 updates
- 0 inserts
- 0 skipped
- 0 duplicates
- 0 errors

Texaco gebruikt dezelfde centrale scraperpipeline als de andere
productiescrapers.

# SHELL

SHELL is toegevoegd als derde actieve productie-scraper.

De Shell scraper gebruikt officiële Shell-stationgegevens en het
officiële Shell-prijsbestand.

## Eigenschappen

- 200 officiële Shell-stations gevonden
- 200 unieke stationrecords verwerkt
- Officiële Shell stationdata
- Officieel Shell XLSX-prijsbestand
- Officiële prijsdatum wordt uit het XLSX-bestand gelezen
- Uniforme scraper-output
- Integratie met `PersistenceEngine`
- Integratie met `StationRepository`
- Automatische updates via de Scheduler
- Monitoring via de Scheduler Monitor
- Historiek via `scheduler_runs`

## Shell station discovery

De scraper verzamelt de officiële Shell-stations via de beschikbare
Shell-stationdata.

De huidige productie-run levert:

```text
Total unique stations: 200
Stations collected: 200
```

## Shell prijsbron

De Shell scraper haalt het officiële Shell-prijsbestand op.

Het bestand wordt als XLSX verwerkt.

Tijdens de huidige validatierun werd succesvol een Shell XLSX-bestand
opgehaald.

De scraper rapporteerde:

```text
XLSX downloaded successfully
Prices found: 6
Effective date: 2026-08-21
Prices collected: 6
```

De gevonden brandstofprijzen worden daarna gekoppeld aan de
stationrecords.

## Uniforme Shell output

Shell-records worden genormaliseerd naar dezelfde structuur als de
andere scrapers.

Voorbeeld:

```json
{
  "station_id": "12683847",
  "brand": "Shell",
  "name": "GILLY (SHELL EXPRESS)",
  "address": "CHAUSSEE DE FLEURUS 588",
  "postal_code": "6060",
  "city": "GILLY",
  "latitude": 50.431375,
  "longitude": 4.505363,
  "prices": {
    "diesel": 2.315,
    "e95": 1.936,
    "e98": 2.094,
    "lpg": 0.792,
    "cng": null,
    "adblue": null
  },
  "currency": "EUR",
  "source": "shell_official_scraper"
}
```

## Shell productievalidatie

De huidige gecontroleerde productie-run levert:

- 200 stations
- 200 updates
- 0 inserts
- 0 skipped
- 0 duplicates
- 0 errors

Shell is daarmee volledig opgenomen in de productie-ScraperManager
pipeline.

---

# Shell ↔ MAES Station Matching

FuelAlert ondersteunt cross-source station matching.

Dit betekent dat hetzelfde fysieke station in verschillende
databronnen aan elkaar kan worden gekoppeld.

De relaties worden opgeslagen in:

`station_source_links`

De repository hiervoor is:

`backend/repositories/StationSourceLinkRepository.js`

## Huidige Shell/MAES resultaten

Er zijn momenteel:

- 200 officiële Shell-stations
- 78 MAES Shell-stations
- 35 actieve Shell ↔ MAES matches
- 43 MAES Shell-stations zonder match

Er zijn 35 actieve Shell/MAES-links opgeslagen.

De matching gebruikt onder andere:

- geografische afstand
- stationidentiteit
- bron
- station ID
- confidence score

## Uniciteitscontrole

Er is een controle uitgevoerd op officiële Shell-stations met meerdere
MAES-koppelingen.

Resultaat:

```text
OK: geen officiële Shell-stations met meerdere Maes-koppelingen.
```

Iedere officiële Shell-station heeft daardoor maximaal één actieve
MAES-koppeling binnen de gecontroleerde dataset.

---

# StationSourceLinkRepository

Bestand:

`backend/repositories/StationSourceLinkRepository.js`

Deze repository beheert de relaties tussen stations uit verschillende
databronnen.

Beschikbare functies:

- `findLink()`
- `upsertLink()`
- `findByStation()`
- `findAllActive()`
- `deactivateLink()`

Belangrijke velden van een link:

- `source_a`
- `station_id_a`
- `source_b`
- `station_id_b`
- `distance_m`
- `match_type`
- `confidence`
- `active`

De links worden gebruikt door de prijsresolutie.

---

# StationPriceResolver

Bestand:

`backend/services/StationPriceResolver.js`

De `StationPriceResolver` bepaalt welke prijsbron voor een station
gebruikt wordt.

De resolver ondersteunt meerdere prijsprioriteiten.

## Linked live

Wanneer een Shell-station aan een betrouwbaar MAES-station gekoppeld
is, kan de actuele MAES-prijs worden gebruikt.

Voorbeeld:

```text
price_source:
maes_network_live_scraper

price_priority:
linked_live
```

De resolver bewaart daarnaast informatie over het gekoppelde station.

Voorbeeld:

```text
source: MAES_NETWORK
station_id: gilly-shell
distance_m: 6.11
confidence: 98.78
```

## Official

Wanneer een Shell-station geen MAES-link heeft, blijft de officiële
Shell-prijs de oorspronkelijke prijsbron.

Voorbeeld:

```text
price_source:
shell_official_scraper

price_priority:
official
```

## Original

Een station dat geen externe prijsbron nodig heeft, gebruikt zijn
oorspronkelijke prijsbron.

Voorbeeld:

```text
price_priority:
original
```

## Fallback

De resolver ondersteunt fallback per brandstof.

Wanneer een gekoppelde live bron geen prijs voor een bepaalde brandstof
levert, kan de oorspronkelijke bron voor die brandstof worden gebruikt.

Hierdoor gaat een bestaande prijs niet verloren wanneer een gekoppelde
bron slechts een deel van de brandstoffen aanbiedt.

---

# Scraper Registry

Actieve productie-scrapers worden geregistreerd in:

`backend/scrapers/registry.js`

Momenteel actief:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

Niet-actieve scrapers worden niet door de `ScraperManager` uitgevoerd.

De registry is het centrale activatiepunt voor productie-uitvoering.

Een nieuwe scraper wordt pas actief nadat deze in de registry is
opgenomen.

---

# Scraper Manager

Bestand:

`backend/scrapers/ScraperManager.js`

De `ScraperManager` is verantwoordelijk voor het uitvoeren van alle
actieve scrapers.

Taken:

- actieve scrapers ophalen
- scrapers uitvoeren
- scraperresultaten verwerken
- Health Registry bijwerken
- PersistenceEngine aanroepen
- execution summary genereren
- scheduler-runs registreren

De huidige actieve registry bevat vijf scrapers:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

Iedere scraper gebruikt dezelfde execution pipeline.

De actieve scrapers worden parallel uitgevoerd via de centrale
ScraperManager.

---

# Scraper Execution Flow

De productieflow is:

```text
Scheduler
    ↓
ScraperManager
    ↓
MAES_NETWORK / DATS24 / SHELL
    ↓
Uniforme station records
    ↓
Validator Engine
    ↓
PersistenceEngine
    ↓
StationRepository
    ↓
stations_v2
```

Monitoring:

```text
Scheduler
    ↓
ScraperManager
    ↓
Scraper
    ↓
SchedulerRunRepository
    ↓
scheduler_runs
    ↓
Scheduler Monitor API
    ↓
Scheduler Monitor frontend
```

---

# Scheduler

De Scheduler voert alle actieve scrapers automatisch uit.

Bestand:

`backend/scheduler/Scheduler.js`

Huidige productieconfiguratie:

```text
Interval: 15 minuten
Interval in ms: 900000
```

Bij backend startup:

1. Scheduler wordt gestart.
2. De eerste uitvoering vindt direct plaats.
3. Daarna wordt iedere 15 minuten een nieuwe run uitgevoerd.

De huidige schedulerjob is:

```text
Fuel Scrapers
```

Deze job start alle scrapers uit de actieve registry:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

---

# Scheduler Run Historiek

Iedere normale scraper-run wordt opgeslagen in:

`scheduler_runs`

De registratie gebeurt via:

`backend/repositories/SchedulerRunRepository.js`

Per scraper wordt een afzonderlijk record opgeslagen.

Opgeslagen informatie:

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

Een succesvolle run krijgt:

```text
status = SUCCESS
```

Een mislukte run krijgt:

```text
status = FAILED
```

Smoke tests worden niet opgeslagen in `scheduler_runs`.

---

# Scheduler Monitor

De Scheduler Monitor toont de uitvoeringshistoriek van de actieve
scrapers.

Backend route:

`backend/routes/schedulerMonitorRoutes.js`

Repository:

`backend/repositories/SchedulerRunRepository.js`

Frontend:

`src/pages/SchedulerMonitor.jsx`

De monitor ondersteunt:

- Runs vandaag
- Success
- Failed
- Gemiddelde duur
- Laatste run
- Aantal stations
- Updated records
- Errors
- Historiek
- Pagination
- Filter per scraper
- Automatische refresh iedere 30 seconden

Beschikbare scraperhistoriek:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

---

# Rate Limiting

Externe databronnen worden beschermd door de centrale RateLimiter.

De RateLimiter ondersteunt:

- delay
- retries
- timeout
- concurrent requests

Voor de actieve productie-scrapers worden bron-specifieke instellingen
gebruikt.

Voorbeeld:

```text
MAES_NETWORK
delay: 1500 ms
retries: 3
timeout: 30000 ms
concurrent: 1

DATS24
delay: 500 ms
retries: 3
timeout: 30000 ms
concurrent: 1
```

Shell gebruikt zijn eigen scraperrequestflow en wordt eveneens via de
centrale ScraperManager uitgevoerd.

---

# Uniform Scraper Output

Alle actieve scrapers leveren een uniforme stationstructuur.

Core fields:

- `station_id`
- `brand`
- `name`
- `address`
- `postal_code`
- `city`
- `latitude`
- `longitude`
- `prices`
- `currency`
- `source`
- `updated_at`

Brandstofnamen kunnen per bron verschillen.

Voorbeelden:

MAES:

- `benzine95`
- `benzine98`
- `diesel`
- `lpg`

DATS24:

- `e95`
- `e98`
- `diesel`
- `lpg`
- `cng`
- `adblue`

Shell:

- `e95`
- `e98`
- `diesel`
- `lpg`

De PersistenceEngine normaliseert deze gegevens naar de
`stations_v2` structuur.

---

# Validation

Iedere scraper wordt door dezelfde validatie-infrastructuur verwerkt.

De validatorarchitectuur controleert onder andere:

- ontbrekende prijzen
- GPS-coördinaten
- adressen
- duplicaten
- ongeldige waarden
- datakwaliteit

De validatorresultaten worden meegenomen in de verwerking en
rapportage.

---

# Persistence

Scrapers schrijven niet rechtstreeks naar MySQL.

De architectuur is:

```text
Scraper
    ↓
ScraperManager
    ↓
PersistenceEngine
    ↓
StationRepository
    ↓
stations_v2
```

Bestanden:

`backend/persistence/PersistenceEngine.js`

`backend/repositories/StationRepository.js`

De PersistenceEngine rapporteert:

- inserted
- updated
- skipped
- duplicates
- errors
- duration

---

# Production Test

De huidige volledige productie-run is succesvol uitgevoerd.

Resultaat:

```text
MAES_NETWORK
Stations : 275
Updated  : 275
Errors   : 0

DATS24
Stations : 147
Updated  : 147
Errors   : 0

SHELL
Stations : 200
Updated  : 200
Errors   : 0

TEXACO
Stations : 91
Updated  : 91
Errors   : 0

Q8
Stations : 469
Updated  : 469
Errors   : 0
```

Totaal:

```text
1082 stationrecords verwerkt
0 errors
```

Belangrijk: het Q8-aantal van 469 betreft gevonden stations. Tijdens
dezelfde run hadden 213 stations beschikbare prijzen en 256 stations
geen beschikbare prijsdata. Dat is geen scraperfout.

De gecontroleerde volledige run is daarmee succesvol door:

- ScraperManager
- Validator Engine
- PersistenceEngine
- StationRepository
- stations_v2
- Scheduler
- scheduler_runs
- Scheduler Monitor

# Nieuwe Scrapers Toevoegen

Een nieuwe scraper toevoegen vereist:

1. Nieuwe scraperklasse
2. Uniforme output
3. Validatie
4. Persistencecontrole
5. Registratie in `registry.js`
6. Scheduler-integratie via ScraperManager
7. Rate limiting indien nodig
8. Productietest
9. Scheduler Monitor controle
10. Documentatie in deze file

De bestaande architectuur zorgt daarna automatisch voor:

- execution
- validation
- persistence
- health monitoring
- metrics
- scheduler monitoring
- historiek

---

# Toekomstige Scrapers

Gepland:

- Gabriëls
- TotalEnergies
- Lukoil
- Gulf
- Avia
- Fuel Media Service

On hold:

- Esso

Q8 en Texaco zijn inmiddels actieve productie-scrapers en staan daarom
niet meer in de toekomstige of on-hold lijst.

Nieuwe bronnen worden pas als Production Ready gemarkeerd nadat:

- de bron betrouwbaar werkt
- de data gevalideerd is
- de persistence succesvol is
- de scheduler succesvol draait
- de monitoring correct werkt
- de resultaten gecontroleerd zijn

---

# Scraper Architectuur Principe

FuelAlert wordt niet opgebouwd als een verzameling losse scrapers.

Iedere scraper is een plug-in binnen dezelfde DataSource Engine.

De architectuur is:

```text
                 DATA SOURCE ENGINE
                         │
                 ┌───────┴────────┐
                 │                │
             Scheduler        Registry
                 │                │
                 └───────┬────────┘
                         │
                   ScraperManager
                         │
          ┌──────────────┼──────────────┐
          │              │              │
        MAES           DATS24         SHELL
          │              │              │
          └──────────────┼──────────────┘
                         │
                 Uniform Output
                         │
                  Validator Engine
                         │
                 PersistenceEngine
                         │
                  StationRepository
                         │
                     stations_v2
```

Cross-source prijsresolutie:

```text
Shell Station
     │
     ↓
station_source_links
     │
     ↓
MAES Station
     │
     ↓
StationPriceResolver
     │
     ├── linked_live → MAES live prijs
     │
     └── fallback → officiële Shell prijs
```

Dit zorgt ervoor dat toekomstige scrapers dezelfde infrastructuur
kunnen gebruiken zonder nieuwe scheduler-, persistence- of
monitoringarchitectuur te bouwen.

---

# Status

Laatste gecontroleerde versie:

**FuelAlert Belgium — 23 augustus 2026**

Actieve productie-scrapers:

- MAES_NETWORK
- DATS24
- SHELL
- TEXACO
- Q8

Recente gecontroleerde stationrecords:

**1082**

Productiefouten tijdens de laatste volledige run:

**0**

Q8 prijsdekking tijdens de laatste volledige run:

- 469 stations gevonden
- 213 stations met prijzen
- 256 stations zonder beschikbare prijzen
- 39 stationpagina's zonder gevonden Q8-code

Deze aantallen zijn momentopnames en kunnen wijzigen wanneer de
bronnen hun stationdekking of prijsbeschikbaarheid wijzigen.
