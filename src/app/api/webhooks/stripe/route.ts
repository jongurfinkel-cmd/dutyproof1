import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPeriodEnd(subscription: any): string | null {
  // current_period_end moved in Stripe API 2024+ — check both locations
  const ts =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end ??
    null
  return ts ? new Date(ts * 1000).toISOString() : null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId || !session.customer || !session.subscription) break

      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription as string
      )

      await admin.from('profiles').upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: subscription.status,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: getPeriodEnd(subscription),
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      await admin
        .from('profiles')
        .update({
          subscription_status: subscription.status,
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          current_period_end: getPeriodEnd(subscription),
        })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      await admin
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('id', userId)
      break
    }

    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any
      const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
      if (!subscriptionId) break

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId as string)
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      await admin
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
