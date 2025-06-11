export {}

const GLOBAL_TTL = 3000; // 3s
interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

type CacheStore<K, V> = Map<K, CacheEntry<V>>;

interface EvictionPolicy<K, V> {
  evict(): K | undefined;
  onAccess?(key: K, entry: CacheEntry<V>): void;
  onSet?(key: K, entry: CacheEntry<V>): void;
}

class LruEvictionPolicy<K, V> implements EvictionPolicy<K, V> {
  constructor(private cacheStore: CacheStore<K, V>) {}

  evict(): K | undefined {
    return this.cacheStore.size ? this.cacheStore.keys().next().value : undefined;
  }

  onAccess?(key: K, entry: CacheEntry<V>): void {
    const cacheEntry = this.cacheStore.get(key);
    if (cacheEntry) {
      this.cacheStore.delete(key);
      this.cacheStore.set(key, entry);
    }
  }

  onSet?(key: K, entry: CacheEntry<V>): void {
    if (this.cacheStore.has(key)) {
      const existingEntry = this.cacheStore.get(key)!;
      this.cacheStore.delete(key);
      this.cacheStore.set(key, { ...existingEntry, ...entry });
    }
  }
}

class Cache<K, V> {
  private maxSize: number;
  private evictionPolicy: EvictionPolicy<K, V>;
  private store: CacheStore<K, V>;

  constructor(
    maxSize: number,
    evictionPolicy: EvictionPolicy<K, V>,
    store?: CacheStore<K, V>
  ) {
    this.maxSize = maxSize;
    this.evictionPolicy = evictionPolicy;
    this.store = store ?? new Map<K, CacheEntry<V>>();
  }

  public get(key: K): V | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    if (this.evictionPolicy.onAccess) {
      this.evictionPolicy.onAccess(key, entry);
    }

    return entry.value;
  }

  public set(key: K, value: V): void {
    const existingEntry = this.store.get(key);

    const expiresAt = Date.now() + GLOBAL_TTL;

    if (existingEntry) {
      existingEntry.value = value;
      existingEntry.expiresAt = expiresAt;

      if (this.evictionPolicy.onSet) {
        this.evictionPolicy.onSet(key, existingEntry);
      }
      return;
    }

    if (this.isFull()) {
      const keyToEvict = this.evictionPolicy.evict();
      if (keyToEvict) {
        this.delete(keyToEvict);
      } else {
        console.warn('Cache items cannot be deleted');
      }
    }

    const newEntry: CacheEntry<V> = { value, expiresAt };
    this.store.set(key, newEntry);

    if (this.evictionPolicy.onSet) {
      this.evictionPolicy.onSet(key, newEntry);
    }
  }

  public delete(key: K): boolean {
    const deleted = this.store.delete(key);

    return deleted;
  }

  public isFull() {
    return this.store.size >= this.maxSize;
  }
}

// Driver code
const cacheStore = new Map<string, CacheEntry<number>>();
const lruPolicy = new LruEvictionPolicy<string, number>(cacheStore);
const cache = new Cache<string, number>(3, lruPolicy, cacheStore);

console.log("Setting values...");
cache.set("a", 1); // cache: { a }
cache.set("b", 2); // cache: { a, b }
cache.set("c", 3); // cache: { a, b, c }

console.log("Current Cache Store:", Array.from(cacheStore.entries()));

console.log("Accessing 'a' to make it most recently used");
cache.get("a"); // LRU becomes b

console.log("Adding 'd' to trigger eviction");
cache.set("d", 4); // 'b' should be evicted

console.log("Cache Store after eviction:", Array.from(cacheStore.entries()));

console.log("Getting 'b':", cache.get("b")); // undefined, was evicted
console.log("Getting 'a':", cache.get("a")); // should return 1
console.log("Getting 'd':", cache.get("d")); // should return 4

setTimeout(() => {
  console.log("After TTL expires...");
  console.log("Getting 'a':", cache.get("a")); // expired
  console.log("Getting 'c':", cache.get("c")); // expired
  console.log("Getting 'd':", cache.get("d")); // expired
}, GLOBAL_TTL + 100);
