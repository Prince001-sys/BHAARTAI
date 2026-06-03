import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// GET /api/study-sets/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(async ({ user, supabase }) => {
    const { data, error } = await supabase
      .from('study_sets')
      .select('*, upload:uploads(*), ai_notes(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Study set not found.' }, { status: 404 })
    }

    // Generate signed URL (expires in 1 hour) if file exists in storage
    if (data.upload && data.upload.file_url) {
      try {
        const { data: urlData } = await supabase.storage
          .from('study-materials')
          .createSignedUrl(data.upload.file_url, 3600) // 1 hour
        data.upload.signedUrl = urlData?.signedUrl || null
      } catch (err) {
        logger.error('Failed to create signed URL:', err)
      }
    }

    return NextResponse.json({ data })
  })
}

// PATCH /api/study-sets/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(async ({ user, supabase }) => {
    let body: { title?: string; description?: string; subject?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.description !== undefined) updates.description = body.description
    if (body.subject !== undefined) updates.subject = body.subject

    const { data, error } = await supabase
      .from('study_sets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Study set not found.' }, { status: 404 })
    }

    return NextResponse.json({ data })
  })
}

// DELETE /api/study-sets/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(async ({ user, supabase }) => {
    const { error } = await supabase
      .from('study_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Study set not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: { message: 'Deleted successfully.' } })
  })
}
