import React, { useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { heartOutline, heart, chatbubbleOutline, createOutline, trashOutline, chevronDown, chevronUp } from 'ionicons/icons';
import { Comment } from '../types/comment';
import CommentInput from './CommentInput';
import { createComment, updateComment, deleteComment } from '../services/comments';
import { useAuth } from '../contexts/AuthContext';

interface CommentItemProps {
  comment: Comment;
  marketId: string;
  depth?: number;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  marketId,
  depth = 0,
  onUpdate,
  onDelete,
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(depth === 0); // Auto-expand top level
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.id === comment.user.id;
  const maxDepth = 4;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatStake = (user: Comment['user']) => {
    // TODO: Get user's forecast stake for this market
    // For now, return empty string
    return '';
  };

  const handleReply = async (content: string) => {
    setIsSubmitting(true);
    try {
      await createComment(marketId, {
        content,
        parent_id: comment.id,
      });
      setIsReplying(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (content: string) => {
    setIsSubmitting(true);
    try {
      await updateComment(comment.id, { content });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = () => {
    // TODO: Implement like functionality
    console.log('Like comment:', comment.id);
  };

  if (comment.is_deleted) {
    return (
      <div className={`py-2 ${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
        <p className="text-gray-400 dark:text-gray-500 italic text-sm">[deleted]</p>
      </div>
    );
  }

  const indentClass = depth > 0 ? `ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4` : '';

  return (
    <div className={`py-3 ${indentClass}`}>
      {/* Comment Header */}
      <div className="flex items-start gap-3 mb-2">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
          {comment.user.display_name.charAt(0).toUpperCase()}
        </div>

        {/* User info and content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {comment.user.display_name}
            </span>
            {formatStake(comment.user) && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {formatStake(comment.user)} Yes
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                (edited)
              </span>
            )}
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <CommentInput
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              placeholder="Edit your comment..."
              initialValue={comment.content}
              isLoading={isSubmitting}
            />
          ) : (
            <p className="text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap mb-2">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <IonIcon icon={comment.user_liked ? heart : heartOutline} className="text-base" />
                <span className="text-xs">{comment.like_count || 0}</span>
              </button>

              {depth < maxDepth && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  <IonIcon icon={chatbubbleOutline} className="text-base" />
                  <span className="text-xs">Reply</span>
                </button>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <IonIcon icon={createOutline} className="text-base" />
                    <span className="text-xs">Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <IonSpinner name="crescent" className="w-4 h-4" />
                    ) : (
                      <IonIcon icon={trashOutline} className="text-base" />
                    )}
                    <span className="text-xs">Delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className="mt-3 ml-11">
          <CommentInput
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            placeholder={`Reply to ${comment.user.display_name}...`}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {showReplies ? (
            <>
              <button
                onClick={() => setShowReplies(false)}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-2 text-sm"
              >
                <IonIcon icon={chevronUp} className="text-xs" />
                <span>Hide {comment.reply_count} {comment.reply_count === 1 ? 'Reply' : 'Replies'}</span>
              </button>
              <div className="space-y-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    marketId={marketId}
                    depth={depth + 1}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors text-sm"
            >
              <IonIcon icon={chevronDown} className="text-xs" />
              <span>Show {comment.reply_count} {comment.reply_count === 1 ? 'Reply' : 'Replies'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
