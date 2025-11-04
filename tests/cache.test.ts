import { RedisCacheStore, InMemoryCacheStore } from "../src/lib/cache";
import { DEFAULT_CONFIG } from "../src/lib/config";
import { createClient } from 'redis';

 // Mock redis client
    jest.mock('redis', () => ({
      createClient: jest.fn()
    }));
      // Mock RedisClientType behavior
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    const mockExists = jest.fn();
    const mockSet = jest.fn();
    (createClient as jest.Mock).mockReturnValue({
      connect: mockConnect,
      exists: mockExists,
      set: mockSet,
    });

describe("CacheStore", () => {
  test("MemoryCacheStore: adds and checks keys", async () => {
    const store = new InMemoryCacheStore();
    expect(await store.has("key1")).toBe(false);
    await store.add("key1");
    expect(await store.has("key1")).toBe(true);
  });

  test("MemoryCacheStore: TTL expires key", async () => {
    const store = new InMemoryCacheStore(3);
    await store.add("temp");
    expect(await store.has("temp")).toBe(true);
    await new Promise(r => setTimeout(r, 4000));
    expect(await store.has("temp")).toBe(false);
  });

  test("RedisCacheStore: mock basic behavior", async () => {
    const store = new RedisCacheStore({ url: DEFAULT_CONFIG.DEFAULT_REDIS_URL });

    expect(createClient).toHaveBeenCalledWith({ url: DEFAULT_CONFIG.DEFAULT_REDIS_URL });
    expect(mockConnect).toHaveBeenCalledTimes(1);
    await store.add("a");
    await store.has("a");
    expect(mockSet).toHaveBeenCalled();
    expect(mockExists).toHaveBeenCalledWith(`${DEFAULT_CONFIG.DEFAUL_REDIS_PREFIX}a`);
  });
});
