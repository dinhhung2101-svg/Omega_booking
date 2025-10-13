import * as React from 'react';
import { clsx } from 'clsx';

type Ctx = { open: boolean; onOpenChange?: (b: boolean)=>void };
const SheetCtx = React.createContext<Ctx>({ open: false });

export function Sheet({ open, onOpenChange, children }: any) {
  return <SheetCtx.Provider value={{ open, onOpenChange }}>{children}</SheetCtx.Provider>;
}

export function SheetContent({ side = 'right', className, children }: any) {
  const ctx = React.useContext(SheetCtx);
  if (!ctx.open) return null;
  const sideCls = side === 'right' ? 'right-0' : side === 'left' ? 'left-0' : 'right-0';
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={()=> ctx.onOpenChange && ctx.onOpenChange(false)} />
      <div className={clsx('absolute top-0 bottom-0 w-[440px] max-w-full bg-white shadow-xl p-4 overflow-auto', sideCls, className)}>
        {children}
      </div>
    </div>
  );
}
export function SheetHeader(props: any){ return <div className="mb-2" {...props} />; }
export function SheetTitle(props: any){ return <h2 className="text-xl font-semibold" {...props} />; }
export function SheetDescription(props: any){ return <div className="text-sm text-gray-600" {...props} />; }
export function SheetFooter(props: any){ return <div className="mt-4" {...props} />; }
