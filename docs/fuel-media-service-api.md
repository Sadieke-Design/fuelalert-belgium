# Fuel Media Service API

## Status

**Status:** Awaiting response from Fuel Media Service.

An information request has been sent requesting access to the commercial Fuel Media Service API.

Current status:
- ⏳ Waiting for technical documentation
- ⏳ Waiting for pricing information
- ⏳ Waiting for licensing conditions
- ⏳ Waiting for API access details

---

## Purpose

Fuel Media Service is being evaluated as a potential official data source for FuelAlert Belgium.

If approved, the API may provide:

- Fuel station information
- Fuel prices
- Station metadata
- Additional commercial datasets

---

## Planned Integration

The Fuel Media Service API will be integrated as one of multiple supported data sources.

FuelAlert follows a hybrid architecture:

Priority:
1. Official APIs
2. Internal scrapers
3. Commercial data providers

---

## Current Architecture

The backend has been designed so that each fuel price can be linked to its origin.

Example:

- source_type
- source_name
- confidence
- updated_at

This allows multiple providers to coexist without changing the database structure.

---

## TODO

- Receive API documentation
- Review endpoints
- Review authentication
- Evaluate licensing
- Evaluate pricing
- Design integration layer
- Implement connector
- Add automated tests

---

## Notes

No implementation work will begin until official documentation and licensing information have been received from Fuel Media Service.