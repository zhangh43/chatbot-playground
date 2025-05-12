import { Suspense } from "react";
import ConnectivityTester from "@/components/diagnostics/connectivity-tester";

export default function DiagnosticsPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">System Diagnostics</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">API Connectivity Tests</h2>
                <Suspense fallback={<div>Loading connectivity tester...</div>}>
                    <ConnectivityTester />
                </Suspense>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
                <div className="bg-gray-100 p-4 rounded-md">
                    <p className="mb-2"><strong>Base Path:</strong> {process.env.NEXT_PUBLIC_BASE_PATH || '/'}</p>
                    <p className="mb-2"><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
                    <p className="mb-2"><strong>Memobase Configured:</strong> {process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL ? 'Yes' : 'No'}</p>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
                <ul className="list-disc list-inside space-y-2">
                    <li>Check that your <code>.env</code> file contains the correct Memobase credentials</li>
                    <li>Ensure Redis server is running and accessible (if using Redis)</li>
                    <li>Look at the server logs for any connection errors</li>
                    <li>Try restarting the development server with <code>npm run dev</code></li>
                    <li>Verify network connectivity to external services</li>
                </ul>
            </div>

            <div className="mt-8 text-sm text-gray-500">
                <p>Browser Info: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side rendering'}</p>
            </div>
        </div>
    );
} 