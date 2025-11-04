export interface Message<T> {
  value: T;
  key?: string;
  timestamp?: number;
}

export interface Adapter<T> {
  start(handler: (msg: Message<T>) => Promise<void>): Promise<void>;
  stop?(): Promise<void>;
  publish?(payload: T): Promise<void>;
}

/**
 * Generic interface for any Cache storage backend.
 * K = id type (string, number, etc.)
 */
export interface CacheStore<K = string> {
  /**
   * Check if an operation ID was already processed.
   */
  has(key: K): Promise<boolean>;

  /**
   * Mark an operation ID as processed.
   */
  add(key: K): Promise<void>;

  /**
   * Clear all records (for testing or memory stores).
   */
  clear?(): Promise<void>;

  close?(): Promise<void>;
}

export interface CacheRecord {
  key: string;
  createdAt: number;
  expiresAt: number;
}

export interface BatchProcessorOptions<T> {
  adapter: Adapter<T>;
  batchSize: number;
  flushIntervalMs: number;
  maxConcurrency: number;
  Cache?: CacheStore<string>;
  onBatch: (batch: T[]) => Promise<void>;
  onError: (err: Error, batch: T[]) => void;
  maxRetries: number;
  retryDelayMs: number;
  createURL?: string;
  getUniqueID: (msg: Message<T>) => Promise<string>;
}
export interface TemperatureReading {
    sensorId: string;
    value: number;
    timestamp: number;
  }
