import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// GET /api/quiz/[quizId] — get quiz with questions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  return withAuth(async ({ user, supabase }) => {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', user.id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 })
    }

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index')

    return NextResponse.json({ data: { quiz, questions: questions || [] } })
  })
}
