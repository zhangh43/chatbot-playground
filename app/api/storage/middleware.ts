import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth } from '@/utils/redis/healthCheck';

/**
 * Storage API middleware
 * 
 * Ensures Redis connection is healthy before processing API requests
 */
export async function middleware(request: NextRequest) {
    // Only check health for non-health-check endpoints
    if (!request.nextUrl.pathname.includes('/api/health')) {
        try {
            // Check if Redis is healthy
            const isHealthy = await checkRedisHealth();

            if (!isHealthy) {
                console.warn('Redis health check failed in middleware');
                return NextResponse.json(
                    {
                        error: 'Service temporarily unavailable, Redis connection issues',
                        message: 'Please try again in a few moments'
                    },
                    { status: 503 }
                );
            }
        } catch (error) {
            console.error('Error in Redis health middleware:', error);
            return NextResponse.json(
                {
                    error: 'Service temporarily unavailable',
                    message: 'Internal server error, please try again later'
                },
                { status: 503 }
            );
        }
    }

    return NextResponse.next();
}

// Configure which paths this middleware runs on
export const config = {
    matcher: ['/api/storage/:path*'],
}; 