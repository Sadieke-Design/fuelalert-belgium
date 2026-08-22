# FuelAlert Belgium - Project Vision

**Versie:** 8.6.0  
**Laatste update:** 22 augustus 2026  
**Status:** Living Document

---

# 1. Projectvisie

FuelAlert Belgium is een modulair platform voor het verzamelen, valideren,
verwerken, combineren en publiceren van actuele Belgische
brandstofinformatie.

Het doel is niet om een verzameling losse scrapers te bouwen, maar een
duurzaam DataSource Platform waarop meerdere databronnen gecontroleerd en
uniform kunnen worden geïntegreerd.

De architectuur moet ervoor zorgen dat nieuwe databronnen kunnen worden
toegevoegd zonder bestaande onderdelen van het platform opnieuw te moeten
bouwen.

---

# 2. Kernidee

FuelAlert moet uiteindelijk één betrouwbare centrale databron vormen voor
brandstofinformatie in België.

Daarvoor worden gegevens uit verschillende bronnen verzameld.

Iedere bron kan andere:

- datastructuren
- station-ID's
- brandstofnamen
- prijsformaten
- adressen
- GPS-gegevens
- updatefrequenties
- betrouwbaarheid

hebben.

FuelAlert normaliseert deze verschillen naar één uniforme interne
datastructuur.

---

# 3. DataSource Platform

De kern van FuelAlert is de DataSource Engine.

Iedere databron wordt als een zelfstandige module geïntegreerd binnen dezelfde
architectuur.

De algemene structuur is:

```text
External Data Source
        ↓
     Scraper
        ↓
 Uniform Station Output
        ↓
 Validator Engine
        ↓
 Persistence Engine
        ↓
 Station Repository
        ↓
    stations_v2
        ↓
     REST API
        ↓
     Frontend
```

Monitoring verloopt parallel:

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
Scheduler Monitor
```

---

# 4. Architectuurprincipes

FuelAlert volgt deze principes:

1. Modularity
2. Multi-source data collection
3. Official APIs preferred over scraping
4. Fail-safe processing
5. Documentation-first development
6. Plug-and-play data sources
7. Separation of responsibilities
8. Platform before features

Deze principes moeten ook bij toekomstige uitbreidingen behouden blijven.

---

# 5. Betrouwbaarheid

Betrouwbaarheid is belangrijker dan het aantal databronnen.

Een scraper wordt daarom niet automatisch als productiebron beschouwd omdat
hij technisch gegevens kan ophalen.

Een nieuwe scraper wordt pas als **Production Ready** beschouwd wanneer:

- de bron betrouwbaar werkt
- de data correct wordt verzameld
- de data gevalideerd is
- de uniforme output correct is
- de persistence werkt
- de Scheduler correct werkt
- monitoring correct werkt
- de resultaten gecontroleerd zijn
- de scraper meerdere succesvolle runs heeft doorlopen
- de documentatie is bijgewerkt

---

# 6. Fail-safe principe

Een probleem bij één databron mag het volledige platform niet stoppen.

Daarom worden scrapers onafhankelijk uitgevoerd en afzonderlijk gemonitord.

Wanneer een scraper faalt:

- blijven andere scrapers actief
- wordt de fout geregistreerd
- wordt de Health Registry bijgewerkt
- wordt de scheduler-run als `FAILED` geregistreerd
- blijft bestaande correcte data beschikbaar

De architectuur moet voorkomen dat één externe bron een single point of
failure vormt.

---

# 7. Uniforme data

Iedere databron kan zijn eigen structuur gebruiken.

FuelAlert converteert deze gegevens naar één uniforme stationstructuur.

Belangrijke velden zijn onder andere:

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
- updated_at

Hierdoor kunnen verschillende databronnen via dezelfde:

- Validator Engine
- PersistenceEngine
- StationRepository
- Scheduler
- Monitoring
- REST API

worden verwerkt.

---

# 8. Eén station, meerdere bronnen

Een belangrijk onderdeel van de visie is dat één fysiek tankstation door
meerdere databronnen kan worden beschreven.

Daarom worden cross-source relaties bijgehouden.

Hiervoor gebruikt FuelAlert:

`station_source_links`

Deze structuur maakt het mogelijk om bijvoorbeeld een officiële Shell
stationrecord te koppelen aan een overeenkomstig MAES-station.

De koppeling kan gebruikmaken van:

- stationidentiteit
- geografische afstand
- bron
- station-ID
- confidence score

---

# 9. Price Resolution

Wanneer meerdere databronnen beschikbaar zijn voor hetzelfde station, moet
FuelAlert kunnen bepalen welke prijs gebruikt moet worden.

Hiervoor is de:

`StationPriceResolver`

ontwikkeld.

De resolver ondersteunt onder andere:

- `linked_live`
- `official`
- `original`
- fallback per brandstof

Hierdoor kan FuelAlert bijvoorbeeld een actuele prijs uit een gekoppelde
MAES-bron gebruiken terwijl voor een ontbrekende brandstofwaarde wordt
teruggevallen op de oorspronkelijke officiële Shell-prijs.

---

# 10. Stations als fundament

De stationsdatabase vormt het fundament van FuelAlert.

Daarom is gekozen voor:

`stations_v2`

De database moet uiteindelijk de centrale en uniforme stationlaag vormen
voor alle databronnen.

De ontwikkeling van verdere functies gebeurt bovenop deze stationlaag.

De prioriteit blijft daarom:

```text
Correcte stations
      ↓
Correcte prijzen
      ↓
Betrouwbare updates
      ↓
Historiek
      ↓
Frontend functionaliteit
      ↓
Premium functies
```

---

# 11. Monitoring

Een betrouwbare databron moet niet alleen gegevens leveren, maar ook
controleerbaar zijn.

Daarom registreert FuelAlert scraper-runs in:

`scheduler_runs`

De Scheduler Monitor maakt deze informatie zichtbaar.

De monitor ondersteunt onder andere:

- runs vandaag
- succesvolle runs
- mislukte runs
- gemiddelde duur
- laatste run
- aantal stations
- aantal updates
- aantal fouten
- volledige historiek
- pagination
- filter per scraper

De monitor wordt automatisch ververst.

---

# 12. Scheduler

Alle actieve productie-scrapers worden automatisch uitgevoerd door de
Scheduler.

Huidige interval:

**15 minuten**

Actieve productie-scrapers:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

De eerste uitvoering gebeurt bij startup.

Daarna worden de actieve scrapers iedere 15 minuten opnieuw uitgevoerd.

---

# 13. Huidige productiebasis

FuelAlert beschikt momenteel over drie actieve productie-scrapers.

| Bron         | Stations | Status              |
| ------------ | -------: | ------------------- |
| MAES Network |      275 | ✅ Production Ready |
| DATS24       |      147 | ✅ Production Ready |
| SHELL        |      200 | ✅ Production Ready |

Totaal:

**622 gecontroleerde stationrecords**

De laatste volledige gecontroleerde run leverde:

```text
MAES_NETWORK
275 stations
275 updates
0 errors

DATS24
147 stations
147 updates
0 errors

SHELL
200 stations
200 updates
0 errors
```

---

# 14. Cross-source matching

De architectuur ondersteunt momenteel cross-source matching tussen
stationbronnen.

Voor Shell en MAES zijn actieve koppelingen aanwezig.

Deze koppelingen maken het mogelijk om verschillende bronnen van hetzelfde
fysieke station met elkaar te combineren.

Dit vormt de basis voor verdere multi-source prijsresolutie.

---

# 15. Toekomstige databronnen

FuelAlert moet uiteindelijk meerdere Belgische brandstofnetwerken kunnen
ondersteunen.

Mogelijke toekomstige bronnen zijn:

- Gabriëls
- TotalEnergies
- Texaco
- Lukoil
- Gulf
- Avia
- Fuel Media Service
- Q8
- Esso

Een bron wordt alleen toegevoegd wanneer de kwaliteit en betrouwbaarheid
voldoende zijn.

---

# 16. Toekomstige functionaliteit

Na het stabiliseren van de stationsarchitectuur wordt verder gewerkt aan:

## Stations

- Station Detail
- geavanceerde filters
- verbeterde kaart
- afstandsfilters
- merkfilters
- brandstoffilters

## Price History

- historische prijzen
- prijswijzigingen
- grafieken
- minimumprijs
- maximumprijs
- gemiddelde prijs
- prijsontwikkeling

## Gebruikersfuncties

- Favorieten
- Prijsalerts
- Persoonlijke instellingen
- Pushnotificaties

## Premium

- Geavanceerde prijsanalyse
- Prijsalerts
- Historiek
- Routeoptimalisatie
- Fleet functionaliteit

## Platform

- DataSource Manager
- Cache Engine
- Developer API
- Verified Station Portal
- Analytics Engine
- Prediction Engine
- AI-assisted Validation

---

# 17. Ontwikkelingsstrategie

FuelAlert wordt bewust in fases ontwikkeld.

De strategie is:

```text
Architectuur
    ↓
Databronnen
    ↓
Validatie
    ↓
Persistence
    ↓
Monitoring
    ↓
Stations
    ↓
Historiek
    ↓
Frontend
    ↓
Premium
    ↓
API
    ↓
Advanced Platform
```

Nieuwe functionaliteit wordt pas toegevoegd wanneer de onderliggende laag
voldoende stabiel is.

---

# 18. Documentatie als onderdeel van ontwikkeling

Documentatie is een vast onderdeel van de ontwikkeling.

Wanneer een architectuuronderdeel wordt toegevoegd of gewijzigd, moeten
de relevante documenten worden bijgewerkt.

Belangrijke documentatie omvat onder andere:

- `PROJECT_VISION.md`
- `System Architecture.md`
- `database.md`
- `scrapers.md`
- `roadmap.md`
- `changelog.md`
- `decision_log.md`
- `api.md`

Het **FuelAlert Master Development Book** vormt de officiële Single Source
of Truth voor de volledige ontwikkelingsgeschiedenis en technische
beslissingen.

---

# 19. Huidige fase

FuelAlert bevindt zich momenteel in de overgang van de oorspronkelijke
scraperarchitectuur naar een volledig geïntegreerd DataSource Platform.

De belangrijkste backendfundamenten zijn inmiddels aanwezig:

- ScraperManager
- Scheduler
- Validator Engine
- PersistenceEngine
- StationRepository
- stations_v2
- Health Registry
- Metrics Registry
- Rate Limiter
- Scheduler Monitor
- scheduler_runs
- station_source_links
- StationPriceResolver

---

# 20. Volgende grote mijlpaal

De volgende grote doelstelling is:

**De stationsmodule volledig afronden en de frontend migreren naar
`stations_v2`.**

Daarna volgen:

1. Price History
2. Verdere databronnen
3. Cache Engine
4. Geavanceerde frontendfunctionaliteit
5. Premium functies
6. DataSource Manager
7. Developer API

---

# 21. Eindvisie

FuelAlert Belgium moet uitgroeien tot een betrouwbare, schaalbare en
uitbreidbare Belgische brandstofdataplatform.

De kracht van het platform moet niet afhankelijk zijn van één scraper of één
databron.

De uiteindelijke architectuur moet meerdere databronnen kunnen combineren,
controleren en prioriteren.

Het einddoel is:

```text
      Multiple Data Sources
               ↓
       DataSource Engine
               ↓
          Validation
               ↓
        Source Matching
               ↓
       Price Resolution
               ↓
        Unified Database
               ↓
            REST API
               ↓
          FuelAlert App
```

FuelAlert is daarmee geen verzameling individuele scrapers meer, maar een
modulair platform voor betrouwbare brandstofdata.
