class CacheManager {
  constructor(duration = 30) {
    this.cache = new Map();
    this.cacheDuration = duration * 60 * 1000; // Convert minutes to milliseconds
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

module.exports = new CacheManager(process.env.CACHE_DURATION || 10);
