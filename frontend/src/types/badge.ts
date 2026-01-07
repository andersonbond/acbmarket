export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface BadgeListResponse {
  success: boolean;
  data: {
    badges: Badge[];
  };
}

