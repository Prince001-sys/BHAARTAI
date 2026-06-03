import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'StudyFlow AI — AI Study Copilot for Indian Students',
  description:
    'Upload PDFs, YouTube videos, and images. Get AI-generated notes, flashcards, quizzes, and a personal AI tutor. The smartest way to study for JEE, NEET & more.',
  keywords: ['JEE preparation', 'NEET study', 'AI notes', 'flashcards', 'quiz generator', 'study assistant India'],
  authors: [{ name: 'StudyFlow AI' }],
  openGraph: {
    title: 'StudyFlow AI — Upload anything. Learn everything.',
    description: 'AI-powered study assistant for Indian students. Notes, flashcards, quizzes & AI chat from any study material.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PostHogProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
