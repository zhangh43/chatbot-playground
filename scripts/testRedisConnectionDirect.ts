/**
 * Test script for directly testing different Redis connection methods
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

async function testConnection(name: string, options: any) {
    console.log(`\n---------- Testing ${name} ----------`);
    console.log('Connection options:', JSON.stringify(options, null, 2));

    const client = createClient(options);

    client.on('error', (error) => {
        console.error(`${name} - Error:`, error.message);
    });

    client.on('connect', () => {
        console.log(`${name} - Connected!`);
    });

    try {
        console.log(`${name} - Connecting...`);
        await client.connect();
        console.log(`${name} - Connection successful`);

        // Test a simple operation
        await client.set('test-key', `Test from ${name}`);
        const value = await client.get('test-key');
        console.log(`${name} - Set and Get successful, value: ${value}`);

        // Clean up
        await client.quit();
        return true;
    } catch (error) {
        console.error(`${name} - Failed:`, error);
        try {
            await client.quit();
        } catch (e) {
            // Ignore
        }
        return false;
    }
}

async function main() {
    const host = process.env.REDIS_HOST || '';
    const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6378;
    const username = process.env.REDIS_USERNAME || '';
    const password = process.env.REDIS_PASSWORD || '';

    console.log('Testing Redis connection with:');
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password ? '******' : 'not set'}`);

    // Method 1: URL without credentials and separate auth parameters
    await testConnection('URL without auth', {
        url: `redis://${host}:${port}`,
        username: username,
        password: password
    });

    // Method 2: URL with credentials
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    await testConnection('URL with auth', {
        url: `redis://${encodedUsername}:${encodedPassword}@${host}:${port}`
    });

    // Method 3: Socket configuration
    await testConnection('Socket configuration', {
        socket: {
            host: host,
            port: port
        },
        username: username,
        password: password
    });

    // Method 4: Password only in URL (for older Redis)
    await testConnection('URL with password only', {
        url: `redis://:${encodedPassword}@${host}:${port}`
    });

    // Method 5: Socket config with AUTH command
    const client = createClient({
        socket: {
            host: host,
            port: port
        }
    });

    console.log('\n---------- Testing Direct AUTH command ----------');
    client.on('error', (err) => {
        console.error('Direct AUTH - Error:', err.message);
    });

    try {
        await client.connect();
        console.log('Direct AUTH - Connected without auth');

        // Try AUTH command directly
        console.log('Direct AUTH - Sending AUTH command...');
        if (username) {
            await client.sendCommand(['AUTH', username, password]);
            console.log('Direct AUTH - Authentication successful with username and password');
        } else {
            await client.sendCommand(['AUTH', password]);
            console.log('Direct AUTH - Authentication successful with password only');
        }

        // Test a simple operation
        await client.set('test-direct-key', 'Test from direct AUTH');
        const value = await client.get('test-direct-key');
        console.log(`Direct AUTH - Set and Get successful, value: ${value}`);

        await client.quit();
    } catch (error) {
        console.error('Direct AUTH - Failed:', error);
        try {
            await client.quit();
        } catch (e) {
            // Ignore
        }
    }
}

main().catch(console.error); 