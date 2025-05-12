/**
 * Redis Health Check Utility
 * 
 * Provides functions to check Redis connection health and perform
 * recovery actions if needed.
 */

import { getRedisClient, closeRedisConnection } from './client';

// Keep track of health check status
let lastHealthCheckTime = 0;
let lastHealthCheckStatus = false;
let healthCheckInProgress = false;

/**
 * Checks if Redis connection is healthy by performing a simple write/read operation
 */
export async function checkRedisHealth(): Promise<boolean> {
    // Don't run multiple health checks simultaneously
    if (healthCheckInProgress) {
        return lastHealthCheckStatus;
    }

    // Don't run health checks too frequently (max once every 10 seconds)
    const now = Date.now();
    if (now - lastHealthCheckTime < 10000) {
        return lastHealthCheckStatus;
    }

    healthCheckInProgress = true;
    lastHealthCheckTime = now;

    try {
        console.log('Performing Redis health check...');
        const client = await getRedisClient();

        // Skip health check if client isn't ready
        if (!client.isReady) {
            console.log('Redis client not ready, skipping health check');
            lastHealthCheckStatus = false;
            return false;
        }

        // Try setting and getting a test value
        const testKey = 'health:check:key';
        const testValue = `healthcheck-${new Date().toISOString()}`;

        await client.set(testKey, testValue);
        const retrieved = await client.get(testKey);

        if (retrieved === testValue) {
            console.log('Redis health check passed');
            lastHealthCheckStatus = true;
            return true;
        } else {
            console.warn(`Redis health check failed: expected "${testValue}" but got "${retrieved}"`);
            lastHealthCheckStatus = false;
            return false;
        }
    } catch (error) {
        console.error('Redis health check failed with error:', error);
        lastHealthCheckStatus = false;

        // Try to recover connection
        await recoverRedisConnection();

        return false;
    } finally {
        healthCheckInProgress = false;
    }
}

/**
 * Attempts to recover Redis connection by closing and recreating the client
 */
export async function recoverRedisConnection(): Promise<boolean> {
    try {
        console.log('Attempting to recover Redis connection...');

        // Close existing connection
        await closeRedisConnection();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to establish a new connection
        const client = await getRedisClient();
        const isConnected = client.isReady;

        if (isConnected) {
            console.log('Redis connection recovery successful');
            return true;
        } else {
            console.error('Redis connection recovery failed');
            return false;
        }
    } catch (error) {
        console.error('Redis connection recovery failed:', error);
        return false;
    }
} 