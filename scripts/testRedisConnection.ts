/**
 * Test script for Redis connection
 * 
 * This script attempts to connect to Redis using the configured credentials
 * and performs a simple set/get operation to verify functionality.
 * 
 * Usage:
 *   npx tsx scripts/testRedisConnection.ts
 */

import dotenv from 'dotenv';
import { getRedisClient, closeRedisConnection } from '../utils/redis/client';

// Load environment variables
dotenv.config();

async function testRedisConnection() {
    console.log('Testing Redis connection...');
    console.log(`Host: ${process.env.REDIS_HOST}`);
    console.log(`Port: ${process.env.REDIS_PORT}`);
    console.log(`Username: ${process.env.REDIS_USERNAME}`);
    console.log(`Password: ${process.env.REDIS_PASSWORD ? '******' : 'not set'}`);

    try {
        const client = await getRedisClient();

        // Test simple operations
        console.log('Setting test key...');
        await client.set('test-key', 'Hello from Memobase!');

        console.log('Getting test key...');
        const value = await client.get('test-key');

        console.log('Test key value:', value);

        if (value === 'Hello from Memobase!') {
            console.log('✅ Redis connection test passed!');
        } else {
            console.log('❌ Redis connection test failed: Unexpected value');
        }
    } catch (error) {
        console.error('❌ Redis connection test failed with error:', error);
    } finally {
        await closeRedisConnection();
    }
}

// Run the test
testRedisConnection().catch(console.error); 