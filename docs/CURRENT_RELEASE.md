# FuelAlert Belgium - Release Information

## Release

**Versie:** 8.4.0  
**Releasedatum:** 27 juli 2026  
**Status:** Development Release

---

# Projectstatus

FuelAlert Belgium is een modulair platform voor het verzamelen, verwerken en publiceren van Belgische brandstofprijzen.

De backend is opgebouwd als een uitbreidbaar scraperplatform waarbij officiële API's, commerciële databronnen en eigen scrapers gecombineerd kunnen worden.

---

# Belangrijkste onderdelen

## Backend

- ✅ Express REST API
- ✅ Scraper Framework
- ✅ ScraperManager
- ✅ BaseScraper
- ✅ BrowserScraper
- ✅ Validation Engine
- ✅ CacheManager
- ✅ Report Engine
- ✅ Scheduler
- ✅ Persistence Layer

## Frontend

- ✅ Dashboard
- ✅ Stationspagina
- ✅ Kaart
- ✅ Authenticatie

---

# Ondersteunde databronnen

| Bron               | Status               |
| ------------------ | -------------------- |
| MAES               | ✅ Productie         |
| Fuel Media Service | ⏳ Contact opgenomen |
| Gabriëls           | ⏳ Gepland           |
| Q8                 | ⏸ On Hold            |
| Esso               | ⏸ On Hold            |

---

# Belangrijkste wijzigingen in deze release

- Modulaire scraperarchitectuur verder uitgewerkt.
- BrowserScraper toegevoegd.
- Validation Engine uitgebreid.
- CacheManager toegevoegd.
- Report Engine toegevoegd.
- Scheduler geïntegreerd.
- MAES scraper volledig operationeel.
- Esso-onderzoek afgerond.
- Q8 voorlopig on hold.
- Fuel Media Service gecontacteerd.

---

# Openstaande prioriteiten

1. Capability Registry
2. Health Engine
3. Smart Rate Limiter
4. Gabriëls scraper
5. Fuel Media Service API (indien beschikbaar)

---

# Documentatie

De volledige projectdocumentatie staat in:

- Master Development Book
- docs/PROJECT_VISION.md
- docs/ARCHITECTURE.md
- docs/scrapers.md
- docs/roadmap.md
- docs/deployment.md

Het **Master Development Book** is de officiële _Single Source of Truth_ van het project.

---

# Git

Repository bevat uitsluitend de broncode.

Uitgesloten van releases:

- node_modules/
- dist/
- build/
- .git/
- logs/
- backend/data/\*.osm.pbf

---

# Opmerking

Deze release is bedoeld als ontwikkelversie en vormt een momentopname van het project op de hierboven vermelde releasedatum.
