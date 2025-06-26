import { createSupabaseClient } from "../utils/supabase.ts";
import { createErrorResponse, createSuccessResponse } from "../utils/cors.ts";

export async function handleGetBalance(cardId: string) {
  const supabaseClient = createSupabaseClient();

  const { data: balances, error } = await supabaseClient
    .rpc('get_card_balance', {
      card_id: cardId
    });

  if (error) {
    return createErrorResponse(error.message, 400);
  }

  return createSuccessResponse({ balances });
}

export async function handleCreateTransaction(merchantId: string, body: any) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  const { cardId, points } = body;
  const supabaseClient = createSupabaseClient();

  // 1. Get the card_merchants relationship
  const { data: cardMerchant, error: cmError } = await supabaseClient
    .from('card_merchants')
    .select('id')
    .eq('card_id', cardId)
    .eq('merchant_id', merchantId)
    .single();

  if (cmError) {
    // If relationship doesn't exist, create it
    const { data: newCardMerchant, error: createError } = await supabaseClient
      .from('card_merchants')
      .insert({
        card_id: cardId,
        merchant_id: merchantId,
      })
      .select()
      .single();

    if (createError) {
      return createErrorResponse(createError.message, 400);
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
      .single();

    if (error) {
      return createErrorResponse(error.message, 400);
    }

    return createSuccessResponse(data);
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
    .single();

  if (error) {
    return createErrorResponse(error.message, 400);
  }

  return createSuccessResponse(data);
} 