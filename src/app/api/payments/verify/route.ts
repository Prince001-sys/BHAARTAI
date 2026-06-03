import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/middleware'
import crypto from 'crypto'
import { analytics } from '@/lib/posthog'

// POST /api/payments/verify — verify payment after checkout
export async function POST(request: Request) {
  return withAuth(async ({ user }) => {
    let body: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment parameters.' }, { status: 400 })
    }

    // Verify signature using HMAC SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed. No money has been charged.' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Save payment record
    await serviceClient.from('payments').insert({
      user_id: user.id,
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      payment_provider: 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })

    // Activate Pro subscription
    const { data: existingSub } = await serviceClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (existingSub) {
      await serviceClient
        .from('subscriptions')
        .update({ plan: 'pro', status: 'active', start_date: startDate, end_date: endDate, razorpay_order_id })
        .eq('user_id', user.id)
    } else {
      await serviceClient.from('subscriptions').insert({
        user_id: user.id,
        plan: 'pro',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        razorpay_order_id,
      })
    }

    // Update user plan_type
    await serviceClient.from('users').update({ plan_type: 'pro' }).eq('id', user.id)

    analytics.subscriptionPurchased(user.id, 'pro', 99)

    return NextResponse.json({ data: { message: 'Subscription activated. Welcome to Pro!', plan: 'pro' } })
  })
}
