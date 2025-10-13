import * as React from 'react';
import { clsx } from 'clsx';

type TabsContextType = { value?: string; onValueChange?: (v: string)=>void };
const TabsCtx = React.createContext<TabsContextType>({});

export function Tabs({ value, onValueChange, className, children }: any) {
  return <div className={className}><TabsCtx.Provider value={{ value, onValueChange }}>{children}</TabsCtx.Provider></div>;
}
export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('inline-flex rounded-md border bg-white', className)} {...props} />;
}
export function TabsTrigger({ value, className, children }: any) {
  const ctx = React.useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.onValueChange && ctx.onValueChange(value)}
      className={clsx('px-3 py-1.5 text-sm rounded-md', active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100', className)}
    >
      {children}
    </button>
  );
}
