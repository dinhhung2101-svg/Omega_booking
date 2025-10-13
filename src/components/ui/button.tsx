import * as React from 'react';
import { clsx } from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'ghost' | 'outline';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const styles = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent hover:bg-gray-100',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50'
    }[variant];
    return (
      <button
        ref={ref}
        className={clsx('inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500', styles, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
