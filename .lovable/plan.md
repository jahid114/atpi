

## Plan: Upgrade All Packages to Latest Versions

### Overview
Update every dependency to its latest major version and fix all breaking changes in the codebase.

### Major Breaking Changes to Address

1. **react-day-picker v8 → v9**: Complete classNames API rewrite, `initialFocus` prop removed, custom component API changed (`IconLeft`/`IconRight` → `Chevron`)
2. **react-router-dom v6 → v7**: Package renamed to `react-router`, API largely compatible but imports change
3. **date-fns v3 → v4**: Minor, `format` still works the same way
4. **vaul v0.9 → v1.x**: Minor API adjustments

### Files to Change

**1. `package.json`** — Bump all versions:
- `react-day-picker`: `^8.10.1` → `^9.6.0`
- `react-router-dom`: `^6.30.1` → `^7.6.0` (or use `react-router` ^7)
- `date-fns`: `^3.6.0` → `^4.1.0`
- `vaul`: `^0.9.9` → `^1.1.0`
- All Radix packages, lucide-react, recharts, sonner, zod, etc. to latest
- Dev deps: vite, vitest, typescript, eslint, etc.

**2. `src/components/ui/calendar.tsx`** — Full rewrite for react-day-picker v9:
- New classNames API (`caption` → `month_caption`, `nav_button` → `button_previous`/`button_next`, `cell` → `day`, `day` → `day_button`, etc.)
- Remove `IconLeft`/`IconRight` custom components, use `Chevron` component
- Remove `initialFocus` handling from type

**3. Remove `initialFocus` prop from all Calendar usages** (4 files, 8 occurrences):
- `src/components/expenses/ExpenseListTab.tsx`
- `src/components/long-term/LTITransactionsTab.tsx`
- `src/components/short-term/STITransactionsTab.tsx`
- `src/components/clients/ClientTransactionsTab.tsx`

**4. `src/components/NavLink.tsx`** — Update imports if react-router-dom v7 changes the `NavLinkProps` type (v7 keeps `react-router-dom` as a re-export package, so imports may remain compatible)

**5. `src/App.tsx`** — No structural changes needed; `BrowserRouter`, `Routes`, `Route`, `Navigate` all still exist in react-router v7's compatibility layer

### Risk Assessment
- **Calendar**: Highest risk — complete classNames rewrite. Will thoroughly map old → new class names.
- **Router**: Low risk — v7 maintains backward compatibility with v6 patterns when using `react-router-dom` imports.
- **date-fns**: Low risk — `format()` API unchanged.
- **Other packages**: Radix, recharts, sonner, etc. are minor/patch bumps with no API changes.

