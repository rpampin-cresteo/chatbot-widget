import { clsx } from 'clsx';
import { ButtonHTMLAttributes, ForwardedRef, forwardRef } from 'react';

const baseStyles =
  'cw-focus-ring inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<string, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-500 text-white hover:bg-rose-600'
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export const Button = forwardRef(function Button(
  { variant = 'primary', className, ...props }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    />
  );
});
