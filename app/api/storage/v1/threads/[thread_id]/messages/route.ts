import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { MessageRepository } from '@/utils/redis/message-repository'
import { ThreadRepository } from '@/utils/redis/thread-repository'
import { validateMessageContent } from '@/utils/redis/message-parser'

/**
 * GET /api/storage/v1/threads/[thread_id]/messages
 * Retrieves messages for a specific thread
 */
export async function GET(
  request: Request,
  { params }: { params: { thread_id: string } }
) {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = data.user.id

    const threadId = params.thread_id

    // Check if thread exists and belongs to user
    const threadRepository = new ThreadRepository()
    const thread = await threadRepository.getThreadById(threadId)

    if (!thread || thread.user_id !== userId) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Get messages for this thread and user
    const messageRepository = new MessageRepository()
    const messages = await messageRepository.getMessagesByThreadAndUser(threadId, userId)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error retrieving messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/storage/v1/threads/[thread_id]/messages
 * Creates a new message in a thread
 */
export async function POST(
  request: Request,
  { params }: { params: { thread_id: string } }
) {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = data.user.id

    const threadId = params.thread_id

    // Validate thread exists and belongs to user
    const threadRepository = new ThreadRepository()
    const thread = await threadRepository.getThreadById(threadId)

    if (!thread || thread.user_id !== userId) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const { content, parent_id } = body

    // Validate message content
    const validatedContent = validateMessageContent(content)

    // Create new message
    const messageRepository = new MessageRepository()
    const message = await messageRepository.createMessage({
      thread_id: threadId,
      user_id: userId,
      content: validatedContent,
      parent_id: parent_id || null
    })

    // Update thread's last update time
    await threadRepository.updateThreadTitle(threadId, thread.title)

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/storage/v1/threads/[thread_id]/messages
 * Deletes all messages in a thread
 */
export async function DELETE(
  request: Request,
  { params }: { params: { thread_id: string } }
) {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = data.user.id

    const threadId = params.thread_id

    // Validate thread exists and belongs to user
    const threadRepository = new ThreadRepository()
    const thread = await threadRepository.getThreadById(threadId)

    if (!thread || thread.user_id !== userId) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Delete the thread (which also deletes all messages)
    await threadRepository.deleteThread(threadId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
