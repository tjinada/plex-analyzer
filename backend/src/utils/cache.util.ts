import { config } from '../config';

class CacheUtil {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  /**
   * Set a value in the cache with TTL
   */
  set(key: string, value: any, ttl?: number): void {
    if (!config.cacheEnabled) {
      return;
    }

    const expiry = Date.now() + (ttl || config.cacheTtl);
    this.cache.set(key, { data: value, expiry });
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    if (!config.cacheEnabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) {
      return false;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const cache = new CacheUtil();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);