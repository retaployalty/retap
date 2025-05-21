import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-merchant-id',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const merchantId = req.headers.get('x-merchant-id')
    if (!merchantId) {
      throw new Error('Missing merchant ID')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    const params = Object.fromEntries(url.searchParams)

    // POST /customers
    if (path === 'customers' && req.method === 'POST') {
      const { data, error } = await supabaseClient
        .from('customers')
        .insert({
          merchant_id: merchantId,
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /cards?uid=XXX
    if (path === 'cards' && req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('uid', params.uid)
        .eq('merchant_id', merchantId)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /cards
    if (path === 'cards' && req.method === 'POST') {
      const { cardId, uid, customerId } = await req.json()

      // Verifica se esiste già una carta con questo UID
      const { data: existingCard } = await supabaseClient
        .from('cards')
        .select('id')
        .eq('uid', uid)
        .single()

      if (existingCard) {
        // Se esiste, restituisci la carta esistente
        return new Response(
          JSON.stringify(existingCard),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Se non esiste, crea una nuova carta
      const { data, error } = await supabaseClient
        .from('cards')
        .insert({
          id: cardId,
          uid,
          customer_id: customerId,
          merchant_id: merchantId,
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /balance?cardId=XXX
    if (path === 'balance' && req.method === 'GET') {
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('id')
        .eq('id', params.cardId)
        .single()

      if (cardError) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: transactions, error: txError } = await supabaseClient
        .from('transactions')
        .select('points')
        .eq('card_id', params.cardId)

      if (txError) {
        return new Response(
          JSON.stringify({ error: txError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const balance = transactions.reduce((sum, tx) => sum + tx.points, 0)

      return new Response(
        JSON.stringify({ balance }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /tx
    if (path === 'tx' && req.method === 'POST') {
      const { cardId, points } = await req.json()

      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('id')
        .eq('id', cardId)
        .eq('merchant_id', merchantId)
        .single()

      if (cardError) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('transactions')
        .insert({
          id: crypto.randomUUID(),
          card_id: cardId,
          merchant_id: merchantId,
          points,
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 