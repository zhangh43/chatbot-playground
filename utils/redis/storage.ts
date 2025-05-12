import { getRedisClient, generateUUID } from './client';

// Key prefixes for Redis
const THREAD_PREFIX = 'thread:';
const MESSAGE_PREFIX = 'message:';
const USER_THREADS_PREFIX = 'user:threads:';

// Interfaces
interface Thread {
    id: string;
    workspace_id: string;
    created_by: string;
    updated_by: string;
    title: string;
    is_archived: boolean;
    external_id?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    last_message_at?: string;
}

interface Message {
    id: string;
    parent_id?: string;
    thread_id: string;
    created_by: string;
    updated_by: string;
    format: string;
    content: any;
    height?: number;
    created_at: string;
    updated_at: string;
}

// Thread Functions
export async function getThreadsForUser(uid: string) {
    const client = await getRedisClient();

    // Get all thread IDs for the user
    const userThreadsKey = `${USER_THREADS_PREFIX}${uid}`;
    const threadIds = await client.sMembers(userThreadsKey);

    if (!threadIds || threadIds.length === 0) {
        return { threads: [] };
    }

    // Get thread details for each ID
    const threads: Thread[] = [];
    for (const threadId of threadIds) {
        const threadKey = `${THREAD_PREFIX}${threadId}`;
        const threadData = await client.hGetAll(threadKey);

        if (threadData && Object.keys(threadData).length > 0) {
            // Parse JSON fields if needed
            const metadata = threadData.metadata ? JSON.parse(threadData.metadata) : undefined;

            // Convert boolean string to actual boolean
            const isArchived = threadData.is_archived === 'true';

            if (!isArchived) {
                threads.push({
                    id: threadId,
                    workspace_id: threadData.workspace_id,
                    created_by: threadData.created_by,
                    updated_by: threadData.updated_by,
                    title: threadData.title || '',
                    is_archived: isArchived,
                    external_id: threadData.external_id,
                    metadata: metadata,
                    created_at: threadData.created_at,
                    updated_at: threadData.updated_at,
                    last_message_at: threadData.last_message_at
                });
            }
        }
    }

    // Sort threads by created_at in descending order
    threads.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { threads };
}

export async function createThread(uid: string, lastMessageAt: string) {
    const client = await getRedisClient();
    const threadId = generateUUID();
    const now = new Date().toISOString();

    // Create thread hash
    const threadKey = `${THREAD_PREFIX}${threadId}`;
    await client.hSet(threadKey, {
        id: threadId,
        workspace_id: 'workspace',
        created_by: uid,
        updated_by: uid,
        title: '',
        is_archived: 'false',
        created_at: now,
        updated_at: now,
        last_message_at: lastMessageAt || now
    });

    // Add thread to user's thread set
    const userThreadsKey = `${USER_THREADS_PREFIX}${uid}`;
    await client.sAdd(userThreadsKey, threadId);

    return { thread_id: threadId };
}

export async function updateThreadArchived(uid: string, threadId: string, archived: boolean) {
    const client = await getRedisClient();
    const threadKey = `${THREAD_PREFIX}${threadId}`;

    // Check if thread exists and belongs to the user
    const createdBy = await client.hGet(threadKey, 'created_by');
    if (!createdBy || createdBy !== uid) {
        throw new Error('Thread not found or access denied');
    }

    // Update thread
    await client.hSet(threadKey, {
        is_archived: archived.toString(),
        updated_by: uid,
        updated_at: new Date().toISOString()
    });

    return {};
}

// Message Functions
export async function getMessagesByThreadAndUser(uid: string, tid: string) {
    const client = await getRedisClient();

    // Get thread to validate ownership
    const threadKey = `${THREAD_PREFIX}${tid}`;
    const createdBy = await client.hGet(threadKey, 'created_by');

    if (!createdBy || createdBy !== uid) {
        throw new Error('Thread not found or access denied');
    }

    // Get all message IDs for the thread
    const threadMessagesKey = `thread:messages:${tid}`;
    const messageIds = await client.sMembers(threadMessagesKey);

    if (!messageIds || messageIds.length === 0) {
        return { messages: [] };
    }

    // Get message details for each ID
    const messages: Message[] = [];
    for (const messageId of messageIds) {
        const messageKey = `${MESSAGE_PREFIX}${messageId}`;
        const messageData = await client.hGetAll(messageKey);

        if (messageData && Object.keys(messageData).length > 0) {
            // Parse content as JSON if stored as string
            let content = messageData.content;
            try {
                if (typeof content === 'string') {
                    content = JSON.parse(content);
                }
            } catch (e) {
                // Keep as is if not parseable
            }

            messages.push({
                id: messageId,
                parent_id: messageData.parent_id || undefined,
                thread_id: messageData.thread_id,
                created_by: messageData.created_by,
                updated_by: messageData.updated_by,
                format: messageData.format,
                content: content,
                height: messageData.height ? parseInt(messageData.height, 10) : undefined,
                created_at: messageData.created_at,
                updated_at: messageData.updated_at
            });
        }
    }

    // Sort messages by created_at in descending order
    messages.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { messages };
}

export async function createMessage(uid: string, tid: string, pid: string | null, fmt: string, content: any) {
    const client = await getRedisClient();
    const messageId = generateUUID();
    const now = new Date().toISOString();

    // Check if thread exists and belongs to the user
    const threadKey = `${THREAD_PREFIX}${tid}`;
    const createdBy = await client.hGet(threadKey, 'created_by');

    if (!createdBy || createdBy !== uid) {
        throw new Error('Thread not found or access denied');
    }

    // Create message hash
    const messageKey = `${MESSAGE_PREFIX}${messageId}`;

    // Stringify content if it's an object
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;

    await client.hSet(messageKey, {
        id: messageId,
        thread_id: tid,
        parent_id: pid || '',
        created_by: uid,
        updated_by: uid,
        format: fmt,
        content: contentStr,
        created_at: now,
        updated_at: now
    });

    // Add message to thread's message set
    const threadMessagesKey = `thread:messages:${tid}`;
    await client.sAdd(threadMessagesKey, messageId);

    // Update thread's last_message_at timestamp
    await client.hSet(threadKey, {
        updated_at: now,
        last_message_at: now
    });

    return { message_id: messageId };
}

export async function getMessageCountByUid(uid: string) {
    const client = await getRedisClient();

    // Get all thread IDs for the user
    const userThreadsKey = `${USER_THREADS_PREFIX}${uid}`;
    const threadIds = await client.sMembers(userThreadsKey);

    if (!threadIds || threadIds.length === 0) {
        return 0;
    }

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Count messages across all threads for today
    let messageCount = 0;
    for (const threadId of threadIds) {
        const threadMessagesKey = `thread:messages:${threadId}`;
        const messageIds = await client.sMembers(threadMessagesKey);

        if (messageIds && messageIds.length > 0) {
            for (const messageId of messageIds) {
                const messageKey = `${MESSAGE_PREFIX}${messageId}`;
                const createdBy = await client.hGet(messageKey, 'created_by');
                const createdAt = await client.hGet(messageKey, 'created_at');

                if (createdBy === uid && createdAt) {
                    const messageDate = new Date(createdAt).getTime();
                    if (messageDate >= todayTimestamp) {
                        messageCount++;
                    }
                }
            }
        }
    }

    return messageCount;
} 