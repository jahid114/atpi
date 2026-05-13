## Goal
Add a "Transfer Medium" selector to the Register Investor form in the LTI Requests tab, matching the pattern used in the LTI Transactions tab (Cash / Check / Bank Transfer), and persist it on the initial deposit history entry.

## Changes

### 1. `src/components/long-term/LTIRequestsTab.tsx`
- Add `transferMedium` state (default `"cash"`), reset on dialog close / after submit.
- In the **Investment Details** grid, when `fundingSource === "direct"`, render a Transfer Medium `Select` (Cash, Check, Bank Transfer) alongside the existing fields, placed just before the Payment Attachment field.
- Pass `transferMedium` (and existing `attachment`) through `onRegister`.

### 2. `src/contexts/LTIContext.tsx` — `RegisterData` & `handleRegister`
- Extend `RegisterData` with optional `transferMedium?: TransferMedium` and `attachment?: { name; url }`.
- In `handleRegister`, attach `transferMedium` and `attachment` to the initial deposit `InvestmentEntry` (only when `fundingSource === "direct"`).

### 3. `src/pages/Investors.tsx`
- No code changes needed; `handleRegister` is already wired through context.

## Notes
- Transfer Medium only shows for Direct funding (Wallet funding doesn't need it), mirroring the existing Attachment behavior.
- Uses existing `TransferMedium` type from `src/types/investor.ts` — no new types.
- No business-logic changes to approval/profit calculations.