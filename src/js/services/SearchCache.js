/**
 * SearchCache Service
 * Caches search results to reduce API calls and improve performance
 */

import { CONFIG } from '../config.js';

export class SearchCache {
  constructor(maxAge = CONFIG.CACHE_DURATION) {
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  getCacheKey(query, page, filters) {
    return JSON.stringify({ query, page, ...filters });
  }

  get(query, page, filters) {
    const key = this.getCacheKey(query, page, filters);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      console.log('Cache hit for:', key);
      return cached.data;
    }

    this.cache.delete(key);
    return null;
  }

  set(query, page, filters, data) {
    const key = this.getCacheKey(query, page, filters);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }
}

export default SearchCache;
