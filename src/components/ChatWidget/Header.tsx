import { FormEvent, useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

type HeaderProps = {
  displayName: string;
  greetingName: string;
  onDisplayNameCommit: (value: string) => Promise<void> | void;
  onClearHistory: () => void;
  onClose?: () => void;
  disabled?: boolean;
};

export const Header = ({
  displayName,
  greetingName,
  onDisplayNameCommit,
  onClearHistory,
  onClose,
  disabled
}: HeaderProps) => {
  const [value, setValue] = useState(displayName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(displayName);
  }, [displayName]);

  const commit = async () => {
    const trimmed = value.trim();
    if (saving || trimmed === displayName.trim()) {
      return;
    }
    setSaving(true);
    try {
      await onDisplayNameCommit(trimmed);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await commit();
  };

  return (
    <header className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Need help?
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Hi {greetingName}!
          </h2>
        </div>
        {onClose ? (
          <IconButton aria-label="Close chat widget" onClick={onClose}>
            x
          </IconButton>
        ) : null}
      </div>
      <form
        className="flex items-center gap-3"
        onSubmit={handleSubmit}
        aria-label="Update display name"
      >
        <label className="flex-1">
          <span className="sr-only">Preferred name</span>
          <input
            name="displayName"
            placeholder="Tell us how to address you"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={commit}
            disabled={disabled}
            className="cw-focus-ring w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          />
        </label>
        <Button type="submit" variant="ghost" disabled={disabled || saving}>
          Save
        </Button>
      </form>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          type="button"
          onClick={onClearHistory}
          disabled={disabled}
        >
          Clear history
        </Button>
      </div>
    </header>
  );
};
