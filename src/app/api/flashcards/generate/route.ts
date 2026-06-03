import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { generateFlashcards, getOpenAIErrorMessage } from '@/lib/openai'
import { createServiceClient } from '@/lib/supabase/middleware'
import { checkAiQuestionLimit } from '@/lib/limits'
import { checkRateLimit } from '@/lib/rateLimit'

// POST /api/flashcards/generate
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    const rateLimit = checkRateLimit(`flashcards:${user.id}`, 10, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
    }

    let body: { studySetId: string; count?: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { studySetId, count = 12 } = body
    if (!studySetId) {
      return NextResponse.json({ error: 'studySetId is required.' }, { status: 400 })
    }

    // Check limit
    const serviceClient = createServiceClient()
    const limitCheck = await checkAiQuestionLimit(user.id, user.plan_type, serviceClient)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Daily AI limit reached. Upgrade to Pro for unlimited AI.', upgradeRequired: true },
        { status: 403 }
      )
    }

    // Get study set + extracted text
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

    try {
      const result = await generateFlashcards(upload.extracted_text, Math.min(count, 20))

      // Delete existing flashcards for this study set
      await supabase.from('flashcards').delete().eq('study_set_id', studySetId).eq('user_id', user.id)

      // Insert new flashcards
      const flashcardsToInsert = result.flashcards.map((fc, index) => ({
        study_set_id: studySetId,
        user_id: user.id,
        question: fc.question,
        answer: fc.answer,
        difficulty: fc.difficulty || 'medium',
        order_index: index,
      }))

      const { data: flashcards, error: insertError } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select()

      if (insertError) throw insertError

      // Track usage
      await serviceClient.from('api_usage').insert({
        user_id: user.id,
        provider: 'openai',
        endpoint: 'flashcards_generation',
        tokens_used: result.tokens_used,
        cost_usd: result.tokens_used * 0.000005,
      })

      // Track usage (todo: implement server-side tracking)
      return NextResponse.json({ data: flashcards })
    } catch (err) {
      const errMsg = getOpenAIErrorMessage(err)
      logger.error('[POST /flashcards/generate]', errMsg, err)
      return NextResponse.json(
        { error: errMsg },
        { status: 503 }
      )
    }
  })
}

// GET /api/flashcards/generate?studySetId= — fetch existing flashcards
export async function GET(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const studySetId = searchParams.get('studySetId')

    if (!studySetId) {
      return NextResponse.json({ error: 'studySetId is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('study_set_id', studySetId)
      .eq('user_id', user.id)
      .order('order_index')

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  })
}
