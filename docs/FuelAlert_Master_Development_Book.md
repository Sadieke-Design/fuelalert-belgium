# FuelAlert Belgium

# Master Development Book

**Versie:** 8.6.0  
**Laatste update:** 22 augustus 2026  
**Status:** Active Development – Single Source of Truth  
**Project gestart:** 21 juli 2026

======================================================================

1. # DOEL

Dit document is de officiële technische documentatie van FuelAlert Belgium.

Het vormt de centrale kennisbank van het volledige project en is de
Single Source of Truth.

Alle architectuur, beslissingen, ontwikkelstatus, roadmap, databronnen,
API's, scrapers, deploymentprocedures en toekomstige uitbreidingen
worden hier bijgehouden.

Iedere ontwikkelsessie eindigt met een update van dit document.

====================================================================== 2. PROJECTVISIE
======================================================================

FuelAlert Belgium ontwikkelt een compleet platform voor brandstofprijzen
en tankstationinformatie in België.

Het systeem verzamelt gegevens uit meerdere databronnen en combineert
deze automatisch tot één betrouwbare dataset.

Databronnen:

• Officiële API's
• Commerciële databronnen
• Eigen scrapers
• Geverifieerde tankstationhouders (toekomst)
• Communitymeldingen (toekomst)

Het platform bestaat uit:

• Backend API
• Webapp
• Progressive Web App (PWA)
• Adminportaal
• Premiumfunctionaliteiten
• Historische prijsanalyse
• Pushnotificaties
• Publieke API (toekomst)

====================================================================== 3. PROJECTREGELS
======================================================================

DOCUMENTATIE

1. Code en documentatie blijven altijd synchroon.
2. Elke release krijgt een nieuw versienummer.
3. Elke architectuurbeslissing komt in het Decision Log.
4. Iedere module krijgt documentatie.
5. Iedere release krijgt een ZIP-back-up.

ONTWIKKELING

1. Architectuur boven snelheid.
2. Modulaire opbouw.
3. Geen duplicate code.
4. Plug-and-play scrapers.
5. Officiële bronnen hebben voorrang.
6. Elke scraper gebruikt dezelfde infrastructuur.
7. Eerst platform, daarna nieuwe databronnen.

====================================================================== 4. PROJECTSTATUS
======================================================================

BACKEND

✅ Validation Engine
✅ Validator Engine
✅ Price Validator
✅ GPS Validator
✅ Address Validator
✅ Duplicate Validator
✅ Persistence Engine
✅ Station Repository
✅ StationSourceLinkRepository
✅ Station Source Matcher
✅ StationPriceResolver
✅ Report Engine
✅ Scheduler Engine
✅ Scheduler Monitor
✅ Station Bootstrap
✅ Capability Registry
✅ Health Registry
✅ Metrics Registry
✅ Rate Limiter
✅ ScraperManager
✅ BaseScraper
✅ BrowserScraper
✅ MAES Network scraper
✅ DATS24 scraper
✅ SHELL scraper
✅ stations_v2 pipeline
✅ station_source_links pipeline
✅ scheduler_runs historiek

IN ONTWIKKELING

⏳ Cache optimalisatie
⏳ DataSource Manager
⏳ Gabriëls scraper
⏳ Fuel Media Service API
⏳ Price History
⏳ Frontend migratie naar stations_v2

ON HOLD

⏸ Q8
⏸ Esso

FRONTEND

✅ Dashboard
✅ Stations
✅ Kaart
✅ Login
✅ Registratie
✅ Wachtwoord vergeten
✅ Reset wachtwoord
✅ Scheduler Monitor

⏳ Favorieten
⏳ Historiek
⏳ Premium
⏳ Filters
⏳ Station Detail
⏳ Kaart optimalisatie

ADMIN

❌ Dashboard
❌ Scheduler beheer
❌ Users
❌ Analytics
❌ Logs

====================================================================== 5. DATA BRONNEN
======================================================================

MAES Network ................. ✅ Productie
275 stations
Sitemap + HTML + JSON-LD

DATS24 ....................... ✅ Productie
147 stations
HTML + embedded station JSON
Live prijzen, GPS en adresgegevens

SHELL ......................... ✅ Productie
200 stations
Officiële Shell stationdata + officieel Shell XLSX-prijsbestand

Fuel Media Service ........... ⏳ Contact opgenomen

Gabriëls ..................... ⏳ Gepland

TotalEnergies ................ ⏳ Gepland

Texaco ....................... ⏳ Gepland

Lukoil ....................... ⏳ Gepland

Gulf ......................... ⏳ Gepland

Avia ......................... ⏳ Gepland

Q8 ........................... ⏸ On Hold

Esso ......................... ⏸ On Hold

DATS24 VALIDATIE

147 stations gevonden
147 unieke station IDs
147 stations met GPS
147 stations met volledig adres
146 stations met E95
146 stations met E98
146 stations met diesel
92 stations met CNG
87 stations met AdBlue
0 stations met LPG aangetroffen tijdens de validatierun
0 scraper-errors

Alle 147 DATS24 records zijn succesvol via de
PersistenceEngine in stations_v2 verwerkt.

SHELL VALIDATIE

200 officiële Shell-stations gevonden.

De Shell scraper:

• verzamelt officiële Shell-stationgegevens
• haalt het officiële Shell-prijsbestand op
• normaliseert de gegevens naar het uniforme stationformaat
• verwerkt de records via PersistenceEngine
• slaat de records op in stations_v2

De gecontroleerde productie-run leverde:

200 stations
200 updates
0 inserts
0 skipped
0 duplicates
0 errors

====================================================================== 6. DATA SOURCE ENGINE
======================================================================

De backend gebruikt één centrale DataSource Engine.

Architectuur:

DataSource Engine

├── Health Registry ✅
├── Metrics Registry ✅
├── Validator Engine ✅
├── Cache Engine ⏳
├── Rate Limiter ✅
├── Persistence Engine ✅
├── Repository Pattern ✅
├── DataSource Manager ⏳
├── ScraperManager ✅
├── BaseScraper ✅
├── BrowserScraper ✅
├── StationSourceLinkRepository ✅
├── Station Source Matcher ✅
├── StationPriceResolver ✅
└── Persistence Layer ✅

Nieuwe databronnen gebruiken automatisch deze infrastructuur.

---

## SCRAPER EXECUTION ARCHITECTURE

Actieve scrapers worden geregistreerd in:

backend/scrapers/registry.js

Momenteel actief:

• MAES_NETWORK
• DATS24
• SHELL

De ScraperManager voert alle geregistreerde scrapers uit.

Flow:

Scheduler
↓
ScraperManager
↓
MAES_NETWORK / DATS24 / SHELL
↓
Uniforme station records
↓
PersistenceEngine
↓
StationRepository
↓
stations_v2

Iedere scraper levert dezelfde uniforme recordstructuur.

De PersistenceEngine ondersteunt verschillende bronbenamingen,
waaronder:

• benzine95 / e95
• benzine98 / e98
• diesel
• lpg
• cng
• adblue

Iedere normale scraper-run wordt geregistreerd in:

scheduler_runs

Smoke tests worden bewust niet geregistreerd in scheduler_runs.

Deze gegevens worden gebruikt voor monitoring, historiek,
statistieken en debugging.

---

## CROSS-SOURCE STATION MATCHING

FuelAlert kan stations uit verschillende databronnen aan elkaar
koppelen wanneer ze naar dezelfde fysieke locatie verwijzen.

De relaties worden opgeslagen in:

station_source_links

Belangrijke velden:

• source_a
• station_id_a
• source_b
• station_id_b
• distance_m
• match_type
• confidence
• active

De huidige Shell/MAES matching leverde:

• 200 officiële Shell-stations
• 78 MAES Shell-stations
• 35 matches
• 43 MAES Shell-stations zonder match

Er zijn momenteel 35 actieve Shell/MAES-links opgeslagen.

Een uniciteitscontrole heeft bevestigd:

• geen officiële Shell-stations met meerdere actieve MAES-koppelingen.

---

## PRICE RESOLUTION

StationPriceResolver bepaalt welke prijsbron voor een station en
brandstofveld gebruikt wordt.

Voor een Shell-station met een geldige MAES-link kan een live MAES-prijs
worden gebruikt.

Bijvoorbeeld:

price_source:
maes_network_live_scraper

price_priority:
linked_live

Een Shell-station zonder geldige MAES-link gebruikt zijn officiële
Shell-prijs:

price_source:
shell_official_scraper

price_priority:
official

Een MAES-station zonder externe koppeling gebruikt zijn oorspronkelijke
MAES-prijsbron.

De resolver ondersteunt fallback per brandstofveld. Wanneer een live
bron voor één brandstof geen waarde levert, kan een beschikbare waarde
uit de oorspronkelijke bron worden gebruikt.

====================================================================== 7. REST API
======================================================================

Beschikbaar

✅ /api/prices/latest
✅ /api/brands
✅ /api/capabilities
✅ /api/health
✅ /api/scheduler
✅ /api/metrics
✅ /api/scheduler-monitor

De Scheduler Monitor ondersteunt onder andere:

• pagination
• filtering per scraper
• scheduler summary
• scraperhistoriek
• laatste runs

Gepland

⏳ /api/history
⏳ /api/statistics
⏳ Publieke API

====================================================================== 8. DECISION LOG
======================================================================

DEC-001
Genspark-architectuur blijft de basis.

DEC-002
FuelAlert evolueert naar een DataSource Engine.

DEC-003
Fuel Media Service wordt onderzocht als aanvullende databron.

DEC-004
Officiële websites hebben voorrang op aggregators.

DEC-005
FuelAlert wordt een multi-source platform.

DEC-006
Officiële API's krijgen altijd voorrang op scraping.

DEC-007
Reverse engineering van Esso wordt stopgezet.

DEC-008
Q8 wordt voorlopig on hold gezet.

DEC-009
Fuel Media Service werd gecontacteerd.

DEC-010
Het Master Development Book is de Single Source of Truth.

DEC-011
Alle scrapers leveren één uniform recordformaat.

DEC-012
Database-opslag verloopt uitsluitend via
PersistenceEngine en StationRepository.

DEC-013
Iedere validator implementeert dezelfde interface:

• total
• valid
• invalid
• success

DEC-014
stations_v2 wordt de centrale backenddatabase voor de nieuwe
scraperarchitectuur.

DEC-015
MAES Network is volledig geïntegreerd in de nieuwe
ScraperManager → PersistenceEngine → StationRepository pipeline.

DEC-016
DATS24 is toegevoegd als tweede productie-scraper.

DEC-017
DATS24 gebruikt dezelfde uniforme scraperarchitectuur als MAES.

DEC-018
De PersistenceEngine ondersteunt zowel benzine95/benzine98 als
e95/e98 zodat verschillende scrapers hun eigen bronbenamingen
kunnen behouden.

DEC-019
Alle actieve scrapers worden centraal geregistreerd in
backend/scrapers/registry.js.

DEC-020
De Scheduler voert de actieve scrapers automatisch uit en registreert
iedere normale uitvoering in scheduler_runs.

DEC-021
De Scheduler Monitor wordt gebruikt als centrale monitoringinterface
voor de scraper-runs.

DEC-022
De Scheduler Monitor ondersteunt afzonderlijke monitoring van
MAES_NETWORK, DATS24 en SHELL.

DEC-023
De Scheduler Monitor ververst automatisch iedere 30 seconden.

DEC-024
De eerste productievalidatie van DATS24 leverde 147 stations op,
waarvan 147 succesvol naar stations_v2 werden verwerkt.

DEC-025
SHELL is toegevoegd als derde actieve productie-scraper.

DEC-026
SHELL levert officiële stationdata en officiële Shell-prijzen via
het officiële Shell XLSX-prijsbestand.

DEC-027
Shell/MAES cross-source relaties worden opgeslagen in
station_source_links.

DEC-028
De StationSourceLinkRepository beheert het aanmaken, ophalen,
updaten en deactiveren van cross-source stationlinks.

DEC-029
De StationPriceResolver bepaalt de beste beschikbare prijsbron voor
een station en ondersteunt linked-live prijzen en fallback.

DEC-030
Een Shell-station met een betrouwbare MAES-link kan live MAES-prijzen
gebruiken.

DEC-031
Een Shell-station zonder MAES-link blijft zijn officiële Shell-prijzen
gebruiken.

DEC-032
Smoke tests mogen geen records aanmaken in scheduler_runs.

DEC-033
Scheduler Monitor ondersteunt filtering per scraper en pagination.

====================================================================== 9. MASTER CHECKLIST
======================================================================

SCRAPERS

✅ MAES Network
275 stations
Productie
Sitemap + HTML + JSON-LD

✅ DATS24
147 stations
Productie
HTML + embedded station JSON

✅ Shell
200 stations
Productie
Officiële Shell stationdata + officieel Shell XLSX-prijsbestand

⏳ Gabriëls

⏳ TotalEnergies

⏳ Texaco

⏳ Lukoil

⏳ Gulf

⏳ Avia

⏸ Esso

⏸ Q8

DATA SOURCE ENGINE

✅ ScraperManager
✅ BaseScraper
✅ BrowserScraper
✅ Validation Engine
✅ Report Engine
✅ Scheduler Engine
✅ Capability Registry
✅ Health Registry
✅ Metrics Registry
✅ Validator Engine
✅ Rate Limiter
✅ Persistence Engine
✅ Station Repository
✅ StationSourceLinkRepository
✅ Station Source Matcher
✅ StationPriceResolver
⏳ Cache Engine
⏳ DataSource Manager

DATABASE

✅ stations_v2
✅ PersistenceEngine
✅ StationRepository
✅ station_source_links
✅ StationSourceLinkRepository
✅ scheduler_runs
✅ MAES import/update pipeline
✅ DATS24 import/update pipeline
✅ SHELL import/update pipeline
⏳ Price History

MONITORING

✅ Health Monitoring
✅ Scheduler Monitor
✅ Scheduler Run History
✅ Per-scraper run registratie
✅ MAES_NETWORK monitoring
✅ DATS24 monitoring
✅ SHELL monitoring
✅ Scraper filtering
✅ Pagination
✅ Automatische refresh iedere 30 seconden

API

✅ /api/prices/latest
✅ /api/brands
✅ /api/capabilities
✅ /api/health
✅ /api/scheduler
✅ /api/metrics
✅ /api/scheduler-monitor
⏳ /api/history
⏳ /api/statistics
⏳ Publieke API

FRONTEND

✅ Dashboard
✅ Stations
✅ Kaart
✅ Login
✅ Registratie
✅ Wachtwoord vergeten
✅ Reset wachtwoord
✅ Scheduler Monitor

⏳ Station Detail
⏳ Favorieten
⏳ Historiek
⏳ Premium
⏳ Filters
⏳ Kaart optimalisatie

ADMIN

❌ Dashboard
❌ Scheduler beheer
❌ Users
❌ Analytics
❌ Logs

======================================================================
9A. SCHEDULER MONITOR
======================================================================

De Scheduler Monitor registreert en toont de resultaten van alle
automatische normale scraper-runs.

Endpoint:

/api/scheduler-monitor

De monitor gebruikt de tabel:

scheduler_runs

Per run worden opgeslagen:

• scraper
• status
• stations
• inserted
• updated
• skipped
• duplicates
• errors
• duration_ms
• started_at
• finished_at

De Scheduler Monitor toont:

• Runs vandaag
• Success runs
• Failed runs
• Gemiddelde duur
• Laatste uitgevoerde run
• Historiek
• Resultaten per scraper
• Filtering per scraper
• Pagination

De frontend ververst automatisch iedere 30 seconden.

Frontend:

src/pages/SchedulerMonitor.jsx

Backend route:

backend/routes/schedulerMonitorRoutes.js

Repository:

backend/repositories/SchedulerRunRepository.js

Momenteel worden afzonderlijke resultaten geregistreerd voor:

• MAES_NETWORK
• DATS24
• SHELL

Smoke tests worden niet in deze historiek opgenomen.

======================================================================
9B. STATION SOURCE LINKS
======================================================================

De tabel:

station_source_links

wordt gebruikt om stations uit verschillende databronnen aan elkaar
te koppelen.

Repository:

backend/repositories/StationSourceLinkRepository.js

De repository ondersteunt:

• findLink()
• upsertLink()
• findByStation()
• findAllActive()
• deactivateLink()

De huidige Shell/MAES matching heeft 35 actieve koppelingen
opgeleverd.

Voorbeeld:

MAES:
gilly-shell

SHELL:
12683847

Afstand:

6.11 meter

Confidence:

98.78%

Deze koppeling wordt door StationPriceResolver gebruikt om de live
MAES-prijzen beschikbaar te maken voor het gekoppelde Shell-station.

======================================================================
9C. STATION PRICE RESOLVER
======================================================================

Bestand:

backend/services/StationPriceResolver.js

De resolver combineert:

• oorspronkelijke stationprijzen
• gekoppelde live prijzen
• bronprioriteit
• fallback

Mogelijke situaties:

1. Gekoppeld Shell-station

price_priority:
linked_live

2. Shell-station zonder koppeling

price_priority:
official

3. MAES-station zonder externe koppeling

price_priority:
original

De resolver bewaart de broninformatie zodat de uiteindelijke prijs
traceerbaar blijft.

====================================================================== 10. CHANGELOG
======================================================================

v8.6.0 — 22 augustus 2026

• SHELL scraper volledig toegevoegd aan de actieve scraper registry.
• 200 officiële Shell-stations succesvol verzameld.
• Officieel Shell XLSX-prijsbestand geïntegreerd.
• Shell volledig geïntegreerd met ScraperManager.
• Shell volledig geïntegreerd met PersistenceEngine.
• Shell volledig geïntegreerd met StationRepository.
• Shell records succesvol opgeslagen in stations_v2.
• Scheduler uitgebreid naar MAES_NETWORK, DATS24 en SHELL.
• Shell toegevoegd aan scheduler_runs.
• Scheduler Monitor uitgebreid met Shell-historiek.
• Scheduler Monitor ondersteunt filtering per scraper.
• Scheduler Monitor ondersteunt pagination.
• StationSourceLinkRepository toegevoegd.
• station_source_links toegevoegd als cross-source relationele laag.
• Shell/MAES matching geïmplementeerd.
• 35 Shell/MAES matches gevonden en opgeslagen.
• Uniciteitscontrole uitgevoerd: geen officiële Shell-stations met
meerdere actieve MAES-koppelingen.
• StationPriceResolver toegevoegd.
• Linked-live prijsresolutie voor gekoppelde Shell/MAES-stations
geïmplementeerd.
• Fallback per brandstofveld ondersteund.
• Shell-stations zonder MAES-link gebruiken officiële Shell-prijzen.
• Smoke tests aangepast zodat ze geen scheduler_runs creëren.
• Volledige productie-run succesvol gevalideerd:
275 MAES + 147 DATS24 + 200 SHELL.
• 0 scraper-errors tijdens de gecontroleerde volledige run.

v8.5.1

• DATS24 scraper volledig gevalideerd.
• DATS24 toegevoegd aan de actieve scraper registry.
• 147 DATS24 stations succesvol gevonden.
• 147 unieke DATS24 station IDs.
• 147 DATS24 stations met GPS.
• 147 DATS24 stations met volledig adres.
• 146 stations met E95.
• 146 stations met E98.
• 146 stations met diesel.
• 92 stations met CNG.
• 87 stations met AdBlue.
• Geen LPG-stations aangetroffen tijdens de validatierun.
• Geen scraper-errors tijdens de validatierun.
• DATS24 volledig geïntegreerd met ScraperManager.
• DATS24 volledig geïntegreerd met PersistenceEngine.
• DATS24 volledig geïntegreerd met StationRepository.
• DATS24 succesvol opgeslagen in stations_v2.
• Scheduler uitgebreid zodat MAES en DATS24 automatisch worden uitgevoerd.
• Scheduler Monitor uitgebreid voor meerdere scrapers.
• Scheduler Monitor toont resultaten per scraper.
• Scheduler Monitor ondersteunt automatische refresh.
• scheduler_runs wordt gebruikt voor volledige scraperhistoriek.

v8.5.0

• Validator Engine volledig afgerond.
• Uniform validator-framework toegevoegd.
• Price Validator toegevoegd.
• GPS Validator toegevoegd.
• Address Validator toegevoegd.
• Duplicate Validator toegevoegd.
• Metrics Registry geïmplementeerd.
• Health Registry uitgebreid.
• Rate Limiter geïntegreerd.
• Persistence Engine gebouwd.
• Station Repository toegevoegd.
• Nieuwe stations_v2 databasepipeline gebouwd.
• Eerste succesvolle end-to-end import.
• MAES Network volledig geïntegreerd.
• 275 stations succesvol opgeslagen.
• 0 fouten tijdens volledige import.

v8.4.1

• Capability Registry geïmplementeerd.
• Endpoint /api/capabilities toegevoegd.
• Health Engine gebouwd.
• Endpoint /api/health toegevoegd.
• Scheduler Engine gebouwd.
• Endpoint /api/scheduler toegevoegd.
• Scheduler voert scrapers automatisch uit.
• Eerste automatische scraper monitoring.
• Start van de DataSource Engine.
• Architectuur volledig herwerkt naar een modulair platform.

v8.4.0

• BrowserScraper toegevoegd.
• Validation Engine uitgebreid.
• CacheManager geïmplementeerd.
• Report Engine toegevoegd.
• Scheduler voorbereid.
• Retry Engine uitgebreid.
• Persistence Layer toegevoegd.
• MAES scraper volledig operationeel.
• PROJECT_VISION.md toegevoegd.
• ARCHITECTURE.md toegevoegd.
• Fuel Media Service documentatie toegevoegd.

====================================================================== 11. VOLGENDE PRIORITEITEN
======================================================================

HUIDIGE PRIORITEIT

1. Stationsmodule volledig afronden
2. Frontend migreren naar stations_v2
3. Station Detail
4. Historiek / Price History
5. Kaart optimalisatie

VOLGENDE DATABRONNEN

6. Gabriëls scraper
7. Fuel Media Service API
8. TotalEnergies
9. Texaco
10. Lukoil
11. Gulf
12. Avia

PLATFORM

13. Scheduler V2 verder uitbreiden
14. Oude cronjobs vervangen
15. Cache optimalisatie
16. DataSource Manager
17. Premium
18. Pushnotificaties
19. Publieke API

====================================================================== 12. LANGE TERMIJNVISIE
======================================================================

FuelAlert Belgium groeit uit tot een volledig platform voor
Belgische tankstationinformatie.

Toekomstige uitbreidingen:

• Verified Station Portal
• Bedrijfsaccounts
• Zelf prijzen beheren
• EV-laadprijzen
• HVO100
• AdBlue
• Carwash
• Shop
• Restaurant
• Openingsuren
• Promoties
• Foto's
• Tijdelijke meldingen
• Publieke Developer API

====================================================================== 13. DATABASE REFERENTIE
======================================================================

De volledige databasearchitectuur wordt gedocumenteerd in:

database.md

Belangrijkste V2-tabellen:

• stations_v2
• station_source_links
• scheduler_runs

Belangrijke repositories:

• StationRepository
• StationSourceLinkRepository
• SchedulerRunRepository

Belangrijke services:

• PersistenceEngine
• StationPriceResolver

====================================================================== 14. CURRENT PRODUCTION VALIDATION
======================================================================

Laatste gecontroleerde volledige scraper-run:

MAES_NETWORK

Stations: 275
Updated: 275
Errors: 0

DATS24

Stations: 147
Updated: 147
Errors: 0

SHELL

Stations: 200
Updated: 200
Errors: 0

Totale actieve stationrecords verwerkt tijdens deze run:

622

Alle drie actieve scrapers:

• succesvol uitgevoerd
• succesvol door PersistenceEngine verwerkt
• succesvol door StationRepository opgeslagen/bijgewerkt
• geregistreerd in scheduler_runs

Schedulerhistoriek:

• MAES_NETWORK: actief
• DATS24: actief
• SHELL: actief

Smoke tests worden afzonderlijk behandeld en worden niet opgenomen
in de normale schedulerhistoriek.

======================================================================
EINDE MASTER DEVELOPMENT BOOK
======================================================================
