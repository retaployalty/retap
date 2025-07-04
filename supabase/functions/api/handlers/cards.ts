import { createSupabaseClient } from "../utils/supabase.ts";
import { createErrorResponse, createSuccessResponse } from "../utils/cors.ts";
import { CardStatus } from "../types.ts";

export async function handleGetCard(merchantId: string, uid: string) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  if (!uid) {
    return createErrorResponse('Missing UID parameter', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Prima verifichiamo se la carta esiste senza filtri
  const { data: allCards, error: allCardsError } = await supabaseClient
    .from('cards')
    .select('*')
    .eq('uid', uid);

  if (allCardsError) {
    return createErrorResponse(allCardsError.message, 400);
  }

  if (!allCards || allCards.length === 0) {
    return createErrorResponse('Card not found', 404);
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
    return createErrorResponse(cmError.message, 400);
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
      return createErrorResponse(insertError.message, 400);
    }
  }

  return createSuccessResponse({
    ...card,
    is_new_merchant: !cardMerchant
  });
}

export async function handleCreateCard(merchantId: string, body: any) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }
  
  const { cardId, uid, customerId } = body;

  // Validazione dei parametri
  if (!cardId || !uid || !customerId) {
    return createErrorResponse('Missing required parameters: cardId, uid, customerId', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Verifica se esiste già una carta con questo UID
  const { data: existingCard, error: existingError } = await supabaseClient
    .from('cards')
    .select('id, customer_id, issuing_merchant_id')
    .eq('uid', uid)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    return createErrorResponse(`Error checking existing card: ${existingError.message}`, 400);
  }

  if (existingCard) {
    // Se esiste, verifica che sia associata al customer corretto
    if (existingCard.customer_id !== customerId) {
      return createErrorResponse('Card UID already exists with different customer', 409);
    }
    
    // Se esiste e appartiene al customer corretto, restituisci la carta esistente
    return createSuccessResponse({
      ...existingCard,
      message: 'Card already exists for this customer'
    });
  }

  // Verifica che il customer esista
  const { data: customer, error: customerError } = await supabaseClient
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    return createErrorResponse('Customer not found', 404);
  }

  // Verifica che il merchant esista
  const { data: merchant, error: merchantError } = await supabaseClient
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return createErrorResponse('Merchant not found', 404);
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
    .single();

  if (cardError) {
    return createErrorResponse(`Error creating card: ${cardError.message}`, 400);
  }

  // Crea la relazione card_merchants
  const { error: cmError } = await supabaseClient
    .from('card_merchants')
    .insert({
      card_id: card.id,
      merchant_id: merchantId,
    });

  if (cmError) {
    // Se fallisce la creazione della relazione, elimina la carta creata
    await supabaseClient
      .from('cards')
      .delete()
      .eq('id', card.id);
    
    return createErrorResponse(`Error creating card-merchant relationship: ${cmError.message}`, 400);
  }

  return createSuccessResponse({
    ...card,
    message: 'Card created successfully'
  }, 201);
}

export async function handleGetCardStatus(merchantId: string, uid: string): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  if (!uid) {
    return createErrorResponse('Missing UID parameter', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Verifica se la carta esiste
  const { data: card, error: cardError } = await supabaseClient
    .from('cards')
    .select('id, uid, customer_id, issuing_merchant_id, created_at')
    .eq('uid', uid)
    .single();

  if (cardError) {
    if (cardError.code === 'PGRST116') {
      // Carta non trovata
      return createSuccessResponse({
        exists: false,
        message: 'Card not found'
      });
    }
    return createErrorResponse(cardError.message, 400);
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

  return createSuccessResponse({
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
  });
}

export async function handleReplaceCard(merchantId: string, body: any): Promise<Response> {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }
  
  const { oldCardId, newUid } = body;

  // Validazione dei parametri
  if (!oldCardId || !newUid) {
    return createErrorResponse('Missing required parameters: oldCardId, newUid', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Verifica che la carta esistente esista e appartenga al merchant
  const { data: existingCard, error: existingError } = await supabaseClient
    .from('cards')
    .select('id, uid, customer_id, issuing_merchant_id')
    .eq('id', oldCardId)
    .single();

  if (existingError || !existingCard) {
    return createErrorResponse('Original card not found', 404);
  }

  // Verifica che il merchant abbia accesso a questa carta (sia issuer o associato)
  const isIssuer = existingCard.issuing_merchant_id === merchantId;
  const { data: cardMerchant, error: cmError } = await supabaseClient
    .from('card_merchants')
    .select('id')
    .eq('card_id', existingCard.id)
    .eq('merchant_id', merchantId)
    .single();

  const isAssociated = !cmError && cardMerchant;

  if (!isIssuer && !isAssociated) {
    return createErrorResponse('Merchant not authorized to replace this card', 403);
  }

  // Verifica che la nuova carta non sia già in uso
  const { data: newCardExists, error: newCardError } = await supabaseClient
    .from('cards')
    .select('id, customer_id')
    .eq('uid', newUid)
    .single();

  if (newCardError && newCardError.code !== 'PGRST116') {
    return createErrorResponse(`Error checking new card: ${newCardError.message}`, 400);
  }

  if (newCardExists) {
    // Se la nuova carta esiste, verifica che appartenga allo stesso customer
    if (newCardExists.customer_id !== existingCard.customer_id) {
      return createErrorResponse('New card UID already exists with different customer', 409);
    }
    
    // Se appartiene allo stesso customer, aggiorna l'UID della carta esistente
    const { error: updateError } = await supabaseClient
      .from('cards')
      .update({ uid: newUid })
      .eq('id', existingCard.id);

    if (updateError) {
      return createErrorResponse(`Error updating card UID: ${updateError.message}`, 400);
    }

    return createSuccessResponse({
      message: 'Card UID updated successfully',
      oldUid: existingCard.uid,
      newUid: newUid,
      cardId: existingCard.id
    });
  }

  // Aggiorna l'UID della carta esistente
  const { error: updateError } = await supabaseClient
    .from('cards')
    .update({ uid: newUid })
    .eq('id', existingCard.id);

  if (updateError) {
    return createErrorResponse(`Error updating card UID: ${updateError.message}`, 400);
  }

  // Se il merchant non era associato, crea la relazione
  if (!isAssociated) {
    const { error: insertError } = await supabaseClient
      .from('card_merchants')
      .insert({
        card_id: existingCard.id,
        merchant_id: merchantId,
      });

    if (insertError) {
      return createErrorResponse(`Error creating card-merchant relationship: ${insertError.message}`, 400);
    }
  }

  return createSuccessResponse({
    message: 'Card replaced successfully',
    oldUid: existingCard.uid,
    newUid: newUid,
    cardId: existingCard.id,
    customerId: existingCard.customer_id
  });
} 