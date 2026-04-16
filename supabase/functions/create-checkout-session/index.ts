import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Mapping duree -> Stripe Price ID
const PRICE_MAP: Record<number, string> = {
  10: 'price_1TMbVTIVxnAoLObYLpKWZ7aE',
  20: 'price_1TMbXNIVxnAoLObYRA4F1yFL',
  30: 'price_1TMbYAIVxnAoLObYNP6rfdbm',
  45: 'price_1TMbZ5IVxnAoLObYY9nuczoY',
  60: 'price_1TMbZrIVxnAoLObYck1DwBM1',
  120: 'price_1TMbaLIVxnAoLObYzCnpxfDT',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authentification via le token de l'utilisateur
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorise' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      studentName,
      subject,
      level,
      description,
      durationMinutes,
      studentPrice,
      teacherRevenue,
      platformCommission,
    } = body

    // Verifier que la duree a un prix Stripe associe
    const priceId = PRICE_MAP[durationMinutes]
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Duree non valide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Creer la demande de cours avec payment_status='pending'
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: courseRequest, error: insertError } = await supabaseAdmin
      .from('course_requests')
      .insert({
        student_id: user.id,
        student_name: studentName,
        subject,
        level,
        description,
        status: 'pending',
        duration_minutes: durationMinutes,
        student_price: studentPrice,
        teacher_revenue: teacherRevenue,
        platform_commission: platformCommission,
        payment_status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !courseRequest) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la creation de la demande' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // URL de retour apres paiement
    const origin = req.headers.get('origin') || 'https://profolib.com'

    // Creer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${origin}/student/waiting/${courseRequest.id}`,
      cancel_url: `${origin}/student/request?cancelled=true`,
      metadata: {
        course_request_id: courseRequest.id,
        student_id: user.id,
      },
      customer_email: user.email,
    })

    return new Response(
      JSON.stringify({ url: session.url, requestId: courseRequest.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Checkout error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
