import * as React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx('w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500', className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
