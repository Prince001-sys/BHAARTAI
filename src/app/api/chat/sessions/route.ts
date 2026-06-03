import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// POST /api/chat/sessions — create or get chat session
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    let body: { studySetId?: string; title?: string; language?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { studySetId, title = 'New Chat', language = 'english' } = body

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        study_set_id: studySetId || null,
        title,
        language,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create chat session.' }, { status: 500 })
    }

    return NextResponse.json({ data: chat })
  })
}

// GET /api/chat/sessions — list user's chat sessions
export async function GET(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const studySetId = searchParams.get('studySetId')

    let query = supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (studySetId) {
      query = query.eq('study_set_id', studySetId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  })
}
