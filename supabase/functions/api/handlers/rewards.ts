import { createSupabaseClient } from "../utils/supabase.ts";
import { createErrorResponse, createSuccessResponse } from "../utils/cors.ts";
import { RewardsAndCheckpoints } from "../types.ts";

export async function handleRedeemReward(merchantId: string, body: any) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  const { customer_id, reward_id, points_spent, status } = body;
  const supabaseClient = createSupabaseClient();

  // Verifica che il premio esista e appartenga al merchant
  const { data: reward, error: rewardError } = await supabaseClient
    .from('rewards')
    .select('*')
    .eq('id', reward_id)
    .eq('merchant_id', merchantId)
    .single();

  if (rewardError || !reward) {
    return createErrorResponse('Reward not found or not authorized', 404);
  }

  // Verifica che il cliente esista
  const { data: customer, error: customerError } = await supabaseClient
    .from('customers')
    .select('*')
    .eq('id', customer_id)
    .single();

  if (customerError || !customer) {
    return createErrorResponse('Customer not found', 404);
  }

  // Trova la carta del cliente per questo merchant
  const { data: card, error: cardError } = await supabaseClient
    .from('cards')
    .select('id')
    .eq('customer_id', customer_id)
    .single();

  if (cardError || !card) {
    return createErrorResponse('Card not found for customer', 404);
  }

  // Trova o crea la relazione card_merchants
  const { data: cardMerchant, error: cmError } = await supabaseClient
    .from('card_merchants')
    .select('id')
    .eq('card_id', card.id)
    .eq('merchant_id', merchantId)
    .single();

  if (cmError && cmError.code !== 'PGRST116') {
    return createErrorResponse('Error finding card-merchant relationship', 400);
  }

  // Se la relazione non esiste, la creiamo
  let cardMerchantId = cardMerchant?.id;
  if (!cardMerchantId) {
    const { data: newCardMerchant, error: createError } = await supabaseClient
      .from('card_merchants')
      .insert({
        card_id: card.id,
        merchant_id: merchantId,
      })
      .select()
      .single();

    if (createError) {
      return createErrorResponse('Error creating card-merchant relationship', 400);
    }
    cardMerchantId = newCardMerchant.id;
  }

  // Crea la transazione per scalare i punti
  const { error: txError } = await supabaseClient
    .from('transactions')
    .insert({
      card_merchant_id: cardMerchantId,
      points: -points_spent, // Punti negativi per scalare
    });

  if (txError) {
    return createErrorResponse('Error creating transaction', 400);
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
    .single();

  if (error) {
    return createErrorResponse(error.message, 400);
  }

  return createSuccessResponse(data, 201);
}

export async function handleAdvanceCheckpoint(merchantId: string, body: any) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  const { cardId, offerId } = body;
  const supabaseClient = createSupabaseClient();

  // Get the customer ID from the card
  const { data: card, error: cardError } = await supabaseClient
    .from('cards')
    .select('customer_id')
    .eq('id', cardId)
    .single();

  if (cardError || !card) {
    return createErrorResponse('Card not found', 404);
  }

  // Call the advance_customer_checkpoint function
  const { data, error } = await supabaseClient
    .rpc('advance_customer_checkpoint', {
      p_customer_id: card.customer_id,
      p_merchant_id: merchantId,
      p_offer_id: offerId
    });

  if (error) {
    return createErrorResponse(error.message, 400);
  }

  // Restituisci sempre un oggetto, non una lista
  const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
  return createSuccessResponse(result);
}

export async function handleRewindCheckpoint(merchantId: string, body: any) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  const { cardId, offerId } = body;
  const supabaseClient = createSupabaseClient();

  // Get the customer ID from the card
  const { data: card, error: cardError } = await supabaseClient
    .from('cards')
    .select('customer_id')
    .eq('id', cardId)
    .single();

  if (cardError || !card) {
    return createErrorResponse('Card not found', 404);
  }

  // Get current step and total steps
  const { data: checkpoint, error: checkpointError } = await supabaseClient
    .from('customer_checkpoints')
    .select('current_step')
    .eq('customer_id', card.customer_id)
    .eq('merchant_id', merchantId)
    .single();

  if (checkpointError) {
    return createErrorResponse('Checkpoint not found', 404);
  }

  // Get total steps from the offer
  const { data: offer, error: offerError } = await supabaseClient
    .from('checkpoint_offers')
    .select('total_steps')
    .eq('id', offerId)
    .single();

  if (offerError) {
    return createErrorResponse('Offer not found', 404);
  }

  // Calculate previous step
  let previousStep = checkpoint.current_step - 1;
  if (previousStep < 1) {
    previousStep = offer.total_steps;
  }

  // Update customer checkpoint
  const { data: updatedCheckpoint, error: updateError } = await supabaseClient
    .from('customer_checkpoints')
    .update({ current_step: previousStep })
    .eq('customer_id', card.customer_id)
    .eq('merchant_id', merchantId)
    .select()
    .single();

  if (updateError) {
    return createErrorResponse(updateError.message, 400);
  }

  // Restituisci sempre un oggetto, non una lista
  const result = { current_step: previousStep, total_steps: offer.total_steps };
  return createSuccessResponse(result);
}

export async function handleGetRewardsAndCheckpoints(merchantId: string, cardId: string): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Missing merchantId', 400);
  }

  if (!cardId) {
    return createErrorResponse('Missing cardId', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Get customer ID from card
  const { data: card, error: cardError } = await supabaseClient
    .from('cards')
    .select('customer_id')
    .eq('id', cardId)
    .single();

  if (cardError) {
    return createErrorResponse('Card not found', 404);
  }

  // 1. Rewards
  const { data: rewards, error: rewardsError } = await supabaseClient
    .from('rewards')
    .select('id, name, description, image_path, price_coins, is_active')
    .eq('merchant_id', merchantId);
  
  if (rewardsError) {
    return createErrorResponse(rewardsError.message, 400);
  }

  // 2. Checkpoint Offers
  const { data: offers, error: offersError } = await supabaseClient
    .from('checkpoint_offers')
    .select('id, name, description, total_steps')
    .eq('merchant_id', merchantId);
  
  if (offersError) {
    return createErrorResponse(offersError.message, 400);
  }

  // 3. Get current step for this customer and merchant
  const { data: checkpoint, error: checkpointError } = await supabaseClient
    .from('customer_checkpoints')
    .select('current_step, offer_id')
    .eq('customer_id', card.customer_id)
    .eq('merchant_id', merchantId)
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

  return createSuccessResponse({ 
    rewards, 
    checkpoint_offers: offersWithSteps,
    current_step: checkpoint?.current_step || 0
  });
}

export async function handleGetMerchantRewards(merchantId: string): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Missing merchantId', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Get only rewards for this merchant (no customer-specific data)
  const { data: rewards, error: rewardsError } = await supabaseClient
    .from('rewards')
    .select('id, name, description, image_path, price_coins, is_active')
    .eq('merchant_id', merchantId)
    .eq('is_active', true);
  
  if (rewardsError) {
    return createErrorResponse(rewardsError.message, 400);
  }

  return createSuccessResponse({ rewards: rewards || [] });
}

export async function handleGetMerchantCheckpoints(merchantId: string): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Missing merchantId', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Get only checkpoint offers for this merchant (no customer-specific data)
  const { data: offers, error: offersError } = await supabaseClient
    .from('checkpoint_offers')
    .select('id, name, description, total_steps')
    .eq('merchant_id', merchantId);
  
  if (offersError) {
    return createErrorResponse(offersError.message, 400);
  }

  // For each offer, get steps and rewards
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
        current_step: 0 // No customer-specific data
      };
    })
  );

  return createSuccessResponse({ 
    checkpoint_offers: offersWithSteps,
    current_step: 0
  });
}

export async function handleRedeemCheckpointReward(merchantId: string, body: any): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  const { customerId, rewardId, stepId } = body;

  if (!customerId || !rewardId || !stepId) {
    return createErrorResponse('Missing required parameters: customerId, rewardId, stepId', 400);
  }

  const supabaseClient = createSupabaseClient();

  try {
    // Chiama la funzione SQL per riscattare il premio del checkpoint
    const { error } = await supabaseClient
      .rpc('redeem_checkpoint_reward', {
        p_customer_id: customerId,
        p_merchant_id: merchantId,
        p_checkpoint_reward_id: rewardId,
        p_checkpoint_step_id: stepId
      });

    if (error) {
      return createErrorResponse(error.message, 400);
    }

    return createSuccessResponse({ 
      message: 'Checkpoint reward redeemed successfully',
      customerId,
      rewardId,
      stepId
    });
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
} 