import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MessageRepository } from '@/utils/redis/message-repository';

/**
 * GET /api/storage/v1/messages
 * List all messages (returns empty array for now)
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
        console.error('Error in messages endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/storage/v1/messages
 * Create a new message (returns dummy data)
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

        // Return a dummy message ID
        return NextResponse.json({
            id: `msg_${crypto.randomUUID().replace(/-/g, '')}`
        });
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 