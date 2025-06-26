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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const path = pathParts.slice(1).join('/')
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

      // Verifica che il merchant esista
      const { data: merchant, error: merchantError } = await supabaseClient
        .from('merchants')
        .select('id')
        .eq('id', merchantId)
        .single()

      if (merchantError || !merchant) {
        return new Response(
          JSON.stringify({ error: 'Merchant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Crea sempre un nuovo customer
      const { data: customer, error } = await supabaseClient
        .from('customers')
        .insert({
          id: crypto.randomUUID(),
          // Altri campi del customer possono essere aggiunti qui se necessario
        })
        .select('id')
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: `Error creating customer: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          id: customer.id,
          message: 'New customer created successfully'
        }),
        { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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

      const uid = params.uid;
      if (!uid) {
        return new Response(
          JSON.stringify({ error: 'Missing UID parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prima verifichiamo se la carta esiste senza filtri
      const { data: allCards, error: allCardsError } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('uid', uid);

      if (allCardsError) {
        return new Response(
          JSON.stringify({ error: allCardsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!allCards || allCards.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // La carta esiste, verifichiamo se è già associata al merchant
      const card = allCards[0];
      const { data: cardMerchant, error: cmError } = await supabaseClient
        .from('card_merchants')
        .select('*')
        .eq('card_id', card.id)
        .eq('merchant_id', merchantId)
        .single();

      if (cmError && cmError.code !== 'PGRST116') { // PGRST116 = no rows returned
        return new Response(
          JSON.stringify({ error: cmError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Se la carta non è associata al merchant, la associamo
      if (!cardMerchant) {
        const { error: insertError } = await supabaseClient
          .from('card_merchants')
          .insert({
            card_id: card.id,
            merchant_id: merchantId,
          });

        if (insertError) {
          return new Response(
            JSON.stringify({ error: insertError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({
          ...card,
          is_new_merchant: !cardMerchant
        }),
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

      // Validazione dei parametri
      if (!cardId || !uid || !customerId) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: cardId, uid, customerId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verifica se esiste già una carta con questo UID
      const { data: existingCard, error: existingError } = await supabaseClient
        .from('cards')
        .select('id, customer_id, issuing_merchant_id')
        .eq('uid', uid)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        return new Response(
          JSON.stringify({ error: `Error checking existing card: ${existingError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (existingCard) {
        // Se esiste, verifica che sia associata al customer corretto
        if (existingCard.customer_id !== customerId) {
          return new Response(
            JSON.stringify({ 
              error: 'Card UID already exists with different customer',
              existingCardId: existingCard.id 
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Se esiste e appartiene al customer corretto, restituisci la carta esistente
        return new Response(
          JSON.stringify({
            ...existingCard,
            message: 'Card already exists for this customer'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verifica che il customer esista
      const { data: customer, error: customerError } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .single()

      if (customerError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Customer not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verifica che il merchant esista
      const { data: merchant, error: merchantError } = await supabaseClient
        .from('merchants')
        .select('id')
        .eq('id', merchantId)
        .single()

      if (merchantError || !merchant) {
        return new Response(
          JSON.stringify({ error: 'Merchant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Crea la nuova carta
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
          JSON.stringify({ error: `Error creating card: ${cardError.message}` }),
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
        // Se fallisce la creazione della relazione, elimina la carta creata
        await supabaseClient
          .from('cards')
          .delete()
          .eq('id', card.id)
        
        return new Response(
          JSON.stringify({ error: `Error creating card-merchant relationship: ${cmError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          ...card,
          message: 'Card created successfully'
        }),
        { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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
      const { data: merchants, error } = await supabaseClient
        .from('merchants')
        .select(`
          id,
          name,
          industry,
          address,
          logo_url,
          cover_image_url,
          hours,
          latitude,
          longitude,
          rewards (*),
          checkpoint_offers (
            *,
            steps:checkpoint_steps (
              *,
              reward:checkpoint_rewards (*)
            )
          )
        `)
        .order('name')

      if (error) throw error

      return new Response(
        JSON.stringify({ merchants }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // POST /redeemed_rewards
    if (path === 'redeemed_rewards' && req.method === 'POST') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { customer_id, reward_id, points_spent, status } = await req.json()

      // Verifica che il premio esista e appartenga al merchant
      const { data: reward, error: rewardError } = await supabaseClient
        .from('rewards')
        .select('*')
        .eq('id', reward_id)
        .eq('merchant_id', merchantId)
        .single()

      if (rewardError || !reward) {
        return new Response(
          JSON.stringify({ error: 'Reward not found or not authorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verifica che il cliente esista
      const { data: customer, error: customerError } = await supabaseClient
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .single()

      if (customerError || !customer) {
        return new Response(
          JSON.stringify({ error: 'Customer not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Trova la carta del cliente per questo merchant
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('id')
        .eq('customer_id', customer_id)
        .single()

      if (cardError || !card) {
        return new Response(
          JSON.stringify({ error: 'Card not found for customer' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Trova o crea la relazione card_merchants
      const { data: cardMerchant, error: cmError } = await supabaseClient
        .from('card_merchants')
        .select('id')
        .eq('card_id', card.id)
        .eq('merchant_id', merchantId)
        .single()

      if (cmError && cmError.code !== 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Error finding card-merchant relationship' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Se la relazione non esiste, la creiamo
      let cardMerchantId = cardMerchant?.id
      if (!cardMerchantId) {
        const { data: newCardMerchant, error: createError } = await supabaseClient
          .from('card_merchants')
          .insert({
            card_id: card.id,
            merchant_id: merchantId,
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: 'Error creating card-merchant relationship' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        cardMerchantId = newCardMerchant.id
      }

      // Crea la transazione per scalare i punti
      const { error: txError } = await supabaseClient
        .from('transactions')
        .insert({
          card_merchant_id: cardMerchantId,
          points: -points_spent, // Punti negativi per scalare
        })

      if (txError) {
        return new Response(
          JSON.stringify({ error: 'Error creating transaction' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Crea il record del premio riscattato
      const { data, error } = await supabaseClient
        .from('redeemed_rewards')
        .insert({
          customer_id,
          merchant_id: merchantId,
          reward_id,
          points_spent,
          status: status || 'pending',
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
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /checkpoints/advance
    if (path === 'checkpoints/advance' && req.method === 'POST') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { cardId, offerId } = await req.json()

      // Get the customer ID from the card
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('customer_id')
        .eq('id', cardId)
        .single()

      if (cardError || !card) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the advance_customer_checkpoint function
      const { data, error } = await supabaseClient
        .rpc('advance_customer_checkpoint', {
          p_customer_id: card.customer_id,
          p_merchant_id: merchantId,
          p_offer_id: offerId
        })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // La funzione SQL restituisce una lista, ma noi vogliamo il primo elemento
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /checkpoints/rewind
    if (path === 'checkpoints/rewind' && req.method === 'POST') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { cardId, offerId } = await req.json()

      // Get the customer ID from the card
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('customer_id')
        .eq('id', cardId)
        .single()

      if (cardError || !card) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get current step and total steps
      const { data: checkpoint, error: checkpointError } = await supabaseClient
        .from('customer_checkpoints')
        .select('current_step')
        .eq('customer_id', card.customer_id)
        .eq('merchant_id', merchantId)
        .eq('offer_id', offerId)
        .single()

      if (checkpointError) {
        return new Response(
          JSON.stringify({ error: 'Checkpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get total steps from the offer
      const { data: offer, error: offerError } = await supabaseClient
        .from('checkpoint_offers')
        .select('total_steps')
        .eq('id', offerId)
        .single()

      if (offerError) {
        return new Response(
          JSON.stringify({ error: 'Offer not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate previous step
      let previousStep = checkpoint.current_step - 1
      if (previousStep < 1) {
        previousStep = offer.total_steps
      }

      // Update customer checkpoint
      const { data: updatedCheckpoint, error: updateError } = await supabaseClient
        .from('customer_checkpoints')
        .update({ current_step: previousStep })
        .eq('customer_id', card.customer_id)
        .eq('merchant_id', merchantId)
        .eq('offer_id', offerId)
        .select()
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          current_step: previousStep,
          total_steps: offer.total_steps
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /rewards-and-checkpoints?merchantId=XXX
    if (path === 'rewards-and-checkpoints' && req.method === 'GET') {
      const merchantIdParam = params.merchantId;
      const cardId = params.cardId;
      
      if (!merchantIdParam) {
        return new Response(
          JSON.stringify({ error: 'Missing merchantId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!cardId) {
        return new Response(
          JSON.stringify({ error: 'Missing cardId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get customer ID from card
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('customer_id')
        .eq('id', cardId)
        .single();

      if (cardError) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Rewards
      const { data: rewards, error: rewardsError } = await supabaseClient
        .from('rewards')
        .select('id, name, description, image_path, price_coins, is_active')
        .eq('merchant_id', merchantIdParam);
      if (rewardsError) {
        return new Response(
          JSON.stringify({ error: rewardsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Checkpoint Offers
      const { data: offers, error: offersError } = await supabaseClient
        .from('checkpoint_offers')
        .select('id, name, description, total_steps')
        .eq('merchant_id', merchantIdParam);
      if (offersError) {
        return new Response(
          JSON.stringify({ error: offersError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Get current step for this customer and merchant
      const { data: checkpoint, error: checkpointError } = await supabaseClient
        .from('customer_checkpoints')
        .select('current_step, offer_id')
        .eq('customer_id', card.customer_id)
        .eq('merchant_id', merchantIdParam)
        .single();

      // 4. For each offer, get steps and rewards
      const offersWithSteps = await Promise.all(
        (offers || []).map(async (offer) => {
          const { data: steps, error: stepsError } = await supabaseClient
            .from('checkpoint_steps')
            .select('id, step_number, reward_id, offer_id')
            .eq('offer_id', offer.id)
            .order('step_number', { ascending: true });
          if (stepsError) {
            throw new Error(stepsError.message);
          }
          // For each step, if reward_id, fetch reward details
          const stepsWithReward = await Promise.all(
            (steps || []).map(async (step) => {
              let reward = null;
              if (step.reward_id) {
                const { data: rewardData, error: rewardError } = await supabaseClient
                  .from('checkpoint_rewards')
                  .select('id, name, description, icon')
                  .eq('id', step.reward_id)
                  .single();
                if (rewardError) throw new Error(rewardError.message);
                reward = rewardData;
              }
              return { ...step, reward };
            })
          );
          return { 
            ...offer, 
            steps: stepsWithReward,
            current_step: checkpoint?.offer_id === offer.id ? checkpoint.current_step : 0
          };
        })
      );

      return new Response(
        JSON.stringify({ 
          rewards, 
          checkpoint_offers: offersWithSteps,
          current_step: checkpoint?.current_step || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /merchant-details?merchantId=XXX&cardId=XXX
    if (path === 'merchant-details' && req.method === 'GET') {
      const merchantId = params.merchantId
      const cardId = params.cardId

      if (!merchantId) {
        throw new Error('Merchant ID is required')
      }

      // Get merchant details
      const { data: merchant, error: merchantError } = await supabaseClient
        .from('merchants')
        .select(`
          *,
          rewards (*),
          checkpoint_offers (
            *,
            steps:checkpoint_steps (
              *,
              reward:checkpoint_rewards (*)
            )
          )
        `)
        .eq('id', merchantId)
        .single()

      if (merchantError) throw merchantError

      // If cardId is provided, get balance and checkpoint progress
      let balance = 0
      let currentStep = 0
      let rewardSteps: number[] = []

      if (cardId) {
        // Get card balance
        const { data: balanceData, error: balanceError } = await supabaseClient
          .rpc('get_card_balance', { card_id: cardId })

        if (balanceError) throw balanceError

        if (balanceData) {
          // Find the balance for this merchant
          const merchantBalance = balanceData.find((b: any) => b.merchant_id === merchantId)
          if (merchantBalance) {
            balance = merchantBalance.balance
            currentStep = merchantBalance.checkpoints_current
            rewardSteps = merchantBalance.reward_steps
          }
        }
      }

      return new Response(
        JSON.stringify({
          merchant,
          balance,
          currentStep,
          rewardSteps
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // GET /merchant-history?merchantId=XXX&cardId=XXX
    if (path === 'merchant-history' && req.method === 'GET') {
      const merchantId = params.merchantId;
      const cardId = params.cardId;

      if (!merchantId || !cardId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchantId or cardId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get card_merchant_id and customer_id
      const { data: cardData, error: cardError } = await supabaseClient
        .from('cards')
        .select('customer_id')
        .eq('id', cardId)
        .single();

      if (cardError) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get card_merchant_id
      const { data: cardMerchant, error: cmError } = await supabaseClient
        .from('card_merchants')
        .select('id')
        .eq('card_id', cardId)
        .eq('merchant_id', merchantId)
        .single();

      if (cmError) {
        return new Response(
          JSON.stringify({ error: 'Card merchant relationship not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get transactions
      const { data: transactions, error: txError } = await supabaseClient
        .from('transactions')
        .select('points, created_at')
        .eq('card_merchant_id', cardMerchant.id)
        .order('created_at', { ascending: false });

      if (txError) {
        return new Response(
          JSON.stringify({ error: txError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get historical checkpoint advancements
      const { data: checkpointAdvancements, error: caError } = await supabaseClient
        .from('checkpoint_advancements')
        .select(`
          step_number,
          total_steps,
          advanced_at,
          offer:checkpoint_offers (
            name
          )
        `)
        .eq('merchant_id', merchantId)
        .eq('customer_id', cardData.customer_id)
        .order('advanced_at', { ascending: false });

      if (caError) {
        return new Response(
          JSON.stringify({ error: caError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get checkpoint rewards
      const { data: checkpoints, error: cpError } = await supabaseClient
        .from('redeemed_checkpoint_rewards')
        .select(`
          redeemed_at,
          reward:checkpoint_rewards (
            name
          ),
          step:checkpoint_steps (
            step_number,
            offer:checkpoint_offers (
              name
            )
          )
        `)
        .eq('merchant_id', merchantId)
        .eq('customer_id', cardData.customer_id)
        .order('redeemed_at', { ascending: false });

      if (cpError) {
        return new Response(
          JSON.stringify({ error: cpError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format checkpoint data
      const formattedCheckpoints = checkpoints.map((cp: any) => ({
        redeemed_at: cp.redeemed_at,
        reward_name: cp.reward?.name,
        step_number: cp.step?.step_number,
        offer_name: cp.step?.offer?.name,
        type: 'checkpoint_reward'
      }));

      // Format checkpoint advancements
      const formattedAdvancements = checkpointAdvancements.map((ca: any) => ({
        date: ca.advanced_at,
        step_number: ca.step_number,
        offer_name: ca.offer?.name,
        total_steps: ca.total_steps,
        type: 'checkpoint_advancement'
      }));

      return new Response(
        JSON.stringify({
          transactions,
          checkpoints: [...formattedCheckpoints, ...formattedAdvancements]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /apple-wallet/generate
    if (path === 'apple-wallet/generate' && req.method === 'POST') {
      const { cardId, customerName, cardUid } = await req.json()

      if (!cardId || !customerName || !cardUid) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Per ora restituiamo un URL di test che punta al controller NestJS
        // TODO: Implementa la logica completa di Apple Wallet con passkit-generator
        const downloadUrl = `http://localhost:4000/apple-wallet/generate`;
        
        return new Response(
          JSON.stringify({ 
            downloadUrl,
            message: 'Apple Wallet pass generation endpoint'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // POST /google-wallet/generate
    if (path === 'google-wallet/generate' && req.method === 'POST') {
      const { cardId, customerName, cardUid } = await req.json()

      if (!cardId || !customerName || !cardUid) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Per ora restituiamo un URL di test
        // TODO: Implementa la logica completa di Google Wallet con JWT valido
        const saveUrl = `https://pay.google.com/gp/v/save/test-jwt-${cardId}`;
        
        return new Response(
          JSON.stringify({ saveUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // GET /cards/status?uid=XXX
    if (path === 'cards/status' && req.method === 'GET') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const uid = params.uid;
      if (!uid) {
        return new Response(
          JSON.stringify({ error: 'Missing UID parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verifica se la carta esiste
      const { data: card, error: cardError } = await supabaseClient
        .from('cards')
        .select('id, uid, customer_id, issuing_merchant_id, created_at')
        .eq('uid', uid)
        .single();

      if (cardError) {
        if (cardError.code === 'PGRST116') {
          // Carta non trovata
          return new Response(
            JSON.stringify({ 
              exists: false,
              message: 'Card not found'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ error: cardError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verifica se la carta è già associata al merchant
      const { data: cardMerchant, error: cmError } = await supabaseClient
        .from('card_merchants')
        .select('id, created_at')
        .eq('card_id', card.id)
        .eq('merchant_id', merchantId)
        .single();

      const isAssociated = !cmError && cardMerchant;
      const isIssuer = card.issuing_merchant_id === merchantId;

      return new Response(
        JSON.stringify({
          exists: true,
          card: {
            id: card.id,
            uid: card.uid,
            customer_id: card.customer_id,
            issuing_merchant_id: card.issuing_merchant_id,
            created_at: card.created_at
          },
          merchant_status: {
            is_associated: isAssociated,
            is_issuer: isIssuer,
            associated_at: cardMerchant?.created_at || null
          },
          message: isAssociated 
            ? 'Card already associated with this merchant'
            : 'Card exists but not associated with this merchant'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /checkpoints/redeem-reward
    if (path === 'checkpoints/redeem-reward' && req.method === 'POST') {
      if (!merchantId) {
        return new Response(
          JSON.stringify({ error: 'Missing merchant ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { customerId, rewardId, stepId } = await req.json()

      if (!customerId || !rewardId || !stepId) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: customerId, rewardId, stepId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Chiama la funzione SQL per riscattare il premio del checkpoint
        const { error } = await supabaseClient
          .rpc('redeem_checkpoint_reward', {
            p_customer_id: customerId,
            p_merchant_id: merchantId,
            p_checkpoint_reward_id: rewardId,
            p_checkpoint_step_id: stepId
          })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            message: 'Checkpoint reward redeemed successfully',
            customerId,
            rewardId,
            stepId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // GET /checkpoints/redeemed-rewards?customerId=XXX&merchantId=XXX
    if (path === 'checkpoints/redeemed-rewards' && req.method === 'GET') {
      const customerId = params.customerId;
      const merchantIdParam = params.merchantId;
      
      if (!customerId || !merchantIdParam) {
        return new Response(
          JSON.stringify({ error: 'Missing customerId or merchantId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Recupera i premi riscattati per questo customer e merchant
        const { data: redeemedRewards, error } = await supabaseClient
          .from('redeemed_checkpoint_rewards')
          .select(`
            checkpoint_reward_id,
            checkpoint_step_id,
            redeemed_at,
            status
          `)
          .eq('customer_id', customerId)
          .eq('merchant_id', merchantIdParam)
          .eq('status', 'completed')
          .order('redeemed_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            redeemed_rewards: redeemedRewards || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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