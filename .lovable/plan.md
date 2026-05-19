# LTI Profit Distribution Modal — API Contracts

Two endpoints back the Distribute Profit modal on the Profit Share tab. Example uses `year = 2026`, `lti-investor-id = 7` (Noah Bennett), `TODAY = 2026-02-14`.

---

## 1. `GET /lti-profit/{year}/distribute/{lti-investor-id}`

Returns everything needed to render the modal: investor header, the per-segment weight/share breakdown, the live profit pool denominator, available payout destinations, and a `canDistribute` guard.

### Response 200

```json
{
  "year": 2026,
  "cycle": {
    "id": "2026",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "asOfDate": "2026-02-14",
    "status": "open"
  },
  "investor": {
    "id": 7,
    "name": "Noah Bennett",
    "email": "noah.bennett@example.com",
    "phone": "+8801710000007",
    "status": "approved"
  },
  "profitPool": 1250000,
  "totalCycleWeight": 412600000,
  "investorWeight": 84810000,
  "sharePct": 0.2056,
  "projectedShare": 257000,
  "principal": 370000,

  "segments": [
    {
      "index": 1,
      "eventType": "deposit",
      "eventLabel": "Deposit",
      "eventAmount": 200000,
      "eventDate": "2026-01-05",
      "startDate": "2026-01-05",
      "endDate": "2026-03-12",
      "days": 66,
      "balance": 200000,
      "weight": 13200000,
      "share": 40000
    },
    {
      "index": 2,
      "eventType": "deposit",
      "eventLabel": "Deposit",
      "eventAmount": 150000,
      "eventDate": "2026-03-12",
      "startDate": "2026-03-12",
      "endDate": "2026-05-20",
      "days": 69,
      "balance": 350000,
      "weight": 24150000,
      "share": 73175
    },
    {
      "index": 3,
      "eventType": "withdrawal",
      "eventLabel": "Withdrawal",
      "eventAmount": 80000,
      "eventDate": "2026-05-20",
      "startDate": "2026-05-20",
      "endDate": "2026-08-01",
      "days": 73,
      "balance": 270000,
      "weight": 19710000,
      "share": 59725
    },
    {
      "index": 4,
      "eventType": "deposit",
      "eventLabel": "Deposit",
      "eventAmount": 100000,
      "eventDate": "2026-08-01",
      "startDate": "2026-08-01",
      "endDate": "2026-10-15",
      "days": 75,
      "balance": 370000,
      "weight": 27750000,
      "share": 84100
    }
  ],
  "totals": {
    "weight": 84810000,
    "share": 257000
  },

  "destinations": {
    "wallet": {
      "id": "wallet",
      "kind": "wallet",
      "label": "Wallet",
      "description": "Credit to Noah Bennett's wallet balance"
    },
    "bank": {
      "id": "bank-7",
      "kind": "bank",
      "accountId": 7,
      "bankName": "BRAC Bank",
      "accountName": "Noah Bennett",
      "accountNumber": "1086415000000",
      "branchName": "Main Branch",
      "routingNumber": "900000217"
    },
    "mobiles": [
      {
        "id": "mobile-71",
        "kind": "mobile",
        "accountId": 71,
        "provider": "Nagad",
        "accountName": "Noah Bennett",
        "accountNumber": "01764211000"
      }
    ]
  },

  "canDistribute": true,
  "alreadyDistributed": false,
  "guard": {
    "reason": null,
    "minAmount": 1
  }
}
```

### Field notes

- `sharePct` is a decimal fraction (0.2056 = 20.56%). UI multiplies by 100.
- `segments[].share` is derived; the source of truth is `weight / totalCycleWeight * profitPool`. Sent pre-computed so the modal does not need to recompute.
- `endDate` of the last open segment equals `min(today, cycle.endDate)`.
- `alreadyDistributed = true` ⇒ `canDistribute = false`, `guard.reason = "already_distributed"`, and a `distribution` block is added mirroring section 2's success body.
- `guard.reason` enum: `null | "already_distributed" | "no_profit" | "cycle_closed" | "not_approved"`.

### Errors

- `404` — investor not found, or not approved.
- `409` `{ "error": "cycle_closed" }` — cycle is `distributed`.

---

## 2. `POST /lti-profit/{year}/distribute/{lti-investor-id}`

Commits the distribution: writes a `payout` InvestmentEntry, snapshots a `ProfitDistribution` row, optionally credits the wallet, and returns the invoice handle.

### Request body

```json
{
  "destination": {
    "kind": "bank",
    "accountId": 7
  },
  "amount": 257000,
  "attachment": {
    "name": "noah-payout-2026.pdf",
    "url": "https://uploads.atpi.app/lti/2026/7/noah-payout-2026.pdf"
  },
  "note": "Q1 2026 profit release",
  "idempotencyKey": "lti-2026-7-2026-02-14"
}
```

Body rules:

- `destination.kind`: `"wallet" | "bank" | "mobile"`.
  - `wallet` ⇒ omit `accountId`.
  - `bank` / `mobile` ⇒ `accountId` required (must match an id returned by the GET).
- `amount` is **optional**. If omitted, server uses the current `projectedShare`. If supplied, it must equal that value within ±1 (rounding) — otherwise `422 amount_mismatch`. Sending it lets the client confirm what the user saw.
- `attachment` allowed only when `destination.kind !== "wallet"`.
- `note` ≤ 500 chars.
- `idempotencyKey` recommended; replays return the original `201` body.

### Response 201

```json
{
  "distribution": {
    "id": "dist_2026_7_01",
    "cycleId": "2026",
    "investorId": 7,
    "weight": 84810000,
    "totalWeight": 412600000,
    "sharePct": 0.2056,
    "amount": 257000,
    "releasedAt": "2026-02-14T10:32:11Z",
    "destination": {
      "kind": "bank",
      "accountId": 7,
      "label": "BRAC Bank · ••••0000"
    },
    "note": "Q1 2026 profit release",
    "attachment": {
      "name": "noah-payout-2026.pdf",
      "url": "https://uploads.atpi.app/lti/2026/7/noah-payout-2026.pdf"
    }
  },
  "entry": {
    "id": 901,
    "investorId": 7,
    "type": "payout",
    "status": "approved",
    "amount": 257000,
    "date": "2026-02-14"
  },
  "wallet": null,
  "invoice": {
    "url": "https://api.atpi.app/lti-profit/2026/distribute/7/invoice.pdf",
    "filename": "LTI-Invoice-NoahBennett-2026.pdf"
  },
  "summaryDelta": {
    "pendingAmount": -257000,
    "distributedAmount": 257000,
    "pendingCount": -1,
    "distributedCount": 1
  }
}
```

When `destination.kind === "wallet"`, `wallet` is populated instead of `null`:

```json
"wallet": {
  "investorId": 7,
  "transactionId": "wtx_4412",
  "creditedAmount": 257000,
  "newBalance": 312500,
  "reason": "LTI profit payout · 2026"
}
```

### Error responses

| Status | `error` code            | Cause                                                            |
| ------ | ----------------------- | ---------------------------------------------------------------- |
| 400    | `invalid_destination`   | Unknown `accountId` for this investor / kind mismatch            |
| 404    | `investor_not_found`    |                                                                  |
| 409    | `already_distributed`   | Investor already has an approved payout for this cycle           |
| 409    | `cycle_closed`          | `cycle.status === "distributed"`                                 |
| 422    | `amount_mismatch`       | `amount` differs from server-computed `projectedShare` by > 1    |
| 422    | `no_profit`             | `projectedShare <= 0`                                            |
| 422    | `attachment_not_allowed`| Attachment sent with `destination.kind === "wallet"`             |

All errors share the shape:

```json
{ "error": "amount_mismatch", "message": "Amount 260000 differs from projected 257000.", "expected": 257000 }
```

---

## Cross-API consistency

- `segments`, `investorWeight`, `totalCycleWeight`, `sharePct`, `projectedShare` in GET match the snapshot persisted in POST's `distribution` block (weight/totalWeight/sharePct/amount). The POST freezes those values per the entity design in `.lovable/plan.md`.
- `destinations` ids returned by GET are the exact strings the POST expects in `destination.accountId`.

Documentation only — no code changes in this plan.
