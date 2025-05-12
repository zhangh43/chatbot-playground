import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Testing Memobase connectivity from server side');

        const url = process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL;
        const apiKey = process.env.NEXT_PUBLIC_MEMOBASE_API_KEY;

        if (!url || !apiKey) {
            console.error('Missing Memobase configuration:', { url: !!url, apiKey: !!apiKey });
            return NextResponse.json({
                success: false,
                error: 'Missing Memobase configuration',
                config: {
                    urlConfigured: !!url,
                    apiKeyConfigured: !!apiKey,
                }
            });
        }

        // Try a simple health check or equivalent request to Memobase
        // Adjust the endpoint based on what's available in Memobase
        const testResponse = await fetch(`${url}/health`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        const responseData = {
            success: testResponse.ok,
            status: testResponse.status,
            statusText: testResponse.statusText,
        };

        if (!testResponse.ok) {
            try {
                const errorText = await testResponse.text();
                console.error('Memobase test error:', {
                    ...responseData,
                    error: errorText
                });

                return NextResponse.json({
                    ...responseData,
                    error: errorText
                });
            } catch (e) {
                return NextResponse.json({
                    ...responseData,
                    error: 'Could not read error response'
                });
            }
        }

        try {
            const data = await testResponse.json();
            return NextResponse.json({
                ...responseData,
                data
            });
        } catch (e) {
            return NextResponse.json({
                ...responseData,
                data: 'Response was not JSON'
            });
        }
    } catch (error: any) {
        console.error('Error testing Memobase connection:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 