import React, { useState, useEffect, useCallback } from 'react';
import { IonCard, IonCardContent, IonButton, IonSpinner, IonIcon, IonCheckbox } from '@ionic/react';
import { shieldOutline } from 'ionicons/icons';
import { Comment } from '../types/comment';
import { getComments, createComment, getCommentCount } from '../services/comments';
import { useAuth } from '../contexts/AuthContext';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  marketId: string;
}

type TabType = 'comments' | 'holders' | 'activity';

const CommentSection: React.FC<CommentSectionProps> = ({ marketId }) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [commentCount, setCommentCount] = useState(0);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [holdersOnly, setHoldersOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getComments(
        marketId,
        pageNum,
        20,
        undefined,
        sort,
        holdersOnly
      );
      
      if (response.success) {
        if (reset) {
          setComments(response.data.comments);
        } else {
          setComments((prev) => [...prev, ...response.data.comments]);
        }
        setTotalPages(response.data.pages);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.detail || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [marketId, sort, holdersOnly]);

  const fetchCommentCount = useCallback(async () => {
    try {
      const response = await getCommentCount(marketId);
      if (response.success) {
        setCommentCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching comment count:', err);
    }
  }, [marketId]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments(1, true);
      fetchCommentCount();
    }
  }, [activeTab, fetchComments, fetchCommentCount]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments(1, true);
    }
  }, [sort, holdersOnly, activeTab, fetchComments]);

  const handlePostComment = async (content: string) => {
    if (!isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await createComment(marketId, { content });
      // Refresh comments
      await fetchComments(1, true);
      await fetchCommentCount();
    } catch (err: any) {
      console.error('Error posting comment:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage, false);
    }
  };

  const handleCommentUpdate = () => {
    fetchComments(1, true);
    fetchCommentCount();
  };

  return (
    <IonCard className="bg-white dark:bg-gray-800 mb-4">
      <IonCardContent className="p-0">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Comments {commentCount > 0 && `(${commentCount})`}
          </button>
          <button
            onClick={() => setActiveTab('holders')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'holders'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Top Holders
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment Input */}
              {isAuthenticated ? (
                <div className="space-y-2">
                  <CommentInput
                    onSubmit={handlePostComment}
                    placeholder="Add a comment..."
                    isLoading={isSubmitting}
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <IonIcon icon={shieldOutline} className="text-base" />
                    <span>Beware of external links.</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  Please sign in to comment.
                </div>
              )}

              {/* Sort and Filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <IonCheckbox
                      checked={holdersOnly}
                      onIonChange={(e) => setHoldersOnly(e.detail.checked)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Holders</span>
                  </label>
                </div>
              </div>

              {/* Comments List */}
              {error ? (
                <div className="text-center py-8 text-red-500 dark:text-red-400 text-sm">
                  {error}
                </div>
              ) : isLoading && comments.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <IonSpinner name="crescent" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        marketId={marketId}
                        onUpdate={handleCommentUpdate}
                        onDelete={handleCommentUpdate}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {page < totalPages && (
                    <div className="flex justify-center pt-4">
                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                      >
                        {isLoading ? <IonSpinner name="crescent" /> : 'Load More'}
                      </IonButton>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'holders' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
              Top Holders feature coming soon...
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
              Activity feature coming soon...
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default CommentSection;
