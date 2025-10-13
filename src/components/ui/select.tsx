import * as React from 'react';
import { clsx } from 'clsx';

type Ctx = {
  value?: string;
  onValueChange?: (v: string)=>void;
  open: boolean;
  setOpen: (b: boolean)=>void;
  items: Array<{value: string; label: string}>;
  setItems: (list: Array<{value: string; label: string}>)=>void;
};
const SelectCtx = React.createContext<Ctx | null>(null);

export function Select({ value, onValueChange, children }: any) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Array<{value: string; label: string}>>([]);
  return (
    <SelectCtx.Provider value={{ value, onValueChange, open, setOpen, items, setItems }}>
      <div className="relative inline-block">{children}</div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className, children }: any) {
  const ctx = React.useContext(SelectCtx)!;
  return (
    <button
      type="button"
      onClick={()=> ctx.setOpen(!ctx.open)}
      className={clsx('w-48 h-9 px-3 rounded-md border border-gray-300 bg-white text-left text-sm', className)}
    >
      {children}
    </button>
  );
}

export function SelectValue() {
  const ctx = React.useContext(SelectCtx)!;
  const current = ctx.items.find(i => i.value === ctx.value);
  return <span>{current ? current.label : 'Chọn...'}</span>;
}

export function SelectContent({ className, children }: any) {
  const ctx = React.useContext(SelectCtx)!;
  if (!ctx.open) return null;
  return (
    <div className={clsx('absolute z-20 mt-1 w-48 rounded-md border bg-white shadow', className)}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: any) {
  const ctx = React.useContext(SelectCtx)!;
  React.useEffect(() => {
    // register item
    ctx.setItems(prev => {
      if (prev.find(p => p.value === value)) return prev;
      return [...prev, { value, label: children }];
    });
  }, [value, children]);
  return (
    <div
      role="option"
      onClick={()=> { ctx.onValueChange && ctx.onValueChange(value); ctx.setOpen(false); }}
      className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
    >
      {children}
    </div>
  );
}
