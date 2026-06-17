# Investor Dashboard — API Spec

Spec for the data behind `/investor/dashboard` (`src/pages/investor/InvestorDashboard.tsx`). One read endpoint returns everything the page renders today: welcome header, 4 KPI cards, LTI + STI summary cards, and the unified transaction history with filters and pagination.

Example uses `userId = u_42` (Alice Johnson) viewing on `TODAY = 2026-06-17`.

---

## 1. `GET /investor/dashboard`

Identifies the caller from the session. No path params.

### Query params

| param | type | default | notes |
|---|---|---|---|
| `source` | `all \| Wallet \| Direct` | `all` | filters the transaction list |
| `status` | `all \| approved \| pending \| rejected` | `all` | filters the transaction list |
| `page` | int | 1 | 1-based |
| `pageSize` | int | 5 | matches project pagination default |

### Response 200

```json
{
  "user": {
    "id": "u_42",
    "name": "Alice Johnson",
    "firstName": "Alice",
    "email": "alice@example.com",
    "phone": "+8801711111111",
    "today": "2026-06-17"
  },

  "kpis": {
    "walletBalance":   { "amount": 25000, "currency": "BDT" },
    "totalInvested":   { "amount": 150000, "currency": "USD" },
    "totalWithdrawn":  { "amount": 12000, "currency": "USD" },
    "totalProfit":     { "amount": 18500, "currency": "USD" }
  },

  "lti": {
    "registered": true,
    "status": "approved",
    "shares": 3,
    "currentInvestment": 70000,
    "withdrawn": 12000,
    "profitReceived": 11000,
    "link": { "route": "/investor/lti" }
  },

  "sti": {
    "projectCount": 2,
    "totalInvested": 80000,
    "expectedReturns": 14400,
    "distributedProfit": 7500,
    "link": { "route": "/investor/sti" }
  },

  "transactions": {
    "items": [
      {
        "id": "wallet-101",
        "date": "2026-01-10",
        "source": "Wallet",
        "type": "Top Up",
        "typeCode": "wallet.top_up",
        "description": "Initial wallet funding",
        "amount": 75000,
        "currency": "BDT",
        "direction": "in",
        "status": "approved",
        "subject": { "kind": "wallet_tx", "id": "wtx_101" },
        "link": { "route": "/investor/wallet", "params": { "txId": "wtx_101" }, "highlightId": "wtx_101" }
      },
      {
        "id": "lti-7",
        "date": "2026-01-15",
        "source": "Wallet",
        "type": "LTI Deposit",
        "typeCode": "lti.deposit",
        "description": "Long-term deposit from wallet",
        "amount": 30000,
        "currency": "USD",
        "direction": "neutral",
        "status": "approved",
        "subject": { "kind": "lti_entry", "id": "entry_7" },
        "link": { "route": "/investor/lti", "tab": "transactions", "highlightId": "entry_7" }
      },
      {
        "id": "sti-payout-2",
        "date": "2025-09-10",
        "source": "Direct",
        "type": "STI Profit Payout",
        "typeCode": "sti.payout",
        "description": "Solar Farm Phase 1 · distributed return",
        "amount": 7500,
        "currency": "USD",
        "direction": "in",
        "status": "approved",
        "subject": { "kind": "sti_entry", "id": "sti_entry_2" },
        "link": { "route": "/investor/sti", "params": { "projectId": "proj_solar_1" }, "highlightId": "sti_entry_2" }
      }
    ],
    "page": 1,
    "pageSize": 5,
    "totalItems": 14,
    "totalPages": 3,
    "appliedFilters": { "source": "all", "status": "all" }
  },

  "filterOptions": {
    "sources": ["all", "Wallet", "Direct"],
    "statuses": ["all", "approved", "pending", "rejected"]
  }
}
```

### Field notes

- `user.today` is server time (the welcome header uses it instead of `new Date()`).
- KPI amounts are pre-aggregated server-side; the UI never re-derives:
  - `totalInvested = ltiCurrent + stiInvested`
  - `totalWithdrawn = ltiWithdrawn + walletWithdrawn`
  - `totalProfit   = ltiPayouts + stiProfit`
- `kpis.walletBalance.currency = "BDT"` (taka, per project memory); investment KPIs are `USD`.
- `lti.registered=false` ⇒ all other `lti` numeric fields are `0` and the card renders the "Not registered…" empty state. Same shape, no `null` branches in the UI.
- `transactions.items[]` is the merged Wallet + LTI + STI feed already produced in `unifiedTx`, sorted desc by `date`, paginated server-side, and filter-applied per query params. `direction` drives the +/- sign and color (`in` → profit, `out` → destructive, `neutral` → foreground).
- `subject` is the stable domain reference for the row. `link` is the routing contract used when the user clicks the row (matches the notification `target` shape so the same helper builds the URL).
- `typeCode` is the stable machine value; `type` is the human label rendered today (`"Top Up"`, `"LTI Deposit"`, `"STI Investment"`, `"STI Profit Payout"`, etc.). The UI uses `type` as-is and groups/sorts by `typeCode` when needed.
- `filterOptions` is returned so the two `<Select>`s render straight from the payload.

### Errors

| Status | `error` | cause |
|---|---|---|
| 401 | `unauthenticated` | no session |
| 403 | `forbidden` | session is not an investor account |
| 422 | `invalid_filter` | unknown `source` / `status` value |

Shared shape `{ "error": "<code>", "message": "..." }`.

---

## 2. Cross-API consistency

- `lti.shares`, `lti.currentInvestment`, `lti.withdrawn`, `lti.profitReceived` match the values returned by the LTI investor endpoint for this user (and the totals in `.lovable/plan.md`'s distribute payload).
- `transactions.items[].subject.id` matches the ids returned by the matching domain APIs:
  - `wallet_tx` → `wtx_*` from the Wallet API
  - `lti_entry` → LTI `InvestmentEntry.id`
  - `sti_entry` → STI ledger entry id
- `link.params` keys (`txId`, `projectId`, `investorId`, `year`, `tab`, `highlight`) match the URL params the destination pages read (same contract as the Notification `target`).

---

## 3. Caching & freshness

- Cacheable per session for ~30s with `Cache-Control: private, max-age=30`.
- Invalidate when any of the following events fire for this user: wallet tx create/approve/reject, LTI entry change, LTI profit distribution, STI invest/distribute. The same events drive notifications, so a single server hook can bust both caches.

Documentation only — no code changes in this plan.
