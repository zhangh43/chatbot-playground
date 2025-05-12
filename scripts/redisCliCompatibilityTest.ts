/**
 * This script tests Redis connection using an approach that exactly matches redis-cli
 * command line parameters as shown in your example:
 * 
 * redis-cli -h hostname -p 6378 --user username --pass password
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Load environment variables
dotenv.config();

async function testRedisCliCommand() {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT || '6378';
    const username = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;

    if (!host || !username || !password) {
        console.error('Missing Redis connection details');
        return;
    }

    // Echo the redis-cli command that works
    console.log('Equivalent redis-cli command:');
    console.log(`redis-cli -h ${host} -p ${port} --user ${username} --pass ${password?.substring(0, 3)}******`);

    // Test with node-redis client using socket options + auth
    console.log('\nTesting node-redis client...');

    const client = createClient({
        socket: {
            host,
            port: parseInt(port)
        }
    });

    client.on('error', (err) => {
        console.error('Redis error:', err);
    });

    try {
        console.log('Connecting without auth first...');
        await client.connect();
        console.log('Connected (no auth)');

        // Now try ACL AUTH command (matches redis 6+ with ACL)
        console.log(`Authenticating with: AUTH ${username} [password]`);
        await client.sendCommand(['AUTH', username, password]);
        console.log('Authentication successful!');

        // Test commands
        await client.set('test-cli-key', 'Hello from CLI compatibility test');
        const value = await client.get('test-cli-key');
        console.log('Test command result:', value);

        await client.quit();
        console.log('Connection closed');
    } catch (error) {
        console.error('Redis connection failed:', error);
        try {
            await client.quit();
        } catch (e) {
            // Ignore
        }
    }
}

// Run the test
testRedisCliCommand().catch(console.error); 