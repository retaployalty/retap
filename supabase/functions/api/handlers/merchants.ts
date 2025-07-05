import { createSupabaseClient } from "../utils/supabase.ts";
import { createErrorResponse, createSuccessResponse } from "../utils/cors.ts";
import { MerchantDetails, MerchantHistory } from "../types.ts";

export async function handleGetMerchants() {
  const supabaseClient = createSupabaseClient();

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
    .order('name');

  if (error) {
    return createErrorResponse(error.message, 400);
  }

  return createSuccessResponse({ merchants });
}

export async function handleGetMerchantDetails(merchantId: string, cardId?: string): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Merchant ID is required', 400);
  }

  const supabaseClient = createSupabaseClient();

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
    .single();

  if (merchantError) {
    return createErrorResponse(merchantError.message, 400);
  }

  // If cardId is provided, get balance and checkpoint progress
  let balance = 0;
  let currentStep = 0;
  let rewardSteps: number[] = [];

  if (cardId) {
    // Get card balance
    const { data: balanceData, error: balanceError } = await supabaseClient
      .rpc('get_card_balance', { card_id: cardId });

    if (balanceError) {
      return createErrorResponse(balanceError.message, 400);
    }

    if (balanceData) {
      // Find the balance for this merchant
      const merchantBalance = balanceData.find((b: any) => b.merchant_id === merchantId);
      if (merchantBalance) {
        balance = merchantBalance.balance;
        currentStep = merchantBalance.checkpoints_current;
        rewardSteps = merchantBalance.reward_steps;
      }
    }
  }

  return createSuccessResponse({
    merchant,
    balance,
    currentStep,
    rewardSteps
  });
}

export async function handleGetMerchantHistory(merchantId: string, cardId: string): Promise<Response> {
  if (!merchantId || !cardId) {
    return createErrorResponse('Missing merchantId or cardId', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Get card_merchant_id and customer_id
  const { data: cardData, error: cardError } = await supabaseClient
    .from('cards')
    .select('customer_id')
    .eq('id', cardId)
    .single();

  if (cardError) {
    return createErrorResponse('Card not found', 404);
  }

  // Get card_merchant_id
  const { data: cardMerchant, error: cmError } = await supabaseClient
    .from('card_merchants')
    .select('id')
    .eq('card_id', cardId)
    .eq('merchant_id', merchantId)
    .single();

  if (cmError) {
    return createErrorResponse('Card merchant relationship not found', 404);
  }

  // Get transactions
  const { data: transactions, error: txError } = await supabaseClient
    .from('transactions')
    .select('points, created_at')
    .eq('card_merchant_id', cardMerchant.id)
    .order('created_at', { ascending: false });

  if (txError) {
    return createErrorResponse(txError.message, 400);
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
    return createErrorResponse(caError.message, 400);
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
    return createErrorResponse(cpError.message, 400);
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

  return createSuccessResponse({
    transactions,
    checkpoints: [...formattedCheckpoints, ...formattedAdvancements]
  });
} 