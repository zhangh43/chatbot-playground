import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MessageRepository } from '@/utils/redis/message-repository';

/**
 * GET /api/storage/v1/messages/count
 * Get the number of messages for rate limiting
 */
export async function GET() {
    try {
        // Get user from Supabase
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            console.error("Error retrieving user in message count endpoint:", error.message);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!data.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = data.user.id;

        try {
            // Get message count from Redis (if available)
            const messageRepo = new MessageRepository();
            // You can implement this to get actual counts if needed
            const count = 0; // Default to 0 for now

            return NextResponse.json(count);
        } catch (countError) {
            console.error("Error retrieving message count:", countError);
            // Return 0 if there's an error retrieving the count
            return NextResponse.json(0);
        }
    } catch (error) {
        console.error('Error in messages count endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 