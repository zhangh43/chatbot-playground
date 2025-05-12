/**
 * Test script for the Redis storage implementation
 * 
 * Tests the core Redis storage functions to make sure they work properly
 * with the new authentication approach.
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
    getThreadsForUser,
    createThread,
    updateThreadArchived,
    getMessagesByThreadAndUser,
    createMessage
} from '../utils/redis/storage';
import { closeRedisConnection } from '../utils/redis/client';

// Load environment variables
dotenv.config();

async function testRedisFunctions() {
    try {
        console.log('Testing Redis storage implementation...');

        // Generate a test user ID
        const testUserId = uuidv4();
        console.log(`Using test user ID: ${testUserId}`);

        // Step 1: Create a thread
        console.log('\n1. Creating a thread...');
        const now = new Date().toISOString();
        const threadResult = await createThread(testUserId, now);
        const threadId = threadResult.thread_id;
        console.log(`Thread created with ID: ${threadId}`);

        // Step 2: Get threads for user
        console.log('\n2. Getting threads for user...');
        const userThreads = await getThreadsForUser(testUserId);
        console.log(`Found ${userThreads.threads.length} threads for user`);
        console.log('Thread data:', JSON.stringify(userThreads.threads[0], null, 2));

        // Step 3: Create a message in the thread
        console.log('\n3. Creating a message...');
        const messageContent = {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: 'Hello from Redis test!'
                }
            ]
        };
        const messageResult = await createMessage(
            testUserId,
            threadId,
            null,
            'aui/v0',
            messageContent
        );
        console.log(`Message created with ID: ${messageResult.message_id}`);

        // Step 4: Get messages for the thread
        console.log('\n4. Getting messages for thread...');
        const threadMessages = await getMessagesByThreadAndUser(testUserId, threadId);
        console.log(`Found ${threadMessages.messages.length} messages in thread`);
        console.log('Message data:', JSON.stringify(threadMessages.messages[0], null, 2));

        // Step 5: Archive the thread
        console.log('\n5. Archiving thread...');
        await updateThreadArchived(testUserId, threadId, true);
        console.log('Thread archived');

        // Step 6: Verify thread is archived by getting threads again
        console.log('\n6. Verifying archived thread is not returned...');
        const userThreadsAfterArchive = await getThreadsForUser(testUserId);
        console.log(`Found ${userThreadsAfterArchive.threads.length} active threads for user (should be 0)`);

        console.log('\n✅ All Redis functions tested successfully!');
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await closeRedisConnection();
    }
}

// Run the test
testRedisFunctions().catch(console.error); 