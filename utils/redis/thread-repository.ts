import { getRedisClient } from './client';
import { MessageRepository } from './message-repository';

export interface Thread {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

interface RawThreadData {
    id?: string;
    user_id?: string;
    title?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: string | undefined;
}

const THREAD_KEY_PREFIX = 'thread:info:';
const USER_THREADS_PREFIX = 'user:';

export class ThreadRepository {
    private messageRepository: MessageRepository;

    constructor() {
        this.messageRepository = new MessageRepository();
    }

    /**
     * Create a new thread
     */
    async createThread(userId: string, title: string): Promise<Thread> {
        // Use the exact format expected by the assistantUI library
        // Format: thread_03MD9BixtUBRK13thC7t83uN (21 random alphanumeric characters)
        const randomId = Array.from(
            { length: 21 },
            () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[
                Math.floor(Math.random() * 62)
            ]
        ).join('');
        const id = `thread_${randomId}`;

        const now = new Date().toISOString();
        const threadKey = `${THREAD_KEY_PREFIX}${id}`;
        const client = await getRedisClient();

        const thread: Thread = {
            id,
            user_id: userId,
            title,
            created_at: now,
            updated_at: now
        };

        // Store thread in Redis
        await client.hSet(threadKey, {
            id,
            user_id: userId,
            title,
            created_at: now,
            updated_at: now
        });

        // Add to user's threads set
        const userThreadsKey = `${USER_THREADS_PREFIX}${userId}:threads`;
        await client.sAdd(userThreadsKey, id);

        return thread;
    }

    /**
     * Get a thread by ID
     */
    async getThreadById(threadId: string): Promise<Thread | null> {
        const client = await getRedisClient();
        const threadKey = `${THREAD_KEY_PREFIX}${threadId}`;
        const threadData = await client.hGetAll(threadKey) as unknown as RawThreadData;

        if (!threadData || !threadData.id) {
            return null;
        }

        return {
            id: threadData.id,
            user_id: threadData.user_id || '',
            title: threadData.title || '',
            created_at: threadData.created_at || '',
            updated_at: threadData.updated_at || ''
        };
    }

    /**
     * Get threads by user ID
     */
    async getThreadsByUser(userId: string): Promise<Thread[]> {
        const client = await getRedisClient();
        const userThreadsKey = `${USER_THREADS_PREFIX}${userId}:threads`;
        const threadIds = await client.sMembers(userThreadsKey);

        const threads: Thread[] = [];
        for (const threadId of threadIds) {
            const thread = await this.getThreadById(threadId);
            if (thread) {
                threads.push(thread);
            }
        }

        // Sort by updated_at (most recent first)
        return threads.sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }

    /**
     * Update a thread's title
     */
    async updateThreadTitle(threadId: string, title: string): Promise<Thread | null> {
        const client = await getRedisClient();
        const threadKey = `${THREAD_KEY_PREFIX}${threadId}`;
        const threadData = await client.hGetAll(threadKey) as unknown as RawThreadData;

        if (!threadData || !threadData.id) {
            return null;
        }

        const now = new Date().toISOString();

        await client.hSet(threadKey, {
            title,
            updated_at: now
        });

        return {
            id: threadData.id,
            user_id: threadData.user_id || '',
            title,
            created_at: threadData.created_at || '',
            updated_at: now
        };
    }

    /**
     * Delete a thread and all its messages
     */
    async deleteThread(threadId: string): Promise<boolean> {
        const client = await getRedisClient();
        const thread = await this.getThreadById(threadId);

        if (!thread) {
            return false;
        }

        // Get all message IDs for this thread
        const threadMessagesKey = `thread:${threadId}`;
        const messageIds = await client.sMembers(threadMessagesKey);

        // Delete all messages
        for (const messageId of messageIds) {
            await this.messageRepository.deleteMessage(messageId);
        }

        // Remove thread from user's threads set
        const userThreadsKey = `${USER_THREADS_PREFIX}${thread.user_id}:threads`;
        await client.sRem(userThreadsKey, threadId);

        // Delete thread key
        const threadKey = `${THREAD_KEY_PREFIX}${threadId}`;
        await client.del(threadKey);

        // Delete thread messages set
        await client.del(threadMessagesKey);

        return true;
    }
} 