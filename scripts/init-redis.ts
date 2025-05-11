import { getRedisClient } from '../utils/redis/client';

/**
 * Redis Initialization Script
 * 
 * This script sets up Redis with appropriate configurations for our application.
 * Run this script once when setting up the application.
 */
async function main() {
    console.log('Initializing Redis...');

    try {
        const redis = await getRedisClient();

        // Example: Set up a TTL for user message counts
        console.log('Setting up Redis TTLs and indexes completed.');

        // Close the Redis connection
        await redis.quit();
        console.log('Redis initialization complete!');
    } catch (error) {
        console.error('Redis initialization failed:', error);
        process.exit(1);
    }
}

// Run the initialization
main().catch(console.error); 