# Restaurant Booking Prototype (Next.js + Tailwind)

This is a ready-to-run prototype for your restaurant booking manager UI.

## Stack
- Next.js 14, React 18, TypeScript
- Tailwind CSS (preconfigured)
- Minimal local UI components compatible with the prototype (`@/components/ui/*`)

## Run locally
```bash
pnpm i   # or npm i / yarn
pnpm dev # or npm run dev / yarn dev
```
Open http://localhost:3000

## Notes
- Data is mocked in-memory on the client. No backend yet.
- The UI matches the spec: visual table map, quick create, check-in, close/complete, cancel with reason (manager), group tables, list view.
- The “Select”, “Sheet”, “Tabs” components are simplified local versions (no external icon/CDN).

## Next steps (optional)
When you're ready, wire it to Supabase + API routes as discussed earlier. You can drop the component from `app/page.tsx` into a real app and keep the same UI imports.
