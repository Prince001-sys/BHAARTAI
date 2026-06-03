import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/middleware'
import crypto from 'crypto'
import { analytics } from '@/lib/posthog'

// POST /api/payments/webhook — Razorpay webhook (no auth required, uses HMAC)
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  if (expectedSignature !== signature && webhookSecret) {
    console.error('[Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  let event: {
    event: string
    payload: {
      payment?: {
        entity: {
          id: string
          order_id: string
          amount: number
          status: string
          notes?: { userId?: string; plan?: string }
        }
      }
      subscription?: {
        entity: {
          id: string
          plan_id: string
          customer_id: string
          status: string
          notes?: { userId?: string }
        }
      }
    }
  }

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment?.entity
    const userId = payment?.notes?.userId

    if (userId && payment) {
      // Update payment record
      await serviceClient
        .from('payments')
        .update({ status: 'captured', razorpay_payment_id: payment.id })
        .eq('razorpay_order_id', payment.order_id)

      // Update user to Pro
      await serviceClient.from('users').update({ plan_type: 'pro' }).eq('id', userId)

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await serviceClient
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            plan: 'pro',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: endDate,
          },
          { onConflict: 'user_id' }
        )

      analytics.subscriptionPurchased(userId, 'pro', payment.amount / 100)
    }
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment?.entity
    if (payment) {
      await serviceClient
        .from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', payment.order_id)
    }
  }

  return NextResponse.json({ received: true })
}
