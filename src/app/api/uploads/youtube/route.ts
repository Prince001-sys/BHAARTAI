import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { isValidYouTubeUrl, extractYouTubeVideoId } from '@/lib/utils'
import { analytics } from '@/lib/posthog'
import { checkUploadLimit } from '@/lib/limits'
import { createServiceClient } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/rateLimit'

// POST /api/uploads/youtube — submit YouTube URL
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    // Rate limit
    const rateLimit = checkRateLimit(`youtube:${user.id}`, 10, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429 }
      )
    }

    // Check upload limit
    const serviceClient = createServiceClient()
    const limitCheck = await checkUploadLimit(user.id, user.plan_type, serviceClient)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Daily upload limit reached. Upgrade to Pro for unlimited uploads.`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    let body: { url: string; title?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { url, title } = body

    if (!url || !isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' },
        { status: 400 }
      )
    }

    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID from URL.' }, { status: 400 })
    }

    const uploadTitle = title || `YouTube: ${videoId}`

    // Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        title: uploadTitle,
        file_type: 'youtube',
        youtube_url: url,
        youtube_video_id: videoId,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (uploadError || !upload) {
      console.error('[POST /uploads/youtube]', uploadError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again later.' },
        { status: 500 }
      )
    }

    // Create study set
    const { data: studySet } = await supabase
      .from('study_sets')
      .insert({
        user_id: user.id,
        upload_id: upload.id,
        title: uploadTitle,
      })
      .select()
      .single()

    analytics.upload(user.id, 'youtube')

    return NextResponse.json({
      data: {
        upload,
        studySet,
        message: 'YouTube video added. Processing will start shortly.',
      },
    })
  })
}
