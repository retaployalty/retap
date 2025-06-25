import { createSupabaseClient } from "../utils/supabase.ts";
import { createErrorResponse, createSuccessResponse } from "../utils/cors.ts";

export async function handleCreateCustomer(merchantId: string) {
  if (!merchantId) {
    return createErrorResponse('Missing merchant ID', 400);
  }

  const supabaseClient = createSupabaseClient();

  // Verifica che il merchant esista
  const { data: merchant, error: merchantError } = await supabaseClient
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return createErrorResponse('Merchant not found', 404);
  }

  // Crea sempre un nuovo customer
  const { data: customer, error } = await supabaseClient
    .from('customers')
    .insert({
      id: crypto.randomUUID(),
      // Altri campi del customer possono essere aggiunti qui se necessario
    })
    .select('id')
    .single();

  if (error) {
    return createErrorResponse(`Error creating customer: ${error.message}`, 400);
  }

  return createSuccessResponse({
    id: customer.id,
    message: 'New customer created successfully'
  }, 201);
} 