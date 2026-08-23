# FuelAlert Belgium — Decision Log

**Versie:** 8.8.0  
**Status:** Living Document  
**Laatste update:** 23 augustus 2026

---

## Doel van dit document

Dit document bevat de belangrijke architectuur- en ontwikkelbeslissingen van FuelAlert Belgium.

Beslissingen worden hier vastgelegd zodat latere wijzigingen niet leiden tot tegenstrijdige implementaties of het opnieuw bespreken van reeds genomen keuzes.

---

# DEC-001 — MAES Batch Processing

**Beslissing**

De MAES scraper verwerkt niet langer alle URLs gelijktijdig.

**Reden**

- Minder geheugenverbruik.
- Minder kans op rate limiting.
- Betere stabiliteit.
- Schaalbaar voor grotere netwerken.

**Implementatie**

- Batch processing.
- De batchgrootte wordt bepaald door de scraperconfiguratie.

**Status**

Geïmplementeerd en actief.

---

# DEC-002 — Official Fuel Data Sources

FuelAlert vereist betrouwbare Belgische brandstofprijzen.

Onderzochte en/of onderzochte bronnen omvatten:

- Eigen scrapers
- Officiële API's
- Commerciële databronnen
- Esso Belgium
- ExxonMobil
- CARBU
- Fuel Media Service

**Beslissing**

FuelAlert blijft een multi-source platform.

Prioriteit:

1. Officiële API's
2. Officiële brondata via betrouwbare scraping
3. Eigen scrapers
4. Commerciële databronnen wanneer technisch, commercieel en juridisch geschikt

Reverse engineering wordt niet als standaardstrategie gebruikt wanneer een officiële bron of API beschikbaar is.

**Fuel Media Service**

Fuel Media Service blijft een mogelijke toekomstige commerciële databron zolang technische, commerciële en licentievoorwaarden niet definitief zijn.

**Status**

Architectuurkeuze actief.

---

# DEC-003 — Modulaire DataSource / Scraper Architecture

FuelAlert wordt modulair opgebouwd.

Nieuwe databronnen moeten kunnen worden toegevoegd zonder de centrale persistence-, validatie-, monitoring- en schedulerarchitectuur opnieuw te bouwen.

De centrale architectuur bevat onder andere:

- Capability Registry
- Scheduler
- Health Registry
- Metrics Registry
- Validator Engine
- Persistence Engine
- Repository Pattern
- Rate Limiter
- ScraperManager
- Report Engine
- SchedulerRunRepository
- StationSourceLinkRepository
- StationPriceResolver
- Scheduler Monitor

De actieve scrapers worden centraal geregistreerd via:

`backend/scrapers/registry.js`

**Huidige registry**

- MAES Network
- DATS24
- Shell
- Texaco
- Q8

Een afzonderlijke DataSource Manager blijft een mogelijke toekomstige uitbreiding en is geen voorwaarde voor de huidige scraperarchitectuur.

---

# DEC-004 — Uniform Scraper Output

Alle actieve scrapers leveren een uniforme stationrecordstructuur.

De uniforme record bevat onder andere:

- station_id
- brand
- name
- address
- city
- postal_code
- latitude
- longitude
- prices
- currency
- updated_at
- source

Hierdoor blijven:

- validators
- persistence
- monitoring
- rapportage
- prijsresolutie

generiek.

Scrapers bevatten geen rechtstreekse database-persistence-logica.

---

# DEC-005 — Validator Framework

Iedere scraper wordt via de centrale validatielaag gecontroleerd.

De BaseScraper voert onder andere recordvalidatie uit en gebruikt daarnaast:

`ValidatorEngine`

De validatielaag blijft onafhankelijk van individuele scrapers.

Voorbeelden van validatiegebieden:

- prijsdata
- GPS
- adresgegevens
- verplichte velden
- duplicaten

Een scraper moet valideerbare uniforme records produceren voordat deze in de persistencepipeline terechtkomen.

---

# DEC-006 — Repository Pattern

Databasebewerkingen verlopen via repositories.

Voor stations:

`StationRepository`

Voor schedulerhistoriek:

`SchedulerRunRepository`

Voor cross-source stationlinks:

`StationSourceLinkRepository`

Scrapers communiceren niet rechtstreeks met MySQL voor station persistence.

De centrale architectuur blijft:

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

---

# DEC-007 — Persistence Layer

Alle normale stationopslag verloopt via:

`PersistenceEngine`

De PersistenceEngine verwerkt uniforme scraperrecords en houdt onder andere bij:

- inserted
- updated
- skipped
- duplicates
- errors
- duration

De persistence-laag voorkomt dat iedere scraper zijn eigen database-implementatie nodig heeft.

---

# DEC-008 — stations_v2

De V2-backend gebruikt:

`stations_v2`

als centrale stationstabel voor de nieuwe architectuur.

De oude productiearchitectuur blijft voorlopig bestaan zolang de volledige frontend- en productiemigratie niet is afgerond.

Migratie gebeurt gefaseerd.

---

# DEC-009 — V2 Migratiestrategie

De migratie gebeurt gefaseerd.

## Fase 1

- Nieuwe scraperarchitectuur
- Validators
- Persistence
- Monitoring

**Status: voltooid**

## Fase 2

- MAES Network
- DATS24
- Shell
- Texaco
- Q8 integreren in de nieuwe scraperarchitectuur

**Status: voltooid voor de huidige actieve scrapers**

## Fase 3

- Frontend volledig laten werken op `stations_v2`

**Status: gepland**

## Fase 4

- Oude cronjobs en oude uitvoeringsmechanismen vervangen waar nog aanwezig

**Status: verder te controleren / migreren**

## Fase 5

- Oude stationdata en oude productiearchitectuur uitfaseren

**Status: gepland**

---

# DEC-010 — Scheduler als centrale execution layer

Alle actieve productie-scrapers worden uitgevoerd via één centrale Scheduler.

De Scheduler start één `ScraperManager`.

De `ScraperManager` voert vervolgens alle scrapers uit die in de actieve registry staan.

De huidige registry bevat:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

**Interval**

15 minuten.

**Startup**

De eerste uitvoering wordt onmiddellijk bij backend-start uitgevoerd.

Daarna volgt uitvoering volgens het ingestelde interval.

**Belangrijke architectuurregel**

De Scheduler hoeft niet voor iedere scraper afzonderlijk te worden aangemaakt.

De centrale Scheduler start de ScraperManager.

---

# DEC-011 — Scheduler Run History

Elke normale scraper-run wordt geregistreerd in:

`scheduler_runs`

via:

`SchedulerRunRepository`

Een scheduler-run bevat:

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

Bij succes:

`status = SUCCESS`

Bij een fout:

`status = FAILED`

**Belangrijke regel**

Smoke tests mogen de normale schedulerhistoriek niet vervuilen.

Wanneer:

`smokeTest = true`

wordt geen record aangemaakt in `scheduler_runs`.

---

# DEC-012 — Scheduler Monitor

FuelAlert beschikt over een Scheduler Monitor voor historische monitoring van scraper-runs.

Backend route:

`backend/routes/schedulerMonitorRoutes.js`

Repository:

`backend/repositories/SchedulerRunRepository.js`

Frontendcomponent:

`SchedulerMonitor.jsx`

Endpoint:

`/api/scheduler-monitor`

De monitor ondersteunt:

- summary
- success-runs
- failed-runs
- gemiddelde duur
- laatste runs
- stations
- updates
- fouten
- historiek
- pagination
- scraperfilter

De frontend ververst automatisch.

**Belangrijk**

De monitor gebruikt `scheduler_runs` als historische bron.

De monitor mag niet worden verward met de interne Scheduler-statusendpoint:

`/api/scheduler`

Die endpoint geeft de geregistreerde schedulerjobs en hun runtime-status weer.

---

# DEC-013 — Shell Production Scraper

Shell is geïntegreerd als productie-databron.

De Shell scraper gebruikt officiële Shell stationinformatie en officiële prijsdata waar beschikbaar.

De Shell scraper volgt dezelfde centrale architectuur:

- BaseScraper
- ValidatorEngine
- PersistenceEngine
- Scheduler
- HealthRegistry
- MetricsRegistry
- ReportEngine
- SchedulerRunRepository
- Scheduler Monitor

**Gecontroleerde actuele omvang**

- ongeveer 200 stations
- succesvolle persistence
- geen fouten in de gecontroleerde volledige run

De exacte stationdekking kan wijzigen wanneer de bron wijzigt.

---

# DEC-014 — DATS24 Production Scraper

DATS24 is geïntegreerd als actieve productie-databron.

De scraper gebruikt de centrale scraperarchitectuur en levert uniforme records.

Een recente volledige run leverde:

- 147 stations
- 147 updates
- 0 persistence-errors

De exacte stationdekking kan wijzigen wanneer de bron wijzigt.

---

# DEC-015 — MAES Network Production Scraper

MAES Network is geïntegreerd als actieve productie-databron.

Een recente volledige run leverde:

- 275 stations
- 275 updates
- 0 persistence-errors

MAES gebruikt batch processing en rate limiting om externe requests gecontroleerd uit te voeren.

De exacte stationdekking kan wijzigen wanneer de bron wijzigt.

---

# DEC-016 — Texaco Production Scraper

Texaco is toegevoegd aan de actieve scraperregistry.

De scraper levert uniforme stationrecords en wordt via dezelfde centrale pipeline verwerkt.

Een recente volledige run leverde:

- 91 stations
- 91 updates
- 0 persistence-errors

De exacte stationdekking kan wijzigen wanneer de bron wijzigt.

---

# DEC-017 — Q8 Production Scraper

Q8 is toegevoegd aan de actieve scraperregistry.

De Q8 scraper gebruikt:

- Q8 officiële sitemap/stationpagina's voor station discovery
- Q8 officiële prijsendpoint voor prijsinformatie
- uniforme recordnormalisatie
- centrale BaseScraper
- ValidatorEngine
- MetricsRegistry
- PersistenceEngine
- SchedulerRunRepository

De Q8 prijsendpoint wordt gebruikt om per station actuele brandstofprijzen op te halen wanneer beschikbaar.

**Volledige gecontroleerde run**

Een recente volledige run leverde:

- 469 Q8 stations gevonden
- 213 Q8 stations met prijzen
- 256 Q8 stations zonder beschikbare prijzen
- 39 stations zonder gevonden Q8-code
- 0 scraperfouten
- 469 database-updates

De Q8 run duurde ongeveer 542 seconden.

**Belangrijke interpretatie**

Een station zonder beschikbare prijs wordt niet beschouwd als een scraperfout.

De scraper kan het station correct ontdekken terwijl de officiële prijsendpoint voor dat station geen bruikbare prijsdata teruggeeft.

Een station zonder prijs blijft daarom een geldig stationrecord zolang de stationgegevens correct zijn.

**Concurrency**

De Q8 scraper gebruikt parallelle verwerking.

De bedoelde configuratie is:

- smoke test: 5 workers
- volledige run: 8 workers

De effectieve externe requestfrequentie blijft daarnaast onderworpen aan rate limiting en bronbeperkingen.

---

# DEC-018 — Cross-Source Station Matching

FuelAlert moet hetzelfde fysieke station uit verschillende databronnen kunnen herkennen.

Daarom wordt een aparte relatiearchitectuur gebruikt:

`station_source_links`

Cross-source relaties worden niet permanent hardcoded in individuele scrapers.

De koppelingen worden centraal beheerd.

Matching kan gebruikmaken van:

- station-ID
- source
- geografische afstand
- stationgegevens
- confidence score
- match type

---

# DEC-019 — Shell ↔ MAES Matching

Voor Shell wordt cross-source matching met MAES gebruikt wanneer een betrouwbare overeenkomst kan worden vastgesteld.

De `StationPriceResolver` kan deze relaties gebruiken om een gekoppelde live prijsbron te vinden.

De relatie zelf blijft onafhankelijk van de scraperimplementatie.

---

# DEC-020 — StationPriceResolver

Omdat één fysiek station meerdere databronnen kan hebben, gebruikt FuelAlert een centrale prijsresolutielaag:

`StationPriceResolver`

De resolver bepaalt welke beschikbare prijsbron voor een station en brandstof wordt gebruikt.

Ondersteunde concepten zijn onder andere:

- linked live source
- official source
- original source
- fallback
- dealer override in de toekomstige dealerlaag

De resolver kan per brandstof fallback toepassen.

Een ontbrekende prijs in één bron hoeft daardoor niet automatisch een beschikbare prijs uit een andere bron te verwijderen.

---

# DEC-021 — Rate Limiting

Externe bronnen worden beschermd via:

`RateLimiter`

Per bron kunnen worden ingesteld:

- delay
- retries
- timeout
- concurrent

De configuratie wordt per databron bepaald.

De RateLimiter voorkomt dat alle scrapers zonder controle externe bronnen gelijktijdig belasten.

---

# DEC-022 — Production Ready Criteria

Een scraper wordt als Production Ready beschouwd wanneer:

- de bron betrouwbaar werkt
- stationdata correct wordt verzameld
- prijsdata correct wordt verzameld waar beschikbaar
- uniforme output correct is
- validatie werkt
- persistence werkt
- Scheduler-integratie werkt
- monitoring werkt
- meerdere runs succesvol zijn uitgevoerd
- resultaten gecontroleerd zijn
- documentatie is bijgewerkt

Een scraper die technisch uitvoert maar nog onvoldoende gevalideerd is, blijft Development.

---

# DEC-023 — Multi-Source Architecture

FuelAlert wordt niet gebouwd rond één brandstofdatabron.

Momenteel zijn actief:

- MAES Network
- DATS24
- Shell
- Texaco
- Q8

Nieuwe bronnen moeten kunnen worden toegevoegd zonder de centrale:

- scraperarchitectuur
- validatie
- persistence
- monitoring
- scheduler
- prijsresolutie

opnieuw te ontwerpen.

---

# DEC-024 — Fuel Media Service

Fuel Media Service wordt onderzocht als potentiële commerciële databron.

Openstaande punten:

- technische API-documentatie
- prijsinformatie
- licentievoorwaarden
- API-toegang
- commerciële voorwaarden

**Beslissing**

Geen implementatie voordat de technische, commerciële en licentievoorwaarden voldoende duidelijk zijn.

---

# DEC-025 — Dealer Price Authority

FuelAlert voorziet in de toekomst een afzonderlijke Dealer Price Authority-laag.

De dealerlaag vervangt de scraperlaag niet.

Architectuur:

```text
Scraper / officiële bron
        ↓
    Basisprijs
        ↓
Dealer Price Authority
        ↓
  Resolved / Final Price
```

Een actieve dealerinstelling kan voor het betreffende station en de betreffende brandstof voorrang krijgen op de automatische bronprijs.

**Belangrijke regel**

Een scraper-run mag een actieve dealerprijs nooit overschrijven.

De automatische bronprijs blijft als broninformatie behouden.

Dealerdata wordt afzonderlijk opgeslagen.

Dealer authority wordt per brandstof toegepast.

De toekomstige dealerfunctionaliteit moet onder andere ondersteunen:

- station claimen
- stationverificatie
- eigen prijzen
- kortingen
- overrides wijzigen
- overrides verwijderen
- audit/historiek

De exacte databasevelden en API-contracten worden pas definitief vastgelegd wanneer de dealerportal daadwerkelijk wordt gebouwd.

---

# DEC-026 — Documentation First

Architectuurwijzigingen en belangrijke technische beslissingen worden vastgelegd in de projectdocumentatie.

Belangrijke documenten zijn onder andere:

- `PROJECT_VISION.md`
- `System Architecture.md`
- `database.md`
- `scrapers.md`
- `roadmap.md`
- `changelog.md`
- `decision_log.md`
- `api.md`

Het FuelAlert Master Development Book blijft de officiële Single Source of Truth voor de projectontwikkeling.

Documentatie moet worden bijgewerkt wanneer een architectuurkeuze daadwerkelijk verandert.

---

# DEC-027 — Stations First

De stationsarchitectuur wordt eerst volledig gestabiliseerd voordat grotere gebruikersfunctionaliteiten worden uitgebreid.

**Prioriteit**

1. Stationsmodule volledig afronden
2. Frontend migreren naar `stations_v2`
3. Station Detail
4. Price History
5. Verdere databronnen
6. Geavanceerde frontendfunctionaliteit
7. Premium functies
8. Developer API

De stationslaag blijft het fundament van FuelAlert.

---

# DEC-028 — Smoke Tests versus Production Runs

Smoke tests en productie-runs worden strikt van elkaar onderscheiden.

Een smoke test is bedoeld om technisch te controleren of een scraper werkt.

Een productie-run:

- wordt door de Scheduler uitgevoerd
- verwerkt de actieve scraperregistry
- gebruikt normale persistence
- wordt geregistreerd in `scheduler_runs`

Een smoke test:

- kan een beperkt aantal stations gebruiken
- mag concurrency beperken
- mag geen productiehistoriek in `scheduler_runs` creëren

Dit onderscheid voorkomt dat ontwikkeltesten de operationele statistieken vervuilen.

---

# DEC-029 — Scheduler en ScraperManager

De Scheduler is verantwoordelijk voor **wanneer** een run start.

De ScraperManager is verantwoordelijk voor **welke scrapers** worden uitgevoerd en hoe de resultaten worden verwerkt.

Architectuur:

```text
Scheduler
    ↓
ScraperManager
    ↓
Active Scraper Registry
    ↓
BaseScraper
    ↓
Validator
    ↓
PersistenceEngine
    ↓
Repository
```

De Scheduler moet geen scraper-specifieke logica bevatten.

De ScraperManager moet geen schedulerinterval beheren.

Deze scheiding blijft een belangrijk architectuurprincipe.

---

# DEC-030 — Scheduler Run Timing

Een scheduler-run wordt als één operationele run beschouwd, maar iedere scraper wordt afzonderlijk geregistreerd in `scheduler_runs`.

Hierdoor kan de monitor bijvoorbeeld afzonderlijk tonen:

- MAES
- DATS24
- SHELL
- TEXACO
- Q8

met elk hun eigen:

- status
- stations
- updates
- fouten
- duur
- starttijd
- eindtijd

De totale duur van een ScraperManager-run mag niet worden verward met de individuele scraperduur.

---

# DEC-031 — Q8 Price Availability

Q8 heeft een werkende officiële prijsendpoint, maar niet ieder station levert via die endpoint bruikbare prijsdata.

Daarom wordt:

```text
station gevonden
```

niet gelijkgesteld aan:

```text
prijs gevonden
```

De scraper rapporteert beide aantallen afzonderlijk.

Dit voorkomt dat ontbrekende prijsdata ten onrechte als scraperfout wordt geregistreerd.

---

# DEC-032 — Source Registry als Single Activation Point

Nieuwe scrapers worden pas onderdeel van de productie-run wanneer ze in:

`backend/scrapers/registry.js`

zijn geregistreerd.

De actieve registry is daarmee het centrale activatiepunt voor scraperuitvoering.

Huidige actieve registry:

```text
MAES_NETWORK
DATS24
SHELL
TEXACO
Q8
```

Dit voorkomt dat scrapers per ongeluk via verschillende codepaden worden gestart.

---

# DEC-033 — Stationsmodule als Fundament

De stationsmodule blijft de eerste grote productiemijlpaal.

Voordat de volledige gebruikerslaag wordt uitgebreid, moeten onder andere de volgende onderdelen stabiel zijn:

- station discovery
- station persistence
- cross-source identity
- prijsresolutie
- actuele prijsdata
- station API
- frontend stationweergave
- station detail
- betrouwbare bronherkomst

Pas daarna worden grotere gebruikersfuncties verder uitgebreid.

---

# DEC-034 — Oude Architectuur niet voortijdig verwijderen

Oude tabellen, endpoints, cronjobs en productielogica worden niet verwijderd enkel omdat V2 technisch werkt.

Uitfasering gebeurt pas nadat:

1. stationdekking gecontroleerd is
2. prijsdata gecontroleerd is
3. frontendmigratie voltooid is
4. API-migratie voltooid is
5. Scheduler V2 stabiel draait
6. historische data correct is behandeld
7. rollback niet langer noodzakelijk is

---

# Huidige architectuurstatus

De belangrijkste huidige componenten zijn:

- `ScraperManager`
- `BaseScraper`
- `Scheduler`
- `ValidatorEngine`
- `PersistenceEngine`
- `StationRepository`
- `HealthRegistry`
- `MetricsRegistry`
- `ReportEngine`
- `RateLimiter`
- `SchedulerRunRepository`
- `StationSourceLinkRepository`
- `StationPriceResolver`
- Scheduler Monitor
- `stations_v2`
- `scheduler_runs`
- `station_source_links`

## Huidige actieve scrapers

| Bron | Scheduler ID | Recente volledige run | Status |
|---|---|---:|---|
| MAES Network | `MAES_NETWORK` | 275 | Production Ready |
| DATS24 | `DATS24` | 147 | Production Ready |
| Shell | `SHELL` | 200 | Production Ready |
| Texaco | `TEXACO` | 91 | Production Ready |
| Q8 | `Q8` | 469 | Production Ready |

**Opmerking**

Deze aantallen zijn momentopnames en mogen niet als permanente stationaantallen worden beschouwd.

---

# Openstaande architectuuronderwerpen

De volgende onderwerpen blijven gepland of in onderzoek:

- DataSource Manager
- Cache Engine
- verdere cross-source matching
- Gabriëls-integratie
- Fuel Media Service-integratie
- TotalEnergies-integratie
- verdere databronnen
- frontendmigratie naar `stations_v2`
- volledige stationsmodule
- station detail
- price history
- dealer portal
- dealer price authority
- verdere API-uitbreiding
- uitfasering oude productiearchitectuur

---

# Vastgelegde strategische principes

FuelAlert volgt momenteel deze kernprincipes:

1. **Modulair** — nieuwe bronnen moeten kunnen worden toegevoegd zonder de kernarchitectuur te herschrijven.
2. **Multi-source** — FuelAlert is niet afhankelijk van één leverancier.
3. **Official-first** — officiële API's en officiële brondata krijgen prioriteit.
4. **Fail-safe** — ontbrekende data uit één bron mag beschikbare data uit een andere bron niet onnodig vernietigen.
5. **Source preservation** — oorspronkelijke brondata blijft behouden.
6. **Central persistence** — scrapers schrijven niet rechtstreeks naar de database.
7. **Central scheduling** — de Scheduler bepaalt wanneer een scraper-run start.
8. **Central management** — de ScraperManager bepaalt welke actieve scrapers worden uitgevoerd.
9. **Traceability** — prijs- en stationherkomst moet controleerbaar blijven.
10. **Stations first** — de stationslaag wordt eerst betrouwbaar gemaakt voordat grote gebruikersfuncties worden uitgebreid.
11. **Documentation first** — belangrijke architectuurkeuzes worden vastgelegd.
12. **Dealer override is separate** — toekomstige dealerprijzen overschrijven nooit de oorspronkelijke brondata.

---

# Wijzigingshistoriek

## Versie 8.8.0 — 23 augustus 2026

Bijgewerkt naar de huidige architectuurstatus.

Belangrijkste wijzigingen:

- Q8 toegevoegd als actieve productie-scraper.
- Texaco toegevoegd als actieve productie-scraper.
- MAES, DATS24 en Shell actuele runstatus bijgewerkt.
- Q8 officiële prijsendpoint en prijsbeschikbaarheid gedocumenteerd.
- Scheduler Monitor als actuele component opgenomen.
- Scheduler en ScraperManager duidelijk van elkaar gescheiden.
- Source Registry vastgelegd als centraal activatiepunt.
- Smoke tests en productie-runs expliciet gescheiden.
- `scheduler_runs`-architectuur geactualiseerd.
- Stations First-principe behouden en aangescherpt.
- Oude architectuur mag niet voortijdig worden verwijderd.
- Dealer Price Authority behouden als toekomstige aparte override-laag.
- Documentatie afgestemd op de huidige multi-source architectuur.

---

# Guiding Principle

FuelAlert wordt gebouwd als een multi-source brandstofplatform, niet als een verzameling losse scrapers.

De kern blijft:

```text
External Sources
      ↓
   Scrapers
      ↓
ScraperManager
      ↓
  Validation
      ↓
 Persistence
      ↓
 stations_v2
      ↓
Cross-source links
      ↓
Price Resolution
      ↓
Future Dealer Override
      ↓
     API
      ↓
   Frontend
```

De automatische bronlaag blijft altijd bestaan als fundamentele databron.

Dealerfunctionaliteit, prijsresolutie en toekomstige gebruikersfuncties worden bovenop deze bronlaag gebouwd zonder de oorspronkelijke brondata te vernietigen.
