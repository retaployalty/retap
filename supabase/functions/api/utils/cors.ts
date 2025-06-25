export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-merchant-id',
}

export function createCorsResponse(body: any, status = 200): Response {
  return new Response(
    JSON.stringify(body),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

export function createErrorResponse(error: string, status = 400): Response {
  return createCorsResponse({ error }, status)
}

export function createSuccessResponse(data: any, status = 200): Response {
  return createCorsResponse(data, status)
} 