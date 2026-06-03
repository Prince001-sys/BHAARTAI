import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// PATCH /api/flashcards/[id] — mark as learned or update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(async ({ user, supabase }) => {
    let body: { is_learned?: boolean }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('flashcards')
      .update({ is_learned: body.is_learned })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Flashcard not found.' }, { status: 404 })
    }

    return NextResponse.json({ data })
  })
}
