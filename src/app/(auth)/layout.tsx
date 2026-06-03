import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — StudyFlow AI',
  description: 'Sign in to StudyFlow AI and start learning smarter with AI-powered notes, flashcards, and quizzes.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 text-white selection:bg-white selection:text-black">
      <div className="relative w-full">
        {children}
      </div>
    </div>
  )
}
