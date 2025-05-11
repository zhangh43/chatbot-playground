import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ThreadRepository } from '@/utils/redis/thread-repository'

/**
 * GET /api/storage/v1/threads/[thread_id]
 * Retrieves a specific thread
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

    // Get thread
    const threadRepository = new ThreadRepository()
    const thread = await threadRepository.getThreadById(threadId)

    // Check if thread exists and belongs to user
    if (!thread || thread.user_id !== userId) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error retrieving thread:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/storage/v1/threads/[thread_id]
 * Updates a thread's title
 */
export async function PATCH(
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

    // Get request body
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Update thread title
    const updatedThread = await threadRepository.updateThreadTitle(threadId, title)

    return NextResponse.json({ thread: updatedThread })
  } catch (error) {
    console.error('Error updating thread:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/storage/v1/threads/[thread_id]
 * Deletes a thread and all its messages
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

    // Check if thread exists and belongs to user
    const threadRepository = new ThreadRepository()
    const thread = await threadRepository.getThreadById(threadId)

    if (!thread || thread.user_id !== userId) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Delete thread and all its messages
    await threadRepository.deleteThread(threadId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting thread:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
