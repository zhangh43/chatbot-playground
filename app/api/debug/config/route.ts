import { NextResponse } from 'next/server';

// This endpoint is for debugging environment variables
// IMPORTANT: REMOVE THIS IN PRODUCTION!
export async function GET() {
    const config = {
        // General config
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        basePath: process.env.NEXT_PUBLIC_BASE_PATH,

        // Memobase config (masked for security)
        memobaseUrl: process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL ?
            `*****${process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL.slice(-10)}` : 'not-set',
        memobaseApiKey: process.env.NEXT_PUBLIC_MEMOBASE_API_KEY ?
            `*****${process.env.NEXT_PUBLIC_MEMOBASE_API_KEY.slice(-8)}` : 'not-set',

        // Environment
        nodeEnv: process.env.NODE_ENV,

        // Headers that would be present
        corsHeaders: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    };

    return NextResponse.json(config);
} 