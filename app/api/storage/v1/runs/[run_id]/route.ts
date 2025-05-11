import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/storage/v1/runs/[run_id]
 * Get a specific run by ID
 */
export async function GET(
    request: Request,
    { params }: { params: { run_id: string } }
) {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const runId = params.run_id;

        // Return a dummy run
        return NextResponse.json({
            id: runId,
            status: 'completed',
            created_at: new Date().toISOString(),
            thread_id: `thread_${'0'.repeat(21)}`,
            assistant_id: null,
            model: null,
            instructions: null,
            tools: [],
            metadata: {},
            usage: null,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting run:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 