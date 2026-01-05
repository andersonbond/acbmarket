export interface Market {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  status: 'open' | 'suspended' | 'resolved' | 'cancelled';
  resolution_outcome?: string;
  created_at: string;
  outcomes: Outcome[];
  total_volume?: number;
  consensus?: {
    yes: number;
    no: number;
  };
}

export interface Outcome {
  id: string;
  name: string;
  total_points: number;
  percentage?: number;
}

