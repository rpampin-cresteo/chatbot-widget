import { useState } from 'react';

import type { ChatMessage } from '@/lib/types';

import { Button } from '../ui/Button';
import { useWidgetStore } from './store';

type FeedbackProps = {
  lastAssistantMessage?: ChatMessage;
  disabled?: boolean;
};

export const Feedback = ({ lastAssistantMessage, disabled }: FeedbackProps) => {
  const { session, feedback, setFeedback } = useWidgetStore((state) => ({
    session: state.session,
    feedback: state.feedback,
    setFeedback: state.setFeedback
  }));

  const [submitting, setSubmitting] = useState(false);

  if (!lastAssistantMessage || !session?.userId) {
    return null;
  }

  const sendFeedback = async (rating: 'positive' | 'negative') => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setFeedback({ messageId: lastAssistantMessage.id, rating });
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId: lastAssistantMessage.id,
          rating
        })
      });
    } catch (error) {
      console.error('[widget] Feedback submission failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <span>Was this answer helpful?</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={feedback?.rating === 'positive' ? 'primary' : 'ghost'}
          disabled={disabled || submitting}
          onClick={() => void sendFeedback('positive')}
          aria-label="Mark answer as helpful"
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={feedback?.rating === 'negative' ? 'primary' : 'ghost'}
          disabled={disabled || submitting}
          onClick={() => void sendFeedback('negative')}
          aria-label="Mark answer as unhelpful"
        >
          No
        </Button>
      </div>
    </div>
  );
};
