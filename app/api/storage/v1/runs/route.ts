import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/storage/v1/runs
 * List all runs (empty for now)
 */
export async function GET() {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return empty data for now
        return NextResponse.json({ data: [] });
    } catch (error) {
        console.error('Error in runs endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/storage/v1/runs
 * Create a new run
 */
export async function POST(request: Request) {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse the request body
        const body = await request.json();

        // Return a dummy run ID
        return NextResponse.json({
            id: `run_${crypto.randomUUID().replace(/-/g, '')}`,
            status: 'completed'
        });
    } catch (error) {
        console.error('Error creating run:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 