# FuelAlert Belgium - Database Documentation

Version: 2.3
Status: Living Document
Last Updated: 2026-08-23

---

# 1. Database Overview

FuelAlert Belgium gebruikt MySQL als persistente databron voor stations,
brandstofprijzen, bronkoppelingen en schedulerhistoriek.

De huidige V2-architectuur is opgebouwd rond een duidelijke scheiding
tussen:

- Stations
- Scraper-bronnen
- Cross-source station links
- Schedulerhistoriek
- Persistence
- Prijsresolutie

De belangrijkste V2-stationstabel is:

`stations_v2`

De belangrijkste monitoringtabel is:

`scheduler_runs`

De tabel voor koppelingen tussen dezelfde fysieke stations uit
verschillende bronnen is:

`station_source_links`

---

# 2. Database Architectuur

De belangrijkste databaseflow is:

Scraper
|
v
ScraperManager
|
v
Validator Framework
|
v
PersistenceEngine
|
v
StationRepository
|
v
stations_v2

Cross-source matching:

Source A
|
v
Station Source Matcher
|
v
station_source_links
|
v
StationPriceResolver
|
v
Resolved price

Scheduler monitoring:

Scheduler
|
v
ScraperManager
|
v
SchedulerRunRepository
|
v
scheduler_runs
|
v
Scheduler Monitor

---

# 3. stations_v2

`stations_v2` is de primaire stationstabel van de V2-architectuur.

Deze tabel bevat de gestandaardiseerde stationrecords die door de
verschillende actieve scrapers worden aangeleverd.

De tabel is ontworpen zodat verschillende databronnen dezelfde
database- en API-structuur kunnen gebruiken.

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

De repository gebruikt deze identifier om bestaande stations terug te
vinden en records te updaten.

De exacte betekenis van een `station_id` blijft afhankelijk van de
bron.

Voorbeelden:

Shell:

`12683847`

MAES:

`gilly-shell`

DATS24:

bron-specifieke stationidentifier.

Een stationidentifier uit één bron mag niet automatisch worden
beschouwd als dezelfde identifier uit een andere bron.

Cross-source relaties worden daarom opgeslagen in
`station_source_links`.

---

# 4. Station Sources

De kolom:

`source`

geeft aan welke bron het stationrecord heeft aangeleverd.

Huidige actieve bronnen:

- `MAES_NETWORK`
- `DATS24`
- `shell_official_scraper`

Voor scheduler- en scraperregistratie wordt de bronnaam van Shell
gebruikt als:

`SHELL`

Het onderscheid is belangrijk:

- scraper source identifier: `SHELL`
- opgeslagen station source: `shell_official_scraper`

De database bewaart hiermee de oorspronkelijke herkomst van het
stationrecord.

---

# 5. Brandstofvelden

De belangrijkste brandstofvelden in `stations_v2` zijn:

- benzine95
- benzine98
- diesel
- lpg
- cng
- adblue

Een brandstofveld kan `NULL` bevatten wanneer de betreffende bron voor
het station geen prijs of waarde levert.

`NULL` betekent dus niet automatisch dat het station die brandstof niet
verkoopt.

Het betekent dat voor dat record geen waarde beschikbaar is.

---

# 6. Brandstof Mapping

Verschillende bronnen gebruiken verschillende namen voor dezelfde
brandstof.

De V2-pipeline normaliseert deze namen.

## DATS24

`e95 -> benzine95`

`e98 -> benzine98`

`diesel -> diesel`

`lpg -> lpg`

`cng -> cng`

`adblue -> adblue`

## MAES

`benzine95 -> benzine95`

`benzine98 -> benzine98`

`diesel -> diesel`

`lpg -> lpg`

## Shell

`benzine95 -> benzine95`

`benzine98 -> benzine98`

`diesel -> diesel`

`lpg -> lpg`

---

# 7. Station Persistence

Scrapers schrijven niet rechtstreeks naar MySQL.

De databaseflow is:

Scraper
|
v
ScraperManager
|
v
PersistenceEngine
|
v
StationRepository
|
v
stations_v2

Belangrijke bestanden:

`backend/persistence/PersistenceEngine.js`

`backend/repositories/StationRepository.js`

## PersistenceEngine

De PersistenceEngine verwerkt de uniforme scraperrecords.

Per record wordt de StationRepository aangeroepen.

Het resultaat wordt bijgehouden als:

- inserted
- updated
- skipped
- duplicates
- errors

De persistence-laag zorgt ervoor dat de individuele scrapers geen
rechtstreekse database-implementatie nodig hebben.

---

# 8. StationRepository

De StationRepository beheert de opslag van stationrecords.

Bestand:

`backend/repositories/StationRepository.js`

De repository bepaalt of een record moet worden ingevoegd of
bijgewerkt.

Logica:

Find station
|
+-- Niet gevonden -> INSERT
|
+-- Gevonden -> UPDATE

De repository vormt daarmee de database-abstractionlaag tussen de
PersistenceEngine en MySQL.

---

# 9. station_source_links

`station_source_links` bevat relaties tussen stationrecords uit
verschillende databronnen.

Dit is noodzakelijk omdat twee bronnen verschillende identifiers
kunnen gebruiken voor dezelfde fysieke locatie.

Voorbeeld:

MAES:

`gilly-shell`

Shell:

`12683847`

Beide kunnen naar dezelfde fysieke Shell-locatie verwijzen.

De relatie wordt dan opgeslagen in:

`station_source_links`

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

Hierdoor blijft het oorspronkelijke stationrecord onafhankelijk van
andere databronnen.

---

# 11. Station Source Matcher

De Station Source Matcher zoekt naar records die waarschijnlijk
dezelfde fysieke locatie voorstellen.

De huidige Shell/MAES matching gebruikt geografische informatie als
belangrijke matchingfactor.

De matcher berekent onder andere:

- afstand tussen stations
- match confidence
- match type

De huidige matchingvalidatie leverde:

- 200 officiële Shell-stations
- 78 MAES Shell-stations
- 35 matches
- 43 MAES Shell-stations zonder match

De 35 gevonden relaties worden opgeslagen in:

`station_source_links`

---

# 12. Link Uniqueness

Voor de actieve Shell/MAES-koppelingen wordt gecontroleerd of één
officieel Shell-station niet aan meerdere actieve MAES-records is
gekoppeld.

De controle groepeert op:

- source_b
- station_id_b

en zoekt naar records met:

`COUNT(*) > 1`

De huidige controle gaf:

`OK: geen officiële Shell-stations met meerdere Maes-koppelingen.`

Dit is belangrijk omdat een foutieve één-op-veel-koppeling verkeerde
prijzen kan veroorzaken.

---

# 13. StationPriceResolver

De `StationPriceResolver` gebruikt de opgeslagen stationlinks om
prijzen uit meerdere bronnen te combineren en bepaalt daarnaast of een
geverifieerde dealer een eigen prijs of korting heeft ingesteld.

Bestand:

`backend/services/StationPriceResolver.js`

De resolver bepaalt:

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

Hierdoor worden vier verschillende concepten strikt van elkaar
gescheiden:

1. scraperprijs
2. gekoppelde bronprijs
3. dealerprijs of dealerkorting
4. uiteindelijke prijs die FuelAlert aan de gebruiker toont

De dealerlaag overschrijft nooit de oorspronkelijke scraperdata.
De scraperprijs blijft als bronwaarde beschikbaar voor controle,
vergelijking, fallback en historiek.

---

# 14. Price Resolution

FuelAlert gebruikt een duidelijke prijsprioriteit.

De basisprijs komt altijd uit een geldige scraper- of officiële
bronprijs. Wanneer een station door een andere bron is gekoppeld, kan
de `StationPriceResolver` eerst de meest geschikte live bronprijs
bepalen.

Daarboven staat de dealerlaag.

De uiteindelijke volgorde is:

Dealer override
|
+-- Dealer heeft eigen prijs ingevoerd
|
+-- Dealer heeft korting ingevoerd
|
v
Resolved scraper/source price
|
+-- Gekoppelde live bron
|
+-- Officiële stationbron
|
+-- Oorspronkelijke opgeslagen bronprijs
|
v
Uiteindelijke prijs

Belangrijk:

Een dealerwijziging vervangt de scraperprijs niet in de database.
De dealerwaarde wordt als afzonderlijke override opgeslagen.

Voorbeeld:

Scraperprijs:

`benzine95 = 1.650`

Dealerprijs:

`benzine95 = 1.620`

Publieksprijs:

`1.620`

De oorspronkelijke scraperprijs blijft:

`1.650`

Daardoor blijft zichtbaar welke prijs de scraper heeft aangeleverd en
welke prijs de dealer actief heeft ingesteld.

Voor een Shell-station met een geldige MAES-link kan bijvoorbeeld:

`price_source = maes_network_live_scraper`

`price_priority = linked_live`

worden gebruikt als bronprijs.

Wanneer er geen geldige MAES-link bestaat, kan:

`price_source = shell_official_scraper`

`price_priority = official`

worden gebruikt.

Een MAES-record zonder Shell-link gebruikt zijn eigen bron.

Bijvoorbeeld:

`price_priority = original`

Een actieve dealer override heeft vervolgens een hogere
presentatieprioriteit dan deze bronprijs.

---

# 15. Price Fallback

De resolver ondersteunt fallback per brandstofveld.

Voorbeeld:

MAES live:

- diesel = beschikbaar
- e95 = beschikbaar
- e98 = NULL

Shell official:

- diesel = beschikbaar
- e95 = beschikbaar
- e98 = beschikbaar

Dan kan de resolver:

- diesel uit MAES gebruiken
- e95 uit MAES gebruiken
- e98 uit Shell gebruiken

Een ontbrekende waarde in één bron hoeft daardoor niet automatisch een
beschikbare waarde uit een andere bron te verwijderen.

---

# 16. Dealer Price Override Architecture

FuelAlert krijgt naast automatische prijsverzameling een aparte
dealerlaag.

De strategie is:

**Scrapers blijven gebouwd en onderhouden voor alle stations.**

De scraper levert de automatische bronprijs.

Een geverifieerde dealer krijgt vervolgens een eigen stationpagina of
dealeromgeving waar hij voor zijn eigen station:

- een eigen brandstofprijs kan invoeren
- een korting kan invoeren
- een bestaande dealerprijs kan aanpassen
- een dealerprijs of korting kan verwijderen

De dealerlaag staat bovenop de scraperlaag en verandert de
scraperbron niet.

De architectuur wordt daardoor:

External Source
|
v
Scraper
|
v
Scraper Price
|
v
Source / Price Resolver
|
v
Dealer Override
|
v
Final Display Price

De scraper blijft dus de automatische fallback.

## 16.1 Basisprincipe

Voor iedere brandstof geldt:

`scraperprijs -> eventuele bronresolutie -> dealer override -> uiteindelijke prijs`

Wanneer de dealer niets heeft ingesteld:

`uiteindelijke prijs = resolved scraper/source price`

Wanneer de dealer een eigen prijs heeft ingesteld:

`uiteindelijke prijs = dealerprijs`

Wanneer de dealer een korting heeft ingesteld:

`uiteindelijke prijs = resolved source price - dealerkorting`

Wanneer een dealer zowel een expliciete prijs als een korting heeft
ingesteld, moet één duidelijke bedrijfsregel worden gebruikt. De
voorkeursregel voor FuelAlert is:

`dealerprijs` heeft prioriteit boven `dealerkorting`.

De korting wordt dan niet nogmaals bovenop de expliciete dealerprijs
toegepast.

## 16.2 Nooit de scraperprijs overschrijven

Een fundamenteel databaseprincipe is:

**Dealerdata mag de scraperdata nooit overschrijven.**

Dus niet:

`benzine95 = dealerprijs`

maar conceptueel:

`source_price = scraper/resolved prijs`

`dealer_override = dealerprijs`

`display_price = dealerprijs`

Hierdoor blijft de automatische bronprijs intact.

Wanneer de dealer zijn override verwijdert, valt het station
automatisch terug op de actuele scraper-/bronprijs.

## 16.3 Per brandstof

Dealer overrides worden per brandstof beheerd.

Voorbeeld:

| Brandstof | Scraperprijs | Dealerprijs | Korting | Eindprijs |
| --------- | -----------: | ----------: | ------: | --------: |
| benzine95 |        1.650 |       1.620 |    NULL |     1.620 |
| benzine98 |        1.790 |        NULL |   0.050 |     1.740 |
| diesel    |        1.680 |        NULL |    NULL |     1.680 |

Een dealer kan dus voor de ene brandstof een eigen prijs gebruiken en
voor een andere brandstof de automatische prijs behouden.

## 16.4 Dealer Override Status

Een dealer override moet een duidelijke status hebben.

Minimaal moet het systeem onderscheid kunnen maken tussen:

- geen override
- actieve dealerprijs
- actieve dealerkorting
- gedeactiveerde override

Een lege of verwijderde override mag niet worden geïnterpreteerd als
een prijs van `0`.

## 16.5 Dealeridentiteit

Een dealer mag alleen prijzen aanpassen voor stations waarvoor hij
geautoriseerd is.

De database moet daarom een controleerbare relatie kunnen leggen
tussen:

- dealer/account
- station
- actieve dealerrechten
- dealerprijs/discount

De stationidentiteit blijft de bestaande FuelAlert-stationidentiteit.
De dealerrelatie wordt daar bovenop opgeslagen.

## 16.6 Audit Trail

Dealerwijzigingen moeten traceerbaar zijn.

Voor een dealerwijziging moet minimaal bekend zijn:

- welk station
- welke brandstof
- welke dealer
- oude dealerwaarde
- nieuwe dealerwaarde
- type wijziging
- datum en tijd
- actieve/inactieve status

Dit is belangrijk voor controle, support, prijsdisputen en toekomstige
prijs-historiek.

## 16.7 Vervaldatum

De databasearchitectuur moet ruimte voorzien voor een optionele
vervaldatum van een dealer override.

Wanneer een override vervalt:

`dealer override -> inactive`

en de resolver gebruikt automatisch opnieuw:

`resolved scraper/source price`

Een vervaldatum is nuttig wanneer een dealer tijdelijk een actieprijs
of tijdelijke korting publiceert.

## 16.8 Dealerprijs versus korting

FuelAlert behandelt een expliciete dealerprijs en een dealerkorting als
twee verschillende types.

### Dealerprijs

De dealer zegt:

`benzine95 = 1.620`

De eindprijs wordt:

`1.620`

### Dealerkorting

De dealer zegt:

`benzine95 korting = 0.030`

Bij een resolved scraperprijs van:

`1.650`

wordt:

`1.650 - 0.030 = 1.620`

### Prioriteit

Wanneer beide bestaan:

`dealerprijs > dealerkorting > resolved source price`

De exacte businessregel moet ook in de applicatielogica worden
afgedwongen zodat dezelfde uitkomst ontstaat in API en frontend.

## 16.9 Brontransparantie

De API moet kunnen onderscheiden tussen:

- automatische bronprijs
- dealer override
- dealer discount
- uiteindelijke prijs

Een gebruiker moet uiteindelijk de correcte actuele prijs zien, maar
FuelAlert moet intern altijd de herkomst van die prijs kunnen bepalen.

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

De resolver moet fail-safe werken.

Als een dealer override ongeldig, gedeactiveerd of verlopen is:

`dealer override`
|
v
niet geldig
|
v
resolved source price

De scraperlaag blijft daardoor altijd de automatische basis.

Als een scraper tijdelijk uitvalt, kan een bestaande geldige
dealerprijs blijven functioneren volgens de ingestelde geldigheidsregels.
Wanneer er geen geldige dealeroverride is, gebruikt FuelAlert de
beschikbare opgeslagen/resolved bronprijs.

## 16.11 Databaseconcept

De dealerdata hoort conceptueel in een aparte structuur en niet als
vervanging van de bronvelden in `stations_v2`.

De voorkeursarchitectuur is een aparte tabel voor actieve en historische
dealer overrides, bijvoorbeeld:

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

Voor audit/historiek kan daarnaast een afzonderlijke tabel worden
gebruikt, bijvoorbeeld:

`station_dealer_override_history`

Mogelijke velden:

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

De exacte tabelstructuur moet pas definitief worden gemaakt wanneer de
dealerportal en authenticatie daadwerkelijk worden geïmplementeerd.

## 16.12 Databaseverantwoordelijkheid

De database moet drie lagen kunnen bewaren:

### Laag 1 — Bronprijs

Afkomstig van scraper of officiële bron.

### Laag 2 — Dealer override

Afkomstig van een geverifieerde dealer.

### Laag 3 — Resolved/final price

De prijs die na toepassing van de prijsregels aan de API/frontend
wordt aangeboden.

Deze drie lagen mogen niet door elkaar worden gehaald.

---

# 16. scheduler_runs

`scheduler_runs` wordt gebruikt voor monitoring en historiek van alle
normale scraper-runs.

De tabel vormt de persistente historiek van de Scheduler.

Iedere actieve scraper wordt afzonderlijk geregistreerd.

## Actieve scrapers

- MAES_NETWORK
- DATS24
- SHELL

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

## Gebruik

Bij een succesvolle run wordt onder andere opgeslagen:

- aantal gevonden stations
- aantal nieuwe stations
- aantal bijgewerkte stations
- aantal overgeslagen records
- aantal duplicaten
- aantal fouten
- totale uitvoeringsduur
- starttijd
- eindtijd

Bij een mislukte run wordt een record opgeslagen met:

`status = FAILED`

Bij een succesvolle run:

`status = SUCCESS`

---

# 17. Scheduler Run Repository

Bestand:

`backend/repositories/SchedulerRunRepository.js`

De repository is verantwoordelijk voor:

- Schedulerhistoriek opslaan
- Schedulerhistoriek ophalen
- Totalen berekenen
- Pagination ondersteunen
- Laatste run ophalen

De repository bevat onder andere methodes voor:

- `getSummary()`
- `getRuns()`
- `getTotalRuns()`
- `create()`

---

# 18. Smoke Tests en scheduler_runs

De ScraperManager ondersteunt een `smokeTest`-modus.

Smoke tests worden bewust niet opgeslagen in `scheduler_runs`.

Hierdoor komen technische testuitvoeringen niet in de normale
schedulerhistoriek terecht.

Normale scheduleruitvoeringen worden wel opgeslagen.

Dit onderscheid houdt de Scheduler Monitor betrouwbaar.

---

# 19. Scheduler Monitor

De Scheduler Monitor gebruikt `scheduler_runs` als historische bron.

Backend route:

`backend/routes/schedulerMonitorRoutes.js`

Repository:

`backend/repositories/SchedulerRunRepository.js`

Frontend:

`src/pages/SchedulerMonitor.jsx`

Endpoint:

`/api/scheduler-monitor`

De monitor ondersteunt filtering per scraper.

Voorbeeld:

`/api/scheduler-monitor?scraper=SHELL&page=1`

De API retourneert:

- pagination
- summary
- runs

Pagination bevat:

- page
- limit
- totalRuns
- totalPages

De huidige afzonderlijke historieken zijn:

- MAES_NETWORK
- DATS24
- SHELL

---

# 20. Scheduler Run Voorbeelden

Een normale Shell-run kan bijvoorbeeld bevatten:

- scraper: `SHELL`
- status: `SUCCESS`
- stations: `200`
- inserted: `0`
- updated: `200`
- skipped: `0`
- duplicates: `0`
- errors: `0`

Een normale DATS24-run kan bijvoorbeeld bevatten:

- scraper: `DATS24`
- status: `SUCCESS`
- stations: `147`
- updated: `147`

Een normale MAES-run kan bijvoorbeeld bevatten:

- scraper: `MAES_NETWORK`
- status: `SUCCESS`
- stations: `275`
- updated: `275`

Deze aantallen zijn voorbeelden van actuele scraperuitvoer en kunnen
wijzigen.

---

# 21. Source Data versus Resolved Data

FuelAlert bewaart de brongegevens en de prijsresolutie als afzonderlijke
concepten.

`stations_v2`:

Bevat het oorspronkelijke opgeslagen stationrecord.

`station_source_links`:

Bevat relaties tussen verschillende bronnen.

`StationPriceResolver`:

Bepaalt welke beschikbare bronprijs uiteindelijk gebruikt wordt.

Hierdoor blijft de herkomst van data traceerbaar.

---

# 22. Database Data Flow

Volledige databaseflow:

External Source
|
v
Scraper
|
v
ScraperManager
|
v
Validator Framework
|
v
PersistenceEngine
|
v
StationRepository
|
v
stations_v2
|
+--------------------+
| |
v v
station_source_links SchedulerRunRepository
| |
v v
StationPriceResolver scheduler_runs
|
v
Dealer Override
|
v
Final Price
|
v
REST API Scheduler Monitor
|
v
Frontend

---

# 23. Database Integrity

De databasearchitectuur probeert brongegevens en bronrelaties strikt
gescheiden te houden.

Belangrijke principes:

- Een stationrecord blijft gekoppeld aan zijn oorspronkelijke source.
- Cross-source relaties worden opgeslagen in `station_source_links`.
- Prijsresolutie verandert de bronidentiteit van een stationrecord niet.
- Schedulerhistoriek wordt opgeslagen in `scheduler_runs`.
- Smoke tests worden niet als productiehistoriek opgeslagen.
- De PersistenceEngine is de centrale database-ingang voor scraperdata.

---

# 24. Oude Database Architectuur

De V2-architectuur gebruikt:

`stations_v2`

De oude databasearchitectuur blijft voorlopig geïsoleerd totdat de
volledige migratie is afgerond.

De oude tabellen mogen pas worden uitgefaseerd wanneer:

1. Alle vereiste scrapers op V2 draaien.
2. Stationdekking is gecontroleerd.
3. Prijsaccuraatheid is gecontroleerd.
4. REST API's naar V2 zijn gemigreerd.
5. Frontendfunctionaliteit is gemigreerd.
6. Scheduler V2 volledig actief is.
7. Historische data correct is behandeld.

---

# 25. Current Database Components

De huidige belangrijke databasecomponenten zijn:

| Component                         | Doel                                     |
| --------------------------------- | ---------------------------------------- |
| `stations_v2`                     | Gestandaardiseerde V2-stations           |
| `station_source_links`            | Koppelingen tussen bronnen               |
| `scheduler_runs`                  | Schedulerhistoriek                       |
| `StationRepository`               | Station persistence                      |
| `StationSourceLinkRepository`     | Cross-source link persistence            |
| `SchedulerRunRepository`          | Schedulerhistoriek persistence           |
| `PersistenceEngine`               | Centrale persistencepipeline             |
| `StationPriceResolver`            | Prijsbron-, fallback- en dealerresolutie |
| `station_dealer_overrides`        | Actieve dealerprijzen en kortingen       |
| `station_dealer_override_history` | Historiek van dealerwijzigingen          |

---

# 26. Current Production Data Sources

De huidige actieve scraperbronnen zijn:

| Source       | Scheduler ID   | Database source          | Status           |
| ------------ | -------------- | ------------------------ | ---------------- |
| MAES Network | `MAES_NETWORK` | MAES source records      | Production Ready |
| DATS24       | `DATS24`       | DATS24 source records    | Production Ready |
| Shell        | `SHELL`        | `shell_official_scraper` | Production Ready |

Actuele scraperuitvoer:

- MAES Network: ongeveer 275 stations
- DATS24: ongeveer 147 stations
- Shell: 200 stations

De aantallen zijn niet permanent en kunnen wijzigen wanneer de
bronnen hun stationdekking aanpassen.

---

# 27. Future Database Extensions

De dealer override-architectuur is vanaf versie 2.3 onderdeel van het
databasemodel. De daadwerkelijke tabellen, API's en dealerportal worden
ingevoerd wanneer de dealerfunctionaliteit wordt gebouwd.

Mogelijke toekomstige databasecomponenten zijn:

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

Deze onderdelen worden pas toegevoegd wanneer de bijbehorende
functionaliteit daadwerkelijk wordt geïmplementeerd.

---

# 28. Database Design Principle

De databasearchitectuur volgt het principe:

Source data first.

Daarbovenop worden relaties en resolutie toegevoegd.

Dit betekent:

1. Bronrecord bewaren.
2. Bron identificeren.
3. Record valideren.
4. Record opslaan.
5. Eventuele cross-source relatie opslaan.
6. Beste beschikbare bronprijs bepalen.
7. Een geldige dealer override toepassen wanneer aanwezig.
8. De oorspronkelijke bronprijs behouden.
9. De uiteindelijke prijs via de API beschikbaar maken.

Hierdoor blijft FuelAlert uitbreidbaar wanneer nieuwe bronnen worden
toegevoegd.

---

# 29. Guiding Principle

De database is niet ontworpen rond één scraper.

De database is ontworpen rond een multi-source platform.

Nieuwe bronnen moeten gebruik kunnen maken van dezelfde:

- stationstructuur
- persistence
- validatie
- bronkoppeling
- prijsresolutie
- dealer override-laag
- schedulerhistoriek
- monitoring

De dealerlaag staat bovenop de automatische bronlaag en mag de
oorspronkelijke scraperdata nooit vernietigen of overschrijven.

De database moet daardoor onafhankelijk blijven van de implementatie
van een individuele scraper en tegelijk ruimte bieden aan
geverifieerde dealers om actuele prijzen of kortingen rechtstreeks te
beheren.
