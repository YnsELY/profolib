import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

// IMPORTANT: Deployer cette fonction avec --no-verify-jwt
// supabase functions deploy stripe-webhook --no-verify-jwt

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Signature manquante' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(JSON.stringify({ error: 'Signature invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const courseRequestId = session.metadata?.course_request_id
    const studentId = session.metadata?.student_id

    if (!courseRequestId) {
      console.error('Missing course_request_id in metadata')
      return new Response(JSON.stringify({ error: 'Metadata manquante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Recuperer les details de la demande pour les montants
    const { data: courseRequest, error: fetchError } = await supabaseAdmin
      .from('course_requests')
      .select('student_price, teacher_revenue, platform_commission')
      .eq('id', courseRequestId)
      .single()

    if (fetchError) {
      console.error('Error fetching course request:', fetchError)
    }

    // Mettre a jour le statut de paiement de la demande
    const { error: updateError } = await supabaseAdmin
      .from('course_requests')
      .update({ payment_status: 'paid' })
      .eq('id', courseRequestId)

    if (updateError) {
      console.error('Error updating payment status:', updateError)
      return new Response(JSON.stringify({ error: 'Erreur mise a jour' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Creer l'enregistrement de paiement
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        course_request_id: courseRequestId,
        student_id: studentId,
        amount: courseRequest?.student_price || (session.amount_total || 0) / 100,
        platform_commission: courseRequest?.platform_commission || 0,
        teacher_revenue: courseRequest?.teacher_revenue || 0,
        payment_method: 'stripe',
        payment_intent_id: session.payment_intent as string,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
    }

    console.log(`Payment confirmed for course request ${courseRequestId}`)
  }

  if (event.type === 'checkout.session.expired') {
    // Nettoyer les demandes non payees quand la session Stripe expire
    const session = event.data.object as Stripe.Checkout.Session
    const courseRequestId = session.metadata?.course_request_id

    if (courseRequestId) {
      const { error } = await supabaseAdmin
        .from('course_requests')
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq('id', courseRequestId)
        .eq('payment_status', 'pending')

      if (error) {
        console.error('Error cancelling expired request:', error)
      } else {
        console.log(`Expired session cleaned up for request ${courseRequestId}`)
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
