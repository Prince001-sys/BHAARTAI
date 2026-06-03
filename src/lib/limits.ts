// Plan limits per security doc
export const FREE_PLAN_LIMITS = {
  uploadsPerDay: 50,
  aiQuestionsPerDay: 100,
}

export const PRO_PLAN_LIMITS = {
  uploadsPerDay: Infinity,
  aiQuestionsPerDay: Infinity,
}

// Rate limits per API endpoint (requests per minute)
export const RATE_LIMITS = {
  aiChat: 20,
  quizGeneration: 5,
  uploads: 10,
  loginOtp: 5,
}

/**
 * Check if user has exceeded their daily upload limit.
 * Uses api_usage table to count today's uploads.
 */
export async function checkUploadLimit(
  userId: string,
  planType: string,
  supabaseServiceClient: ReturnType<typeof import('@/lib/supabase/middleware').createServiceClient>
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (planType === 'pro') {
    return { allowed: true, used: 0, limit: Infinity }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabaseServiceClient
    .from('uploads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())

  const used = count || 0
  const limit = FREE_PLAN_LIMITS.uploadsPerDay

  return {
    allowed: used < limit,
    used,
    limit,
  }
}

/**
 * Check if user has exceeded their daily AI question limit.
 */
export async function checkAiQuestionLimit(
  userId: string,
  planType: string,
  supabaseServiceClient: ReturnType<typeof import('@/lib/supabase/middleware').createServiceClient>
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (planType === 'pro') {
    return { allowed: true, used: 0, limit: Infinity }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data } = await supabaseServiceClient
    .from('api_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())

  const used = data?.length || 0
  const limit = FREE_PLAN_LIMITS.aiQuestionsPerDay

  return {
    allowed: used < limit,
    used,
    limit,
  }
}
