export interface User {
  id: string;
  email?: string;  // Optional email
  display_name: string;
  bio?: string;
  avatar_url?: string;
  chips: number;
  reputation: number;
  badges: string[];
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  is_admin: boolean;
  is_market_moderator: boolean;
  is_banned?: boolean;
  chips_frozen?: boolean;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginCredentials {
  contact_number: string;  // Changed to contact_number
  password: string;
}

export interface RegisterData {
  email?: string;  // Optional email
  password: string;
  display_name: string;
  contact_number: string;
}

