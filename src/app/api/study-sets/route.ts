import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// GET /api/study-sets — list all study sets with pagination
export async function GET(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('study_sets')
      .select('*, upload:uploads(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        studySets: data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  })
}

// POST /api/study-sets — create a text-based study set
export async function POST(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    let body: { title: string; description?: string; subject?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('study_sets')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        description: body.description,
        subject: body.subject,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  })
}
