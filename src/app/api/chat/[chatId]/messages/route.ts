import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { chatWithAI } from '@/lib/openai'
import { createServiceClient } from '@/lib/supabase/middleware'
import { checkAiQuestionLimit } from '@/lib/limits'
import { checkRateLimit } from '@/lib/rateLimit'
import { analytics } from '@/lib/posthog'

// POST /api/chat/[chatId]/messages — send message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  return withAuth(async ({ user, supabase }) => {
    // Rate limit: 20 messages per minute
    const rateLimit = checkRateLimit(`chat:${user.id}`, 20, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    // Check AI usage limit
    const serviceClient = createServiceClient()
    const limitCheck = await checkAiQuestionLimit(user.id, user.plan_type, serviceClient)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI limit reached (${limitCheck.limit} uses/day on Free plan). Upgrade to Pro for unlimited chat.`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    let body: { message: string; language?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { message, language = 'english' } = body
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
    }

    // Verify chat ownership
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*, study_sets(*, upload:uploads(extracted_text))')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat session not found.' }, { status: 404 })
    }

    // Get context from study set
    const studySetData = chat.study_sets as { upload?: { extracted_text?: string } } | null
    const context = studySetData?.upload?.extracted_text || ''

    // Get recent chat history (last 10 messages for context window)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(10)

    const history = (recentMessages || []).reverse() as Array<{
      role: 'user' | 'assistant'
      content: string
    }>

    // Add current user message to history
    const messagesForAI = [...history, { role: 'user' as const, content: message }]

    // Save user message
    await supabase.from('messages').insert({
      chat_id: chatId,
      user_id: user.id,
      role: 'user',
      content: message,
    })

    try {
      const result = await chatWithAI(messagesForAI, context, language)

      // Save AI response
      const { data: aiMessage } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          role: 'assistant',
          content: result.answer,
          tokens_used: result.tokens_used,
        })
        .select()
        .single()

      // Update chat timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId)

      // Track usage
      await serviceClient.from('api_usage').insert({
        user_id: user.id,
        provider: 'openai',
        endpoint: 'chat',
        tokens_used: result.tokens_used,
        cost_usd: result.tokens_used * 0.0000002,
      })

      analytics.chatMessage(user.id, chatId)

      return NextResponse.json({ data: aiMessage })
    } catch (err) {
      logger.error('[POST /chat/messages]', err)
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again in a few minutes.' },
        { status: 503 }
      )
    }
  })
}

// GET /api/chat/[chatId]/messages — get chat history
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  return withAuth(async ({ user, supabase }) => {
    // Verify ownership
    const { data: chat } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found.' }, { status: 404 })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({ data: messages })
  })
}
