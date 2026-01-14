export interface Forecast {
  id: string;
  user_id: string;
  market_id: string;
  outcome_id: string;
  points: number;
  reward_amount?: number | null; // Actual reward amount if forecast wins
  status: 'pending' | 'won' | 'lost';
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  outcome_name?: string;
  market_title?: string;
  market_status?: string;
}

export interface ForecastCreate {
  outcome_id: string;
  points: number;
}

export interface ForecastUpdate {
  outcome_id?: string;
  points?: number;
}

export interface ForecastResponse {
  success: boolean;
  data: {
    forecast: Forecast;
    new_balance: number;
    updated_outcome?: {
      id: string;
      name: string;
      total_points: number;
    };
  };
  message: string;
}

export interface ForecastListResponse {
  success: boolean;
  data: {
    forecasts: Forecast[];
    user_forecast?: Forecast | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

