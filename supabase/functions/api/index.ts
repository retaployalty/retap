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

      // Use the get_or_create_customer function instead of direct table insertion
      const { data, error } = await supabaseClient
        .rpc('get_or_create_customer', {
          p_merchant_id: merchantId
        })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ id: data }),
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

      // Prima verifichiamo se la carta esiste senza filtri
      const { data: allCards, error: allCardsError } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('uid', params.uid);

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
      const { data: merchants, error: merchantsError } = await supabaseClient
        .from('merchants')
        .select('id, name, industry, address, country, created_at, hours, cover_image_url')
        .order('name', { ascending: true })

      if (merchantsError) {
        return new Response(
          JSON.stringify({ error: merchantsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Per ogni merchant, recupera rewards e checkpoint offers
      const merchantsWithData = await Promise.all(merchants.map(async (merchant) => {
        // Recupera i rewards
        const { data: rewards, error: rewardsError } = await supabaseClient
          .from('rewards')
          .select('id, name, description, image_path, price_coins, is_active')
          .eq('merchant_id', merchant.id)
          .eq('is_active', true);

        if (rewardsError) {
          console.error('Error fetching rewards:', rewardsError);
        }

        // Recupera i checkpoint offers
        const { data: offers, error: offersError } = await supabaseClient
          .from('checkpoint_offers')
          .select('id, name, description, total_steps')
          .eq('merchant_id', merchant.id);

        if (offersError) {
          console.error('Error fetching checkpoint offers:', offersError);
        }

        // Per ogni offer, recupera i steps e i rewards
        const offersWithSteps = await Promise.all((offers || []).map(async (offer) => {
          const { data: steps, error: stepsError } = await supabaseClient
            .from('checkpoint_steps')
            .select('id, step_number, reward_id, offer_id')
            .eq('offer_id', offer.id)
            .order('step_number', { ascending: true });

          if (stepsError) {
            console.error('Error fetching steps:', stepsError);
            return { ...offer, steps: [] };
          }

          // Per ogni step, se ha un reward_id, recupera i dettagli del reward
          const stepsWithReward = await Promise.all((steps || []).map(async (step) => {
            let reward = null;
            if (step.reward_id) {
              const { data: rewardData, error: rewardError } = await supabaseClient
                .from('checkpoint_rewards')
                .select('id, name, description, icon')
                .eq('id', step.reward_id)
                .single();
              if (!rewardError) {
                reward = rewardData;
              }
            }
            return { ...step, reward };
          }));

          return { ...offer, steps: stepsWithReward };
        }));

        return {
          ...merchant,
          image_path: merchant.cover_image_url?.[0] || null,
          rewards: rewards || [],
          checkpoint_offers: offersWithSteps || [],
          _debug: {
            merchant_id: merchant.id,
            has_image: !!merchant.cover_image_url?.length,
            rewards_count: rewards?.length || 0,
            checkpoint_offers_count: offers?.length || 0
          }
        };
      }));

      return new Response(
        JSON.stringify({ 
          merchants: merchantsWithData,
          _debug: {
            total_merchants: merchants.length,
            merchants_with_images: merchantsWithData.filter(m => m.image_path).length,
            merchants_with_rewards: merchantsWithData.filter(m => m.rewards.length > 0).length,
            merchants_with_checkpoints: merchantsWithData.filter(m => m.checkpoint_offers.length > 0).length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      return new Response(
        JSON.stringify(data),
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
        .select()
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify([{
          current_step: previousStep,
          total_steps: offer.total_steps
        }]),
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