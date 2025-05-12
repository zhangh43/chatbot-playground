import { NextResponse } from 'next/server';
import { getRedisClient } from '@/utils/redis/client';

export const dynamic = 'force-dynamic';

/**
 * Redis health check endpoint
 * 
 * Checks if Redis is connectable and responds properly
 */
export async function GET() {
    try {
        const client = await getRedisClient();

        // Try setting and getting a test value
        const testKey = 'health:check:key';
        const testValue = `healthcheck-${new Date().toISOString()}`;

        await client.set(testKey, testValue);
        const retrieved = await client.get(testKey);

        if (retrieved === testValue) {
            return NextResponse.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                message: 'Redis connection is working properly'
            }, { status: 200 });
        } else {
            return NextResponse.json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                message: 'Redis data integrity check failed',
                details: `Expected "${testValue}" but got "${retrieved}"`
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Redis health check failed:', error);
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            message: 'Redis connection failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 