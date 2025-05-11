import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/storage/v1/files
 * List files
 */
export async function GET() {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return empty list
        return NextResponse.json({ data: [] });
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/storage/v1/files
 * Upload a file
 */
export async function POST(request: Request) {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return a dummy file ID
        return NextResponse.json({
            id: `file_${crypto.randomUUID().replace(/-/g, '')}`,
            created_at: new Date().toISOString(),
            filename: 'dummy-file.txt',
            bytes: 0,
            purpose: 'assistants',
            status: 'processed'
        });
    } catch (error) {
        console.error('Error creating file:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 