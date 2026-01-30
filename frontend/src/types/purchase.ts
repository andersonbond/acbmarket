export interface Purchase {
  id: string;
  user_id: string;
  amount_cents: number;
  chips_added: number;
  provider: 'test' | 'stripe' | 'gcash' | 'paymaya' | 'paymongo' | 'terminal3' | 'admin';
  provider_tx_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface PurchaseCreate {
  chips_added: number;
  payment_provider?: 'paymongo' | 'terminal3' | null;
}

export interface Terminal3WidgetConfig {
  key: string;
  base_url: string;
  widget_id: string;
  evaluation: number;
  ps: string;
}

export interface CheckoutResponseData {
  purchase: Purchase;
  new_balance?: number;
  widget_config?: Terminal3WidgetConfig;
  /** Signed Terminal3 checkout URL (use as iframe src to avoid error 06). */
  checkout_url?: string;
}

export interface PurchaseResponse {
  success: boolean;
  data: CheckoutResponseData;
  message: string;
}

export interface PurchaseListResponse {
  success: boolean;
  data: {
    purchases: Purchase[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

