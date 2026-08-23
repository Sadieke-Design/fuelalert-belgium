# FuelAlert Belgium - Roadmap

**Versie:** 8.8.0  
**Laatste update:** 23 augustus 2026  
**Status:** Active Development

---

# Phase 8 — DataSource Platform

De oorspronkelijke Phase 8 had als doel de backend om te bouwen naar een
modulaire, uitbreidbare scraperarchitectuur.

Deze fase is inmiddels grotendeels afgerond.

## Backend Platform

- ✅ Modular scraper architecture
- ✅ BaseScraper
- ✅ BrowserScraper
- ✅ ScraperManager
- ✅ Scraper Registry
- ✅ Validation Engine
- ✅ Price Validator
- ✅ GPS Validator
- ✅ Address Validator
- ✅ Duplicate Validator
- ✅ Persistence Engine
- ✅ Station Repository
- ✅ stations_v2
- ✅ Scheduler
- ✅ Health Registry
- ✅ Metrics Registry
- ✅ Report Engine
- ✅ Rate Limiter
- ✅ Capability Registry
- ✅ Scheduler Run Repository
- ✅ Scheduler Monitor
- ✅ station_source_links
- ✅ StationSourceLinkRepository
- ✅ StationPriceResolver

---

# Phase 8.1 — Scraper Architecture

## Voltooid

- ✅ BaseScraper
- ✅ BrowserScraper
- ✅ ScraperManager
- ✅ Scraper Registry
- ✅ Uniforme scraper-output
- ✅ Centrale scraper execution
- ✅ Multi-source architectuur
- ✅ Foutafhandeling
- ✅ Health-integratie
- ✅ Persistence-integratie

---

# Phase 8.2 — Stationsmodule

## Voltooid

- ✅ stations_v2 database
- ✅ StationRepository
- ✅ PersistenceEngine
- ✅ Station bootstrap
- ✅ Station import
- ✅ Station updates
- ✅ GPS-validatie
- ✅ Adresvalidatie
- ✅ Duplicate validatie
- ✅ MAES Network productie-integratie
- ✅ DATS24 productie-integratie
- ✅ SHELL productie-integratie

## Huidige productiegegevens

| Bron         | Stations | Status        |
| ------------ | -------: | ------------- |
| MAES Network |      275 | ✅ Production |
| DATS24       |      147 | ✅ Production |
| SHELL        |      200 | ✅ Production |
| TEXACO       |       91 | ✅ Production |
| Q8           |      469 | ✅ Production |

**Totaal gecontroleerde scraperrecords:** 1082

**Opmerking Q8:** 469 stations gevonden; 213 met beschikbare prijzen en
256 zonder beschikbare prijsdata tijdens de laatste volledige run.

---

# Phase 8.3 — Scrapers

## Voltooid

### MAES Network

- ✅ Sitemap discovery
- ✅ HTML parsing
- ✅ JSON-LD / embedded data
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 275 stations

### DATS24

- ✅ HTML station scraping
- ✅ Embedded station data
- ✅ GPS
- ✅ Adresgegevens
- ✅ Brandstofprijzen
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 147 stations

### SHELL

- ✅ Officiële Shell stationdata
- ✅ Officiële Shell XLSX-prijsdata
- ✅ XLSX verwerking
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 200 stations

### TEXACO

- ✅ Officiële station discovery
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 91 stations

### Q8

- ✅ Officiële Q8 sitemap discovery
- ✅ Playwright/rendered stationpagina's
- ✅ Q8 stationcode extractie
- ✅ Officiële Q8 prijs API
- ✅ Uniforme output
- ✅ Persistence
- ✅ Scheduler
- ✅ Monitoring
- ✅ Historiek
- ✅ 469 stations
- ⚠️ 213 stations met prijzen
- ⚠️ 256 stations zonder beschikbare prijzen
- ⚠️ 39 stationpagina's zonder gevonden Q8-code

---

# Phase 8.4 — DataSource Engine

## Voltooid

- ✅ Capability Registry
- ✅ Scheduler
- ✅ Health Engine
- ✅ Metrics Engine
- ✅ Validator Engine
- ✅ Persistence Engine
- ✅ Rate Limiter
- ✅ Report Engine
- ✅ ScraperManager
- ✅ SchedulerRunRepository
- ✅ Scheduler Monitor

## Scheduler

De Scheduler draait momenteel iedere:

**15 minuten**

Actieve scrapers:

- `MAES_NETWORK`
- `DATS24`
- `SHELL`
- `TEXACO`
- `Q8`

Iedere normale run wordt geregistreerd in:

`scheduler_runs`

Smoke tests worden niet geregistreerd in de schedulerhistoriek.

---

# Phase 8.5 — Cross-Source Station Matching

## Voltooid

- ✅ `station_source_links`
- ✅ `StationSourceLinkRepository`
- ✅ Cross-source station matching
- ✅ Shell ↔ MAES matching
- ✅ Distance calculation
- ✅ Confidence score
- ✅ Link uniciteitscontrole
- ✅ 35 actieve Shell/MAES links

## Resultaat

Van de 200 officiële Shell-stations zijn momenteel 35 betrouwbare
koppelingen met MAES-stations actief.

De matching wordt gebruikt door de prijsresolutie.

---

# Phase 8.6 — Price Resolution

## Voltooid

- ✅ `StationPriceResolver`
- ✅ Linked-live prijsbron
- ✅ Official prijsbron
- ✅ Original prijsbron
- ✅ Per-brandstof fallback
- ✅ Brontransparantie
- ✅ Shell → MAES live prijsresolutie

## Prijsprioriteit

Voor een gekoppeld Shell-station:

`linked_live`

Voor een Shell-station zonder MAES-link:

`official`

Voor een oorspronkelijk station zonder externe koppeling:

`original`

De resolver kan per brandstof terugvallen op de oorspronkelijke
prijsbron wanneer de gekoppelde bron geen waarde levert.

---

# Phase 8.7 — Scheduler Monitoring

## Voltooid

- ✅ scheduler_runs
- ✅ SchedulerRunRepository
- ✅ Scheduler Monitor API
- ✅ Scheduler Monitor frontend
- ✅ Automatische refresh
- ✅ Runs vandaag
- ✅ Success statistics
- ✅ Failed statistics
- ✅ Average duration
- ✅ Laatste run
- ✅ Station count
- ✅ Updated count
- ✅ Error count
- ✅ Pagination
- ✅ Filter per scraper
- ✅ MAES history
- ✅ DATS24 history
- ✅ SHELL history

---

# Phase 8.8 — Smoke Testing

## Voltooid

- ✅ Smoke test mode
- ✅ Volledige scraper smoke test
- ✅ Controle van alle actieve scrapers
- ✅ Controle van PersistenceEngine
- ✅ Controle van scraper output
- ✅ Controle dat smoke tests geen `scheduler_runs` creëren

Smoke tests kunnen worden uitgevoerd zonder de schedulerhistoriek
te vervuilen.

---

# Phase 8.9 — Production Validation

## Voltooid

Laatste volledige gecontroleerde productie-run:

### MAES Network

- 275 stations
- 275 updates
- 0 errors

### DATS24

- 147 stations
- 147 updates
- 0 errors

### SHELL

- 200 stations
- 200 updates
- 0 errors

### TEXACO

- 91 stations
- 91 updates
- 0 errors

### Q8

- 469 stations
- 469 updates
- 0 scraper-errors
- 213 stations met prijzen
- 256 stations zonder beschikbare prijzen
- 39 stationpagina's zonder gevonden Q8-code

### Totaal

- 1082 scraperrecords
- 0 scraper-errors

---

# Phase 9 — Stations Frontend

## Prioriteit: Hoog

De backend stationsarchitectuur is nu stabiel genoeg om de frontend
verder naar `stations_v2` te migreren.

## Te ontwikkelen

- ⏳ Frontend volledig migreren naar `stations_v2`
- ⏳ Station Detail
- ⏳ Verbeterde stationslijst
- ⏳ Filters
- ⏳ Brandfilters
- ⏳ Brandstoffilters
- ⏳ Afstandfilters
- ⏳ Prijsfilters
- ⏳ Kaart optimalisatie
- ⏳ Station status
- ⏳ Live prijsweergave

---

# Phase 10 — Price History

## Te ontwikkelen

- ⏳ Historische brandstofprijzen
- ⏳ Prijswijzigingen opslaan
- ⏳ Historiek per station
- ⏳ Historiek per merk
- ⏳ Historiek per brandstof
- ⏳ Grafieken
- ⏳ Minimumprijs
- ⏳ Maximumprijs
- ⏳ Gemiddelde prijs
- ⏳ Prijsontwikkeling
- ⏳ API voor historische prijzen

---

# Phase 11 — Nieuwe Databronnen

## Prioriteit

### 1. Gabriëls

- ⏳ Brononderzoek
- ⏳ Scraper
- ⏳ Validatie
- ⏳ Persistence
- ⏳ Scheduler
- ⏳ Monitoring
- ⏳ Productie

### 2. Fuel Media Service

- ⏳ Reactie/contact opvolgen
- ⏳ API evalueren
- ⏳ Datakwaliteit testen
- ⏳ Integratiemodel bepalen

### 3. TotalEnergies

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 4. Lukoil

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 6. Gulf

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

### 6. Avia

- ⏳ Brononderzoek
- ⏳ Scraper/API
- ⏳ Validatie
- ⏳ Integratie

**Q8 en Texaco zijn inmiddels Production Ready en vallen niet meer
onder Phase 11.**

---

# Phase 12 — Cache & Performance

## Te ontwikkelen

- ⏳ Cache Engine
- ⏳ API response caching
- ⏳ Station caching
- ⏳ Price caching
- ⏳ Database query optimization
- ⏳ Frontend caching
- ⏳ Rate-limit optimalisatie

---

# Phase 13 — DataSource Manager

## Status

⏳ Planned

De DataSource Manager wordt de intelligente laag boven de verschillende
databronnen.

Doel:

Automatisch bepalen welke bron voor een bepaald gegeven de beste
beschikbare informatie levert.

Basisbron-prioriteit:

1. Officiële API
2. Commerciële databron
3. Officiële website
4. Scraper van de officiële bron
5. Communitydata

**Uitzondering — Dealer Authority:**

Een actieve instelling van een geverifieerde stationhouder staat boven de
automatisch verzamelde bronprijs voor het betreffende station en de
betreffende brandstof.

De dealerlaag is dus geen gewone databron in deze prioriteitenlijst,
maar een expliciete override-laag bovenop de brondata.

De bestaande `StationPriceResolver` vormt een eerste stap in deze
richting.

---

# Phase 14 — Frontend Functionaliteit

## Te ontwikkelen

- ⏳ Favorieten
- ⏳ Prijsalerts
- ⏳ Historiek
- ⏳ Premium
- ⏳ Persoonlijke instellingen
- ⏳ Pushnotificaties
- ⏳ Routeplanning
- ⏳ Geavanceerde filters

---

# Phase 15 — Admin Platform

## Te ontwikkelen

- ⏳ Admin dashboard
- ⏳ Gebruikersbeheer
- ⏳ Scraperbeheer
- ⏳ Schedulerbeheer
- ⏳ Databronbeheer
- ⏳ Health monitoring
- ⏳ Metrics
- ⏳ Logs
- ⏳ Handmatige scraper-run
- ⏳ Stationcorrecties
- ⏳ Linkbeheer
- ⏳ Price override

---

# Phase 16 — Premium Platform

## Te ontwikkelen

- ⏳ Premium abonnementen
- ⏳ Prijsalerts
- ⏳ Geavanceerde historiek
- ⏳ Favorieten
- ⏳ Persoonlijke prijsanalyse
- ⏳ Routeoptimalisatie
- ⏳ Fleet functionaliteit
- ⏳ Bedrijfsaccounts

---

# Phase 17 — Publieke API

## Te ontwikkelen

- ⏳ Developer API
- ⏳ API authentication
- ⏳ API keys
- ⏳ Rate limiting
- ⏳ Usage statistics
- ⏳ API documentation
- ⏳ Premium API plans

---

# Phase 17.1 — Dealer Price Authority Strategy

## Strategische beslissing

FuelAlert blijft eerst verdergaan met het bouwen van betrouwbare scrapers
voor alle relevante tankstationmerken.

De scrapers blijven de **basisbron** voor actuele stationprijzen.

Daarboven komt een afzonderlijke laag voor **geverifieerde dealers /
stationhouders**. Een dealer kan zijn eigen station claimen en daarna
prijzen of kortingen beheren.

De dealerlaag vervangt dus niet de scraperarchitectuur, maar vormt een
hogere, gecontroleerde prijslaag bovenop de automatisch verzamelde
brondata.

## Prijsstrategie

De uiteindelijke prijs voor een station wordt bepaald volgens:

```text
Scraper / officiële databron
            ↓
       Basisprijs
            ↓
   Dealer Price Override
            ↓
      Resolved Price
            ↓
         Frontend
```

Zolang een dealer niets heeft aangepast:

**Scraperprijs = getoonde prijs**

Zodra een geverifieerde dealer een prijs of korting voor zijn station
heeft ingesteld:

**Dealerinstelling = leidende prijsinformatie**

De scraper mag daarna de dealerinstelling niet overschrijven.

Een volgende scraper-run blijft wel de actuele bronprijs verzamelen,
maar deze wordt alleen als basisinformatie gebruikt zolang er geen
actieve dealerinstelling is.

## Dealer kan beheren

Een geverifieerde dealer moet in de toekomstige portal minimaal kunnen:

- ⏳ Eigen station claimen
- ⏳ Benzine 95 prijs aanpassen
- ⏳ Benzine 98 prijs aanpassen
- ⏳ Dieselprijs aanpassen
- ⏳ LPG-prijs aanpassen
- ⏳ Andere beschikbare brandstoffen aanpassen
- ⏳ Een korting instellen
- ⏳ Een prijs handmatig overschrijven
- ⏳ Een eerder ingestelde override verwijderen
- ⏳ Zien wanneer de prijs voor het laatst werd aangepast

## Belangrijk onderscheid

FuelAlert bewaart steeds beide concepten:

1. **Bronprijs** — prijs die door scraper/API/andere databron is
   aangeleverd.
2. **Dealerprijs / dealerinstelling** — expliciete instelling van een
   geverifieerde stationhouder.

De oorspronkelijke bronprijs mag dus nooit verloren gaan wanneer een
dealer een prijs aanpast.

Dit maakt het mogelijk om:

- de bronprijs te blijven controleren
- dealerprijzen te onderscheiden van scraperprijzen
- wijzigingen te traceren
- de dealerinstelling later te verwijderen
- opnieuw automatisch naar de bronprijs terug te vallen

## Prijsresolutie

De bestaande `StationPriceResolver` wordt in een latere fase uitgebreid
met dealer authority.

De logische volgorde wordt:

```text
1. Beschikbare scraper / officiële bronprijs
2. Dealer override indien actief
3. Dealer korting indien actief
4. Resolved price
```

De precieze technische implementatie van prijs versus korting wordt
vastgelegd tijdens de database- en API-uitwerking.

## Per brandstof

Dealerinstellingen moeten per brandstof onafhankelijk kunnen worden
beheerd.

Voorbeeld:

```text
Diesel:
  scraperprijs = €1,650
  dealerprijs  = €1,599
  → FuelAlert toont €1,599

Benzine 95:
  scraperprijs = €1,720
  geen dealerinstelling
  → FuelAlert toont €1,720

Benzine 98:
  scraperprijs = €1,820
  dealer korting = €0,050
  → FuelAlert toont de volgens de dealerinstelling berekende prijs
```

Een dealerwijziging voor één brandstof mag de andere brandstoffen dus
niet overschrijven.

## Bescherming tegen scraper-overschrijving

Dit is een fundamenteel onderdeel van de architectuur.

De scraper mag:

- de bronprijs bijwerken
- brongegevens vernieuwen
- nieuwe stationinformatie leveren

De scraper mag **niet**:

- een actieve dealerprijs overschrijven
- een actieve dealerinstelling verwijderen
- een actieve dealer korting verwijderen

Alleen een geautoriseerde dealer of een daarvoor bestemde admin-flow
mag een actieve dealerinstelling wijzigen of verwijderen.

## Volgorde van ontwikkeling

De ontwikkelstrategie blijft bewust:

```text
1. Scrapers bouwen voor zoveel mogelijk stations
2. Stationdata en prijzen betrouwbaar verzamelen
3. Stations volledig op orde brengen
4. Dealer/Verified Station Portal bouwen
5. Dealerprijs- en kortingsbeheer toevoegen
6. StationPriceResolver uitbreiden met dealer authority
7. Frontend dealerbron transparant tonen
```

De dealerfunctionaliteit wordt dus **bovenop de scraperarchitectuur**
gebouwd en niet als vervanging ervan.

---

# Phase 18 — Verified Station Portal

## Te ontwikkelen

Tankstationhouders kunnen in de toekomst:

- ⏳ Station claimen
- ⏳ Stationsgegevens beheren
- ⏳ Prijzen controleren
- ⏳ Eigen brandstofprijzen instellen
- ⏳ Eigen brandstofkortingen instellen
- ⏳ Prijzen per brandstof beheren
- ⏳ Dealerprijs tijdelijk overschrijven
- ⏳ Dealerinstelling verwijderen en terugvallen op scraperprijs
- ⏳ Wijzigingshistoriek van dealerprijzen
- ⏳ Zichtbaar onderscheid tussen scraperprijs en dealerprijs
- ⏳ Services beheren
- ⏳ Openingstijden beheren
- ⏳ Foto's toevoegen
- ⏳ Promoties publiceren
- ⏳ Tijdelijke meldingen plaatsen

---

# Phase 19 — Advanced Platform

## Lange termijn

- ⏳ Analytics Engine
- ⏳ Prediction Engine
- ⏳ AI-assisted validation
- ⏳ Prijsvoorspelling
- ⏳ Automatische anomaliedetectie
- ⏳ Fleet Platform
- ⏳ EV charging data
- ⏳ HVO100
- ⏳ AdBlue
- ⏳ Carwash
- ⏳ Shopinformatie
- ⏳ Restaurantinformatie

---

# Huidige Prioriteiten

De huidige prioriteiten zijn:

1. **Stationsmodule volledig afronden**
2. **Frontend migreren naar `stations_v2`**
3. **Station Detail**
4. **Kaart en filters**
5. **Price History**
6. **Verder bouwen van scrapers voor de overige relevante stations**
7. **Gabriëls scraper**
8. **Fuel Media Service**
9. **Verified Station / Dealer Portal**
10. **Dealer Price Authority en dealer-kortingen**
11. **Extra databronnen**
12. **Cache Engine**
13. **DataSource Manager**

---

# Roadmap Principe

FuelAlert wordt gefaseerd ontwikkeld.

De volgorde blijft:

```text
Platform
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
Een nieuwe scraper wordt pas als Production Ready beschouwd wanneer:

de bron betrouwbaar werkt
de data gevalideerd is
de persistence werkt
de Scheduler werkt
monitoring werkt
de resultaten gecontroleerd zijn
de documentatie is bijgewerkt

Dealerprijsstrategie:

Scrapers blijven de automatische basisprijs leveren.
Een actieve dealerinstelling heeft voorrang op die basisprijs.
De scraper mag een actieve dealerinstelling nooit overschrijven.
De oorspronkelijke bronprijs blijft bewaard voor transparantie en
fallback.
Current Status — v8.8.0

Productie

✅ MAES Network — 275
✅ DATS24 — 147
✅ SHELL — 200
✅ TEXACO — 91
✅ Q8 — 469
✅ ScraperManager
✅ Scheduler
✅ PersistenceEngine
✅ Validation Engine
✅ Health Registry
✅ Metrics Registry
✅ Rate Limiter
✅ Scheduler Monitor
✅ scheduler_runs
✅ station_source_links
✅ StationPriceResolver

Laatste volledige gecontroleerde run:

**1082 scraperrecords — 0 scraper-errors**

Q8 detail:

- 469 stations gevonden
- 213 stations met prijzen
- 256 stations zonder beschikbare prijzen
- 39 stationpagina's zonder gevonden Q8-code

Volgende grote mijlpaal

**Stationsmodule volledig afronden en frontend migreren naar
`stations_v2`.**

Roadmap-principe:

Scrapers blijven de automatische basisprijs leveren.
Een actieve dealerinstelling heeft voorrang op die basisprijs.
De scraper mag een actieve dealerinstelling nooit overschrijven.
De oorspronkelijke bronprijs blijft bewaard voor transparantie en
fallback.
```
