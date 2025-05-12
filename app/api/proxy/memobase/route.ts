import { NextRequest, NextResponse } from 'next/server';

// This endpoint proxies requests to Memobase to avoid CORS issues
export async function POST(req: NextRequest) {
    try {
        console.log('Memobase proxy endpoint called');

        const url = process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL;
        const apiKey = process.env.NEXT_PUBLIC_MEMOBASE_API_KEY;

        if (!url || !apiKey) {
            console.error('Missing Memobase configuration:', { url: !!url, apiKey: !!apiKey });
            return NextResponse.json(
                { error: 'Memobase configuration is missing' },
                { status: 500 }
            );
        }

        // Get the request body
        const body = await req.json();
        console.log('Proxying request to Memobase:', { endpoint: body.endpoint });

        // Forward the request to Memobase
        const response = await fetch(`${url}${body.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...body.headers
            },
            body: JSON.stringify(body.data || {})
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Memobase API error:', {
                status: response.status,
                statusText: response.statusText,
                errorText
            });
            return NextResponse.json(
                { error: 'Memobase API error', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Error in Memobase proxy:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 