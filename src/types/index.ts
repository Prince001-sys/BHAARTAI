export type UserRole = 'student' | 'admin' | 'super_admin'
export type PlanType = 'free' | 'pro'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type FileType = 'pdf' | 'image' | 'youtube' | 'text'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ChatLanguage = 'english' | 'hindi' | 'hinglish'
export type MessageRole = 'user' | 'assistant'
export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending'

export interface User {
  id: string
  email: string | null
  phone: string | null
  full_name: string | null
  avatar_url: string | null
  plan_type: PlanType
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: PlanType
  status: SubscriptionStatus
  start_date: string | null
  end_date: string | null
  razorpay_subscription_id: string | null
  razorpay_order_id: string | null
  created_at: string
  updated_at: string
}

export interface Upload {
  id: string
  user_id: string
  title: string
  file_url: string | null
  file_type: FileType
  file_size: number | null
  original_filename: string | null
  processing_status: ProcessingStatus
  extracted_text: string | null
  youtube_url: string | null
  youtube_video_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface StudySet {
  id: string
  user_id: string
  upload_id: string | null
  title: string
  description: string | null
  subject: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  upload?: Upload
  ai_notes?: AiNotes | null
}

export interface AiNotes {
  id: string
  study_set_id: string
  user_id: string
  summary: string | null
  detailed_notes: string | null
  revision_notes: string | null
  exam_notes: string | null
  generation_status: GenerationStatus
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  study_set_id: string
  user_id: string
  question: string
  answer: string
  difficulty: Difficulty
  is_learned: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  study_set_id: string
  user_id: string
  title: string
  difficulty: Difficulty
  quiz_type: 'mcq' | 'short_answer'
  total_questions: number
  generation_status: GenerationStatus
  created_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string
  explanation: string | null
  order_index: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  percentage: number
  answers: Record<string, string> | null
  completed_at: string
}

export interface Chat {
  id: string
  user_id: string
  study_set_id: string | null
  title: string
  language: ChatLanguage
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  user_id: string
  role: MessageRole
  content: string
  tokens_used: number | null
  created_at: string
}

export interface LearningProgress {
  id: string
  user_id: string
  study_set_id: string | null
  minutes_studied: number
  quiz_score: number | null
  flashcards_reviewed: number
  flashcards_learned: number
  last_activity: string
  streak_days: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_provider: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  created_at: string
}

export interface ApiUsage {
  id: string
  user_id: string
  provider: string
  endpoint: string
  tokens_used: number
  cost_usd: number | null
  created_at: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface DashboardStats {
  totalStudySets: number
  totalUploads: number
  totalMinutesStudied: number
  averageQuizScore: number
  totalFlashcardsReviewed: number
  streakDays: number
  recentStudySets: StudySet[]
  recentQuizAttempts: QuizAttempt[]
}

export interface PricingPlan {
  name: string
  price: number
  currency: string
  period: string
  features: string[]
  isPopular?: boolean
  planType: PlanType
}
