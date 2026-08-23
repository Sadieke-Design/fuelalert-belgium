# Decision Log

**Versie:** 8.7.0  
**Laatste update:** 23 augustus 2026

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

**Status**

- Wacht op antwoord Fuel Media Service.

---

## DEC-003 — Modulaire DataSource Engine

De DataSource Engine wordt volledig modulair opgebouwd.

Nieuwe componenten worden eerst generiek ontwikkeld voordat nieuwe scrapers
worden toegevoegd.

**Oorspronkelijke volgorde**

1. Capability Registry
2. Scheduler
3. Health Registry
4. Metrics Registry
5. Validator Engine
6. Persistence Engine
7. Repository Pattern
8. Rate Limiter
9. DataSource Manager

**Huidige status**

De belangrijkste generieke componenten zijn inmiddels geïmplementeerd.

Aanvullend zijn toegevoegd:

- ScraperManager
- Report Engine
- SchedulerRunRepository
- Scheduler Monitor
- station_source_links
- StationSourceLinkRepository
- StationPriceResolver

De DataSource Manager blijft gepland voor een latere fase.

---

## DEC-004 — Uniform Scraper Output

Alle scrapers leveren een uniforme stationrecordstructuur aan.

Hierdoor blijven validators, persistence, monitoring en rapportage generiek.

Scrapers bevatten geen databasespecifieke persistence-logica.

De uniforme output wordt door de centrale backendarchitectuur verwerkt.

---

## DEC-005 — Validator Framework

Iedere validator implementeert dezelfde generieke interface.

Voorbeelden van validators:

- Price Validator
- GPS Validator
- Address Validator
- Duplicate Validator

De Validator Engine kan hierdoor verschillende databronnen op dezelfde
manier verwerken.

De validatielaag blijft onafhankelijk van de individuele scraper.

---

## DEC-006 — Repository Pattern

Databasebewerkingen verlopen via repositories.

Voor stations wordt hiervoor `StationRepository` gebruikt.

Scrapers communiceren niet rechtstreeks met MySQL.

De persistencearchitectuur blijft:

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

Voor schedulerhistoriek wordt `SchedulerRunRepository` gebruikt.

Voor cross-source stationlinks wordt `StationSourceLinkRepository` gebruikt.

---

## DEC-007 — Persistence Layer

Alle stationopslag verloopt via `PersistenceEngine`.

PersistenceEngine bepaalt onder andere:

- insert
- update
- foutafhandeling
- statistieken
- rapportage

De Persistence Engine levert uniforme resultaten zoals:

- inserted
- updated
- skipped
- duplicates
- errors
- duration

Hierdoor kunnen alle scrapers dezelfde persistence-infrastructuur gebruiken.

---

## DEC-008 — stations_v2

De nieuwe backend gebruikt `stations_v2` als centrale stationstabel voor de
nieuwe architectuur.

De oorspronkelijke productiedatabase blijft voorlopig bestaan zolang de
volledige frontend- en productiemigratie nog niet is afgerond.

De migratie naar `stations_v2` gebeurt gefaseerd.

---

## DEC-009 — V2 Migratiestrategie

De migratie gebeurt gefaseerd.

### Fase 1

- Nieuwe scraperarchitectuur
- Validators
- Persistence
- Monitoring

**Status: voltooid**

### Fase 2

- Scrapers integreren in de nieuwe architectuur
- MAES Network
- DATS24
- SHELL

**Status: voltooid**

### Fase 3

- Frontend laten werken op `stations_v2`

**Status: gepland / volgende grote mijlpaal**

### Fase 4

- Oude cronjobs vervangen door de nieuwe Schedulerarchitectuur

**Status: nog te migreren waar nodig**

### Fase 5

- Oude stationdata en oude productiearchitectuur uitfaseren

**Status: gepland**

---

## DEC-010 — Scheduler als centrale execution layer

Alle actieve productie-scrapers worden uitgevoerd via één centrale Scheduler.

**Beslissing**

De Scheduler moet niet per scraper afzonderlijk worden geïmplementeerd.

De Scheduler start de `ScraperManager`, waarna de actieve scrapers via de
registry worden uitgevoerd.

**Huidige productie-scrapers**

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

**Interval**

15 minuten.

De eerste uitvoering gebeurt bij backend-startup.

Daarna worden de actieve scrapers iedere 15 minuten uitgevoerd.

---

## DEC-011 — Scheduler Run History

Elke normale scraper-run wordt geregistreerd in:

`scheduler_runs`

De registratie gebeurt via:

`SchedulerRunRepository`

Een scheduler-run bevat onder andere:

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

**Belangrijke beslissing**

Smoke tests mogen de schedulerhistoriek niet vervuilen.

Wanneer `smokeTest = true` wordt gebruikt, wordt geen record aangemaakt in
`scheduler_runs`.

---

## DEC-012 — Scheduler Monitor

Er wordt een centrale Scheduler Monitor gebruikt voor controle van de
scraperuitvoeringen.

De monitor toont onder andere:

- runs
- success
- failed
- gemiddelde duur
- laatste run
- stations
- updates
- fouten
- historiek
- pagination
- filter per scraper

De monitor gebruikt `scheduler_runs` als bron.

De frontend wordt automatisch ververst.

De monitor ondersteunt afzonderlijke historie voor:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

---

## DEC-013 — Shell als Production Scraper

De Shell-bron is toegevoegd aan de actieve scraperarchitectuur.

**Beslissing**

Shell wordt behandeld als een volwaardige productie-databron en volgt
dezelfde architectuur als MAES Network en DATS24.

**Shell-integratie**

- Officiële Shell stationdata
- Officiële Shell XLSX-prijsdata
- Uniforme scraper-output
- PersistenceEngine
- Scheduler
- Health Registry
- Metrics
- Scheduler Monitor
- Scheduler history

**Huidige gecontroleerde omvang**

- 200 stations
- 200 updates tijdens de laatste volledige run
- 0 errors

---

## DEC-014 — Cross-Source Station Matching

FuelAlert moet hetzelfde fysieke station uit verschillende databronnen
kunnen herkennen.

Daarom is gekozen voor een aparte relatiearchitectuur:

`station_source_links`

**Beslissing**

Cross-source relaties worden niet rechtstreeks in de individuele scraper
hardcoded.

De koppelingen worden centraal beheerd.

De matching kan gebruikmaken van:

- station-ID
- bron
- geografische afstand
- confidence score
- stationgegevens

---

## DEC-015 — Shell ↔ MAES Matching

Voor Shell wordt gebruikgemaakt van cross-source matching met MAES waar een
betrouwbare overeenkomst kan worden vastgesteld.

De koppeling bevat onder andere:

- source
- station_id
- name
- distance_m
- confidence
- last_update

De `StationPriceResolver` kan deze koppelingen gebruiken om actuele prijzen
uit de gekoppelde MAES-bron te verkrijgen.

---

## DEC-016 — StationPriceResolver

Omdat één station meerdere databronnen kan hebben, is een centrale
prijsresolutielaag ingevoerd.

Component:

`StationPriceResolver`

**Doel**

Bepalen welke prijsbron per station en brandstof moet worden gebruikt.

Ondersteunde bronprioriteiten omvatten:

- `linked_live`
- `official`
- `original`

De resolver ondersteunt ook fallback per brandstof.

Hierdoor kan bijvoorbeeld een gekoppeld Shell-station actuele MAES-prijzen
gebruiken terwijl ontbrekende brandstoffen terugvallen op de officiële
Shell-prijs.

---

## DEC-017 — Rate Limiting

Externe databronnen worden beschermd via de centrale `RateLimiter`.

Per databron kunnen onder andere worden ingesteld:

- delay
- retries
- timeout
- concurrent

De configuratie wordt per bron bepaald op basis van de eigenschappen en
beperkingen van de externe bron.

---

## DEC-018 — Productie Ready Criteria

Een scraper wordt pas als **Production Ready** beschouwd wanneer:

- de bron betrouwbaar werkt
- de data correct wordt verzameld
- de data gevalideerd is
- de uniforme output correct is
- persistence werkt
- Scheduler-integratie werkt
- monitoring werkt
- meerdere succesvolle runs zijn uitgevoerd
- resultaten gecontroleerd zijn
- documentatie is bijgewerkt

Een scraper die technisch werkt maar nog onvoldoende gevalideerd is, blijft
in Development.

---

## DEC-019 — Multi-Source Architectuur

FuelAlert wordt niet gebouwd rond één enkele brandstofdatabron.

**Beslissing**

Meerdere bronnen mogen gelijktijdig actief zijn.

Momenteel zijn actief:

- MAES Network
- DATS24
- SHELL

Toekomstige bronnen kunnen worden toegevoegd zonder de centrale
persistence-, monitoring- en schedulerarchitectuur opnieuw te bouwen.

---

## DEC-020 — Fuel Media Service

Fuel Media Service wordt onderzocht als potentiële commerciële databron.

**Huidige status**

- Informatieaanvraag verstuurd
- Wachten op API-documentatie
- Wachten op prijsinformatie
- Wachten op licentievoorwaarden
- Wachten op API-toegang

**Beslissing**

Er wordt geen implementatie gestart voordat de technische, commerciële en
licentievoorwaarden zijn geëvalueerd.

Fuel Media Service wordt pas Production Ready wanneer dezelfde
kwaliteitscriteria gelden als voor andere databronnen.

---

## DEC-021 — Dealer Price Authority

**Context**

FuelAlert verzamelt brandstofprijzen automatisch via meerdere databronnen
en scrapers. Daarnaast is het wenselijk om in de toekomst geverifieerde
dealers / stationhouders hun eigen prijzen en kortingen te laten beheren.

De dealerfunctionaliteit mag de bestaande multi-source scraperarchitectuur
niet vervangen en mag de oorspronkelijke brondata niet verloren laten gaan.

**Beslissing**

FuelAlert blijft scrapers en andere databronnen gebruiken als automatische
basis voor stationprijzen.

Daarboven wordt een afzonderlijke **Dealer Price Authority**-laag voorzien.

Wanneer een geverifieerde dealer geen eigen prijsinstelling heeft:

```text
Scraper / officiële bron
        ↓
    Getoonde prijs
```

Wanneer een geverifieerde dealer een prijs of korting instelt:

```text
Scraper / officiële bron
        ↓
    Basisprijs
        ↓
Dealer Price Authority
        ↓
    Getoonde prijs
```

Een actieve dealerinstelling heeft dus **voorrang op de scraperprijs** voor
het betreffende station en de betreffende brandstof.

**Belangrijke regel**

Een scraper-run mag een actieve dealerprijs of dealerinstelling nooit
overschrijven.

De scraper blijft de actuele bronprijs verzamelen en opslaan als
broninformatie.

De dealerinstelling blijft daar onafhankelijk van bestaan.

**Brondata blijft behouden**

FuelAlert bewaart conceptueel altijd het onderscheid tussen:

- automatische bronprijs
- actieve dealerprijs
- dealer korting
- uiteindelijke resolved price

Wanneer een dealer zijn override verwijdert, kan FuelAlert automatisch
terugvallen op de meest recente geldige bronprijs.

**Per brandstof**

Dealer authority wordt per brandstof toegepast.

Een dealer kan bijvoorbeeld alleen Diesel aanpassen terwijl Benzine 95 en
Benzine 98 volledig door de automatische bron worden bepaald.

Een dealerwijziging voor één brandstof mag geen andere brandstoffen
overschrijven.

**Dealerfunctionaliteit**

De toekomstige Verified Station / Dealer Portal moet onder andere kunnen:

- station claimen
- stationverificatie doorlopen
- prijzen per brandstof instellen
- kortingen per brandstof instellen
- een actieve prijsoverride wijzigen
- een override verwijderen
- de eigen actuele instellingen bekijken
- wijzigingen kunnen traceren

**Prijsresolutie**

De bestaande `StationPriceResolver` wordt hiervoor in een latere fase
uitgebreid.

De algemene logica wordt:

```text
Bronprijs beschikbaar
        ↓
Dealerinstelling actief?
   ↓              ↓
  Nee             Ja
   ↓              ↓
Bronprijs      Dealerinstelling
        \        /
         ↓      ↓
       Resolved Price
```

De exacte databasevelden, API-contracten en authenticatie/verificatie van
dealers worden pas vastgelegd wanneer deze functionaliteit daadwerkelijk
wordt geïmplementeerd.

**Ontwikkelstrategie**

De ontwikkeling gebeurt bewust in deze volgorde:

1. Scrapers bouwen voor zoveel mogelijk relevante stations
2. Stationdata en automatische prijzen betrouwbaar maken
3. Stationsmodule volledig afronden
4. Verified Station / Dealer Portal bouwen
5. Dealer price authority implementeren
6. `StationPriceResolver` uitbreiden
7. Frontend transparant laten zien of een prijs automatisch of door een
   geverifieerde dealer is aangeleverd

**Architectuurprincipe**

Dealer authority is geen vervanging van de scraperlaag.

Het is een gecontroleerde override-laag **bovenop** de automatische
brondata.

## DEC-022 — Documentation First

Architectuurwijzigingen en belangrijke technische beslissingen moeten worden
vastgelegd in de projectdocumentatie.

Belangrijke documenten:

- `PROJECT_VISION.md`
- `System Architecture.md`
- `database.md`
- `scrapers.md`
- `roadmap.md`
- `changelog.md`
- `decision_log.md`
- `api.md`

Het FuelAlert Master Development Book blijft de officiële Single Source of
Truth voor de projectontwikkeling.

---

## DEC-023 — Stations First

De stationsarchitectuur wordt eerst volledig gestabiliseerd voordat
grotere gebruikersfunctionaliteiten worden uitgebreid.

**Beslissing**

De huidige prioriteit is:

1. Stationsmodule volledig afronden
2. Frontend migreren naar `stations_v2`
3. Station Detail
4. Price History
5. Verdere databronnen
6. Geavanceerde frontendfunctionaliteit
7. Premium functies
8. Developer API

De stationslaag vormt het fundament voor de verdere ontwikkeling van
FuelAlert.

---

# Huidige architectuurstatus

De belangrijkste architectuurcomponenten zijn momenteel:

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
- `Scheduler Monitor`
- `stations_v2`
- `scheduler_runs`
- `station_source_links`

De huidige productiebronnen zijn:

| Bron         | Stations | Status              |
| ------------ | -------: | ------------------- |
| MAES Network |      275 | ✅ Production Ready |
| DATS24       |      147 | ✅ Production Ready |
| SHELL        |      200 | ✅ Production Ready |

---

## Vastgelegde strategische beslissing

De Dealer Price Authority is als architectuurkeuze vastgelegd in DEC-021.
De technische implementatie blijft gepland voor de Verified Station /
Dealer Portal-fase.

# Openstaande architectuurbeslissingen

De volgende onderwerpen blijven open voor toekomstige beslissingen:

- DataSource Manager
- Cache Engine
- Verdere cross-source matching
- Gabriëls-integratie
- Fuel Media Service-integratie
- TotalEnergies-integratie
- Verdere databronnen
- Frontendmigratie naar `stations_v2`
- Uitfasering van de oude productiearchitectuur
