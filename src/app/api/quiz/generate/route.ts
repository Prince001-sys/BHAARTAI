import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { generateQuiz } from '@/lib/openai'
import { createServiceClient } from '@/lib/supabase/middleware'
import { checkAiQuestionLimit } from '@/lib/limits'
import { checkRateLimit } from '@/lib/rateLimit'
import { analytics } from '@/lib/posthog'

// POST /api/quiz/generate
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    // Rate limit: 5 quiz generations per minute
    const rateLimit = checkRateLimit(`quiz:${user.id}`, 5, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
    }

    let body: { studySetId: string; difficulty?: string; count?: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { studySetId, difficulty = 'medium', count = 10 } = body
    if (!studySetId) {
      return NextResponse.json({ error: 'studySetId is required.' }, { status: 400 })
    }

    const validDifficulties = ['easy', 'medium', 'hard']
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty. Use easy, medium, or hard.' }, { status: 400 })
    }

    // Check AI usage limit
    const serviceClient = createServiceClient()
    const limitCheck = await checkAiQuestionLimit(user.id, user.plan_type, serviceClient)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Daily AI limit reached. Upgrade to Pro.', upgradeRequired: true },
        { status: 403 }
      )
    }

    // Get study set
    const { data: studySet, error: ssError } = await supabase
      .from('study_sets')
      .select('*, upload:uploads(extracted_text)')
      .eq('id', studySetId)
      .eq('user_id', user.id)
      .single()

    if (ssError || !studySet) {
      return NextResponse.json({ error: 'Study set not found.' }, { status: 404 })
    }

    const upload = studySet.upload as { extracted_text?: string } | null
    if (!upload?.extracted_text) {
      return NextResponse.json({ error: 'Content not yet processed.' }, { status: 422 })
    }

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        study_set_id: studySetId,
        user_id: user.id,
        title: `${studySet.title} — ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
        difficulty,
        quiz_type: 'mcq',
        generation_status: 'generating',
      })
      .select()
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Failed to create quiz.' }, { status: 500 })
    }

    try {
      const result = await generateQuiz(upload.extracted_text, difficulty, Math.min(count, 15))

      // Insert questions
      const questionsToInsert = result.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        order_index: index,
      }))

      await supabase.from('quiz_questions').insert(questionsToInsert)

      // Update quiz status
      await serviceClient
        .from('quizzes')
        .update({
          generation_status: 'completed',
          total_questions: result.questions.length,
        })
        .eq('id', quiz.id)

      // Track usage
      await serviceClient.from('api_usage').insert({
        user_id: user.id,
        provider: 'openai',
        endpoint: 'quiz_generation',
        tokens_used: result.tokens_used,
        cost_usd: result.tokens_used * 0.000005,
      })

      analytics.quizStart(user.id, quiz.id, difficulty)

      return NextResponse.json({ data: { quizId: quiz.id, totalQuestions: result.questions.length } })
    } catch (err) {
      console.error('[POST /quiz/generate]', err)
      await serviceClient
        .from('quizzes')
        .update({ generation_status: 'failed' })
        .eq('id', quiz.id)

      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again.' },
        { status: 503 }
      )
    }
  })
}
