export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CardStatus {
  exists: boolean;
  card?: {
    id: string;
    uid: string;
    customer_id: string;
    issuing_merchant_id: string;
    created_at: string;
  };
  merchant_status?: {
    is_associated: boolean;
    is_issuer: boolean;
    associated_at: string | null;
  };
  message?: string;
}

export interface MerchantDetails {
  merchant: any;
  balance: number;
  currentStep: number;
  rewardSteps: number[];
}

export interface MerchantHistory {
  transactions: any[];
  checkpoints: any[];
}

export interface RewardsAndCheckpoints {
  rewards: any[];
  checkpoint_offers: any[];
  current_step: number;
}

export interface WalletGenerationRequest {
  cardId: string;
  customerName: string;
  cardUid: string;
}

export interface WalletGenerationResponse {
  downloadUrl?: string;
  saveUrl?: string;
  message?: string;
} 