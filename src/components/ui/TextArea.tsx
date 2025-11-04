import { clsx } from 'clsx';
import { ForwardedRef, TextareaHTMLAttributes, forwardRef } from 'react';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef(function TextArea(
  { className, ...props }: TextAreaProps,
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'cw-focus-ring min-h-[52px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
        className
      )}
      {...props}
    />
  );
});
