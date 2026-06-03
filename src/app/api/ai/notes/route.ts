import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { generateNotes, getOpenAIErrorMessage } from '@/lib/openai'
import { createServiceClient } from '@/lib/supabase/middleware'
import { checkAiQuestionLimit } from '@/lib/limits'
import { checkRateLimit } from '@/lib/rateLimit'

// POST /api/ai/notes — generate notes for a study set
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    // Rate limit
    const rateLimit = checkRateLimit(`notes:${user.id}`, 10, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429 }
      )
    }

    let body: { studySetId: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { studySetId } = body
    if (!studySetId) {
      return NextResponse.json({ error: 'studySetId is required.' }, { status: 400 })
    }

    // Check AI usage limit
    const serviceClient = createServiceClient()
    const limitCheck = await checkAiQuestionLimit(user.id, user.plan_type, serviceClient)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI limit reached (${limitCheck.limit} uses/day on Free plan). Upgrade to Pro for unlimited AI.`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Get study set + upload
    const { data: studySet, error: ssError } = await supabase
      .from('study_sets')
      .select('*, upload:uploads(*)')
      .eq('id', studySetId)
      .eq('user_id', user.id)
      .single()

    if (ssError || !studySet) {
      return NextResponse.json({ error: 'Study set not found.' }, { status: 404 })
    }

    const upload = studySet.upload as { extracted_text?: string; processing_status?: string } | null
    if (!upload?.extracted_text) {
      return NextResponse.json(
        { error: 'Content not yet extracted. Please wait for processing to complete.' },
        { status: 422 }
      )
    }

    // Check if notes already exist
    const { data: existingNotes } = await supabase
      .from('ai_notes')
      .select('id, generation_status')
      .eq('study_set_id', studySetId)
      .single()

    if (existingNotes?.generation_status === 'generating') {
      return NextResponse.json(
        { error: 'Notes are already being generated. Please wait.' },
        { status: 409 }
      )
    }

    // Create or update notes record with 'generating' status
    let notesId: string
    if (existingNotes) {
      await supabase
        .from('ai_notes')
        .update({ generation_status: 'generating' })
        .eq('id', existingNotes.id)
      notesId = existingNotes.id
    } else {
      const { data: newNotes } = await supabase
        .from('ai_notes')
        .insert({
          study_set_id: studySetId,
          user_id: user.id,
          generation_status: 'generating',
        })
        .select()
        .single()
      notesId = newNotes!.id
    }

    try {
      const result = await generateNotes(upload.extracted_text)

      // Update notes with generated content
      await serviceClient
        .from('ai_notes')
        .update({
          summary: result.summary,
          detailed_notes: result.detailed_notes,
          revision_notes: result.revision_notes,
          exam_notes: result.exam_notes,
          generation_status: 'completed',
        })
        .eq('id', notesId)

      // Track API usage
      await serviceClient.from('api_usage').insert({
        user_id: user.id,
        provider: 'openai',
        endpoint: 'notes_generation',
        tokens_used: result.tokens_used,
        cost_usd: result.tokens_used * 0.000005,
      })

    // Track analytics (todo: implement server-side)
      // Fetch final notes
      const { data: notes } = await supabase
        .from('ai_notes')
        .select('*')
        .eq('id', notesId)
        .single()

      return NextResponse.json({ data: notes })
    } catch (err) {
      const errMsg = getOpenAIErrorMessage(err)
      console.error('[POST /ai/notes]', errMsg, err)
      await serviceClient
        .from('ai_notes')
        .update({ generation_status: 'failed' })
        .eq('id', notesId)

      return NextResponse.json(
        { error: errMsg },
        { status: 503 }
      )
    }
  })
}

// GET /api/ai/notes?studySetId= — fetch existing notes
export async function GET(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const studySetId = searchParams.get('studySetId')

    if (!studySetId) {
      return NextResponse.json({ error: 'studySetId is required.' }, { status: 400 })
    }

    const { data: notes, error } = await supabase
      .from('ai_notes')
      .select('*')
      .eq('study_set_id', studySetId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ data: notes })
  })
}
