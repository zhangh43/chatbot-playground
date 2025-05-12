'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type TestResult = {
    endpoint: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    details?: Record<string, unknown>;
    timestamp: Date;
};

export default function ConnectivityTester() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const runTests = async () => {
        setIsLoading(true);
        setResults([]);

        // Test endpoints
        await testEndpoint('/api/debug/config', 'GET', 'Environment Config');
        await testEndpoint('/api/debug/memobase-test', 'GET', 'Memobase Connection');
        await testEndpoint('/api/health/redis', 'GET', 'Redis Connection');

        setIsLoading(false);
    };

    const testEndpoint = async (endpoint: string, method: string, name: string) => {
        const newResult: TestResult = {
            endpoint: name,
            status: 'pending',
            message: `Testing ${name}...`,
            timestamp: new Date()
        };

        setResults(prev => [...prev, newResult]);

        try {
            console.log(`Testing endpoint: ${endpoint}`);
            const response = await fetch(endpoint, { method });
            const data = await response.json();

            setResults(prev => prev.map(r =>
                r.endpoint === name ? {
                    ...r,
                    status: response.ok ? 'success' : 'error',
                    message: response.ok ? 'Connection successful' : `Error: ${response.status} ${response.statusText}`,
                    details: data,
                    timestamp: new Date()
                } : r
            ));
        } catch (error: unknown) {
            console.error(`Error testing ${name}:`, error);
            setResults(prev => prev.map(r =>
                r.endpoint === name ? {
                    ...r,
                    status: 'error',
                    message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
                    timestamp: new Date()
                } : r
            ));
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>API Connectivity Diagnostics</CardTitle>
                <CardDescription>
                    Test connectivity to various API endpoints to diagnose issues
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {results.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No tests run yet. Click the button below to start testing.
                        </div>
                    ) : (
                        results.map((result, index) => (
                            <div key={index} className="border rounded-md p-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium">{result.endpoint}</h3>
                                    <span className={`px-2 py-1 rounded text-sm ${result.status === 'success' ? 'bg-green-100 text-green-800' :
                                        result.status === 'error' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {result.status === 'success' ? 'Success' :
                                            result.status === 'error' ? 'Failed' : 'Testing...'}
                                    </span>
                                </div>
                                <p className="text-sm mt-2">{result.message}</p>
                                {result.details && (
                                    <details className="mt-2">
                                        <summary className="text-sm text-blue-500 cursor-pointer">
                                            View Details
                                        </summary>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                            {JSON.stringify(result.details, null, 2)}
                                        </pre>
                                    </details>
                                )}
                                <div className="text-xs text-gray-500 mt-2">
                                    {result.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={runTests}
                    disabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? 'Testing...' : 'Run Connectivity Tests'}
                </Button>
            </CardFooter>
        </Card>
    );
} 