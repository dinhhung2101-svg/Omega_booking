import * as React from 'react';
import { clsx } from 'clsx';

export function Badge({ className, variant = 'default', ...props }: any) {
  const styles = variant === 'outline'
    ? 'border border-gray-300 text-gray-700 bg-white'
    : 'bg-gray-900 text-white';
  return <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs', styles, className)} {...props} />;
}
