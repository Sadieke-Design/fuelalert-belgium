# FuelAlert Belgium API Documentation

**Versie:** 8.7.0  
**Laatste update:** 23 augustus 2026


---

# Dealer Price Override API

FuelAlert ondersteunt naast automatische scraperprijzen ook geverifieerde
dealerprijzen en dealerkortingen.

De dealerlaag staat bovenop de automatische prijslaag.

De prijsvolgorde is:

```text
Dealerprijs
    ↓
Dealerkorting
    ↓
Resolved scraper/source price
```

Een dealerwijziging overschrijft de oorspronkelijke scraperprijs niet.
De scraperprijs blijft beschikbaar als bronwaarde.

De uiteindelijke prijs die aan de frontend wordt aangeboden wordt door
de prijsresolver bepaald.

## Dealerbevoegdheid

Een dealer mag alleen prijsinformatie aanpassen voor stations waarvoor
het account geautoriseerd is.

De API moet daarom altijd de relatie controleren tussen:

- ingelogde dealer
- station
- dealerrechten
- brandstof
- actieve override

Een dealer mag nooit de prijs van een station van een andere dealer
wijzigen.

## Dealerprijs

Een dealer kan een expliciete prijs instellen voor een brandstof.

Conceptueel:

```text
dealerprijs = 1.620
```

De uiteindelijke prijs wordt dan:

```text
final_price = 1.620
```

De oorspronkelijke scraperprijs blijft behouden.

## Dealerkorting

Een dealer kan ook een korting instellen.

Bijvoorbeeld:

```text
source_price = 1.650
dealer_discount = 0.030
```

De uiteindelijke prijs wordt:

```text
final_price = 1.620
```

## Prioriteit

Wanneer zowel een dealerprijs als een dealerkorting bestaan, heeft de
expliciete dealerprijs voorrang.

```text
dealerprijs
    >
dealerkorting
    >
resolved source price
```

De korting wordt dus niet nogmaals toegepast wanneer een expliciete
dealerprijs actief is.

## Dealer override verwijderen

Wanneer een dealer zijn override verwijdert of deactiveert, valt de API
automatisch terug op de actuele resolved scraper/source price.

```text
Dealer override verwijderd
        ↓
Resolved source price
        ↓
Final price
```

Een dealeroverride mag nooit als `0` worden geïnterpreteerd wanneer de
dealer deze heeft verwijderd.

## Vervaldatum

Dealerprijzen en kortingen kunnen een geldigheidsperiode hebben.

Wanneer:

```text
valid_until < current_time
```

is de override niet langer actief.

De resolver gebruikt dan opnieuw de beschikbare bronprijs.

## API response prijsinformatie

De prijs-API moet de herkomst van de uiteindelijke prijs kunnen
onderscheiden.

Conceptueel kan een station bijvoorbeeld teruggeven:

```json
{
  "source_price": 1.650,
  "source": "MAES_NETWORK",
  "dealer_override": 1.620,
  "dealer_discount": null,
  "final_price": 1.620,
  "price_origin": "dealer_override"
}
```

Bij een dealerkorting:

```json
{
  "source_price": 1.650,
  "source": "MAES_NETWORK",
  "dealer_override": null,
  "dealer_discount": 0.030,
  "final_price": 1.620,
  "price_origin": "dealer_discount"
}
```

Zonder dealeroverride:

```json
{
  "source_price": 1.650,
  "source": "MAES_NETWORK",
  "dealer_override": null,
  "dealer_discount": null,
  "final_price": 1.650,
  "price_origin": "source"
}
```

## Voorgestelde dealer-endpoints

De exacte routes worden vastgelegd wanneer de dealerportal wordt
geïmplementeerd. De API-architectuur moet minimaal ruimte bieden voor:

```text
GET    /api/dealer/stations
GET    /api/dealer/stations/:stationId/prices
POST   /api/dealer/stations/:stationId/prices
PUT    /api/dealer/stations/:stationId/prices/:fuelType
DELETE /api/dealer/stations/:stationId/prices/:fuelType
```

Deze routes zijn architecturale doelroutes en mogen niet als
productie-endpoints worden beschouwd zolang de dealerportal nog niet
is geïmplementeerd.

## Publieke prijs-API

De bestaande publieke station- en prijs-API's moeten uiteindelijk de
`final_price` beschikbaar maken.

Intern moet de API daarnaast de bron kunnen onderscheiden:

```text
source_price
dealer_override
dealer_discount
final_price
price_origin
```

Hierdoor kan FuelAlert zowel de actuele publieksprijs tonen als de
herkomst van die prijs controleren.

## Audit

Dealerprijswijzigingen moeten traceerbaar zijn.

De backend moet daarom uiteindelijk kunnen registreren:

- station
- dealer
- brandstof
- oude waarde
- nieuwe waarde
- type wijziging
- tijdstip
- actieve status

De auditfunctionaliteit wordt gekoppeld aan de dealer override-database
die in de Database-documentatie is beschreven.

## Fail-safe

Een fout in de dealerlaag mag de scraperlaag niet beschadigen.

Wanneer een dealeroverride ongeldig is:

```text
Dealer override
      ↓
ongeldig
      ↓
Resolved source price
```

De scraperprijs blijft daardoor altijd de automatische basis en
fallback van FuelAlert.


---

# Scheduler Monitor API

## GET `/api/scheduler-monitor`

Geeft de schedulerhistoriek en monitoringinformatie van de scraperuitvoeringen.

De endpoint wordt gebruikt door de Scheduler Monitor frontend.

### Query parameters

| Parameter | Type | Standaard | Beschrijving |
|---|---|---:|---|
| `page` | number | 1 | Paginanummer |
| `scraper` | string | geen | Filter op één scraper |

Voorbeelden:

```text
/api/scheduler-monitor?page=1
```

```text
/api/scheduler-monitor?scraper=SHELL&page=1
```

```text
/api/scheduler-monitor?scraper=DATS24&page=1
```

```text
/api/scheduler-monitor?scraper=MAES_NETWORK&page=1
```

---

## Response

```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalRuns": 0,
    "totalPages": 1
  },
  "summary": {},
  "runs": []
}
```

---

## Pagination

De API gebruikt pagination voor de schedulerhistoriek.

Standaard:

```text
limit = 50
```

De response bevat:

- `page`
- `limit`
- `totalRuns`
- `totalPages`

Voorbeeld:

```json
"pagination": {
  "page": 1,
  "limit": 50,
  "totalRuns": 2998,
  "totalPages": 60
}
```

Wanneer een scraperfilter wordt gebruikt, worden de totalen beperkt tot
de geselecteerde scraper.

Voorbeeld:

```json
"pagination": {
  "page": 1,
  "limit": 50,
  "totalRuns": 2,
  "totalPages": 1
}
```

---

# Summary

`summary` bevat de algemene schedulerstatistieken.

Velden:

- `totalRuns`
- `successRuns`
- `failedRuns`
- `averageDuration`
- `lastRun`

Voorbeeld:

```json
{
  "totalRuns": 10,
  "successRuns": 10,
  "failedRuns": 0,
  "averageDuration": 850,
  "lastRun": {
    "id": 3001,
    "scraper": "SHELL",
    "status": "SUCCESS"
  }
}
```

---

# Runs

`runs` bevat de afzonderlijke scraperuitvoeringen.

Iedere run bevat onder andere:

- `id`
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

Voorbeeld:

```json
{
  "id": 3001,
  "scraper": "SHELL",
  "status": "SUCCESS",
  "stations": 200,
  "inserted": 0,
  "updated": 200,
  "skipped": 0,
  "duplicates": 0,
  "errors": 0,
  "duration_ms": 856,
  "started_at": "2026-08-22T16:06:26.000Z",
  "finished_at": "2026-08-22T16:06:26.000Z"
}
```

---

# Ondersteunde scraperfilters

De huidige productie-scrapers zijn:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

De Scheduler Monitor kan de historie per scraper afzonderlijk ophalen.

---

# Scheduler Monitor

De endpoint wordt gebruikt door de Scheduler Monitor.

De monitor toont onder andere:

- runs van vandaag
- succesvolle runs
- mislukte runs
- gemiddelde uitvoeringsduur
- laatste scraper-run
- aantal stations
- aantal updates
- aantal fouten
- volledige schedulerhistoriek
- historie per scraper
- pagination

De frontend ververst de gegevens automatisch iedere 30 seconden.

---

# Backend

De route wordt geregistreerd in:

`backend/server.js`

Route:

`/api/scheduler-monitor`

Router:

`backend/routes/schedulerMonitorRoutes.js`

Database repository:

`backend/repositories/SchedulerRunRepository.js`

De gegevens worden opgeslagen in:

`scheduler_runs`

---

# Scheduler Run Flow

```text
Scheduler
    ↓
ScraperManager
    ↓
Active Scraper
    ↓
PersistenceEngine
    ↓
SchedulerRunRepository
    ↓
scheduler_runs
    ↓
Scheduler Monitor API
    ↓
Frontend
```

---

# Foutresponse

Bij een serverfout retourneert de API HTTP status `500`.

Voorbeeld:

```json
{
  "success": false,
  "error": "Database error"
}
```

---

# Opmerking

Smoke tests worden niet geregistreerd in `scheduler_runs`.

Alleen normale scraperuitvoeringen worden als scheduler-run opgeslagen.

Hierdoor bevat de Scheduler Monitor uitsluitend echte schedulerhistoriek
en worden technische smoke tests niet als productie-uitvoering weergegeven.
