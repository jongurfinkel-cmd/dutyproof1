import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { getStripe } from '@/lib/stripe'

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
    const isAnnual = body.annual === true

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const monthlyPriceId = process.env.STRIPE_PRICE_ID
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID
    if (!appUrl || !monthlyPriceId) {
      console.error('Missing NEXT_PUBLIC_APP_URL or STRIPE_PRICE_ID')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const priceId = isAnnual && annualPriceId ? annualPriceId : monthlyPriceId

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
        metadata: { supabase_user_id: user.id },
      },
      payment_method_collection: 'always',
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/billing`,
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
