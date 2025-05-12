import { MemoBaseClient } from "@memobase/memobase";

let clientInstance: MemoBaseClient | null = null;

// Function to check if all required environment variables are set
const checkEnvironmentVariables = () => {
  const url = process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL;
  const apiKey = process.env.NEXT_PUBLIC_MEMOBASE_API_KEY;

  if (!url || !apiKey) {
    const error = `Memobase configuration incomplete: ${!url ? 'Missing NEXT_PUBLIC_MEMOBASE_PROJECT_URL' : ''
      }${!url && !apiKey ? ' and ' : ''
      }${!apiKey ? 'Missing NEXT_PUBLIC_MEMOBASE_API_KEY' : ''
      }`;
    console.error(error);
    return false;
  }

  return true;
};

// Function to create a new client with proper error handling
export const getMemoBaseClient = (): MemoBaseClient => {
  if (clientInstance) {
    return clientInstance;
  }

  if (!checkEnvironmentVariables()) {
    throw new Error('Cannot initialize Memobase client: Missing configuration');
  }

  try {
    console.log('Initializing Memobase client...');
    clientInstance = new MemoBaseClient(
      process.env.NEXT_PUBLIC_MEMOBASE_PROJECT_URL!,
      process.env.NEXT_PUBLIC_MEMOBASE_API_KEY!
    );

    console.log('Memobase client initialized successfully');
    return clientInstance;
  } catch (error) {
    console.error('Failed to initialize Memobase client:', error);
    throw new Error(`Memobase client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// For backward compatibility
export const memoBaseClient = getMemoBaseClient();

// Create a wrapper with retry logic for any Memobase operation
export async function withMemobaseRetry<T>(
  operation: (client: MemoBaseClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get a fresh client on each retry
      const client = getMemoBaseClient();
      return await operation(client);
    } catch (error: any) {
      lastError = error;
      const retryDelay = Math.pow(2, i) * 1000; // Exponential backoff
      console.error(`Memobase operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      console.log(`Retrying in ${retryDelay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError || new Error('Unknown error in Memobase operation');
}
