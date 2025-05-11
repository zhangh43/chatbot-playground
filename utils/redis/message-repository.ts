import { getRedisClient } from './client';
import { parseMessageContent } from './message-parser';
import { ValidMessage } from '../message-validation';

export interface Message {
    id: string;
    thread_id: string;
    user_id: string;
    created_at: string;
    content: ValidMessage | any;
    parent_id: string | null;
}

// Type for raw message data from Redis
interface RawMessageData {
    id?: string;
    thread_id?: string;
    user_id?: string;
    created_at?: string;
    content?: string | any;
    parent_id?: string;
    [key: string]: string | undefined;
}

const MESSAGE_KEY_PREFIX = 'message:';
const THREAD_MESSAGE_KEY_PREFIX = 'thread:';

export class MessageRepository {
    /**
     * Create a new message
     */
    async createMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
        // Use the exact format expected by the assistantUI library
        // Format: msg_0B22qcfrLaZGd9DW79RSu7zJ (22 random alphanumeric characters)
        const randomId = Array.from(
            { length: 22 },
            () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[
                Math.floor(Math.random() * 62)
            ]
        ).join('');
        const id = `msg_${randomId}`;

        const created_at = new Date().toISOString();
        const messageKey = `${MESSAGE_KEY_PREFIX}${id}`;
        const client = await getRedisClient();

        // We need to ensure the content is serializable
        let contentToStore = messageData.content;
        if (typeof contentToStore === 'object' && contentToStore !== null) {
            contentToStore = JSON.stringify(contentToStore);
        }

        const parent_id = messageData.parent_id || null;

        await client.hSet(messageKey, {
            id,
            thread_id: messageData.thread_id,
            user_id: messageData.user_id,
            created_at,
            content: contentToStore,
            parent_id: parent_id?.toString() || "null"
        });

        // Add to thread index
        const threadKey = `${THREAD_MESSAGE_KEY_PREFIX}${messageData.thread_id}`;
        await client.sAdd(threadKey, id);

        return {
            id,
            thread_id: messageData.thread_id,
            user_id: messageData.user_id,
            created_at,
            content: messageData.content,
            parent_id
        };
    }

    /**
     * Get messages by thread ID and optionally for a specific user
     */
    async getMessagesByThreadAndUser(thread_id: string, user_id?: string): Promise<Message[]> {
        const client = await getRedisClient();
        const threadKey = `${THREAD_MESSAGE_KEY_PREFIX}${thread_id}`;
        const messageIds = await client.sMembers(threadKey);

        const messages: Message[] = [];

        for (const id of messageIds) {
            const messageKey = `${MESSAGE_KEY_PREFIX}${id}`;
            const messageData = await client.hGetAll(messageKey) as unknown as RawMessageData;

            if (!messageData || !messageData.id) continue;

            // Filter by user_id if provided
            if (user_id && messageData.user_id !== user_id) continue;

            // Parse the content appropriately
            const parsedContent = parseMessageContent(messageData.content);

            // Handle parent_id correctly (convert "null" string to null)
            const parent_id = messageData.parent_id === "null" || !messageData.parent_id ? null : messageData.parent_id;

            messages.push({
                id: messageData.id,
                thread_id: messageData.thread_id || '',
                user_id: messageData.user_id || '',
                created_at: messageData.created_at || new Date().toISOString(),
                content: parsedContent,
                parent_id
            });
        }

        // Sort by created_at
        return messages.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }

    /**
     * Delete a message by ID
     */
    async deleteMessage(id: string): Promise<void> {
        const client = await getRedisClient();
        const messageKey = `${MESSAGE_KEY_PREFIX}${id}`;
        const messageData = await client.hGetAll(messageKey) as unknown as RawMessageData;

        if (messageData && messageData.thread_id) {
            const threadKey = `${THREAD_MESSAGE_KEY_PREFIX}${messageData.thread_id}`;
            await client.sRem(threadKey, id);
        }

        await client.del(messageKey);
    }
} 