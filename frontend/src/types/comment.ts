export interface CommentUser {
  id: string;
  display_name: string;
  reputation: number;
  badges?: string[];
}

export interface Comment {
  id: string;
  market_id: string;
  user: CommentUser;
  parent_id?: string;
  content: string;
  like_count: number;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  reply_count: number;
  replies?: Comment[];
  user_liked: boolean;
}

export interface CommentCreate {
  content: string;
  parent_id?: string;
}

export interface CommentUpdate {
  content: string;
}

export interface CommentListResponse {
  success: boolean;
  data: {
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  errors?: Array<{ message: string }>;
}

export interface CommentResponse {
  success: boolean;
  data: {
    comment: Comment;
  };
  errors?: Array<{ message: string }>;
}

export interface CommentCountResponse {
  success: boolean;
  data: {
    count: number;
  };
  errors?: Array<{ message: string }>;
}
