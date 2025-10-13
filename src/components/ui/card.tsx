import * as React from 'react';
import { clsx } from 'clsx';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-xl border bg-white shadow-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-4', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-4 pt-0', className)} {...props} />;
}
