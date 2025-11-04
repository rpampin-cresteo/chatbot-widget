import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from 'react';

import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';

type ComposerProps = {
  input: string;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
  onRetry: () => void;
  onClear: () => void;
  isLoading: boolean;
  canRetry?: boolean;
  disabled?: boolean;
};

export const Composer = ({
  input,
  onInputChange,
  onSubmit,
  onStop,
  onRetry,
  onClear,
  isLoading,
  canRetry,
  disabled
}: ComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [composerError, setComposerError] = useState<string | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (input.trim().length === 0) {
        setComposerError('Please enter a prompt before sending.');
        return;
      }
      setComposerError(null);
      const form = event.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (input.trim().length === 0) {
      event.preventDefault();
      setComposerError('Please enter a prompt before sending.');
      return;
    }
    setComposerError(null);
    onSubmit(event);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <footer className="border-t border-slate-100 p-4 dark:border-slate-800">
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <TextArea
          ref={textareaRef}
          value={input}
          placeholder="Ask about product docs, troubleshooting, or search results..."
          onChange={(event) => {
            setComposerError(null);
            onInputChange(event);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-disabled={disabled}
          aria-label="Chat prompt"
          aria-describedby={composerError ? 'composer-error' : undefined}
        />
        {composerError ? (
          <p id="composer-error" className="text-sm text-rose-500">
            {composerError}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={disabled || isLoading}
              aria-label="Send message"
            >
              Send
            </Button>
            {isLoading ? (
              <Button variant="ghost" type="button" onClick={onStop}>
                Stop
              </Button>
            ) : (
              canRetry && (
                <Button variant="ghost" type="button" onClick={onRetry}>
                  Regenerate
                </Button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" onClick={onClear} disabled={disabled}>
              Clear
            </Button>
          </div>
        </div>
      </form>
    </footer>
  );
};
