import { NextResponse } from 'next/server'
import { withAuth, validateFileServer } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/rateLimit'
import { checkUploadLimit } from '@/lib/limits'
// POST /api/uploads — upload a file (PDF or image)
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    // Rate limit: 10 uploads/hour
    const rateLimitResult = checkRateLimit(`upload:${user.id}`, 10, 60 * 60 * 1000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429 }
      )
    }

    // Check free plan upload limit
    const serviceClient = createServiceClient()
    const limitCheck = await checkUploadLimit(user.id, user.plan_type, serviceClient)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Daily upload limit reached (${limitCheck.limit} uploads/day on Free plan). Upgrade to Pro for unlimited uploads.`,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Parse multipart form
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Server-side file validation
    const validation = validateFileServer(file.name, file.type, file.size)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
    const uploadTitle = title || file.name.replace(/\.[^/.]+$/, '') || 'Untitled'

    // Upload to Supabase Storage (user-scoped path)
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const storagePath = `${user.id}/${fileName}`

    const { error: storageError } = await supabase.storage
      .from('study-materials')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error('[POST /uploads] Storage error:', storageError)
      return NextResponse.json(
        { error: 'Failed to upload file. Please try again.' },
        { status: 500 }
      )
    }

    // Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        title: uploadTitle,
        file_url: storagePath,
        file_type: fileType,
        file_size: file.size,
        original_filename: file.name,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (uploadError || !upload) {
      console.error('[POST /uploads] DB error:', uploadError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again later.' },
        { status: 500 }
      )
    }

    // Create study set automatically
    const { data: studySet, error: studySetError } = await supabase
      .from('study_sets')
      .insert({
        user_id: user.id,
        upload_id: upload.id,
        title: uploadTitle,
      })
      .select()
      .single()

    if (studySetError) {
      console.error('[POST /uploads] Study set creation error:', studySetError)
    }

    // Track analytics via proper server-side tracker (stubbed for now)
    // TODO: use posthog-node for server-side analytics

    return NextResponse.json({
      data: {
        upload,
        studySet,
        message: 'File uploaded successfully. Processing started.',
      },
    })
  })
}

// GET /api/uploads — list user's uploads
export async function GET() {
  return withAuth(async ({ user, supabase }) => {
    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { error: 'Something went wrong. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: uploads })
  })
}
