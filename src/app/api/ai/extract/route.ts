import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/middleware'

// POST /api/ai/extract — extract text from uploaded PDF or YouTube video
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    let body: { uploadId: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { uploadId } = body
    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId is required.' }, { status: 400 })
    }

    // Verify ownership
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (error || !upload) {
      return NextResponse.json({ error: 'Upload not found.' }, { status: 404 })
    }

    if (upload.processing_status === 'completed' && upload.extracted_text) {
      return NextResponse.json({
        data: { message: 'Already extracted.', status: 'completed' },
      })
    }

    // Mark as processing
    await supabase
      .from('uploads')
      .update({ processing_status: 'processing' })
      .eq('id', uploadId)

    let extractedText = ''

    try {
      if (upload.file_type === 'pdf') {
        // Download file from storage using signed URL
        const serviceClient = createServiceClient()
        const { data: signedUrl, error: signedUrlError } = await serviceClient.storage
          .from('study-materials')
          .createSignedUrl(upload.file_url!, 60)

        if (!signedUrl?.signedUrl || signedUrlError) {
          logger.error('[POST /ai/extract] createSignedUrl Error:', signedUrlError, upload.file_url)
          throw new Error('Could not generate signed URL for file.')
        }

        // Fetch the file
        const response = await fetch(signedUrl.signedUrl)
        if (!response.ok) throw new Error('Failed to download file.')

        const buffer = await response.arrayBuffer()

        // pdf-parse v1 has a bug in Webpack/Turbopack where `!module.parent` triggers a test run.
        // We import the lib directly to bypass it.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdf = require('pdf-parse/lib/pdf-parse.js')
        const data = await pdf(Buffer.from(buffer))
        extractedText = data.text.trim()

        if (!extractedText || extractedText.trim().length < 50) {
          throw new Error('PDF appears to be empty or contains no readable text.')
        }
      } else if (upload.file_type === 'youtube') {
        // Extract YouTube transcript — prefer English, fallback to Hindi, then any available
        const { YoutubeTranscript } = await import('youtube-transcript')

        let transcriptItems: Array<{ text: string; offset: number; duration: number }> = []
        let usedLang = 'en'

        // Try languages in priority order: English → Hindi → auto (no lang specified)
        const langPriority = ['en', 'hi', '']
        let lastError: Error | null = null

        for (const lang of langPriority) {
          try {
            const opts = lang ? { lang } : {}
            transcriptItems = await YoutubeTranscript.fetchTranscript(upload.youtube_video_id!, opts)
            usedLang = lang || 'auto'
            if (transcriptItems.length > 0) break
          } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e))
            continue
          }
        }

        if (transcriptItems.length === 0) {
          throw lastError ?? new Error('Could not extract transcript from this video. The video may not have captions enabled.')
        }

        // Build plain text for AI processing
        extractedText = transcriptItems.map((item) => item.text).join(' ')

        // Store timestamped segments as JSON for the timeline UI
        const segments = transcriptItems.map((item) => ({
          text: item.text,
          start: Math.floor((item.offset ?? 0) / 1000), // convert ms → seconds
          duration: Math.floor((item.duration ?? 0) / 1000),
        }))

        // Save segments separately in the DB — non-fatal if column doesn't exist yet
        try {
          const serviceClientEarly = createServiceClient()
          await serviceClientEarly
            .from('uploads')
            .update({ transcript_segments: JSON.stringify(segments) })
            .eq('id', uploadId)
        } catch {
          // transcript_segments column may not exist yet — not fatal
        }

        logger.info(`[YouTube] Extracted ${transcriptItems.length} segments in lang="${usedLang}" for video ${upload.youtube_video_id}`)

        if (!extractedText || extractedText.trim().length < 50) {
          throw new Error('Could not extract transcript from this video.')
        }
      } else if (upload.file_type === 'image') {
        // Use Gemini Vision to extract text from images
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const visionModel = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const serviceClient = createServiceClient()
        const { data: signedUrl, error: signedUrlError } = await serviceClient.storage
          .from('study-materials')
          .createSignedUrl(upload.file_url!, 60)

        if (!signedUrl?.signedUrl || signedUrlError) {
          logger.error('[POST /ai/extract] createSignedUrl Error (Image):', signedUrlError)
          throw new Error('Could not generate signed URL.')
        }

        // Fetch image as base64
        const imgResponse = await fetch(signedUrl.signedUrl)
        if (!imgResponse.ok) throw new Error('Failed to download image.')
        const imgBuffer = await imgResponse.arrayBuffer()
        const base64 = Buffer.from(imgBuffer).toString('base64')
        const mimeType = (imgResponse.headers.get('content-type') || 'image/jpeg') as string

        const visionResult = await visionModel.generateContent([
          {
            inlineData: { data: base64, mimeType },
          },
          'Extract all text, formulas, equations, and content from this image. Format it clearly with proper structure.',
        ])

        extractedText = visionResult.response.text() || ''
      }

      // Update upload with extracted text
      const serviceClient = createServiceClient()
      await serviceClient
        .from('uploads')
        .update({
          extracted_text: extractedText,
          processing_status: 'completed',
        })
        .eq('id', uploadId)

      return NextResponse.json({
        data: {
          message: 'Text extracted successfully.',
          status: 'completed',
          textLength: extractedText.length,
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file.'
      logger.error('[POST /ai/extract]', errorMessage)

      await supabase
        .from('uploads')
        .update({
          processing_status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', uploadId)

      return NextResponse.json(
        { error: "We couldn't process this file. Please try another file." },
        { status: 422 }
      )
    }
  })
}
