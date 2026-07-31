class CapabilityRegistry {
  constructor() {
    this.sources = new Map();
  }

  register(name, capabilities) {
    this.sources.set(name, capabilities);
  }

  get(name) {
    return this.sources.get(name);
  }

  has(name) {
    return this.sources.has(name);
  }

  all() {
    return [...this.sources.entries()].map(([name, capabilities]) => ({
      name,
      capabilities,
    }));
  }
}

const registry = new CapabilityRegistry();

export default registry;
