'use client'

import { useSubscriptionStore } from '@/store/subscriptionStore'
import { toast } from 'sonner'

export default function PricingPage() {
  const { plan, setPlan, uploadsUsedToday } = useSubscriptionStore()

  const handleUpgrade = () => {
    // Mock upgrade flow
    const confirm = window.confirm(
      'Redirecting to payment gateway for Pro Plan (₹99/month). Continue?'
    )
    if (confirm) {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: 'Processing payment...',
          success: () => {
            setPlan('pro')
            // Add a mock unlimited upload just to sync the UI smoothly
            return 'Successfully upgraded to Pro! Unlimited features unlocked.'
          },
          error: 'Payment failed.',
        }
      )
    }
  }

  const handleCancel = () => {
    const confirm = window.confirm(
      'Are you sure you want to cancel your Pro subscription? You will lose unlimited access.'
    )
    if (confirm) {
      setPlan('free')
      toast.success('Subscription cancelled. You are now on the Free plan.')
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#121212] flex flex-col selection:bg-white selection:text-black">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Upgrade your study game</h2>
          <p className="text-gray-400 text-lg">
            Unlock the full power of StudyFlow AI to learn faster and retain more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-[#1A1A1A] rounded-3xl p-8 border border-white/10 flex flex-col hover:border-white/20 transition-all">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Free</h3>
            <div className="flex items-end gap-1 mb-8">
              <span className="text-5xl font-extrabold text-white tracking-tighter">₹0</span>
              <span className="text-gray-500 font-medium pb-1">/month</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-gray-300">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <span>3 Uploads per day</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <span>20 AI Tutor Questions per day</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <span>Basic Notes & Flashcards</span>
              </li>
            </ul>
            <button
              disabled={plan === 'free'}
              className="w-full py-4 rounded-xl font-bold transition-all border border-white/10 cursor-not-allowed disabled:opacity-50 text-gray-400 bg-transparent"
            >
              {plan === 'free' ? 'Current Plan' : 'Free Plan'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-[#1A1A1A] to-[#121212] rounded-3xl p-8 border border-blue-500/50 flex flex-col shadow-2xl relative scale-100 md:scale-105 z-10 hover:border-blue-400 transition-all shadow-blue-900/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-md">
              Best Value
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Pro</h3>
            <div className="flex items-end gap-1 mb-8">
              <span className="text-5xl font-extrabold text-white tracking-tighter">₹99</span>
              <span className="text-gray-400 font-medium pb-1">/month</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-white font-medium">
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Unlimited Uploads (PDF & YouTube)</span>
              </li>
              <li className="flex items-center gap-3 text-white font-medium">
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Unlimited AI Tutor Questions</span>
              </li>
              <li className="flex items-center gap-3 text-white font-medium">
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Custom Mock Quizzes (Easy/Med/Hard)</span>
              </li>
              <li className="flex items-center gap-3 text-white font-medium">
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Priority Support</span>
              </li>
            </ul>
            {plan === 'pro' ? (
              <button
                onClick={handleCancel}
                className="w-full py-4 rounded-xl font-bold transition-all cursor-pointer bg-white text-black hover:bg-gray-200 shadow-md"
              >
                Manage Subscription (Pro Active)
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full py-4 rounded-xl font-bold transition-all cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-900/20"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* Current Status Footer */}
        <div className="mt-20 max-w-2xl mx-auto bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-white font-bold mb-1 tracking-tight">Your current usage</h4>
            <p className="text-gray-400 text-sm">
              {plan === 'pro'
                ? "You have unlimited uploads and AI questions. Keep studying!"
                : `You have used ${uploadsUsedToday} of 3 free uploads today.`}
            </p>
          </div>
          {plan === 'free' && (
             <div className="w-full sm:w-1/3 bg-black rounded-full h-2 overflow-hidden border border-white/10">
               <div className="bg-white h-full" style={{ width: `${Math.min(100, (uploadsUsedToday / 3) * 100)}%` }} />
             </div>
          )}
        </div>
      </main>
    </div>
  )
}
