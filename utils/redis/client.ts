import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize connection
redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));

let isConnected = false;

// Get or create Redis client instance
async function getRedisClient() {
    if (!isConnected) {
        await redisClient.connect();
        isConnected = true;
    }
    return redisClient;
}

/**
 * Set one value within a hash
 */
export async function setSingleHashField(key: string, field: string, value: any): Promise<number> {
    const client = await getRedisClient();
    const stringValue = stringifyValue(value);
    return client.hSet(key, field, stringValue);
}

/**
 * Set multiple hash fields one by one to avoid type issues
 */
export async function setHashFields(key: string, obj: Record<string, any>): Promise<number> {
    const client = await getRedisClient();
    let totalSet = 0;

    for (const [field, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        const stringValue = stringifyValue(value);
        const result = await client.hSet(key, field, stringValue);
        totalSet += result;
    }

    return totalSet;
}

/**
 * Add to sorted set
 */
export async function addToSortedSet(key: string, score: number, value: string): Promise<number> {
    const client = await getRedisClient();
    return client.zAdd(key, [{ score, value }]);
}

/**
 * Increment and set expiry
 */
export async function incrementWithExpiry(key: string, seconds: number): Promise<number> {
    const client = await getRedisClient();
    const value = await client.incr(key);
    await client.expire(key, seconds);
    return value;
}

/**
 * Convert any value to string
 */
function stringifyValue(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

export { getRedisClient }; 