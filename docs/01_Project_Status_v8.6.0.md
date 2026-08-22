# FuelAlert Belgium — Project Status

**Versie:** 8.6.0  
**Laatste update:** 22 augustus 2026  
**Status:** Development Release

---

# Backend

- ✅ Scheduler
- ✅ Monitoring
- ✅ Health Registry
- ✅ Repository Layer
- ✅ Persistence Engine
- ✅ Scheduler Monitor API
- ✅ Pagination
- ✅ ScraperManager
- ✅ Validator Engine
- ✅ Metrics Registry
- ✅ Report Engine
- ✅ Rate Limiter
- ✅ `stations_v2` databasepipeline
- ✅ `scheduler_runs`
- ✅ `station_source_links`
- ✅ `StationPriceResolver`
- ✅ Deployment

---

# Scrapers

| Scraper | Stations | Status |
|---|---:|---|
| MAES Network | 275 | ✅ Production Ready |
| DATS24 | 147 | ✅ Production Ready |
| SHELL | 200 | ✅ Production Ready |
| Gabriëls | - | ⏳ Gepland |
| Q8 | - | ⏳ Development |
| Esso | - | ⏳ Gepland |
| TotalEnergies | - | ⏳ Gepland |
| Texaco | - | ⏳ Gepland |
| Lukoil | - | ⏳ Gepland |

---

# Frontend

- ✅ Dashboard
- ✅ Stations
- ✅ Scheduler Monitor
- ✅ Live scraper monitoring
- ⏳ Station Detail
- ⏳ Historiek per station
- ⏳ Kaartoptimalisatie
- ⏳ Volledige frontendmigratie naar `stations_v2`

---

# Admin

- ❌ Dashboard
- ❌ Schedulerbeheer
- ❌ Users
- ❌ Analytics
- ❌ Logs

---

# Monitoring

- ✅ Scheduler Monitor
- ✅ Live refresh iedere 30 seconden
- ✅ Success/Failed statistieken
- ✅ Gemiddelde uitvoeringsduur
- ✅ Laatste uitgevoerde run
- ✅ Historiek van scraper-runs
- ✅ Pagination
- ✅ Filteren per scraper
- ✅ Afzonderlijke scraperhistoriek
- ✅ SHELL opgenomen in scraperhistoriek
- ⏳ Uitklapbare uitgebreide historiek per scraper

---

# Scheduler

De actieve productie-scrapers worden automatisch uitgevoerd via de centrale
Scheduler.

**Interval:**

- 15 minuten
- Eerste uitvoering bij backend-startup

**Actieve productie-scrapers:**

- `MAES_NETWORK`
- `DATS24`
- `SHELL`

Iedere normale scraper-run wordt geregistreerd in:

`scheduler_runs`

Smoke tests worden bewust niet geregistreerd in `scheduler_runs`.

---

# Huidige productiegegevens

| Scraper | Stations | Status |
|---|---:|---|
| MAES Network | 275 | ✅ |
| DATS24 | 147 | ✅ |
| SHELL | 200 | ✅ |
| **Totaal** | **622** | **✅** |

---

# Cross-Source Architectuur

- ✅ `station_source_links`
- ✅ Cross-source station matching
- ✅ Confidence score
- ✅ Afstandscontrole
- ✅ `StationPriceResolver`
- ✅ Linked live price resolution
- ✅ Fallback naar officiële bronprijzen

---

# Volgende grote mijlpaal

De eerstvolgende grote ontwikkelfocus is het volledig afronden van de
**Stationsmodule**.

Daarna:

1. Frontend volledig migreren naar `stations_v2`
2. Station Detail
3. Historiek per station
4. Kaartoptimalisatie
5. Verdere scraperintegraties
6. Gabriëls
7. Q8
8. Esso
9. TotalEnergies
10. Verdere databronnen
11. Adminfunctionaliteiten
12. Premium functies

---

# Belangrijke opmerking

De backend V2-architectuur is inmiddels operationeel voor drie
productiebronnen:

```text
MAES_NETWORK
DATS24
SHELL
     ↓
ScraperManager
     ↓
Validator Engine
     ↓
PersistenceEngine
     ↓
stations_v2
```

De oude productiearchitectuur wordt pas volledig uitgefaseerd nadat de
Stationsmodule en frontendmigratie naar `stations_v2` volledig zijn afgerond.
