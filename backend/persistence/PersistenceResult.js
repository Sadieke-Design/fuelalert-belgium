class PersistenceResult {
  constructor() {
    this.received = 0;
    this.inserted = 0;
    this.updated = 0;
    this.skipped = 0;
    this.duplicates = 0;
    this.errors = [];
    this.duration = 0;
  }
}

export default PersistenceResult;
