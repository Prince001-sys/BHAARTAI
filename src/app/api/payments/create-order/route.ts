import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import Razorpay from 'razorpay'

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Payment service not configured.')
  }
  return new Razorpay({ key_id, key_secret })
}

// POST /api/payments/create-order — create Razorpay order for Pro plan
export async function POST() {
  return withAuth(async ({ user }) => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment service not configured.' },
        { status: 503 }
      )
    }

    try {
      const razorpay = getRazorpayInstance()
      const order = await razorpay.orders.create({
        amount: 9900, // ₹99 in paise
        currency: 'INR',
        receipt: `studyflow_${user.id}_${Date.now()}`,
        notes: {
          userId: user.id,
          plan: 'pro',
        },
      })

      return NextResponse.json({
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        },
      })
    } catch (err) {
      logger.error('[POST /payments/create-order]', err)
      return NextResponse.json(
        { error: 'Payment failed. No money has been charged.' },
        { status: 500 }
      )
    }
  })
}
