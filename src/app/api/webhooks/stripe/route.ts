import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  // current_period_end moved to SubscriptionItem in Stripe API 2024+
  const itemEnd = subscription.items?.data?.[0]?.current_period_end
  if (typeof itemEnd === 'number') return new Date(itemEnd * 1000).toISOString()
  // Fallback for older API versions where it lived on the subscription root
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- older Stripe API versions had this on the root
  const rootEnd = (subscription as any).current_period_end
  if (typeof rootEnd === 'number') return new Date(rootEnd * 1000).toISOString()
  return null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      webhookSecret
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

      const { error: upsertError } = await admin.from('profiles').upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: subscription.status,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: getPeriodEnd(subscription),
      })
      if (upsertError) console.error('Stripe checkout.session.completed upsert error:', upsertError)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      const { error: subUpdateError } = await admin
        .from('profiles')
        .update({
          subscription_status: subscription.status,
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          current_period_end: getPeriodEnd(subscription),
        })
        .eq('id', userId)
      if (subUpdateError) console.error('Stripe subscription.updated error:', subUpdateError)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      const { error: deleteError } = await admin
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('id', userId)
      if (deleteError) console.error('Stripe subscription.deleted error:', deleteError)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId =
        invoice.parent?.subscription_details?.subscription ?? null
      if (!subscriptionId) break

      const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
      const subscription = await getStripe().subscriptions.retrieve(subId)
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      const { error: pastDueError } = await admin
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('id', userId)
      if (pastDueError) console.error('Stripe invoice.payment_failed error:', pastDueError)
      break
    }
  }

  return NextResponse.json({ received: true })
}
