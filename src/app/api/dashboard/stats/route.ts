import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// GET /api/dashboard/stats — aggregate user stats
export async function GET() {
  return withAuth(async ({ user, supabase }) => {
    // Run all queries in parallel
    const [
      studySetsResult,
      progressResult,
      recentStudySetsResult,
      recentAttemptsResult,
    ] = await Promise.all([
      supabase
        .from('study_sets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false),

      supabase
        .from('learning_progress')
        .select('minutes_studied, quiz_score, flashcards_reviewed, streak_days, last_activity')
        .eq('user_id', user.id),

      supabase
        .from('study_sets')
        .select('*, upload:uploads(file_type, processing_status)')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(6),

      supabase
        .from('quiz_attempts')
        .select('*, quiz:quizzes(title, difficulty)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5),
    ])

    const progressData = progressResult.data || []
    const totalMinutesStudied = progressData.reduce((sum, p) => sum + (p.minutes_studied || 0), 0)
    const quizAttemptsCount = progressData.filter(p => p.quiz_score !== null).length
    const averageQuizScore =
      quizAttemptsCount > 0
        ? progressData.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / quizAttemptsCount
        : 0
    const totalFlashcardsReviewed = progressData.reduce(
      (sum, p) => sum + (p.flashcards_reviewed || 0),
      0
    )
    const maxStreak = progressData.reduce((max, p) => Math.max(max, p.streak_days || 0), 0)

    return NextResponse.json({
      data: {
        totalStudySets: studySetsResult.count || 0,
        totalMinutesStudied,
        averageQuizScore: Math.round(averageQuizScore * 10) / 10,
        totalFlashcardsReviewed,
        streakDays: maxStreak,
        recentStudySets: recentStudySetsResult.data || [],
        recentQuizAttempts: recentAttemptsResult.data || [],
      },
    })
  })
}
