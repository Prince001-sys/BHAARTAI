import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white selection:text-black flex flex-col font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">StudyFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
        </div>
        <Link href="/login">
          <button className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all cursor-pointer">
            Get Started
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          StudyFlow AI 2.0 is now live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
          Learn faster with <br className="hidden md:block"/> AI-powered study sets.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          Upload any PDF or YouTube lecture. We instantly generate detailed notes, smart flashcards, and interactive mock quizzes to cut your study time in half.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link href="/login">
            <button className="bg-white text-black px-8 py-4 rounded-full text-base font-bold hover:bg-gray-200 transition-all cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2">
              Start learning for free
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </Link>
          <Link href="#demo">
            <button className="px-8 py-4 rounded-full text-base font-bold text-white border border-white/20 hover:bg-white/10 transition-all cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              Watch Demo
            </button>
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-24 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 h-[500px]"></div>
          <div className="w-full h-[500px] bg-[#121212] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-[#1A1A1A]">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            {/* Split Screen Mockup */}
            <div className="mt-12 h-full flex">
              <div className="w-1/2 border-r border-white/10 p-8 flex flex-col items-center justify-center text-gray-600">
                <span className="material-symbols-outlined text-6xl mb-4">picture_as_pdf</span>
                <p>Lecture_Notes_Ch4.pdf</p>
              </div>
              <div className="w-1/2 p-8 bg-[#18181B] flex flex-col gap-4">
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-white/5 rounded"></div>
                <div className="h-4 w-5/6 bg-white/5 rounded"></div>
                <div className="h-4 w-4/6 bg-white/5 rounded"></div>
                <div className="mt-8 h-32 w-full bg-[#27272A] rounded-lg border border-white/10 flex flex-col justify-center items-center gap-2 shadow-inner">
                  <span className="material-symbols-outlined text-white/50 text-3xl">style</span>
                  <span className="text-white/50 font-medium text-sm">Flashcard Generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 px-8 max-w-7xl mx-auto w-full border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to ace your exams.</h2>
          <p className="text-gray-400">Built for modern students who want to study smarter, not harder.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121212] border border-white/10 p-8 rounded-2xl hover:border-white/30 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-white text-2xl">description</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Summaries</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              We extract text from your PDFs and YouTube videos, generating structured summaries and key takeaways automatically.
            </p>
          </div>
          
          <div className="bg-[#121212] border border-white/10 p-8 rounded-2xl hover:border-white/30 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-white text-2xl">style</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Flashcards</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              Convert any document into an interactive deck of flashcards. Master definitions and concepts with active recall.
            </p>
          </div>
          
          <div className="bg-[#121212] border border-white/10 p-8 rounded-2xl hover:border-white/30 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-white text-2xl">quiz</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Mock Quizzes</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              Test your knowledge before the real exam. Our AI creates personalized MCQs based exactly on your syllabus.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>© 2026 StudyFlow AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
