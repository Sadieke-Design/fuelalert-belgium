# Decision Log

## 2026-07-25

### MAES Scraper

Besloten om de scraper niet langer alle URL's gelijktijdig te laten verwerken.

Reden:
- Minder geheugenverbruik.
- Minder kans op rate limiting.
- Betere stabiliteit.
- Schaalbaar voor grote netwerken.

Implementatie:
- Batchverwerking.
- Batchgrootte: 20.