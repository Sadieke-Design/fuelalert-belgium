# Fuel Media Service API

**Versie:** 1.1  
**Laatste update:** 22 augustus 2026  
**Status:** Awaiting response from Fuel Media Service

---

# 1. Status

Fuel Media Service wordt momenteel geëvalueerd als potentiële externe
databron voor FuelAlert Belgium.

Er is een informatieaanvraag verstuurd met de vraag naar toegang tot de
commerciële Fuel Media Service API.

Huidige status:

- ⏳ Wachten op technische documentatie
- ⏳ Wachten op prijsinformatie
- ⏳ Wachten op licentievoorwaarden
- ⏳ Wachten op API-toegangsgegevens

Er is momenteel nog geen actieve Fuel Media Service-integratie in
FuelAlert.

---

# 2. Doel

Fuel Media Service wordt onderzocht als mogelijke aanvullende databron
voor FuelAlert Belgium.

Afhankelijk van de beschikbare API-functionaliteit kan de dienst mogelijk
gegevens leveren zoals:

- Tankstations
- Brandstofprijzen
- Stationmetadata
- Brandstofinformatie
- Aanvullende commerciële datasets

De exacte beschikbare datasets zijn nog niet bevestigd en zijn afhankelijk
van de documentatie en het gekozen abonnement/licentiemodel.

---

# 3. Plaats binnen de FuelAlert architectuur

Fuel Media Service wordt beschouwd als een externe DataSource.

De architectuur van FuelAlert is ontworpen zodat meerdere databronnen naast
elkaar kunnen bestaan.

Algemene structuur:

```text
Fuel Media Service API
        ↓
   DataSource Connector
        ↓
 Uniforme Station Output
        ↓
 Validator Engine
        ↓
 PersistenceEngine
        ↓
 StationRepository
        ↓
    stations_v2
```

De toekomstige integratie moet dezelfde infrastructuur gebruiken als de
bestaande databronnen.

---

# 4. Databronprioriteit

FuelAlert hanteert als uitgangspunt:

1. Officiële API's
2. Officiële databronnen
3. Interne scrapers
4. Commerciële databronnen
5. Andere geverifieerde databronnen

Fuel Media Service valt onder commerciële databronnen.

Een commerciële bron krijgt daarom niet automatisch voorrang op een
betrouwbare officiële bron.

De uiteindelijke prioriteit wordt bepaald op basis van:

- betrouwbaarheid
- actualiteit
- volledigheid
- prijsinformatie
- geografische dekking
- licentievoorwaarden
- API-stabiliteit
- datakwaliteit

---

# 5. Multi-source architectuur

FuelAlert is ontworpen om meerdere bronnen voor hetzelfde station te
kunnen verwerken.

Een station kan bijvoorbeeld informatie ontvangen van:

```text
MAES
DATS24
SHELL
Fuel Media Service
```

De bronnen kunnen vervolgens aan hetzelfde fysieke station worden
gekoppeld via de bestaande cross-source architectuur.

Hiervoor gebruikt FuelAlert onder andere:

`station_source_links`

Hierdoor kan een toekomstige Fuel Media Service-integratie worden
toegevoegd zonder de bestaande databasearchitectuur opnieuw te moeten
bouwen.

---

# 6. Broninformatie

FuelAlert moet bij externe gegevens kunnen bijhouden waar de informatie
vandaan komt.

Belangrijke broninformatie omvat onder andere:

- `source`
- `source_type`
- `source_name`
- `confidence`
- `updated_at`

De exacte implementatie wordt bepaald wanneer de Fuel Media Service API
wordt onderzocht.

De bestaande `StationPriceResolver` kan in de toekomst worden uitgebreid
wanneer Fuel Media Service daadwerkelijk als prijsbron wordt toegevoegd.

---

# 7. Mogelijke integratie

Wanneer Fuel Media Service toegang verleent, wordt eerst onderzocht:

## API

- Beschikbare endpoints
- API-versie
- Requestlimieten
- Pagination
- Filters
- Zoekmogelijkheden
- Updatefrequentie

## Authenticatie

- API key
- Bearer token
- OAuth
- Andere authenticatiemethode

## Data

- Station ID
- Stationnaam
- Merk
- Adres
- Postcode
- Gemeente
- GPS
- Brandstoffen
- Brandstofprijzen
- Update timestamps
- Stationstatus
- Services

## Technische beperkingen

- Rate limits
- Request limits
- Concurrent requests
- Timeoutlimieten
- Dagelijkse quota
- Licentiebeperkingen

---

# 8. Validatie

Een eventuele Fuel Media Service-integratie moet dezelfde validatie
doorlopen als iedere andere databron.

De gegevens moeten onder andere worden gecontroleerd op:

- ontbrekende stationgegevens
- ontbrekende prijzen
- ongeldige prijzen
- ongeldige GPS-coördinaten
- ongeldige adressen
- duplicaten
- onrealistische waarden
- datakwaliteit

De connector mag de database niet rechtstreeks vullen zonder de normale
FuelAlert dataflow te volgen.

---

# 9. Geplande DataSource Flow

Indien de API wordt geïntegreerd:

```text
Fuel Media Service API
        ↓
Fuel Media Service Connector
        ↓
Uniforme API output
        ↓
Validator Engine
        ↓
PersistenceEngine
        ↓
StationRepository
        ↓
stations_v2
```

Monitoring:

```text
Scheduler
    ↓
ScraperManager
    ↓
Fuel Media Service
    ↓
SchedulerRunRepository
    ↓
scheduler_runs
    ↓
Scheduler Monitor
```

Hierdoor krijgt de bron dezelfde monitoringmogelijkheden als de huidige
productie-scrapers.

---

# 10. Scheduler

Indien Fuel Media Service geschikt blijkt voor periodieke updates, wordt
de connector opgenomen in de bestaande Schedulerarchitectuur.

De bron krijgt dan:

- automatische uitvoering
- foutregistratie
- health monitoring
- metrics
- scheduler history
- Scheduler Monitor-integratie

De exacte updatefrequentie wordt bepaald op basis van:

- API-limieten
- licentievoorwaarden
- updatefrequentie van de bron
- gewenste actualiteit
- serverbelasting

---

# 11. Rate Limiting

De Fuel Media Service-integratie moet gebruikmaken van de bestaande
RateLimiter wanneer de API daarom vraagt.

Mogelijke instellingen:

```text
delay
retries
timeout
concurrent
```

De exacte waarden worden pas bepaald na ontvangst van de officiële
API-documentatie en technische limieten.

---

# 12. Database

De integratie moet gebruikmaken van de bestaande:

`stations_v2`

Er wordt geen aparte stationdatabase aangemaakt tenzij de API-architectuur
dit technisch noodzakelijk maakt.

Wanneer meerdere bronnen hetzelfde station beschrijven, kunnen deze via de
bestaande cross-source infrastructuur worden gekoppeld.

---

# 13. Price Resolution

Wanneer Fuel Media Service actuele prijzen levert, kan deze bron mogelijk
worden gebruikt door de `StationPriceResolver`.

De uiteindelijke prioriteit moet nog worden bepaald.

Mogelijke situatie:

```text
Official API
      ↓
Fuel Media Service
      ↓
Internal scraper
      ↓
Fallback
```

Dit is voorlopig slechts een architectuurmogelijkheid.

De daadwerkelijke prioriteit wordt pas vastgesteld na evaluatie van:

- datakwaliteit
- actualiteit
- betrouwbaarheid
- licentie
- kosten
- dekking

---

# 14. Licentie

Voor implementatie moet eerst worden gecontroleerd welke rechten FuelAlert
krijgt om de gegevens te gebruiken.

Te onderzoeken:

- commerciële licentie
- opslag van data
- caching
- historische opslag
- publieke weergave
- API redistribution
- gebruik in mobiele applicatie
- gebruik voor prijsvergelijking
- gebruik in commerciële/premium functies
- aantal API-calls
- aantal gebruikers
- geografische beperkingen

Geen integratie wordt als Production Ready beschouwd voordat de
licentievoorwaarden voldoende duidelijk zijn.

---

# 15. Kosten

De commerciële kosten moeten worden geëvalueerd voordat Fuel Media Service
wordt geïntegreerd.

Te bepalen:

- maandelijkse kosten
- jaarlijkse kosten
- prijs per request
- prijs per station
- prijs per gebruiker
- API-call quota
- extra kosten voor historische gegevens
- kosten voor commerciële/publicatie-rechten

---

# 16. Implementatieplan

Wanneer Fuel Media Service wordt goedgekeurd:

### Stap 1 — Documentatie

- API-documentatie ontvangen
- API-specificatie analyseren
- Authenticatie analyseren
- Rate limits bepalen

### Stap 2 — Datakwaliteit

- Stations testen
- GPS testen
- Adressen testen
- Brandstofprijzen testen
- Updatefrequentie testen

### Stap 3 — Connector

- Nieuwe DataSource connector bouwen
- Uniforme output implementeren
- Error handling implementeren

### Stap 4 — Validatie

- Validator Engine integreren
- Price Validator
- GPS Validator
- Address Validator
- Duplicate Validator

### Stap 5 — Persistence

- `stations_v2` integratie
- Station matching
- Source metadata

### Stap 6 — Scheduler

- Scheduler-integratie
- RateLimiter configureren
- automatische runs

### Stap 7 — Monitoring

- Health Registry
- Metrics Registry
- `scheduler_runs`
- Scheduler Monitor

### Stap 8 — Productietest

- meerdere runs uitvoeren
- resultaten controleren
- fouten analyseren
- performance controleren

### Stap 9 — Production Ready

Pas na succesvolle validatie wordt Fuel Media Service als actieve
productiebron beschouwd.

---

# 17. TODO

## Onderzoek

- ⏳ API-documentatie ontvangen
- ⏳ Endpoints beoordelen
- ⏳ Authenticatie beoordelen
- ⏳ Rate limits beoordelen
- ⏳ Datadekking beoordelen
- ⏳ Datakwaliteit beoordelen
- ⏳ Licentievoorwaarden beoordelen
- ⏳ Prijsmodel beoordelen

## Technische ontwikkeling

- ⏳ Integratiearchitectuur ontwerpen
- ⏳ Connector implementeren
- ⏳ Uniforme output implementeren
- ⏳ Validator-integratie
- ⏳ Persistence-integratie
- ⏳ Station matching
- ⏳ Scheduler-integratie
- ⏳ RateLimiter-configuratie
- ⏳ Monitoring-integratie
- ⏳ Geautomatiseerde tests

## Productie

- ⏳ End-to-end test
- ⏳ Meerdere succesvolle runs
- ⏳ Datakwaliteitscontrole
- ⏳ Performancecontrole
- ⏳ Productie-activering

---

# 18. Huidige status

```text
Fuel Media Service
        ↓
Informatieaanvraag verstuurd
        ↓
Wachten op antwoord
        ↓
API-documentatie
Pricing
Licentie
Toegang
        ↓
Evaluatie
        ↓
Beslissing integratie
```

Er is momenteel **geen actieve Fuel Media Service scraper of API
connector** in de FuelAlert productieomgeving.

---

# 19. Production Ready criteria

Fuel Media Service wordt pas Production Ready verklaard wanneer:

- API technisch stabiel werkt
- data betrouwbaar is
- stationgegevens correct zijn
- prijzen correct zijn
- data gevalideerd wordt
- persistence correct werkt
- station matching correct werkt
- Scheduler correct werkt
- RateLimiter correct werkt
- Health Monitoring correct werkt
- Metrics correct werken
- Scheduler Monitor correct werkt
- meerdere succesvolle runs zijn uitgevoerd
- licentievoorwaarden zijn goedgekeurd
- kosten aanvaardbaar zijn
- documentatie is bijgewerkt

---

# 20. Beslissing

**Huidige beslissing:**

⏳ **Evaluatie — nog geen implementatie**

Er wordt geen ontwikkelwerk gestart voordat de officiële technische,
commerciële en licentie-informatie van Fuel Media Service beschikbaar is.

Na ontvangst van de informatie wordt eerst een technische en commerciële
evaluatie uitgevoerd.

Pas daarna wordt beslist of Fuel Media Service aan FuelAlert Belgium wordt
toegevoegd.
