import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ThreadRepository } from '@/utils/redis/thread-repository'

/**
 * GET /api/storage/v1/threads
 * Retrieves all threads for the current user
 */
export async function GET() {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = data.user.id

    // Get all threads for the user
    const threadRepository = new ThreadRepository()
    const threads = await threadRepository.getThreadsByUser(userId)

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Error retrieving threads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/storage/v1/threads
 * Creates a new thread
 */
export async function POST(request: Request) {
  try {
    // Get user from Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = data.user.id

    // Get request body
    const body = await request.json()
    const { title = 'New Chat' } = body

    // Create new thread
    const threadRepository = new ThreadRepository()
    const thread = await threadRepository.createThread(userId, title)

    return NextResponse.json({ thread }, { status: 201 })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
