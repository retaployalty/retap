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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    const params = Object.fromEntries(url.searchParams)
    const merchantId = req.headers.get('x-merchant-id')

    // POST /customers
    if (path === 'customers' && req.method === 'POST') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { data, error } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('uid', params.uid)
        .eq('issuing_merchant_id', merchantId)
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
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .insert({
          id: cardId,
          uid,
          customer_id: customerId,
          issuing_merchant_id: merchantId,
        })
        .select()
        .single()

      if (cardError) {
        return new Response(
          JSON.stringify({ error: cardError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Crea la relazione card_merchants
      const { error: cmError } = await supabaseClient
        .from('card_merchants')
        .insert({
          card_id: card.id,
          merchant_id: merchantId,
        })

      if (cmError) {
        return new Response(
          JSON.stringify({ error: cmError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(card),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /balance?cardId=XXX
    if (path === 'balance' && req.method === 'GET') {
      const { data: balances, error } = await supabaseClient
        .rpc('get_card_balance', {
          card_id: params.cardId
        })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ balances }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /tx
    if (path === 'tx' && req.method === 'POST') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { cardId, points } = await req.json()

      // 1. Get the card_merchants relationship
      const { data: cardMerchant, error: cmError } = await supabaseClient
        .from('card_merchants')
        .select('id')
        .eq('card_id', cardId)
        .eq('merchant_id', merchantId)
        .single()

      if (cmError) {
        // If relationship doesn't exist, create it
        const { data: newCardMerchant, error: createError } = await supabaseClient
          .from('card_merchants')
          .insert({
            card_id: cardId,
            merchant_id: merchantId,
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create transaction with new relationship
        const { data, error } = await supabaseClient
          .from('transactions')
          .insert({
            id: crypto.randomUUID(),
            card_merchant_id: newCardMerchant.id,
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

      // Create transaction with existing relationship
      const { data, error } = await supabaseClient
        .from('transactions')
        .insert({
          id: crypto.randomUUID(),
          card_merchant_id: cardMerchant.id,
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

    // GET /merchants
    if (path === 'merchants' && req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('merchants')
        .select('id, name, industry, address, country, created_at')
        .order('name', { ascending: true })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ merchants: data }),
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