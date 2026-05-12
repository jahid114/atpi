

# Revamp LTI Profit Share Tab — Per-Investor Yearly Distribution

Replace the existing Profit Share tab (Visibility toggle + Distribution Summary + Invoice Vault) with a single distribution table that lets the admin distribute the year's profit share to each approved investor one by one — mirroring the STI distribution pattern. After each distribution, an invoice PDF is auto-generated.

---

## What Changes

### Removed
- "Profit Visibility" card (eye/eye-off toggle) — gone entirely.
- "Invoice Vault" section with the static invoice list — replaced.

### Kept (slightly tweaked)
- **Distribution Summary** card on top — Total to Distribute, Eligible Investors, Avg. Share — but reflects only **undistributed** amounts for `selectedYear`.

### New — Yearly Distribution Table
For each approved investor, in a row:

| Column            | Content                                                                 |
|-------------------|-------------------------------------------------------------------------|
| #                 | Index                                                                    |
| Investor          | Name + phone                                                             |
| Invested (TWB)    | Time-weighted balance for the year                                       |
| Projected Share   | `calculateInvestorShare(investor, profit, investors)` — visible upfront  |
| Status            | Badge: **Pending** (no payout for `selectedYear`) or **Distributed** (payout entry exists for `selectedYear`) |
| Distributed On    | Date of payout (only when distributed) — blank otherwise                 |
| Action            | `Distribute` button (Pending) → triggers per-investor distribution. `Invoice` button (Distributed) → re-downloads the PDF. |

A header action `Distribute All Pending` sits above the table for batch convenience (loops through pending rows).

### Behavior
- Profit pool is the existing `profit` from `useFinancial` (already year-filtered upstream).
- "Distributed for this year" = the investor has a `payout` history entry whose `date` falls in `selectedYear`. (Year-aware so re-running the page next year shows everyone Pending again.)
- Clicking **Distribute** on a row:
  1. Computes the share via `calculateInvestorShare`.
  2. Appends a `payout` entry to that investor's history (status `approved`, dated today, year = `selectedYear`).
  3. Auto-generates and downloads an LTI invoice PDF for that investor (year, principal/TWB, share amount, profit %, date).
  4. Fires a notification + toast.
- Clicking **Invoice** on an already-distributed row regenerates the same PDF from the stored payout entry.
- Investor portal: investors see profit only after a `payout` entry exists — no UI change needed since payouts are already what drives their visible amount.

---

## Files to Change

1. **`src/lib/lti-pdf.ts`** *(new)* — `generateLTIInvoice(investor, year, payout, profitPct?)` modeled on `sti-pdf.ts` (same brand styling, same layout: header, project/year info box, investor info box, amount table with Principal / Profit Share / Total, footer).

2. **`src/contexts/LTIContext.tsx`** — Extend `handleRelease` (or add `handleDistributeYear(id, year)`) so the payout entry it creates is dated within the active year and triggers the invoice download. Keep the existing `handleRelease` signature compatible; add a thin wrapper used by the new tab. Notification: `lti / distributed`.

3. **`src/components/long-term/LTIProfitShareTab.tsx`** — Full rewrite:
   - Remove visibility toggle, remove static `staticInvoices` array, remove invoice-vault table.
   - Keep the Distribution Summary card (recomputed against undistributed only).
   - Add the new yearly distribution table with `Distribute` / `Invoice` per row + `Distribute All Pending` button.
   - Use `usePagination` to keep table tidy.
   - Search box (by investor name) + status filter (`all` / `pending` / `distributed`).

4. **`src/pages/Investors.tsx`** — No structural change; tab already wires `LTIProfitShareTab`. Will continue passing `investors`, `profit`, `selectedYear` (now actually used for the year check).

---

## Out of Scope

- Investor-side dashboard tweaks (already shows received profits via existing payout history).
- Backend / DB schema (frontend-only project, per project memory).
- Re-styling other LTI tabs.

