# FuelAlert Belgium - Database Documentation

Version: 2.4  
Status: Living Document  
Last Updated: 2026-08-23

---

# 1. Database Overview

FuelAlert Belgium gebruikt MySQL als persistente databron voor stations, brandstofprijzen, bronkoppelingen, schedulerhistoriek en toekomstige dealerfunctionaliteit.

De huidige V2-architectuur is opgebouwd rond een duidelijke scheiding tussen:

- Stations
- Scraper-bronnen
- Cross-source station links
- Schedulerhistoriek
- Persistence
- Prijsresolutie
- Toekomstige dealer overrides

De belangrijkste V2-stationtabel is `stations_v2`.

De belangrijkste monitoringtabel is `scheduler_runs`.

De tabel voor koppelingen tussen dezelfde fysieke stations uit verschillende bronnen is `station_source_links`.

De huidige actieve scraperregistry bevat:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

---

# 2. Database Architectuur

De belangrijkste databaseflow is:

Scraper → ScraperManager → Validator Framework → PersistenceEngine → StationRepository → `stations_v2`

Cross-source matching:

Source A → Station Source Matcher → `station_source_links` → StationPriceResolver → Resolved price

Scheduler monitoring:

Scheduler → ScraperManager → SchedulerRunRepository → `scheduler_runs` → Scheduler Monitor

---

# 3. stations_v2

`stations_v2` is de primaire stationstabel van de V2-architectuur.

Deze tabel bevat gestandaardiseerde stationrecords die door de actieve scrapers worden aangeleverd.

## Belangrijkste kolommen

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

## station_id

`station_id` is de bron-specifieke unieke identifier van een station.

Een identifier uit één bron mag niet automatisch worden beschouwd als dezelfde identifier uit een andere bron. Cross-source relaties worden opgeslagen in `station_source_links`.

---

# 4. Station Sources

De kolom `source` geeft aan welke bron het stationrecord heeft aangeleverd.

De huidige actieve scraper source identifiers zijn:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

Voor Shell moet onderscheid worden gemaakt tussen de scraper identifier en de opgeslagen genormaliseerde source. De huidige Shell-scraper gebruikt `SHELL` als scraper identifier en levert records met `source = shell_official_scraper`.

Andere scrapers kunnen hun eigen genormaliseerde sourcewaarde gebruiken.

---

# 5. Brandstofvelden

De belangrijkste brandstofvelden zijn:

- benzine95
- benzine98
- diesel
- lpg
- cng
- adblue

Een brandstofveld kan `NULL` bevatten wanneer de bron voor het station geen waarde levert.

`NULL` betekent niet automatisch dat het station de brandstof niet verkoopt; het betekent dat voor dat record geen waarde beschikbaar is.

---

# 6. Brandstof Mapping

## DATS24

- `e95 -> benzine95`
- `e98 -> benzine98`
- `diesel -> diesel`
- `lpg -> lpg`
- `cng -> cng`
- `adblue -> adblue`

## MAES

- `benzine95 -> benzine95`
- `benzine98 -> benzine98`
- `diesel -> diesel`
- `lpg -> lpg`

## Shell

- `benzine95 -> benzine95`
- `benzine98 -> benzine98`
- `diesel -> diesel`
- `lpg -> lpg`

## Q8

De Q8-scraper gebruikt onder andere:

- `PETROL_EURO_95 -> e95 -> benzine95`
- `PETROL_SUPERPLUS_98 -> e98 -> benzine98`
- `DIESEL -> diesel`
- `LPG -> lpg`
- `ADBLUE -> adblue`

Een Q8-station kan succesvol worden genormaliseerd zonder voor alle brandstoffen een prijs te hebben.

---

# 7. Station Persistence

Scrapers schrijven niet rechtstreeks naar MySQL.

De flow is:

Scraper → ScraperManager → PersistenceEngine → StationRepository → `stations_v2`

Belangrijke bestanden:

- `backend/persistence/PersistenceEngine.js`
- `backend/repositories/StationRepository.js`

De PersistenceEngine houdt per run bij:

- inserted
- updated
- skipped
- duplicates
- errors

---

# 8. StationRepository

Bestand: `backend/repositories/StationRepository.js`

De repository bepaalt of een record moet worden ingevoegd of bijgewerkt:

Find station → Niet gevonden: INSERT → Gevonden: UPDATE

De repository vormt de database-abstractionlaag tussen PersistenceEngine en MySQL.

---

# 9. station_source_links

`station_source_links` bevat relaties tussen stationrecords uit verschillende databronnen.

Dit is noodzakelijk wanneer twee bronnen verschillende identifiers gebruiken voor dezelfde fysieke locatie.

## Belangrijkste kolommen

- id
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

# 10. Gebruik van station_source_links

De tabel wordt gebruikt voor:

- Cross-source station matching
- Station identity resolution
- Live prijsresolutie
- Controle op dubbele koppelingen
- Toekomstige uitbreiding met extra bronnen

De koppeling wordt niet rechtstreeks in `stations_v2` opgeslagen.

---

# 11. Station Source Matcher

De matcher zoekt records die waarschijnlijk dezelfde fysieke locatie voorstellen en kan onder andere gebruiken:

- afstand tussen stations
- match confidence
- match type

De eerder gevalideerde Shell/MAES matching leverde als momentopname:

- 200 officiële Shell-stations
- 78 MAES Shell-stations
- 35 matches
- 43 MAES Shell-stations zonder match

Deze aantallen zijn niet permanent.

---

# 12. Link Uniqueness

Voor actieve cross-source-koppelingen moet worden gecontroleerd of één officieel station niet aan meerdere bronrecords is gekoppeld wanneer dat volgens de matchingregels niet is toegestaan.

Een controle kan groeperen op `source_b` en `station_id_b` en zoeken naar `COUNT(*) > 1`.

De eerdere Shell/MAES-controle gaf:

`OK: geen officiële Shell-stations met meerdere Maes-koppelingen.`

---

# 13. StationPriceResolver

Bestand: `backend/services/StationPriceResolver.js`

De resolver bepaalt onder andere:

- resolved prices
- price source
- price priority
- linked station
- source prices
- fallback usage
- dealer override
- dealer discount
- uiteindelijke publieksprijs
- herkomst van de uiteindelijke prijs

De vier concepten blijven gescheiden:

1. scraperprijs
2. gekoppelde bronprijs
3. dealerprijs of dealerkorting
4. uiteindelijke prijs voor de gebruiker

De dealerlaag overschrijft nooit de oorspronkelijke scraperdata.

---

# 14. Price Resolution

Basisvolgorde:

Dealer override → Resolved scraper/source price → gekoppelde live bron → officiële stationbron → oorspronkelijke opgeslagen bronprijs → uiteindelijke prijs

Een dealerwijziging vervangt de scraperprijs niet in de database.

Voorbeeld:

`source_price = 1.650`  
`dealer_override = 1.620`  
`display_price = 1.620`

De oorspronkelijke scraperprijs blijft beschikbaar.

Voor een geldig gekoppeld Shell/MAES-station kan bijvoorbeeld `price_priority = linked_live` worden gebruikt. Zonder geldige link kan de officiële stationbron worden gebruikt.

---

# 15. Price Fallback

Fallback gebeurt per brandstofveld.

Voorbeeld:

MAES live:

- diesel beschikbaar
- e95 beschikbaar
- e98 NULL

Shell official:

- diesel beschikbaar
- e95 beschikbaar
- e98 beschikbaar

De resolver kan dan diesel en e95 uit MAES en e98 uit Shell gebruiken.

---

# 16. Dealer Price Override Architecture

De scraperlaag blijft de automatische basis. Een geverifieerde dealer kan later voor een geautoriseerd station een eigen prijs of korting instellen.

Architectuur:

External Source → Scraper → Scraper Price → Source/Price Resolver → Dealer Override → Final Display Price

## 16.1 Basisprincipe

`scraperprijs -> bronresolutie -> dealer override -> uiteindelijke prijs`

Bij geen override is de uiteindelijke prijs de resolved source price.

Bij een expliciete dealerprijs is de eindprijs de dealerprijs.

Bij alleen een korting is de eindprijs de resolved source price minus de korting.

Wanneer beide bestaan, heeft volgens de voorkeursregel de expliciete dealerprijs prioriteit.

## 16.2 Nooit de scraperprijs overschrijven

Conceptueel:

`source_price = scraper/resolved prijs`

`dealer_override = dealerprijs`

`display_price = dealerprijs`

Bij verwijderen van de override valt het station terug op de actuele scraper-/bronprijs.

## 16.3 Per brandstof

Overrides worden per brandstof beheerd.

| Brandstof | Scraperprijs | Dealerprijs | Korting | Eindprijs |
| --------- | -----------: | ----------: | ------: | --------: |
| benzine95 |        1.650 |       1.620 |    NULL |     1.620 |
| benzine98 |        1.790 |        NULL |   0.050 |     1.740 |
| diesel    |        1.680 |        NULL |    NULL |     1.680 |

## 16.4 Dealer Override Status

Minimaal:

- geen override
- actieve dealerprijs
- actieve dealerkorting
- gedeactiveerde override

Een lege override mag niet als prijs `0` worden geïnterpreteerd.

## 16.5 Dealeridentiteit

De database moet een controleerbare relatie kunnen leggen tussen:

- dealer/account
- station
- actieve dealerrechten
- dealerprijs/discount

## 16.6 Audit Trail

Dealerwijzigingen moeten minimaal station, brandstof, dealer, oude waarde, nieuwe waarde, type wijziging, datum/tijd en status kunnen vastleggen.

## 16.7 Vervaldatum

Een override kan een optionele `valid_until` hebben. Na verval valt de resolver terug op de resolved source price.

## 16.8 Dealerprijs versus korting

`dealerprijs > dealerkorting > resolved source price`

Dezelfde regel moet in backend en frontend worden toegepast.

## 16.9 Brontransparantie

De API moet automatische bronprijs, dealer override, dealer discount en eindprijs kunnen onderscheiden.

Voorbeeld:

```text
source_price: 1.650
source: MAES_NETWORK
dealer_override: 1.620
dealer_discount: NULL
final_price: 1.620
price_origin: dealer_override
```

## 16.10 Terugval

Ongeldige, gedeactiveerde of verlopen dealer overrides mogen niet de prijs op nul zetten. De resolver valt terug op de resolved source price.

## 16.11 Databaseconcept

Voorkeursstructuur voor toekomstige dealerfunctionaliteit:

`station_dealer_overrides`

Mogelijke velden:

- id
- station_id
- dealer_id
- fuel_type
- override_type
- override_value
- active
- valid_from
- valid_until
- created_at
- updated_at

Optionele historie:

`station_dealer_override_history`

- id
- override_id
- station_id
- dealer_id
- fuel_type
- override_type
- old_value
- new_value
- action
- created_at

Deze tabellen zijn architectuur voor toekomstige functionaliteit en mogen niet als geïmplementeerd worden beschouwd zolang ze niet daadwerkelijk in MySQL bestaan.

## 16.12 Databaseverantwoordelijkheid

De database moet conceptueel drie lagen kunnen onderscheiden:

1. Bronprijs
2. Dealer override
3. Resolved/final price

---

# 17. scheduler_runs

`scheduler_runs` bevat de persistente historiek van normale scraper-runs.

De huidige actieve scraper IDs zijn:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

## Kolommen

- id
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

Succesvolle runs krijgen `status = SUCCESS`; mislukte runs `status = FAILED`.

De opgeslagen statistieken omvatten station count, persistence-resultaten, fouten, duur en tijdstippen.

---

# 18. Scheduler Run Repository

Bestand: `backend/repositories/SchedulerRunRepository.js`

Verantwoordelijk voor:

- schedulerhistoriek opslaan
- historiek ophalen
- totalen berekenen
- pagination
- laatste run ophalen

Methodes:

- `getSummary()`
- `getRuns()`
- `getTotalRuns()`
- `create()`

`getSummary()` berekent de runstatistieken van vandaag met `DATE(started_at) = CURDATE()` en haalt de meest recente run afzonderlijk op.

---

# 19. Smoke Tests en scheduler_runs

De ScraperManager ondersteunt `smokeTest`.

Smoke tests worden bewust niet opgeslagen in `scheduler_runs`.

Normale scheduleruitvoeringen worden wel opgeslagen.

Een handmatige `ScraperManager.run({ smokeTest: true })` hoort dus niet als productiehistoriek in de Scheduler Monitor te verschijnen.

---

# 20. Scheduler Monitor

Backend route:

`backend/routes/schedulerMonitorRoutes.js`

Repository:

`backend/repositories/SchedulerRunRepository.js`

Frontend:

`SchedulerMonitor.jsx`

Endpoint:

`/api/scheduler-monitor`

De API ondersteunt een scraperfilter, bijvoorbeeld:

`/api/scheduler-monitor?scraper=SHELL&page=1`

De response bevat:

- pagination
- summary
- runs

Pagination bevat:

- page
- limit
- totalRuns
- totalPages

**Belangrijk:** de huidige frontendfilterlijst bevat alleen `SHELL`, `DATS24` en `MAES_NETWORK`, terwijl de actieve backend registry ook `TEXACO` en `Q8` bevat. Dit is een open monitoringspunt en geen reden om de databasehistoriek van TEXACO/Q8 als foutief te beschouwen.

---

# 21. Scheduler en Scraper Registry

Bestand: `backend/scrapers/registry.js`

Actieve registry:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

De scheduler registreert momenteel één job:

`Fuel Scrapers`

met een interval van 15 minuten.

Bij opstart wordt eerst onmiddellijk een run uitgevoerd; daarna volgens het interval.

De Scheduler bewaart `lastRun` alleen in memory. Persistente historische gegevens staan in `scheduler_runs`.

---

# 22. Scheduler Run Voorbeelden

Recente scraperuitvoer heeft onder andere laten zien:

- MAES_NETWORK: 275 stations
- DATS24: 147 stations
- SHELL: 200 stations
- TEXACO: 91 stations
- Q8: 469 stations

Een recente Q8-run rapporteerde:

- 469 stations gevonden
- 213 stations met prijzen
- 256 stations zonder prijzen
- 39 zonder Q8-code
- 0 fouten

Deze aantallen zijn momentopnames en kunnen wijzigen.

Station count en prijsdekking zijn verschillende metrics.

---

# 23. Source Data versus Resolved Data

`stations_v2` bevat het opgeslagen stationrecord.

`station_source_links` bevat relaties tussen bronnen.

`StationPriceResolver` bepaalt welke beschikbare bronprijs wordt gebruikt.

Een station kan dus succesvol bestaan in de database terwijl één of meer prijsvelden `NULL` zijn.

---

# 24. Database Data Flow

External Source → Scraper → BaseScraper → Validator Framework → ScraperManager → PersistenceEngine → StationRepository → `stations_v2`

Daarna kunnen cross-source links naar `StationPriceResolver` leiden en schedulerresultaten naar `SchedulerRunRepository` → `scheduler_runs`.

Dealer overrides worden pas bovenop de resolved bronprijs toegepast wanneer die functionaliteit daadwerkelijk is geïmplementeerd.

---

# 25. Database Integrity

Belangrijke principes:

- Een stationrecord blijft gekoppeld aan zijn oorspronkelijke source.
- Cross-source relaties worden opgeslagen in `station_source_links`.
- Prijsresolutie verandert de bronidentiteit niet.
- Schedulerhistoriek staat in `scheduler_runs`.
- Smoke tests worden niet als productiehistoriek opgeslagen.
- PersistenceEngine is de centrale database-ingang voor scraperdata.
- Een ontbrekende brandstofprijs mag niet automatisch als `0` worden opgeslagen.
- Een succesvol gevonden station betekent niet dat iedere brandstofprijs beschikbaar is.
- Dealerdata mag brondata niet overschrijven.

---

# 26. Oude Database Architectuur

De V2-architectuur gebruikt `stations_v2`.

De oude databasearchitectuur blijft geïsoleerd totdat de migratie volledig is afgerond.

Uitfasering mag pas wanneer:

1. Alle vereiste scrapers op V2 draaien.
2. Stationdekking is gecontroleerd.
3. Prijsaccuraatheid is gecontroleerd.
4. REST API's naar V2 zijn gemigreerd.
5. Frontendfunctionaliteit is gemigreerd.
6. Scheduler V2 volledig actief is.
7. Historische data correct is behandeld.

---

# 27. Current Database Components

| Component                         | Doel                                           |
| --------------------------------- | ---------------------------------------------- |
| `stations_v2`                     | Gestandaardiseerde V2-stations                 |
| `station_source_links`            | Koppelingen tussen bronnen                     |
| `scheduler_runs`                  | Schedulerhistoriek                             |
| `StationRepository`               | Station persistence                            |
| `StationSourceLinkRepository`     | Cross-source link persistence                  |
| `SchedulerRunRepository`          | Schedulerhistoriek persistence                 |
| `PersistenceEngine`               | Centrale persistencepipeline                   |
| `StationPriceResolver`            | Prijsbron-, fallback- en dealerresolutie       |
| `station_dealer_overrides`        | Toekomstige actieve dealerprijzen en kortingen |
| `station_dealer_override_history` | Toekomstige historiek van dealerwijzigingen    |

Dealer-tabellen zijn architectuur voor toekomstige functionaliteit totdat ze daadwerkelijk in MySQL zijn aangemaakt.

---

# 28. Current Scraper Sources

| Source       | Scheduler ID   | Genormaliseerde source   | Status |
| ------------ | -------------- | ------------------------ | ------ |
| MAES Network | `MAES_NETWORK` | `MAES_NETWORK`           | Actief |
| DATS24       | `DATS24`       | `DATS24`                 | Actief |
| Shell        | `SHELL`        | `shell_official_scraper` | Actief |
| Texaco       | `TEXACO`       | Texaco scraper source    | Actief |
| Q8           | `Q8`           | `q8_official_scraper`    | Actief |

Recente dekking:

- MAES Network: 275
- DATS24: 147
- Shell: 200
- Texaco: 91
- Q8: 469

Deze aantallen zijn geen vaste databasevereisten.

---

# 29. Scraper Coverage versus Price Coverage

FuelAlert maakt onderscheid tussen:

## Stationdekking

Aantal stations dat succesvol is gevonden en genormaliseerd.

## Prijsdekking

Aantal gevonden stations waarvoor minstens één geldige brandstofprijs beschikbaar is.

Voor Q8 was een recente volledige run:

- 469 stations gevonden
- 213 met minstens één prijs
- 256 zonder prijzen
- 39 URLs zonder bruikbare Q8-code
- 0 scraper errors

`469 stations gevonden` betekent dus niet `469 stations met volledige prijsinformatie`.

---

# 30. Future Database Extensions

Mogelijke toekomstige componenten:

- Price History
- Source Health History
- Station Change History
- Verified Station Data
- Opening Hours
- Promotions
- EV Charging
- Station Services
- Source Quality Scores
- Advanced Price Resolution History

Deze worden pas toegevoegd wanneer de bijbehorende functionaliteit daadwerkelijk wordt geïmplementeerd.

---

# 31. Database Design Principle

De databasearchitectuur volgt:

**Source data first.**

Daarbovenop worden relaties en resolutie toegevoegd:

1. Bronrecord bewaren.
2. Bron identificeren.
3. Record valideren.
4. Record opslaan.
5. Eventuele cross-source relatie opslaan.
6. Beste beschikbare bronprijs bepalen.
7. Geldige dealer override toepassen wanneer aanwezig.
8. Oorspronkelijke bronprijs behouden.
9. Uiteindelijke prijs via de API beschikbaar maken.

---

# 32. Guiding Principle

De database is ontworpen als multi-source platform en niet rond één scraper.

Nieuwe bronnen moeten dezelfde stationstructuur, persistence, validatie, bronkoppeling, prijsresolutie, dealerlaag, schedulerhistoriek en monitoring kunnen gebruiken.

De dealerlaag staat bovenop de automatische bronlaag en mag oorspronkelijke scraperdata nooit vernietigen of overschrijven.

---

# 33. Current Implementation Notes

## ScraperManager

Bestand: `backend/scrapers/ScraperManager.js`

De manager voert de actieve scrapers parallel uit via `Promise.allSettled()`.

Per scraper worden HealthRegistry, PersistenceEngine, rapportering en bij normale runs `SchedulerRunRepository` gebruikt.

Een fout in één scraper hoeft daardoor de andere scrapers niet automatisch te stoppen.

## BaseScraper

Bestand: `backend/scrapers/BaseScraper.js`

De BaseScraper:

- wacht op RateLimiter
- verzamelt records
- valideert records
- registreert health/metrics
- retourneert uniforme records

## RateLimiter

Bestand: `backend/ratelimiter/RateLimiter.js`

Ondersteunt per bron:

- delay
- retries
- timeout
- concurrent

De RateLimiter-wachttijd is niet hetzelfde als interne worker-concurrency van een scraper. Q8 kan bijvoorbeeld meerdere workers gebruiken voor stationverwerking terwijl de RateLimiter afzonderlijk de bronaanvraag reguleert.

## MetricsRegistry

Bestand: `backend/metrics/MetricsRegistry.js`

Metrics worden in memory bijgehouden.

Endpoint:

`/api/metrics`

Dit is niet hetzelfde als de persistente `scheduler_runs`-historiek.

---

# 34. Database Monitoring Principle

Voor monitoring moeten drie niveaus worden onderscheiden:

## Niveau 1 — Live health

`HealthRegistry`

Actuele toestand van een scraper.

## Niveau 2 — Runtime metrics

`MetricsRegistry`

Runtime-metrics van scraperuitvoeringen.

## Niveau 3 — Persistente historiek

`scheduler_runs`

Blijvende schedulerhistoriek.

De Scheduler Monitor gebruikt niveau 3.

---

# 35. Database Status

Per 2026-08-23 is de V2-databasearchitectuur geschikt voor verdere uitbreiding van de multi-source scraperlaag.

De actuele prioriteit blijft:

1. Alle vereiste scrapers technisch correct laten werken.
2. Stationdekking per bron controleren.
3. Prijsdekking per bron controleren.
4. Cross-source matching controleren waar nodig.
5. Persistence controleren.
6. Schedulerhistoriek controleren.
7. Monitoring laten aansluiten op alle actieve scrapers.
8. Pas daarna frontend stationfunctionaliteit verder uitbouwen.

De frontend is geen bewijs dat een scraper correct werkt. De primaire waarheid is backend scraperuitvoer, validatie, persistence en schedulerhistoriek.

---

# 36. Final Database Principle

FuelAlert Belgium moet altijd kunnen antwoorden op vier afzonderlijke vragen:

1. **Welk station is dit?**
2. **Welke bron heeft dit station aangeleverd?**
3. **Welke bronprijs is beschikbaar?**
4. **Welke prijs wordt uiteindelijk aan de gebruiker getoond en waarom?**

Voor schedulerbeheer moeten daarnaast kunnen worden vastgesteld:

5. **Wanneer is welke scraper uitgevoerd?**
6. **Hoeveel stations werden gevonden?**
7. **Hoeveel records werden bijgewerkt?**
8. **Hoe lang duurde de run?**
9. **Zijn er fouten geweest?**

Deze scheiding is de basis voor een betrouwbare, controleerbare en uitbreidbare FuelAlert-database.
