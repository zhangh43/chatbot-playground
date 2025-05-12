import { createClient } from "@/utils/supabase/server";
import { getThreadsForUser, createThread } from "@/utils/redis/storage";

/**
 * 获取线程列表
 * @returns 线程列表
 */
export async function GET() {
  // get user from supabase
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Use Redis to get threads instead of Supabase RPC
    const result = await getThreadsForUser(data.user.id);

    return new Response(
      JSON.stringify(
        result || {
          threads: [],
        }
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Error getting threads:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * 创建线程
 * @param last_message_at 最后一条消息的时间
 * @example
 * {
 *   "last_message_at": "2025-04-21T14:54:41.588Z"
 * }
 * @returns 线程ID
 */
export async function POST(req: Request) {
  // get user from supabase
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { last_message_at } = await req.json();
  if (!last_message_at) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    // Use Redis to create thread instead of Supabase RPC
    const result = await createThread(data.user.id, last_message_at);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error creating thread:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
