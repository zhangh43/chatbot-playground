/**
 * Migration script to move data from Supabase to Redis
 * 
 * This script fetches all threads and messages from Supabase and populates them in Redis
 * using the same data structure defined in the Redis storage implementation.
 * 
 * Usage: 
 *   npm run migrate-to-redis
 * 
 * Make sure both Supabase and Redis environment variables are set in .env
 */

import dotenv from 'dotenv';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getRedisClient, closeRedisConnection } from '../utils/redis/client';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or key not found in environment variables');
    process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function migrateThreads() {
    console.log('Fetching users...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    const redisClient = await getRedisClient();
    let threadCount = 0;
    let messageCount = 0;

    for (const user of users.users) {
        console.log(`Migrating data for user: ${user.email} (${user.id})`);

        // Fetch threads for user
        const { data: threadData, error: threadError } = await supabase
            .rpc('get_threads_for_user', { uid: user.id });

        if (threadError) {
            console.error(`Error fetching threads for user ${user.id}:`, threadError);
            continue;
        }

        if (!threadData?.threads || !Array.isArray(threadData.threads)) {
            console.log(`No threads found for user ${user.id}`);
            continue;
        }

        const userThreadsKey = `user:threads:${user.id}`;

        for (const thread of threadData.threads) {
            threadCount++;
            console.log(`Migrating thread: ${thread.id}`);

            // Store thread in Redis
            const threadKey = `thread:${thread.id}`;
            await redisClient.hSet(threadKey, {
                id: thread.id,
                workspace_id: thread.workspace_id || 'workspace',
                created_by: thread.created_by,
                updated_by: thread.updated_by,
                title: thread.title || '',
                is_archived: thread.is_archived ? 'true' : 'false',
                external_id: thread.external_id || '',
                metadata: thread.metadata ? JSON.stringify(thread.metadata) : '',
                created_at: new Date(thread.created_at).toISOString(),
                updated_at: new Date(thread.updated_at).toISOString(),
                last_message_at: thread.last_message_at ? new Date(thread.last_message_at).toISOString() : ''
            });

            // Add thread to user's thread set
            await redisClient.sAdd(userThreadsKey, thread.id);

            // Fetch messages for this thread
            const { data: messageData, error: messageError } = await supabase
                .rpc('get_messages_by_thread_and_user', {
                    tid: thread.id,
                    uid: user.id
                });

            if (messageError) {
                console.error(`Error fetching messages for thread ${thread.id}:`, messageError);
                continue;
            }

            if (!messageData?.messages || !Array.isArray(messageData.messages)) {
                console.log(`No messages found for thread ${thread.id}`);
                continue;
            }

            const threadMessagesKey = `thread:messages:${thread.id}`;

            for (const message of messageData.messages) {
                messageCount++;

                // Store message in Redis
                const messageKey = `message:${message.id}`;

                // Serialize content if it's an object
                let contentStr = message.content;
                if (typeof contentStr === 'object') {
                    contentStr = JSON.stringify(contentStr);
                }

                await redisClient.hSet(messageKey, {
                    id: message.id,
                    parent_id: message.parent_id || '',
                    thread_id: message.thread_id,
                    created_by: message.created_by,
                    updated_by: message.updated_by,
                    format: message.format,
                    content: contentStr,
                    height: message.height?.toString() || '',
                    created_at: new Date(message.created_at).toISOString(),
                    updated_at: new Date(message.updated_at).toISOString()
                });

                // Add message to thread's message set
                await redisClient.sAdd(threadMessagesKey, message.id);
            }

            console.log(`Migrated ${messageData.messages.length} messages for thread ${thread.id}`);
        }

        console.log(`Migrated ${threadData.threads.length} threads for user ${user.id}`);
    }

    console.log(`Migration complete. Migrated ${threadCount} threads and ${messageCount} messages.`);
}

(async () => {
    try {
        console.log('Starting migration from Supabase to Redis...');
        await migrateThreads();
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeRedisConnection();
        console.log('Migration script completed.');
    }
})(); 