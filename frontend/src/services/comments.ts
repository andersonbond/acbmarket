/**
 * Comments service
 */
import api from './api';
import {
  CommentListResponse,
  CommentResponse,
  CommentCreate,
  CommentUpdate,
  CommentCountResponse,
} from '../types/comment';

export const getComments = async (
  marketId: string,
  page: number = 1,
  limit: number = 20,
  parentId?: string,
  sort: 'newest' | 'oldest' = 'newest',
  holdersOnly: boolean = false
): Promise<CommentListResponse> => {
  const params: any = {
    page,
    limit,
    sort,
    holders_only: holdersOnly,
  };
  
  if (parentId) {
    params.parent_id = parentId;
  }
  
  const response = await api.get<CommentListResponse>(
    `/api/v1/markets/${marketId}/comments`,
    { params }
  );
  return response.data;
};

export const getCommentCount = async (
  marketId: string
): Promise<CommentCountResponse> => {
  const response = await api.get<CommentCountResponse>(
    `/api/v1/markets/${marketId}/comments/count`
  );
  return response.data;
};

export const createComment = async (
  marketId: string,
  commentData: CommentCreate
): Promise<CommentResponse> => {
  const response = await api.post<CommentResponse>(
    `/api/v1/markets/${marketId}/comments`,
    commentData
  );
  return response.data;
};

export const updateComment = async (
  commentId: string,
  commentData: CommentUpdate
): Promise<CommentResponse> => {
  const response = await api.patch<CommentResponse>(
    `/api/v1/comments/${commentId}`,
    commentData
  );
  return response.data;
};

export const deleteComment = async (
  commentId: string
): Promise<{ success: boolean; data: { message: string }; errors?: Array<{ message: string }> }> => {
  const response = await api.delete(
    `/api/v1/comments/${commentId}`
  );
  return response.data;
};
