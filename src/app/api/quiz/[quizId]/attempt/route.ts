import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/middleware'
import { analytics } from '@/lib/posthog'

// POST /api/quiz/[quizId]/attempt — submit quiz attempt and save score
export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  return withAuth(async ({ user, supabase }) => {
    let body: { answers: Record<string, string>; score: number; totalQuestions: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { answers, score, totalQuestions } = body

    // Verify quiz ownership
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, user_id, study_set_id')
      .eq('id', quizId)
      .eq('user_id', user.id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 })
    }

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0

    // Save attempt
    const serviceClient = createServiceClient()
    const { data: attempt, error: attemptError } = await serviceClient
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        score,
        total_questions: totalQuestions,
        percentage,
        answers,
      })
      .select()
      .single()

    if (attemptError) {
      logger.error('[POST /quiz/attempt]', attemptError)
      return NextResponse.json({ error: 'Failed to save attempt.' }, { status: 500 })
    }

    // Update learning progress
    const { data: existingProgress } = await supabase
      .from('learning_progress')
      .select('id, quiz_score')
      .eq('user_id', user.id)
      .eq('study_set_id', quiz.study_set_id)
      .single()

    if (existingProgress) {
      await serviceClient
        .from('learning_progress')
        .update({
          quiz_score: percentage,
          last_activity: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
    } else {
      await serviceClient.from('learning_progress').insert({
        user_id: user.id,
        study_set_id: quiz.study_set_id,
        quiz_score: percentage,
        last_activity: new Date().toISOString(),
      })
    }

    analytics.quizComplete(user.id, quizId, score, percentage)

    return NextResponse.json({ data: attempt })
  })
}

// GET /api/quiz/[quizId]/attempt — get quiz attempts history
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  return withAuth(async ({ user, supabase }) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  })
}
