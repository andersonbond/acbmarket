import React, { useState } from 'react';
import { IonButton, IonTextarea, IonIcon } from '@ionic/react';
import { sendOutline, closeOutline } from 'ionicons/icons';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  initialValue?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  onCancel,
  placeholder = 'Add a comment...',
  isLoading = false,
  initialValue = '',
}) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    if (onCancel) {
      onCancel();
    }
  };

  const remainingChars = 2000 - content.length;
  const isOverLimit = content.length > 2000;

  return (
    <div className="space-y-2">
      <IonTextarea
        value={content}
        onIonInput={(e) => setContent(e.detail.value!)}
        placeholder={placeholder}
        rows={3}
        className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        disabled={isSubmitting || isLoading}
        maxlength={2000}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onCancel && (
            <IonButton
              fill="clear"
              size="small"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
            >
              <IonIcon icon={closeOutline} slot="start" />
              Cancel
            </IonButton>
          )}
          <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {remainingChars} characters remaining
          </span>
        </div>
        <IonButton
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting || isLoading || isOverLimit}
          className="button-primary"
        >
          <IonIcon icon={sendOutline} slot="start" />
          Post Comment
        </IonButton>
      </div>
    </div>
  );
};

export default CommentInput;
