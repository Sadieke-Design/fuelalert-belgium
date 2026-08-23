# FuelAlert Belgium - Systeemarchitectuur

Versie: 2.3

Status: Levend document

Laatst bijgewerkt: 2026-08-23

---

# Architectuurprincipes

FuelAlert volgt deze architectuurprincipes.

1. Modulariteit
2. Gegevensverzameling uit meerdere bronnen
3. Officiële API's krijgen voorrang op scraping
4. Foutveilige verwerking
5. Ontwikkeling met documentatie als uitgangspunt
6. Plug-and-play gegevensbronnen
7. Scheiding van verantwoordelijkheden
8. Platform vóór functies
9. Brononafhankelijkheid
10. Geverifieerde bronkoppeling
11. Live prijsresolutie
12. Monitoring als uitgangspunt
13. Door dealers beheerde prijsoverschrijvingen
14. Voorrang van dealerprijzen op bronprijzen
15. Traceerbare prijsoorsprong

---

# Overzicht

FuelAlert Belgium is een modulair dataplatform voor het verzamelen, valideren,
opslaan, bepalen en verspreiden van Belgische brandstofprijsinformatie.

In plaats van elke scraper als een afzonderlijke component te behandelen, wordt elke
gegevensbron geïntegreerd in een gemeenschappelijke scraper- en persistentiearchitectuur.

Het platform richt zich op:

- Betrouwbaarheid
- Schaalbaarheid
- Onderhoudbaarheid
- Modulariteit
- Uitbreidbaarheid
- Brononafhankelijkheid
- Datakwaliteit
- Continue monitoring
- Dealerdeelname
- Transparante prijsoorsprong

Huidige actieve gegevensbronnen:

- MAES Network
- DATS24
- Shell

De architectuur maakt het mogelijk extra bronnen toe te voegen zonder
de kernarchitectuur voor persistentie, monitoring, scheduler of prijsresolutie
te wijzigen.

Een belangrijk toekomstig principe is dat FuelAlert scrapers blijft bouwen
voor stations en netwerken en daarnaast een gecontroleerd
dealerportaal aanbiedt waarmee geverifieerde stationdealers/operators
hun eigen prijzen en kortingen handmatig kunnen beheren.

---

# Architectuur op hoog niveau

                    Frontend (React + Vite)

                               |

                               v

                        REST API (Express)

                               |

                +--------------+--------------+

                |                             |

          Authenticatie                Bedrijfsdiensten

                |                             |

                +--------------+--------------+

                               |

                        Scraper Manager

                               |

          +--------------------+--------------------+

          |                    |                    |

      MAES Network           DATS24              Shell

          |                    |                    |

          +--------------------+--------------------+

                               |

                       Uniforme scraperuitvoer

                               |

                       Validatiekader

                               |

                       Persistentie-engine

                               |

                       Stationrepository

                               |

                           stations_v2

                               |

                 +-------------+-------------+

                 |                           |

        Stationbronlinks         Dealerprijsgegevens

                 |                           |

                 +-------------+-------------+

                               |

                        Prijsresolatielaag

                               |

                 +-------------+-------------+

                 |                           |

          Scraper-/bronprijs       Dealeroverschrijving

                 |                           |

                 +-------------+-------------+

                               |

                         Bepaalde prijs

                               |

                         REST API / Frontend

Ondersteunende infrastructuur:

- Scheduler
- Scheduler-runrepository
- Scheduler-monitor
- Health Registry
- Metrics Registry
- Capability Registry
- Rate Limiter
- Rapportage-engine
- Dealer Authenticatie
- Dealer-stationverificatie
- Dealerprijsbeheer
- Audit van prijsoverschrijvingen

---

# Kerngegevensarchitectuur

FuelAlert scheidt bronverzameling van stationidentiteit,
dealeridentiteit en prijsresolutie.

Een scraper is verantwoordelijk voor het verzamelen van brongebonden gegevens.

De persistentielaag slaat het bronrecord op.

De stationkoppelingslaag kan records uit verschillende bronnen koppelen
wanneer ze hetzelfde fysieke station vertegenwoordigen.

De dealerlaag identificeert geverifieerde dealers/operators die gemachtigd zijn
om prijzen voor hun station te beheren.

De prijsresolver bepaalt welke beschikbare prijs moet worden gebruikt voor
de weergegeven prijs.

The resulting architecture is:

External Bron

       |

       v

Scraper

       |

       v

Uniform Output

       |

       v

ScraperManager

       |

       v

Validatiekader

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

       +-------------> station_source_links

       |

       +-------------> dealer_station_relationships

       |

       +-------------> dealer_price_overrides

       |

       v

PriceResolutionEngine

       |

       v

Bepaalde prijs

       |

       v

REST API

       |

       v

Frontend

---

# DataBron Engine

De DataBron Engine is de centrale architectuur voor het integreren van
externe brandstofgegevensbronnen.

Elke actieve bron gebruikt dezelfde infrastructuur voor uitvoering, persistentie, monitoring
and rapportage te wijzigen.

Huidige componenten:

- Scraper Registry
- ScraperManager
- BaseScraper
- Capability Registry
- Validatiekader
- Persistentie-engine
- Stationrepository
- Station Bron Link Repository
- Station Price Resolver
- Prijsresolutie-engine
- Scheduler
- Scheduler-runrepository
- Scheduler-monitor
- Health Registry
- Metrics Registry
- Rate Limiter
- Rapportage-engine

---

# Capability Registry

De Capability Registry beschrijft welke mogelijkheden elke gegevensbron ondersteunt.

Voorbeelden:

- Brandstofprijzen
- Stations
- Coördinaten
- Openingsuren
- EV-laden
- Promoties
- Diensten

Het capabilitiesysteem maakt het mogelijk dat toekomstige bronnen extra
informatie aanbieden zonder de kernarchitectuur te wijzigen.

Endpoint:

`/api/capabilities`

---

# Scheduler Engine

De Scheduler voert de geregistreerde scraperworkflow automatisch uit.

Verantwoordelijkheden:

- Taakplanning
- Periodieke uitvoering
- Uitvoering bij opstart
- Achtergrondverwerking
- Starten van de ScraperManager

Huidig productie-interval:

- 15 minutes
- 900000 ms

De scheduler voert de volledige actieve scraperregistratie uit.

Huidig actieve scrapers:

- MAES_NETWORK
- DATS24
- SHELL

Dealerprijzen worden niet vervangen alleen omdat een scraper wordt uitgevoerd.
De scraper werkt de brongegevenslaag bij; de prijsresolatielaag
bepaalt wat uiteindelijk wordt weergegeven.

Endpoint:

`/api/scheduler`

---

# Uitvoeringsstroom van de Scheduler

The scheduler executes:

Scheduler

|

Geregistreerde taak

|

ScraperManager.run()

|

Actieve scrapers

|

PersistenceEngine

|

StationRepository

|

Database

|

SchedulerRunRepository

|

scheduler_runs

|

Scheduler-monitor

De Scheduler bevat geen brongebonden scraperlogica.

Brongebonden logica blijft in de afzonderlijke scraper.

Dealeroverschrijvingen maken geen deel uit van de scraperuitvoering. Ze worden afzonderlijk beheerd
en geëvalueerd door de prijsresolatielaag.

---

# Scraper Registry

Actieve scrapers worden geregistreerd in:

`backend/scrapers/registry.js`

Huidige actieve productiescrapers:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

De registry levert de actieve scrapercollectie die wordt gebruikt door
`ScraperManager`.

Een nieuwe productiescraper toevoegen vereist:

1. De scraper implementeren
2. De uitvoer valideren
3. De scraper registreren
4. Persistentie testen
5. Scheduleruitvoering testen
6. De scraper actieveren

De langetermijnstrategie is om betrouwbare scrapers voor
aanvullende stationnetwerken te blijven toevoegen en tegelijk geverifieerde dealers
toe te staan prijzen te beheren wanneer bronprijzen niet beschikbaar, vertraagd of aangevuld
moeten worden met dealerinformatie.

---

# Scraper Manager

De ScraperManager is verantwoordelijk voor het uitvoeren van alle actieve scrapers te vervangen.

File:

`backend/scrapers/ScraperManager.js`

Verantwoordelijkheden:

- Actieve scrapers uitvoeren
- Scrapers uitvoeren via de gemeenschappelijke interface
- Scraperfouten afhandelen
- Health Registry bijwerken
- Records doorgeven aan de PersistenceEngine
- Uitvoeringssamenvattingen genereren
- Resultaten van scheduler-runs registreren
- Voorkomen dat smoketests schedulerhistoriek aanmaken

Scrapers are executed through the common ScraperManager architecture.

De ScraperManager bepaalt niet of een scraperprijs of dealerprijs
moet worden weergegeven. Die beslissing behoort tot de prijsresolutie-
laag.

---

# Gedrag van smoketests

The ScraperManager supports a `smokeTest` mode.

Smoketests kunnen de volledige scraperpipeline uitvoeren zonder
persistente schedulerhistoriekrecords aan te maken.

Wanneer:

`smokeTest = true`

kan de scraperuitvoering nog steeds:

- Execute scrapers
- Validate records
- Testgegevens opslaan wanneer gevraagd
- Uitvoeringsrapporten genereren

maar geen records aanmaken in:

`scheduler_runs`

Normale scheduleruitvoeringen gebruiken:

`smokeTest = false`

en worden opgenomen in de schedulerhistoriek.

---

# Uniforme scraperuitvoer

Alle actieve scrapers leveren een gemeenschappelijke stationrecordstructuur.

Kernvelden zijn onder andere:

- station_id
- brand
- name
- address
- postal_code
- city
- latitude
- longitude
- prices
- currency
- source
- bijgewerkt_at

Verschillen in brandstofbenamingen tussen bronnen worden vóór of tijdens
de persistentie genormaliseerd.

Voorbeelden:

MAES:

- benzine95
- benzine98
- diesel
- lpg

DATS24:

- e95
- e98
- diesel
- lpg
- cng
- adblue

Shell:

- benzine95
- benzine98
- diesel
- lpg
- cng
- adblue

Een brandstofveld kan `NULL` bevatten wanneer de bron die
brandstof niet aanbiedt.

Scraper output remains the bronprijs laag. It must not overwrite an
actieve dealer override in the resolved/public price laag.

---

# Huidige Scrapers

## MAES Network

Bron identifier:

`MAES_NETWORK`

Status:

Productieklaar

Huidig station coverage:

Approximately 275 records in the actieve scraper output.

The MAES scraper collects live station information from the MAES
network.

De scraper is integrated into:

- ScraperManager
- PersistenceEngine
- Scheduler
- Health Registry
- Metrics Registry
- Scheduler-monitor

---

## DATS24

Bron identifier:

`DATS24`

Status:

Productieklaar

Huidig station coverage:

Approximately 147 stations in the actieve scraper output.

The DATS24 scraper collects station and fuel price information from
DATS24 station pages and associated stationgegevens.

De scraper is integrated into:

- ScraperManager
- PersistenceEngine
- Scheduler
- Health Registry
- Metrics Registry
- Scheduler-monitor

---

## Shell

Bron identifier:

`SHELL`

Status:

Productieklaar

Huidig station coverage:

200 officiële Shell station records.

The Shell scraper retrieves officiële Shell station information and
officiële Shell price information.

The Shell scraper is integrated into the same architecture as MAES and
DATS24.

The Shell scraper uses the officiële Shell Belgium price update source
for its officiële price dataset.

The current implementatie also supports linking Shell stations to
corresponding MAES Network station records when a geverifieerde station
match exists.

This allows FuelAlert to use live MAES network prices for a physical
Shell station when the station is represented in both sources.

Dealer overrides remain independent of this cross-source mechanism.

---

# Shell -> MAES Stationkoppeling

FuelAlert contains a dedicated station source linking mechanism.

Database table:

`station_source_links`

Repository:

`backend/repositories/StationBronLinkRepository.js`

The purpose of this system is to connect station records from
different data sources that represent the same physical station.

The link contains information such as:

- source_a
- station_id_a
- source_b
- station_id_b
- distance_m
- match_type
- confidence
- actieve
- aangemaakt_at
- bijgewerkt_at

---

# Station Bron Matcher

The station source matcher automatically searches for compatible
station records between sources.

The current Shell -> MAES matching process uses geographic station
coordinates as the primary matching mechanism.

The matcher evaluates:

- Geographic distance
- Station identity
- Bron
- Station coordinates
- Match confidence

Huidig Shell matching validatie has established:

- 200 officiële Shell stations
- 78 MAES Shell records
- 35 geverifieerde matches
- 43 MAES Shell records without an officiële Shell match

The geverifieerde matches are opgeslagen in:

`station_source_links`

A uniqueness check ensures that one officiële Shell station is not
linked to multiple actieve MAES records.

---

# StationBronLinkRepository

File:

`backend/repositories/StationBronLinkRepository.js`

Verantwoordelijkheden:

- Find an existing station link
- Create or update links
- Find links for a station
- Find all actieve links
- Deactivate links

De repository provides the persistence layer for cross-source station
relationships.

Actief links can be retrieved using:

`findAllActief()`

Station-specific links can be retrieved using:

`findByStation()`

---

# Station Price Resolver

File:

`backend/services/StationPriceResolver.js`

The Station Price Resolver determines which bronprijs should be used
when a station has multiple available data sources.

This separates:

- Station identity
- Bron identity
- Bron linking
- Bron price selection

For a Shell station with a valid MAES link, the resolver can select
the live MAES Network price.

De resolver exposes information about:

- Resolved prices
- Price source
- Price priority
- Linked station
- Bron prices
- Fallback usage

The Station Price Resolver must also respect dealer overrides.

Dealer-entered prices and discounts are evaluated before the final
resolved price is returned to the API/frontend.

---

# Dealerprijsbeheer Architecture

FuelAlert will provide a dedicated mechanism through which geverifieerde
station dealers/operators can maintain their own station prices and
discounts.

This does not replace the scraper strategy.

The strategy is:

1. Continue building scrapers for all relevant station networks.
2. Use scraper/brondata as the automatic baseline.
3. Provide geverifieerde dealers with a station management page.
4. Allow a geverifieerde dealer to enter or adjust fuel prices.
5. Allow a geverifieerde dealer to enter applicable discounts.
6. Once a valid dealer override exists, it takes precedence over
   scraper/bronprijss for that station and brandstof niet aanbiedt.
7. Continue collecting scraper prices in the background.
8. Keep the oorspronkelijke scraper/brondata available for traceability.
9. Allow the dealer override to be removed or expire according to the
   configured business rules.
10. When no actieve dealer override exists, automatically fall back to
    the normal source-resolution strategy.

This means the scraper remains the automatic data backbone, while the
dealer becomes the authoritative prijsbron for the station when the
dealer has explicitly supplied a price or discount.

---

# Dealeridentiteit en Stationverificatie

Dealer price management must never be based solely on an ungeverifieerde
claim that a user owns or manages een station te beheren.

Het systeem therefore requires a station-dealer verification laag.

Conceptuele relatie:

User

|

Authenticatie

|

Dealer Account

|

Station Verification

|

Verified Station

|

Dealerprijsbeheer

A dealer may only create an actieve price override for stations for
which the dealer has been geverifieerde/authorized.

The exact verification workflow is a separate implementatie concern
en kan omvatten:

- Manual administrator verification
- Business/contact verification
- Station-specific verification
- Verification documents
- Other controlled verification mechanisms

De architectuur must support verification status independently from
the price data itself.

---

# Dealer-stationrelaties

Dealer ownership/management relationships must be opgeslagen separately
from station brondata.

Conceptual table:

`dealer_station_relationships`

Belangrijke conceptuele velden zijn onder andere:

- id
- user_id / dealer_id
- station_id
- verification_status
- verification_method
- geverifieerde_at
- geverifieerde_by
- actieve
- aangemaakt_at
- bijgewerkt_at

Deze relatie bepaalt of een dealer gemachtigd is om
een station te beheren.

---

# Dealerprijsoverschrijvingen

Dealer-entered prices must be opgeslagen separately from scraper/source
prices.

Conceptual table:

`dealer_price_overrides`

The table should support:

- id
- station_id
- dealer_id
- fuel_type
- price
- discount
- currency
- actieve
- valid_from
- valid_until
- bijgewerkt_at
- aangemaakt_at

Optionele velden voor oorsprong/audit kunnen zijn:

- source
- note
- bijgewerkt_by
- previous_price
- previous_discount

Het exacte databaseschema wordt tijdens de implementatie definitief vastgelegd.

De belangrijke architectuurregel is dat dealeroverschrijvingen de
oorspronkelijke scraper-/bronprijs in de brongegevenslaag niet mogen
laag.

---

# Bereik van Dealerprijsoverschrijvingen

Overrides should be granular enough to avoid unnecessarily replacing
all station prices.

Het voorkeursmodel is:

Station + Fuel Type + Dealeroverschrijving

Voorbeeld:

Station A:

- benzine95 -> dealerprijs
- benzine98 -> scraper price
- diesel -> dealer discount
- lpg -> scraper price

If a dealer changes only diesel, the other fuel prices continue using
the normal source-resolution logic.

Dit biedt nauwkeurige controle en voorkomt het per ongeluk vervangen van
geldige brongegevens.

---

# Dealerkortingen

FuelAlert may support dealer-entered discounts separately from the
base price.

A dealer could therefore provide:

Base scraper price:

€1.700

Dealer discount:

€0.050

Resolved effective price:

€1.650

De architectuur must clearly distinguish between:

- Bron/base price
- Dealer override price
- Dealer discount
- Resolved effective price

Dit onderscheid is belangrijk voor transparantie, controleerbaarheid en toekomstige
prijshistoriekfunctionaliteit.

If the dealer enters an absolute final price instead of a discount,
the system must not automatically calculate a discount unless the
required source/base price is known and the business rules explicitly
allow it.

---

# Prioriteit van Prijsresolutie

The final price shown by FuelAlert is determined by a dedicated
price-resolution process.

De beoogde prioriteit is:

1. Actief geverifieerde dealer override
2. Linked live bronprijs
3. Official/oorspronkelijke station bronprijs
4. Stored fallback price
5. No price available

Voor elk brandstoftype wordt de resolutie afzonderlijk uitgevoerd.

Voorbeeld:

Dealer:

diesel = €1.650

MAES live:

diesel = €1.690

Shell officiële:

diesel = €1.700

Resolved:

diesel = €1.650

De dealerprijs wins because the dealer has supplied an actieve,
geverifieerde override.

Deze regel geldt ongeacht of de onderliggende stationprijs
afkomstig is van MAES, DATS24, Shell of een toekomstige bron.

---

# Prijsresolutie met Kortingen

When a dealer supplies a discount instead of an absolute price, the
resolution process can calculate the effective dealerprijs.

Voorbeeld:

Bron resolved price:

€1.700

Dealer discount:

€0.050

Effective dealerprijs:

€1.650

De resolver moet de onderliggende waarden behouden zodat de API de
oorsprong kan tonen.

Conceptueel:

- base_price = 1.700
- dealer_discount = 0.050
- resolved_price = 1.650
- price_source = dealer
- price_priority = dealer_override

If the dealer override is removed or expires, the resolver returns to
the normal source priority.

---

# Dealeroverschrijving and Scraper Update Behaviour

A scraper continues running normally after a dealer override is
aangemaakt.

Voorbeeld:

Vóór dealeroverschrijving:

Scraper price:

€1.700

Weergegeven:

€1.700

Dealer voert in:

€1.650

Weergegeven:

€1.650

Volgende scraperuitvoering:

Scraper price:

€1.680

Weergegeven:

€1.650

De scraper price has changed, but the actieve dealer override remains
bepalend.

Als de dealer de overschrijving later verwijdert of deze vervalt:

Scraper price:

€1.680

Weergegeven:

€1.680

Dit is een fundamentele architectuurregel.

A scraper update must never silently destroy an actieve dealer override.

---

# Dealeroverschrijving Audit Trail

All dealerprijs changes should be traceable.

Het systeem should retain sufficient information to determine:

- Which dealer changed the price
- Which station was changed
- Which fuel type was changed
- Previous value
- New value
- Previous discount
- New discount
- Timestamp
- Activation/deactivation state

A future audit table may be implemented as:

`dealer_price_override_historiek`

This is important for:

- Datakwaliteit
- Dispute handling
- Abuse detection
- Administrator review
- Price historiek
- Dealer accountability

---

# Prijsoorsprong

Every resolved price should be traceable to its origin.

De API should be able to expose conceptual metadata such as:

- resolved_price
- base_price
- dealer_price
- dealer_discount
- price_source
- price_priority
- source_station_id
- source_bijgewerkt_at
- dealer_bijgewerkt_at

Voorbeeld:

resolved_price:

`1.650`

price_source:

`dealer_override`

price_priority:

`dealer`

base_price:

`1.700`

dealer_discount:

`0.050`

Hierdoor kan de frontend duidelijk aangeven dat de prijs
door de dealer is aangeleverd of gewijzigd.

---

# Strategie voor Bronprioriteit

FuelAlert distinguishes between:

- Original brondata
- Linked live brondata
- Official brondata
- Fallback data
- Dealer override data

The StationPriceResolver determines which price should be exposed to
the application.

The oorspronkelijke station/bronrecord remains opgeslagen in its brondata
laag.

Cross-source relationships are opgeslagen separately in
`station_source_links`.

Dealer relationships and dealer overrides are opgeslagen separately from
bronrecords.

The resolved price is therefore a calculated application value rather
than the replacement of the underlying brondata.

---

# Validatie-engine

The Validator Engine is responsible for validating scraper output
before database de persistentie genormaliseerd.

Huidig validatie architecture includes:

- Price Validator
- GPS Validator
- Address Validator
- Duplicate Validator

Validation responsibilities include:

- Missing prices
- Invalid prices
- Invalid coordinates
- Invalid addresses
- Duplicate stations
- Suspicious records
- Datakwaliteit checks

The validator framework uses a common validator interface.

The validatie layer is designed to be extended with additional
validators without changing the scraper architecture.

Dealer price validatie is a separate but related responsibility.

Dealer-entered prices should be checked for:

- Valid numeric format
- Reasonable price range
- Valid fuel type
- Authorized station
- Valid currency
- Valid discount format
- Validity period
- Conflicting actieve overrides

Het systeem should be able to reject or flag obviously invalid dealer
de brongegevens van de scraper te wijzigen.

---

# Persistentiearchitectuur

Scrapers do not write directly to MySQL.

Architecture:

Scraper

|

ScraperManager

|

Validatiekader

|

PersistenceEngine

|

StationRepository

|

stations_v2

Dealer data follows a separate persistence path:

Dealer Portal

|

Authenticatie

|

Station Verification

|

Dealer Price Validation

|

Dealer Price Repository

|

dealer_price_overrides

Deze scheiding voorkomt dat scraperupdates rechtstreeks dealer
overschrijvingsrecords wijzigen.

Files:

`backend/persistence/PersistenceEngine.js`

`backend/repositories/StationRepository.js`

Toekomstig dealer-specific repository examples:

`backend/repositories/DealerStationRepository.js`

`backend/repositories/DealerPriceOverrideRepository.js`

---

# PersistenceEngine

The Persistentie-engine processes scraper records.

For each valid record it calls the StationRepository.

The persistence result is counted as:

- inserted
- bijgewerkt
- skipped
- duplicates
- errors

The uitvoering duration is also recorded.

The PersistenceEngine provides a common persistence mechanism for all
actieve data sources.

It must not delete or overwrite dealer overschrijvingsrecords wijzigen.

---

# StationRepository

The StationRepository is responsible for storing stationgegevens.

Database table:

`stations_v2`

The station identifier is:

`station_id`

De repository performs:

Find station

     |

     +-- Not found -> INSERT

     |

     +-- Found     -> UPDATE

De repository abstracts direct SQL station persistence from the rest
of the application.

Bron updates to station prices remain separate from the dealer
override laag.

---

# Database

The primary V2 station table is:

`stations_v2`

Important fields include:

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
- actieve
- last_update
- last_price_change
- aangemaakt_at
- bijgewerkt_at

Fuel-specific fields may contain `NULL` when a particular station does
not provide that brandstof niet aanbiedt.

De architectuur does not require dealer overrides to be opgeslagen in
these base station price columns.

---

# Stationbronlinks Database

Cross-source station relationships are opgeslagen separately from
`stations_v2`.

Table:

`station_source_links`

This table prevents source-specific station identifiers from being
mixed into the main stationidentiteit.

This architecture allows future sources to be linked without changing
the station table structure.

Dealer station relationships are separate from source linking.

---

# Datamodel voor Dealers

Dealer functionality introduces three logically separate concepts:

1. Dealer identity
2. Dealer authorization for a station
3. Dealer price override

These must not be collapsed into the station table.

Conceptuele relatie:

Dealer Account

      |

      v

Dealer Station Relationship

      |

      v

Verified Station

      |

      v

Dealer Price Override

      |

      v

Prijsresolutie-engine

This allows a dealer to manage one or more authorized stations without
mixing authentication, stationidentiteit and price data.

---

# Brandstofmapping

The persistence and resolution layers support different naming
conventions used by individual data sources.

DATS24:

`e95 -> benzine95`

`e98 -> benzine98`

MAES:

`benzine95 -> benzine95`

`benzine98 -> benzine98`

Shell:

`benzine95 -> benzine95`

`benzine98 -> benzine98`

This allows multiple scrapers to use the same database structure.

Dealer fuel entries must use the same canonical FuelAlert fuel types.

---

# Health Registry

The Health Registry provides live source health information.

The ScraperManager updates the registry after each scraper uitvoering.

Tracked information includes:

- Status
- Number of stations
- Errors
- Success rate

Huidig statuses:

- ONLINE
- OFFLINE

Endpoint:

`/api/health`

Dealer functionality should not affect scraper health rapportage.

A healthy scraper can continue running even when dealer overrides are
actieve.

---

# Metrics Registry

The Metrics Registry collects scraper uitvoering information.

Tracked metrics include:

- Runtime
- Average duration
- Total uitvoerings
- Failed uitvoerings
- Stations processed
- Inserted records
- Updated records
- Skipped records
- Duplicate records
- Errors

Endpoint:

`/api/metrics`

Toekomstige statistieken kunnen dealeractiviteiten afzonderlijk bijhouden, zoals:

- Actief dealer overrides
- Dealer price updates
- Override expirations
- Verification events

These metrics should not be mixed with scraper uitvoering metrics.

---

# Rate Limiter

The Rate Limiter protects external data sources.

Verantwoordelijkheden:

- Delay requests
- Retry strategy
- Prevent blocking
- Respect source limitations
- Control concurrent requests
- Configure request timeouts

De huidige configuratie omvat:

MAES_NETWORK:

- delay: 1500 ms
- retries: 3
- timeout: 30000 ms
- concurrent: 1

DATS24:

- delay: 500 ms
- retries: 3
- timeout: 30000 ms
- concurrent: 1

The Rate Limiter is designed so additional sources can receive
source-specific configuraties.

Dealer portal requests do not use scraper rate-limiting rules.

---

# Rapportage-engine

The Rapportage-engine generates standardized scraper uitvoering reports.

Reports contain:

- Bron
- Success status
- Station count
- Inserted records
- Updated records
- Skipped records
- Duplicate records
- Errors
- Duration

Toekomstige dealer-rapporten kunnen afzonderlijk omvatten:

- Dealer updates
- Actief overrides
- Expired overrides
- Verification status

---

# Scheduler-runrepository

Every normal scraper uitvoering is registered in:

`scheduler_runs`

File:

`backend/repositories/SchedulerRunRepository.js`

Stored information includes:

- scraper
- status
- stations
- inserted
- bijgewerkt
- skipped
- duplicates
- errors
- duration_ms
- started_at
- finished_at

Smoke-test uitvoerings do not create scheduler historiek records.

Dealer price changes are not scheduler runs and must not be opgeslagen as
scheduler uitvoerings.

---

# Scheduler-monitor

De Scheduler-monitor provides realtime monitoring of scraper
uitvoering.

Backend route:

`backend/routes/schedulerMonitorRoutes.js`

Repository:

`backend/repositories/SchedulerRunRepository.js`

Frontend:

`src/pages/SchedulerMonitor.jsx`

Functionaliteiten:

- Live refresh
- Runs today
- Success statistics
- Failed statistics
- Average duration
- Latest executed run
- Number of stations
- Number of bijgewerkt records
- Error count
- Scheduler historiek
- Pagination
- Per-scraper filtering
- Separate scraper historiek

Huidig scraper histories:

- MAES_NETWORK
- DATS24
- SHELL

Backend endpoint:

`/api/scheduler-monitor`

Het endpoint ondersteunt filtering op scraper.

Voorbeeld:

`/api/scheduler-monitor?scraper=SHELL&page=1`

De API returns:

- pagination
- summary
- runs

Paginering omvat:

- page
- limit
- totalRuns
- totalPages

Dealer price changes are intentionally outside scheduler historiek.

---

# Scheduler-monitor Data Flow

Scheduler

    |

ScraperManager

    |

Scraper

    |

PersistenceEngine

    |

SchedulerRunRepository

    |

scheduler_runs

    |

Scheduler-monitor API

    |

React Scheduler-monitor

The monitor reads actual scheduler uitvoering historiek from the database
in plaats van alleen te vertrouwen op tijdelijke runtime-status.

---

# Schedulerhistoriek

The scheduler historiek records complete production scraper uitvoerings.

Voorbeeld:

SHELL

stations: 200

bijgewerkt: 200

status: SUCCESS

DATS24

stations: 147

bijgewerkt: 147

status: SUCCESS

MAES_NETWORK

stations: 275

bijgewerkt: 275

status: SUCCESS

A successful uitvoering is visible independently for every actieve
source.

---

# Schedulerconfiguratie

De backend scheduler is initialized when the API server starts.

Huidig production job:

`Fuel Scrapers`

Interval:

`15 minutes`

De taak voert uit:

- MAES_NETWORK
- DATS24
- SHELL

De scheduler gebruikt dezelfde ScraperManager als handmatige en diagnostische
uitvoerings.

Dealer overrides do not alter scraper scheduling.

---

# REST API

Huidig relevant endpoints include:

`/api/fuel-prices`

`/api/stations`

`/api/capabilities`

`/api/health`

`/api/metrics`

`/api/validatie`

`/api/persistence`

`/api/scheduler`

`/api/scheduler-monitor`

Toekomstig dealer endpoints should include a dedicated authenticated API
laag krijgen, conceptueel:

`/api/dealer/stations`

`/api/dealer/stations/:stationId`

`/api/dealer/prices`

`/api/dealer/prices/:stationId`

`/api/dealer/overrides`

`/api/dealer/overrides/:id`

`/api/dealer/verification`

Dit zijn architectuurdoelen en betekenen niet dat alle endpoints
al geïmplementeerd zijn.

Authenticatie endpoints include:

`/api/auth/register`

`/api/auth/verify-email`

`/api/auth/login`

`/api/auth/forgot-password`

`/api/auth/reset-password`

---

# Gedrag van de Publieke Prijs-API

The public station/price API should return the resolved price rather
than blindly exposing the raw station price.

Conceptueel:

Raw brondata

       |

Bron resolution

       |

Dealer override check

       |

Resolved price

       |

Public API

For each fuel type the API should be able to expose enough provenance
for the frontend to distinguish:

- Scraper price
- Linked bronprijs
- Dealer price
- Dealer discount
- Effective resolved price

De frontend mag de logica voor prijsprioriteit niet zelf hoeven te reproduceren.

De backend blijft de enige bron van waarheid voor prijsresolutie.

---

# Frontendarchitectuur

De frontend communicates with the backend through REST endpoints.

Huidig frontend components include:

- Dashboard
- Stations
- Map
- Authenticatie
- Scheduler-monitor

Toekomstig dealer components include:

- Dealer Dashboard
- My Stations
- Station Price Management
- Discount Management
- Price History
- Verification Status
- Dealer Account

Dealer pages must use authenticated backend APIs.

Price-resolution rules must remain in the backend and must not be
implemented independently in the frontend.

---

# Dealerworkflow

The intended dealer workflow is:

1. Dealer registers/logs in.
2. Dealer requests access to een station te beheren.
3. FuelAlert verifies the dealer/station relationship.
4. Station becomes available in the dealer portal.
5. Dealer opens the station price management page.
6. Dealer enters prices and/or discounts.
7. FuelAlert validates the values.
8. Valid overrides become actieve.
9. Public station prices immediately use the dealer override.
10. Scrapers continue updating bronprijss in the background.
11. Dealer override remains authoritative while actieve.
12. Dealer removes or lets the override expire.
13. FuelAlert automatically falls back to source-based resolutie.

This workflow is deliberately independent of scraper uitvoering.

---

# Voorbeeld van Dealerprijs

Bron data:

MAES:

- benzine95 = €1.700
- diesel = €1.690

Dealer:

- diesel = €1.650
- benzine95 = no override

Resolved:

- benzine95 = €1.700 from MAES
- diesel = €1.650 from dealer

De dealer has not replaced the MAES record. De dealer has aangemaakt a
station/fuel-specific override.

---

# Dealeroverschrijving Lifecycle

An override can have the following conceptual states:

- Draft
- Actief
- Expired
- Disabled
- Rejected

Only an authorized `Actief` override participates in public price
resolutie.

A future implementatie may add approval requirements for certain
dealer accounts or unusual price changes.

---

# Dealerbeveiliging en Misbruikpreventie

Because dealerprijss directly affect public information, dealer
management must be treated as a privileged function.

De architectuur moet ondersteunen:

- Authenticatie
- Authorization
- Station verification
- Input validatie
- Audit logging
- Rate limiting
- Abuse detection
- Override expiration
- Administrator review
- Ability to disable a dealer override
- Ability to suspend dealer access

Een dealer mag nooit een ander station kunnen wijzigen door simpelweg
een station-ID in een verzoek te wijzigen.

Autorisatie moet server-side worden afgedwongen.

---

# Architectuur voor Prijshistoriek

Toekomstige prijshistoriek moet onderscheid maken tussen bronprijswijzigingen
en wijzigingen van dealeroverschrijvingen.

Een historisch record moet antwoord kunnen geven op:

- What was the bronprijs?
- What was the dealerprijs?
- Was a dealer discount actieve?
- What was the resolved public price?
- When did the change occur?
- Which source/dealer supplied the value?

Zo voorkomen we dat dealerprijzen de historische brongegevens verbergen.

---

# Datakwaliteitsstrategie

FuelAlert gaat er niet van uit dat alle externe brongegevens even
betrouwbaar zijn.

De architectuur therefore separates:

- Bron collection
- Validation
- Persistence
- Station linking
- Dealer verification
- Dealer price validatie
- Price resolution
- Presentation

Hierdoor kan het platform de meest geschikte beschikbare bron gebruiken
zonder de oorspronkelijke broninformatie te verliezen.

---

# Strategie voor Bronprioriteit

FuelAlert distinguishes between:

- Original brondata
- Linked live brondata
- Official brondata
- Fallback data
- Dealer override data

The StationPriceResolver determines which price should be exposed to
the application.

The oorspronkelijke station record remains opgeslagen in `stations_v2`.

Cross-source relationships are opgeslagen separately in
`station_source_links`.

Dealer relationships and dealer overrides are opgeslagen separately.

The resolved price is a calculated application value rather than the
replacement of the underlying brondata.

---

# Foutveilige Architectuur

Een scraperfout mag het volledige scrapersysteem niet laten uitvallen.

ScraperManager executes actieve scrapers independently.

De architectuur uses `Promise.allSettled()` so one failing scraper does
not automatically prevent other scrapers from completing.

A failed scraper:

- Is marked OFFLINE in HealthRegistry
- Generates an error log
- Produces a FAILED uitvoering summary
- Creates a FAILED scheduler historiek record during normal uitvoering

Andere succesvolle scrapers kunnen blijven werken.

Dealeroverschrijvingen blijven onafhankelijk van de scraperuitvoering beschikbaar,
zolang aan de geldigheids- en autorisatievereisten is voldaan.

Dit betekent dat een tijdelijke scraperstoring niet automatisch een
geldige dealerprijs uit het publieke resultaat verwijdert.

---

# Architectuur met Monitoring als Uitgangspunt

Van elke productiescraper wordt operationele zichtbaarheid verwacht.

De architectuur therefore tracks:

- Execution status
- Station count
- Updated records
- Inserted records
- Skipped records
- Duplicate records
- Errors
- Duration
- Historical runs

Dealer management introduces a separate operational layer that should
eventually track:

- Verification events
- Price updates
- Override activations
- Override expirations
- Disabled overrides
- Dealer activity

This keeps scraper monitoring and dealer activity auditable without
ongerelateerde statistieken te vermengen.

---

# Schaalbaarheid

Het toevoegen van een nieuwe gegevensbron moet vereisen:

1. New scraper
2. Registration
3. Configuration
4. Validation
5. Persistence testing
6. Scheduler testing
7. Monitoring verification
8. Activation

The existing architecture automatically provides:

- Scraper uitvoering
- Persistence
- Health monitoring
- Metrics
- Scheduler historiek
- Scheduler monitoring
- Reporting
- Price resolution

Een nieuwe bron mag geen nieuwe persistentiearchitectuur vereisen.

Het toevoegen van dealerondersteuning mag evenmin vereisen dat elke
afzonderlijke scraper wordt aangepast. Dealer functionality operates as a separate layer
above source collection and below public price presentation.

---

# Huidige Productiebronnen

| Bron         | Status         | Stations | Methode                                                  |
| ------------ | -------------- | -------: | -------------------------------------------------------- |
| MAES Network | Productieklaar |      275 | Sitemap + HTML + embedded data                           |
| DATS24       | Productieklaar |      147 | HTML + embedded stationgegevens                          |
| Shell        | Productieklaar |      200 | Official Shell stationgegevens + officiële price dataset |

The station counts represent the current scraper output and can change
when source coverage changes.

---

# Status van Bronkoppelingen

Huidige koppeling tussen bronnen:

| Bron A       | Bron B | Status | Koppelingen |
| ------------ | ------ | ------ | ----------: |
| MAES_NETWORK | SHELL  | Actief |          35 |

De huidige Shell/MAES-validatie heeft vastgesteld:

- 200 officiële Shell stations
- 78 MAES Shell stations
- 35 geverifieerde geographic matches
- 43 MAES Shell records without an officiële Shell match

Actief links are opgeslagen in:

`station_source_links`

Het systeem voert ook een uniciteitscontrole uit om ervoor te zorgen dat een officieel
Shell-station niet meerdere actieve MAES-koppelingen heeft.

---

# Officiële Gegevensbronnen

FuelAlert supports both scraper-based and officiële data integrations.

Huidig status:

| Bron               | Status                        |
| ------------------ | ----------------------------- |
| MAES               | Werkend                       |
| DATS24             | Werkend                       |
| Shell              | Werkend                       |
| ESSO               | No officiële public API found |
| Fuel Media Service | Gecontacteerd                 |
| CARBU API          | Commercieel                   |

Officiële API's krijgen voorrang wanneer ze beschikbaar en geschikt zijn
voor de benodigde gegevens.

Dealerprijsbeheer is aanvullend op bronverzameling. Het is
niet bedoeld om het zoeken naar officiële API's of betrouwbare
scrapers te vervangen.

---

# Ontwikkelingsbronnen

Potential or future sources include:

- Gabriëls
- Q8
- Esso
- TotalEnergies
- Fuel Media Service
- Texaco
- Additional station networks

Een bron wordt pas als productieklaar beschouwd wanneer:

1. Data collection works reliably
2. Output passes validatie
3. Persistence works correctly
4. Duplicate behaviour is geverifieerde
5. Scheduler uitvoering works
6. Monitoring works
7. Bron-specific failure behaviour is tested

---

# Datakwaliteitsstrategie

FuelAlert gaat er niet van uit dat alle externe brongegevens even
betrouwbaar zijn.

De architectuur therefore separates:

- Bron collection
- Validation
- Persistence
- Station linking
- Price resolution
- Dealer verification
- Dealer price validatie
- Presentation

Hierdoor kan het platform de meest geschikte beschikbare bron gebruiken
zonder de oorspronkelijke broninformatie te verliezen.

---

# Toekomstige Modules

Geplande toevoegingen:

- Verified Station Portal
- Dealer Portal
- Dealerprijsbeheer
- Dealer Verification
- Fleet Platform
- Analytics Engine
- Prediction Engine
- AI-assisted Validation
- Developer API
- Premium Diensten
- Notification Engine
- Price History
- Additional source linking
- Advanced source prioritisation
- Dealer audit system

---

# Migratiestrategie

FuelAlert wordt gemigreerd naar de V2-architectuur.

The V2 architecture uses:

- `stations_v2`
- ScraperManager
- Validatiekader
- PersistenceEngine
- Repository Pattern
- Scheduler
- SchedulerRunRepository
- Scheduler-monitor
- Stationbronlinks
- Station Price Resolver

De dealerarchitectuur wordt als extra laag toegevoegd en zal
niet vereisen dat de bronscrapers opnieuw worden geschreven.

De oude station-/databasearchitectuur blijft geïsoleerd totdat alle
vereiste functionaliteit is gemigreerd en gevalideerd.

De oude architectuur mag niet worden verwijderd totdat:

1. All required production scrapers operate on V2
2. Station coverage has been validated
3. Price accuracy has been validated
4. REST endpoints use the new data model
5. Frontend migration is complete
6. Scheduler V2 is fully operational
7. Historical data requirements have been addressed

---

# Implementatievolgorde voor Dealerfunctionaliteit

Dealer functionality should be implemented only after the station
foundation is stable.

Aanbevolen volgorde:

1. Complete and validate station coverage
2. Complete and validate all required scrapers
3. Complete stationidentiteit and source linking
4. Complete source-based prijsresolutie
5. Implement dealer authentication/authorization
6. Implement dealer-station verification
7. Implement dealerprijs storage
8. Implement dealerprijs validatie
9. Implement dealerprijs override resolution
10. Implement dealerprijs management frontend
11. Implement dealer audit/historiek
12. Add dealer monitoring and abuse controls
13. Expose dealer provenance in the public API
14. Test scraper/dealer interaction extensively

This preserves the project priority that stationgegevens and station
identity must first be reliable before higher-level functionality is
introduced.

---

# Fundamentele Prijsregel

The following rule is fundamental to FuelAlert:

> **Scrapers provide the automatic bronprijs. A geverifieerde dealer can
> provide a station-specific price or discount. When an actieve geverifieerde
> dealer override exists, the dealer value takes precedence over the
> scraper/source value for that station and fuel type.**

De scraper continues running and its data remains opgeslagen.

A scraper update must never silently overwrite an actieve dealer
override.

When the dealer override becomes inactieve, uitgeschakeld or vervallen, the
system automatically returns to the normal source-based price
resolution strategy.

Deze regel geldt afzonderlijk voor elk brandstoftype.

---

# Leidende Principes

FuelAlert is no longer developed as a collection of independent
scrapers te vervangen.

FuelAlert is a modular DataBron Platform where every data source
integrates with the same architecture.

Het platform combines:

- Automated source collection
- Verified stationidentiteit
- Cross-source station linking
- Bron-based prijsresolutie
- Verified dealerprijs management
- Dealer-specific price overrides
- Transparante prijsoorsprong
- Continue monitoring

Elke architectuurbeslissing moet bijdragen aan:

- Betrouwbaarheid
- Onderhoudbaarheid
- Schaalbaarheid
- Uitbreidbaarheid
- Reusability
- Traceability
- Datakwaliteit
- Operational visibility
