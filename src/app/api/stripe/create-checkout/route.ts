import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { getStripe } from '@/lib/stripe'

const VALID_PLANS = ['contractor', 'professional'] as const
type PlanId = typeof VALID_PLANS[number]

function getPriceId(plan: PlanId): string | undefined {
  if (plan === 'professional') return process.env.STRIPE_PROFESSIONAL_PRICE_ID
  return process.env.STRIPE_PRICE_ID // contractor uses the original env var
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowSec: 60, prefix: 'stripe-checkout' })
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const plan: PlanId = VALID_PLANS.includes(body.plan) ? body.plan : 'contractor'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const priceId = getPriceId(plan)
    if (!appUrl || !priceId) {
      console.error(`Missing NEXT_PUBLIC_APP_URL or price ID for plan: ${plan}`)
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_tier: plan },
      },
      payment_method_collection: 'always',
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/billing`,
      metadata: { supabase_user_id: user.id, plan_tier: plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
