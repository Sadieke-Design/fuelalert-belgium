# Fuel Scrapers

FuelAlert Belgium gebruikt een modulaire scraperarchitectuur waarbij iedere scraper
dezelfde uniforme recordstructuur teruggeeft. De scrapers worden beheerd door de
`ScraperManager` en automatisch uitgevoerd door de Scheduler.

## Scraper Status

| Brand        | Status             | Methode                      | Stations | Opmerking                          |
| ------------ | ------------------ | ---------------------------- | -------: | ---------------------------------- |
| MAES Network | ✅ Production Ready | Sitemap + HTML + JSON-LD     |      275 | Batch processing + uniforme output |
| DATS24       | ✅ Production Ready | HTML + embedded station JSON |      147 | Live prijzen, GPS en adresgegevens |
| Q8           | 🚧 Development     | Playwright                   |        - | Pending validation                 |
| ESSO Network | 🚧 Development     | -                            |        - | Nog niet actief in registry        |

## MAES Network

MAES Network is momenteel volledig geïntegreerd in de productiearchitectuur.

Eigenschappen:

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

De scraper ondersteunt het MAES-netwerk en de merken die via het MAES-netwerk
worden aangeboden.

## DATS24

DATS24 is volledig gevalideerd en toegevoegd aan de productieomgeving.

Eigenschappen:

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
- 147 records succesvol naar de database verwerkt
### DATS24 Data

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

Voorbeeld van de uniforme output:

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

### Kopieervak 3/3

```md
---

## Scraper Registry

Actieve productie-scrapers worden geregistreerd in:

`backend/scrapers/registry.js`

Momenteel actief:

- `MAES_NETWORK`
- `DATS24`

Niet-actieve scrapers worden niet door de `ScraperManager` uitgevoerd.

---

## Scraper Execution Flow

Elke actieve scraper wordt automatisch uitgevoerd via:

```text
Scheduler
    ↓
ScraperManager
    ↓
MAES_NETWORK / DATS24
    ↓
Uniforme station records
    ↓
PersistenceEngine
    ↓
StationRepository
    ↓
stations_v2