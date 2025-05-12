import { createClient } from "@/utils/supabase/server";
import { updateThreadArchived } from "@/utils/redis/storage";

/**
 * 修改消息状态
 * @param thread_id 线程ID
 * @param is_archive 是否归档
 * /v1/threads/thread_03MD9BixtUBRK13thC7t83uN
 * @example
 * {
 *   "is_archived": true
 * }
 * @returns 修改成功
 */
export async function PUT(req: Request, { params }: { params: Promise<{ thread_id: string }> }) {
  // get user from supabase
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { thread_id } = await params;
  const { is_archived } = await req.json();
  if (!thread_id || is_archived === undefined) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    // Use Redis to update thread archived status instead of Supabase RPC
    const result = await updateThreadArchived(data.user.id, thread_id, is_archived);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error updating thread archived status:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
