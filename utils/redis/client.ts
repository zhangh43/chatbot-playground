import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

// Define Redis connection options
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;
let reconnectHandlerAdded = false;

// Initialize Redis client
export async function getRedisClient() {
    // If already connecting, wait for that to complete
    if (isConnecting) {
        // Wait for the connection to be established
        let waitCount = 0;
        while (isConnecting && waitCount < 50) { // Max 5 seconds wait
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
        }
        // If client exists and is ready, return it
        if (redisClient?.isReady) {
            return redisClient;
        }
    }

    // Check if client needs to be created or reconnected
    if (!redisClient || !redisClient.isReady) {
        isConnecting = true;
        try {
            // If there's an existing client that's not ready, try to clean it up
            if (redisClient && !redisClient.isReady) {
                try {
                    // Don't try to disconnect - just log it and abandon the old client
                    console.log('Abandoning stale Redis client');
                } catch (e) {
                    // Ignore errors during cleanup
                }
                redisClient = null;
            }

            // Create connection first, then authenticate
            const host = process.env.REDIS_HOST || 'localhost';
            const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
            const username = process.env.REDIS_USERNAME;
            const password = process.env.REDIS_PASSWORD;

            console.log('Creating new Redis client...');

            // Create client with socket connection but without auth
            redisClient = createClient({
                socket: {
                    host,
                    port,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.log('Max reconnection attempts reached, stopping reconnects');
                            return new Error('Max reconnection attempts reached');
                        }
                        // Exponential backoff with a maximum delay
                        const delay = Math.min(Math.pow(2, retries) * 100, 3000);
                        console.log(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
                        return delay;
                    }
                }
            });

            // Handle errors
            redisClient.on('error', (error) => {
                console.error('Redis Client Error:', error);
            });

            // Handle reconnections - only add this handler once
            if (!reconnectHandlerAdded && username && password) {
                reconnectHandlerAdded = true;

                // Handle reconnections
                redisClient.on('reconnecting', () => {
                    console.log('Redis client reconnecting...');
                });

                // Handle connection
                redisClient.on('connect', async () => {
                    console.log('Redis client connected');

                    // Try to re-authenticate when reconnected
                    if (redisClient?.isOpen && !redisClient?.isReady) {
                        try {
                            console.log('Reconnected, re-authenticating...');
                            await redisClient.sendCommand(['AUTH', username, password]);
                            console.log('Re-authentication successful');
                        } catch (error) {
                            console.error('Re-authentication failed:', error);
                        }
                    }
                });
            }

            // Handle ready (after connect and auth)
            redisClient.on('ready', () => {
                console.log('Redis client ready');
            });

            // Connect first without authentication
            console.log('Connecting to Redis...');
            await redisClient.connect();

            // Then authenticate using the AUTH command
            if (username && password) {
                console.log('Authenticating with Redis using username and password...');
                await redisClient.sendCommand(['AUTH', username, password]);
                console.log('Redis authentication successful!');
            }
        } catch (error) {
            console.error('Failed to initialize Redis client:', error);
            throw error;
        } finally {
            isConnecting = false;
        }
    }

    return redisClient;
}

// Helper function to generate UUIDs
export function generateUUID() {
    return uuidv4();
}

// Close Redis connection
export async function closeRedisConnection() {
    if (redisClient) {
        try {
            // Only try to disconnect if the client is connected
            if (redisClient.isOpen) {
                await redisClient.disconnect();
                console.log('Redis connection closed');
            } else {
                console.log('Redis client already disconnected');
            }
        } catch (error) {
            console.error('Error closing Redis connection:', error);
        } finally {
            reconnectHandlerAdded = false;
            redisClient = null;
        }
    }
} 