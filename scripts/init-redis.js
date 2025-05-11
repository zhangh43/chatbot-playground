// Redis Initialization Script
const redis = require('redis');

async function main() {
    console.log('Initializing Redis...');

    try {
        // Create Redis client
        const client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        // Connect to Redis
        await client.connect();

        console.log('Connected to Redis, setting up indexes and configuration...');

        // You can add initialization logic here if needed
        // For example, create indices for your data structures

        // Close the Redis connection
        await client.quit();
        console.log('Redis initialization complete!');
    } catch (error) {
        console.error('Redis initialization failed:', error);
        process.exit(1);
    }
}

// Run the initialization
main().catch(console.error); 