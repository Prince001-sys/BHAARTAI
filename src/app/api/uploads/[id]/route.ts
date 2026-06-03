import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// GET /api/uploads/[id] — get upload status and signed URL
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(async ({ user, supabase }) => {
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !upload) {
      return NextResponse.json({ error: 'Upload not found.' }, { status: 404 })
    }

    // Generate signed URL (expires in 5 minutes) if file exists in storage
    let signedUrl: string | null = null
    if (upload.file_url) {
      const { data: urlData } = await supabase.storage
        .from('study-materials')
        .createSignedUrl(upload.file_url, 300) // 5 minutes
      signedUrl = urlData?.signedUrl || null
    }

    return NextResponse.json({ data: { ...upload, signedUrl } })
  })
}

// DELETE /api/uploads/[id] — delete upload and associated file
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(async ({ user, supabase }) => {
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !upload) {
      return NextResponse.json({ error: 'Upload not found.' }, { status: 404 })
    }

    // Delete from storage
    if (upload.file_url) {
      await supabase.storage.from('study-materials').remove([upload.file_url])
    }

    // Delete record (cascades to study_sets via FK)
    await supabase.from('uploads').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ data: { message: 'Upload deleted successfully.' } })
  })
}
