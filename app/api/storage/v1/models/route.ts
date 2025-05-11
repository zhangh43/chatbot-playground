import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/storage/v1/models
 * List available models
 */
export async function GET() {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return a sample list of models
        return NextResponse.json({
            data: [
                {
                    id: 'gpt-4',
                    created_at: new Date().toISOString(),
                    name: 'GPT-4'
                },
                {
                    id: 'gpt-3.5-turbo',
                    created_at: new Date().toISOString(),
                    name: 'GPT-3.5 Turbo'
                }
            ]
        });
    } catch (error) {
        console.error('Error listing models:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 