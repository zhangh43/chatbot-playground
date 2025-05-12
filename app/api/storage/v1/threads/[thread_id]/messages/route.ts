import { createClient } from "@/utils/supabase/server";
import { getMessagesByThreadAndUser, createMessage } from "@/utils/redis/storage";

// Define a proper type for message structure
interface MessageContent {
  role?: string;
  content?: Array<{ type: string; text: string }> | string;
}

// Complete Message interface based on actual data structure
interface Message {
  id?: string;
  content: MessageContent | string;
  format?: string;
  parent_id?: string | null;
  thread_id?: string;
  created_at?: string;
  created_by?: string;
  updated_by?: string;
  updated_at?: string;
  severity?: number;
}

// For the response data structure
interface ResponseData {
  messages: Message[];
  // Define additional fields that might exist in response data
  thread_id?: string;
  metadata?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

/**
 * 获取消息
 * @param thread_id 线程ID
 * @example
 * /v1/threads/thread_03MD9BixtUBRK13thC7t83uN/messages
 * @returns 消息列表
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ thread_id: string }> }
) {
  // get user from supabase
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { thread_id } = await params;
  if (!thread_id) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    // Use Redis to get messages instead of Supabase RPC
    const res = await getMessagesByThreadAndUser(data.user.id, thread_id);

    // Validate and fix messages before returning them
    const responseData: ResponseData = res || { messages: [] };

    // Ensure each message in the array has a valid role
    if (responseData.messages && Array.isArray(responseData.messages)) {
      responseData.messages = responseData.messages.map((message: Message) => {
        try {
          // Check if message content exists
          if (!message.content) {
            message.content = { role: 'user' };
            return message;
          }

          // Handle string content by converting it to proper format
          if (typeof message.content === 'string') {
            try {
              // Try to parse JSON string
              const parsedContent = JSON.parse(message.content as string);
              message.content = parsedContent;
            } catch {
              // If not valid JSON, treat as user message
              message.content = {
                role: 'user',
                content: [{ type: 'text', text: message.content as string }]
              };
            }
          }

          // Now message.content should be an object
          if (typeof message.content === 'object') {
            const contentObj = message.content as MessageContent;
            // If role is missing or invalid, default to user
            if (!contentObj.role || !['user', 'assistant', 'system'].includes(contentObj.role)) {
              contentObj.role = 'user';
            }

            // Ensure content array exists for AUI format
            if (message.format === 'aui/v0' &&
              (!Array.isArray(contentObj.content) ||
                contentObj.content.length === 0)) {
              contentObj.content = [{ type: 'text', text: '' }];
            }
          }
        } catch (err) {
          console.error('Error processing message:', err);
          // Provide a fallback valid message structure
          message.content = {
            role: 'user',
            content: [{ type: 'text', text: 'Error loading message content' }]
          };
        }
        return message;
      });
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Error getting messages:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * 创建消息
 * @param thread_id 线程ID
 * @param content 消息内容
 * @param format 消息格式
 * @param parent_id 父消息ID
 * @example
 * {
 *  "content": {
 *    "role": "user",
 *    "content": [
 *      {
 *        "type": "text",
 *        "text": "Hello!"
 *      }
 *    ]
 *  },
 *  "format": "aui/v0",
 *  "parent_id": null
 * }
 * @returns 消息ID
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ thread_id: string }> }
) {
  // get user from supabase
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { thread_id } = await params;
  const { content, format, parent_id } = await req.json();
  if (!content || !format || parent_id === undefined || !thread_id) {
    return new Response("Bad Request", { status: 400 });
  }

  // Validate message content format
  let validatedContent = content;
  if (typeof content === 'object') {
    // Ensure a valid role is present
    if (!content.role || !['user', 'assistant', 'system'].includes(content.role)) {
      validatedContent = { ...content, role: 'user' }; // Default to user if role is missing or invalid
    }

    // For aui/v0 format, ensure content array is present
    if (format === 'aui/v0' && (!Array.isArray(validatedContent.content) || validatedContent.content.length === 0)) {
      validatedContent.content = [{ type: 'text', text: '' }];
    }
  }

  try {
    // Use Redis to create message instead of Supabase RPC
    const result = await createMessage(
      data.user.id,
      thread_id,
      parent_id,
      format,
      validatedContent
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error creating message:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
