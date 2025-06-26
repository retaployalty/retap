import { corsHeaders, createErrorResponse } from "./utils/cors.ts";

// Import handlers
import { handleCreateCustomer } from "./handlers/customers.ts";
import { handleGetCard, handleCreateCard, handleGetCardStatus } from "./handlers/cards.ts";
import { handleGetBalance, handleCreateTransaction } from "./handlers/transactions.ts";
import { handleGetMerchants, handleGetMerchantDetails, handleGetMerchantHistory } from "./handlers/merchants.ts";
import { 
  handleRedeemReward, 
  handleAdvanceCheckpoint, 
  handleRewindCheckpoint, 
  handleGetRewardsAndCheckpoints,
  handleGetMerchantRewards,
  handleGetMerchantCheckpoints,
  handleRedeemCheckpointReward
} from "./handlers/rewards.ts";
import { handleGenerateAppleWallet, handleGenerateGoogleWallet } from "./handlers/wallet.ts";

export async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const path = pathParts.slice(1).join('/');
    const params = Object.fromEntries(url.searchParams);
    const merchantId = req.headers.get('x-merchant-id');

    // POST /customers
    if (path === 'customers' && req.method === 'POST') {
      return await handleCreateCustomer(merchantId || '');
    }

    // GET /cards?uid=XXX
    if (path === 'cards' && req.method === 'GET') {
      return await handleGetCard(merchantId || '', params.uid || '');
    }

    // POST /cards
    if (path === 'cards' && req.method === 'POST') {
      const body = await req.json();
      return await handleCreateCard(merchantId || '', body);
    }

    // GET /balance?cardId=XXX
    if (path === 'balance' && req.method === 'GET') {
      return await handleGetBalance(params.cardId || '');
    }

    // POST /tx
    if (path === 'tx' && req.method === 'POST') {
      const body = await req.json();
      return await handleCreateTransaction(merchantId || '', body);
    }

    // GET /merchants
    if (path === 'merchants' && req.method === 'GET') {
      return await handleGetMerchants();
    }

    // POST /redeemed_rewards
    if (path === 'redeemed_rewards' && req.method === 'POST') {
      const body = await req.json();
      return await handleRedeemReward(merchantId || '', body);
    }

    // POST /checkpoints/advance
    if (path === 'checkpoints/advance' && req.method === 'POST') {
      const body = await req.json();
      return await handleAdvanceCheckpoint(merchantId || '', body);
    }

    // POST /checkpoints/rewind
    if (path === 'checkpoints/rewind' && req.method === 'POST') {
      const body = await req.json();
      return await handleRewindCheckpoint(merchantId || '', body);
    }

    // POST /checkpoints/redeem-reward
    if (path === 'checkpoints/redeem-reward' && req.method === 'POST') {
      const body = await req.json();
      return await handleRedeemCheckpointReward(merchantId || '', body);
    }

    // GET /rewards-and-checkpoints?merchantId=XXX&cardId=XXX
    if (path === 'rewards-and-checkpoints' && req.method === 'GET') {
      return await handleGetRewardsAndCheckpoints(params.merchantId || '', params.cardId || '');
    }

    // GET /merchant-rewards?merchantId=XXX
    if (path === 'merchant-rewards' && req.method === 'GET') {
      return await handleGetMerchantRewards(params.merchantId || '');
    }

    // GET /merchant-checkpoints?merchantId=XXX
    if (path === 'merchant-checkpoints' && req.method === 'GET') {
      return await handleGetMerchantCheckpoints(params.merchantId || '');
    }

    // GET /merchant-details?merchantId=XXX&cardId=XXX
    if (path === 'merchant-details' && req.method === 'GET') {
      return await handleGetMerchantDetails(params.merchantId || '', params.cardId);
    }

    // GET /merchant-history?merchantId=XXX&cardId=XXX
    if (path === 'merchant-history' && req.method === 'GET') {
      return await handleGetMerchantHistory(params.merchantId || '', params.cardId || '');
    }

    // POST /apple-wallet/generate
    if (path === 'apple-wallet/generate' && req.method === 'POST') {
      const body = await req.json();
      return await handleGenerateAppleWallet(body);
    }

    // POST /google-wallet/generate
    if (path === 'google-wallet/generate' && req.method === 'POST') {
      const body = await req.json();
      return await handleGenerateGoogleWallet(body);
    }

    // GET /cards/status?uid=XXX
    if (path === 'cards/status' && req.method === 'GET') {
      return await handleGetCardStatus(merchantId || '', params.uid || '');
    }

    return createErrorResponse('Not found', 404);
  } catch (error) {
    return createErrorResponse(error.message, 400);
  }
} 