import PersistenceResult from "./PersistenceResult.js";
import StationRepository from "../repositories/StationRepository.js";

class PersistenceEngine {
  async save(records) {
    const started = Date.now();

    const result = new PersistenceResult();

    result.received = records.length;

    for (const record of records) {
      try {
        const action = await StationRepository.upsert(record);

        if (action === "inserted") {
          result.inserted++;
        } else {
          result.updated++;
        }
      } catch (err) {
        console.error("DATABASE ERROR:", err);

        result.errors.push(err.message);
      }
    }

    result.duration = Date.now() - started;

    return result;
  }
}

export default new PersistenceEngine();
