import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

// Define Redis connection options
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client
export async function getRedisClient() {
    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        redisClient.on('error', (error) => {
            console.error('Redis Client Error:', error);
        });

        await redisClient.connect();
    }

    return redisClient;
}

// Helper function to generate UUIDs
export function generateUUID() {
    return uuidv4();
}

// Close Redis connection
export async function closeRedisConnection() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
} 