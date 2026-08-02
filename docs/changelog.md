# Changelog

## 2026-07-25

### MAES Network Scraper

- Nieuwe batchverwerking toegevoegd.
- Parallelle verwerking vervangen door batches van 20 requests.
- Volledige scraper succesvol getest.
- 1740 URLs ontdekt via sitemap.
- 275 stations succesvol verwerkt.
- 0 fouten tijdens volledige run.

## Fase 8.2.1

### MAES Network afgerond

- Batch processing toegevoegd
- JSON-LD adresdetectie toegevoegd
- Uniforme scraper-output
- 275 stations succesvol verwerkt
- Slechts 1 uitzonderingspagina zonder bruikbaar JSON-LD
- Productie gereed verklaard

## 2026-07-26

- Completed investigation into official Belgian fuel price data providers.
- Researched Fuel Media Service and CARBU API.
- Contacted Fuel Media Service regarding commercial API access.
- Confirmed FuelAlert will follow a hybrid multi-source architecture.

## v8.4.0

### Nieuw

- Capability Registry toegevoegd.
- Nieuw endpoint `/api/capabilities`.
- Scrapers registreren nu automatisch hun mogelijkheden.
- Eerste implementatie voor MAES Network.
- Eerste bouwsteen van de DataSource Engine gerealiseerd.

## v8.4.1

### Nieuw

- Capability Registry geïmplementeerd.
- Nieuw endpoint `/api/capabilities`.
- Health Registry toegevoegd.
- Nieuw endpoint `/api/health`.
- Scheduler Engine toegevoegd.
- Nieuw endpoint `/api/scheduler`.
- MAES scraper draait automatisch via de Scheduler.
- Eerste automatische Health-monitoring geïmplementeerd.
- Fundament van de DataSource Engine gerealiseerd.

## v8.5.0

### Core Backend

- Validator Engine volledig geïmplementeerd.
- Uniform validator-framework toegevoegd.
- Price Validator toegevoegd.
- GPS Validator toegevoegd.
- Address Validator toegevoegd.
- Duplicate Validator toegevoegd.

### Persistence Layer

- Persistence Engine toegevoegd.
- Repository Pattern geïmplementeerd.
- Station Repository toegevoegd.
- Nieuwe `stations_v2` databasepipeline gebouwd.
- Insert- en update-mechanisme geïmplementeerd.
- Eerste succesvolle end-to-end persistence uitgevoerd.

### Monitoring

- Metrics Registry geïntegreerd.
- Health Registry geïntegreerd.
- Report Engine uitgebreid.
- Rate Limiter geïntegreerd.

### MAES Network

- MAES Network volledig geïntegreerd in de nieuwe V2-architectuur.
- Uniforme scraper-output geïmplementeerd.
- Volledige validatie vóór opslag.
- Automatische opslag via Persistence Engine.

### Resultaat

- Eerste volledige end-to-end V2-pipeline succesvol afgerond.
- 275 stations succesvol gescrapet.
- 275 records succesvol gevalideerd.
- 275 records succesvol opgeslagen in `stations_v2`.
- 0 databasefouten.
- 0 validatiefouten.
- Nieuwe backend-architectuur operationeel.