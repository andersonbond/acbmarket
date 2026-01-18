import React, { useState, useEffect, useCallback } from 'react';
import { IonCard, IonCardContent, IonButton, IonSpinner, IonIcon, IonCheckbox } from '@ionic/react';
import { shieldOutline, trendingUp, checkmarkCircle, trophy, add, person, chatbubbleOutline, peopleOutline, pulseOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Comment } from '../types/comment';
import { getComments, createComment, getCommentCount } from '../services/comments';
import { useAuth } from '../contexts/AuthContext';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import api from '../services/api';
import { activityService } from '../services/activity';
import { Activity } from '../types/activity';

interface CommentSectionProps {
  marketId: string;
}

type TabType = 'comments' | 'holders' | 'activity';

interface TopHolder {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
  total_points: number;
  outcomes: Array<{
    outcome_id: string;
    outcome_name: string;
    points: number;
  }>;
}

// Generate gradient avatar colors based on user ID
const getAvatarGradient = (userId: string): string => {
  const gradients = [
    'from-orange-400 to-yellow-500',
    'from-purple-400 to-pink-500',
    'from-teal-400 to-blue-500',
    'from-green-400 to-emerald-500',
    'from-red-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-pink-400 to-rose-500',
    'from-cyan-400 to-teal-500',
  ];
  
  const index = userId.charCodeAt(0) % gradients.length;
  return gradients[index];
};

// Format time for activities
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

// Get activity icon
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'forecast_placed':
      return trendingUp;
    case 'market_resolved':
      return checkmarkCircle;
    case 'badge_earned':
      return trophy;
    case 'market_created':
      return add;
    case 'comment_posted':
      return person;
    default:
      return trendingUp;
  }
};

// Get activity color
const getActivityColor = (type: string) => {
  switch (type) {
    case 'forecast_placed':
      return 'text-blue-500 dark:text-blue-400';
    case 'market_resolved':
      return 'text-green-500 dark:text-green-400';
    case 'badge_earned':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'market_created':
      return 'text-purple-500 dark:text-purple-400';
    case 'comment_posted':
      return 'text-gray-500 dark:text-gray-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
};

// Activity Item Component
interface ActivityItemProps {
  activity: Activity;
  history: any;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, history }) => {
  const getActivityMessage = () => {
    if (!activity.user_display_name) {
      // System activity
      switch (activity.activity_type) {
        case 'market_resolved':
          return 'Market was resolved';
        default:
          return 'System activity';
      }
    }

    // User activity
    switch (activity.activity_type) {
      case 'forecast_placed':
        const points = activity.meta_data?.points || 0;
        const outcomeName = activity.meta_data?.outcome_name || 'an outcome';
        return (
          <>
            <span className="font-semibold">{activity.user_display_name}</span>
            {` placed ₱${points.toLocaleString()} chips on "${outcomeName}"`}
          </>
        );
      case 'market_resolved':
        return (
          <>
            <span className="font-semibold">{activity.user_display_name}</span>
            {' resolved this market'}
          </>
        );
      case 'badge_earned':
        const badgeName = activity.meta_data?.badge_name || 'a badge';
        return (
          <>
            <span className="font-semibold">{activity.user_display_name}</span>
            {` earned ${badgeName}`}
          </>
        );
      case 'market_created':
        return (
          <>
            <span className="font-semibold">{activity.user_display_name}</span>
            {' created this market'}
          </>
        );
      case 'comment_posted':
        return (
          <>
            <span className="font-semibold">{activity.user_display_name}</span>
            {' posted a comment'}
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{activity.user_display_name}</span>
            {' performed an action'}
          </>
        );
    }
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
      onClick={() => {
        if (activity.user_id) {
          history.push(`/users/${activity.user_id}/profile`);
        }
      }}
    >
      <IonIcon
        icon={getActivityIcon(activity.activity_type)}
        className={`text-xl ${getActivityColor(activity.activity_type)} flex-shrink-0 mt-0.5`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          {getActivityMessage()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatTime(activity.created_at)}
        </p>
      </div>
    </div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({ marketId }) => {
  const { isAuthenticated } = useAuth();
  const history = useHistory();
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
  const [topHolders, setTopHolders] = useState<TopHolder[]>([]);
  const [isLoadingHolders, setIsLoadingHolders] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);

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

  const fetchTopHolders = useCallback(async () => {
    setIsLoadingHolders(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/markets/${marketId}/top-holders?limit=10`);
      if (response.data.success) {
        setTopHolders(response.data.data.holders || []);
      }
    } catch (err: any) {
      console.error('Error fetching top holders:', err);
      setError(err.response?.data?.detail || 'Failed to load top holders');
      setTopHolders([]);
    } finally {
      setIsLoadingHolders(false);
    }
  }, [marketId]);

  const fetchActivities = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    setIsLoadingActivities(true);
    setError(null);
    try {
      const response = await activityService.getMarketActivity(marketId, pageNum, 20);
      if (response.success) {
        if (reset) {
          setActivities(response.data.activities);
        } else {
          setActivities((prev) => [...prev, ...response.data.activities]);
        }
        setActivityTotalPages(response.data.pagination.pages);
      }
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.response?.data?.detail || 'Failed to load activities');
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [marketId]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments(1, true);
      fetchCommentCount();
    } else if (activeTab === 'holders') {
      fetchTopHolders();
    } else if (activeTab === 'activity') {
      fetchActivities(1, true);
    }
  }, [activeTab, fetchComments, fetchCommentCount, fetchTopHolders, fetchActivities]);

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
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'comments'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <IonIcon icon={chatbubbleOutline} className="text-base" />
            <span>Comments {commentCount > 0 && `(${commentCount})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('holders')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'holders'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <IonIcon icon={peopleOutline} className="text-base" />
            <span>Top Holders</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'activity'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <IonIcon icon={pulseOutline} className="text-base" />
            <span>Activity</span>
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
            <div className="space-y-3">
              {isLoadingHolders ? (
                <div className="flex justify-center items-center py-12">
                  <IonSpinner name="crescent" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 dark:text-red-400 text-sm">
                  {error}
                </div>
              ) : topHolders.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  No holders yet. Be the first to place a forecast!
                </div>
              ) : (
                <>
                  {topHolders.map((holder) => (
                    <div
                      key={holder.user_id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
                      onClick={() => history.push(`/users/${holder.user_id}/profile`)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Rank */}
                        <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 text-sm flex-shrink-0">
                          {holder.rank === 1 ? '🥇' : holder.rank === 2 ? '🥈' : holder.rank === 3 ? '🥉' : `#${holder.rank}`}
                        </div>
                        
                        {/* User Avatar */}
                        {holder.avatar_url ? (
                          <img
                            src={holder.avatar_url}
                            alt={holder.display_name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(holder.user_id)} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                            {holder.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {holder.display_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Rep: {holder.reputation.toFixed(1)}</span>
                            <span>•</span>
                            <span className="font-semibold text-primary">
                              ₱{holder.total_points.toLocaleString()}
                            </span>
                          </div>
                          {/* Outcomes */}
                          {holder.outcomes.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {holder.outcomes.map((outcome, idx) => (
                                <span
                                  key={outcome.outcome_id}
                                  className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300"
                                >
                                  {outcome.outcome_name}: ₱{outcome.points.toLocaleString()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {isLoadingActivities && activities.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <IonSpinner name="crescent" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 dark:text-red-400 text-sm">
                  {error}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  No activity yet. Be the first to interact with this market!
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} history={history} />
                    ))}
                  </div>

                  {/* Load More */}
                  {activityPage < activityTotalPages && (
                    <div className="flex justify-center pt-4">
                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={() => {
                          const nextPage = activityPage + 1;
                          setActivityPage(nextPage);
                          fetchActivities(nextPage, false);
                        }}
                        disabled={isLoadingActivities}
                      >
                        {isLoadingActivities ? <IonSpinner name="crescent" /> : 'Load More'}
                      </IonButton>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default CommentSection;
