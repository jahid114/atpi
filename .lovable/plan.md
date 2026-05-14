# LTI Entity Design — Efficient Profit-Share Calculation

You're right. The previous design only modeled raw transactions, which forces every profit-share read to walk the entire `InvestmentEntry` history of every approved investor and recompute time-weighted balances. That's fine for 13 seeded investors in React state, but it does not scale and it offers no audit trail of past distributions.

This revision adds three things to the entity model:

1. A **denormalized weight cache** on each investor (incrementally maintained on ledger writes).
2. A **ProfitCycle** entity (the 365-day window the pro-rata engine already assumes).
3. A **ProfitDistribution** entity that snapshots each investor's share at release time, so historical payouts are O(1) reads instead of recomputations.

## 1. Why the previous design was inefficient

For one Profit Share read the current code does:

```text
for each approved investor:
  for each approved deposit/withdrawal in history:
    sort, segment, multiply balance × days
=> O(N investors × M entries) every render, every tab switch
```

And nothing is persisted — if the netProfit changes, all old "released" payouts silently drift, because `payout` rows in history don't remember the weight or denominator they were computed against.

## 2. Revised Entity Model

```text
┌──────────────────────┐ 1     0..N ┌──────────────────────────────┐
│      Investor        │───────────▶│     InvestmentEntry          │
│ + cached weight      │            │ deposit | withdrawal | payout│
│ + cached balance     │            │ pending | approved | rejected│
└──────────┬───────────┘            └──────────────────────────────┘
           │ 1
           │ 0..N
           ▼
┌──────────────────────────────┐
│  InvestorWeightSnapshot      │   one row per (investor, cycle)
│ cycleId, weight, balance,    │   updated incrementally on each
│ lastEventDate                │   approved ledger write
└──────────┬───────────────────┘
           │ N
           │ 1
           ▼
┌──────────────────────────────┐ 1   0..N ┌──────────────────────────────┐
│       ProfitCycle            │─────────▶│     ProfitDistribution       │
│ id, startDate, endDate,      │          │ cycleId, investorId,         │
│ totalDays, totalWeight (Σ),  │          │ weight, sharePct, amount,    │
│ netProfitSnapshot, status:   │          │ releasedAt, entryId (FK to   │
│   open | distributed         │          │ the payout InvestmentEntry)  │
└──────────────────────────────┘          └──────────────────────────────┘
```

### 2.1 New / changed fields

**Investor (added)**
| Field                   | Type    | Purpose                                                 |
| ----------------------- | ------- | ------------------------------------------------------- |
| currentBalance          | number  | Σ approved deposits − Σ approved withdrawals (cached).  |
| currentCycleWeight      | number  | Time-weighted balance for the **open** cycle (cached).  |
| lastEventDate           | date    | Date of the last approved deposit/withdrawal applied.   |

These are derived but **persisted and updated on write**, so reads are O(1).

**ProfitCycle (new)**
| Field              | Type                     | Notes                                              |
| ------------------ | ------------------------ | -------------------------------------------------- |
| id                 | PK                       | e.g. `2026`.                                       |
| startDate, endDate | date                     | 365-day window (matches `pro-rata-engine` memory). |
| totalDays          | number                   | Constant (365).                                    |
| totalWeight        | number                   | Σ `InvestorWeightSnapshot.weight` for this cycle.  |
| netProfitSnapshot  | number?                  | Frozen at distribution time.                       |
| status             | open / distributed       | Locks weights once distributed.                    |

**InvestorWeightSnapshot (new)**
| Field          | Type | Notes                                                                            |
| -------------- | ---- | -------------------------------------------------------------------------------- |
| investorId     | FK   |                                                                                  |
| cycleId        | FK   | (investorId, cycleId) is the unique key.                                         |
| balance        | num  | Running balance at `lastEventDate` (clipped to cycle).                           |
| weight         | num  | Σ (segmentBalance × segmentDays) accumulated incrementally.                      |
| lastEventDate  | date | Cursor used by the incremental updater.                                          |

**ProfitDistribution (new)**
| Field         | Type | Notes                                                                          |
| ------------- | ---- | ------------------------------------------------------------------------------ |
| id            | PK   |                                                                                |
| cycleId       | FK   |                                                                                |
| investorId    | FK   |                                                                                |
| weight        | num  | Snapshot of investor weight at release time.                                   |
| totalWeight   | num  | Snapshot of cycle denominator at release time.                                 |
| sharePct      | num  | weight / totalWeight (stored for display / audit).                             |
| amount        | num  | Released amount in USD.                                                        |
| releasedAt    | date |                                                                                |
| entryId       | FK   | The corresponding `InvestmentEntry { type: "payout" }` row.                    |

## 3. How weights are updated efficiently

The expensive step today is "walk all history → segment → multiply". Replace it with an **incremental updater** that runs only when the ledger changes:

```text
onApprove(entry):                       // also onReject of an approved entry (reverse)
  cycle  = cycleFor(entry.date)
  snap   = getOrCreate(InvestorWeightSnapshot, investor, cycle)

  // 1) close the previous segment from snap.lastEventDate → entry.date
  days   = daysBetween(snap.lastEventDate ?? cycle.startDate, entry.date)
  snap.weight  += snap.balance * days

  // 2) apply this event to the running balance
  if entry.type == "deposit":     snap.balance += entry.amount
  if entry.type == "withdrawal":  snap.balance -= entry.amount
  // payouts do not change balance or weight

  // 3) advance the cursor
  snap.lastEventDate = entry.date

  // 4) keep the cycle denominator in sync
  cycle.totalWeight = Σ snapshots.weight   // or maintain a delta-update
```

A nightly (or on-read) "settle to today" step extends the last open segment up to `min(today, cycle.endDate)` so the dashboard always shows a fresh `currentCycleWeight` without a full rescan.

Reads now become:

```text
investorShare(investor) =
  (investor.currentCycleWeight + tail(investor, today))
  / cycle.totalWeight
  × cycle.netProfitSnapshot ?? currentNetProfit
```

That's O(1) per investor instead of O(M).

## 4. How "Release" becomes a snapshot

Today, releasing a payout writes only an `InvestmentEntry { type: "payout" }`. We add the audit row alongside it:

```text
release(investor):
  d = ProfitDistribution {
    cycleId, investorId,
    weight = snap.weight + tail,
    totalWeight = cycle.totalWeight,
    sharePct, amount, releasedAt = today
  }
  e = InvestmentEntry { type: "payout", amount, status: "approved" }
  d.entryId = e.id
```

Once `cycle.status = "distributed"`, the cycle is frozen: weights, denominator, and netProfit are locked, so reopening the page next year still shows the exact share each investor received.

## 5. Migration from current code

| Current                                                               | Revised                                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `calcTimeWeightedBalance(investor)` walked history on every render.   | Replaced by `investor.currentCycleWeight` (cached) + tiny tail extension.        |
| `calculateInvestorShare()` re-summed every investor's weight.         | Reads `cycle.totalWeight` (already maintained).                                  |
| `payout` entries had no provenance.                                   | Each release writes a `ProfitDistribution` row linked to the payout entry.       |
| Year boundary was implicit (`YEAR_START` / `TODAY` constants).        | Explicit `ProfitCycle` rows, one per year, with `open` / `distributed` status.   |
| Approve/reject re-derived `invested` from history.                    | Approve/reject also calls `applyDelta(snapshot, ±amount, eventDate)`.            |

The TypeScript-level changes if/when implemented:

- Add `currentBalance`, `currentCycleWeight`, `lastEventDate` to `Investor`.
- Add `src/types/profit-cycle.ts` with `ProfitCycle`, `InvestorWeightSnapshot`, `ProfitDistribution`.
- In `LTIContext`: replace pure recomputation with `applyApprove / applyReject / applyRelease` reducers that update both the entry **and** the snapshot.
- Keep the existing pure functions (`calcWeightSegments`, etc.) for the Profit Share **breakdown UI** — they're cheap when called for a single investor on demand.

## 6. Backend-ready schema (when LTI moves off React state)

```text
profit_cycles(
  id PK, start_date, end_date, total_days,
  total_weight, net_profit_snapshot NULL,
  status                                   -- 'open' | 'distributed'
)

investor_weight_snapshots(
  investor_id FK, cycle_id FK,
  balance, weight, last_event_date,
  PRIMARY KEY (investor_id, cycle_id)
)

profit_distributions(
  id PK, cycle_id FK, investor_id FK,
  weight, total_weight, share_pct, amount,
  released_at, entry_id FK -> investment_entries.id
)

investors(
  ..., current_balance, current_cycle_weight, last_event_date
)
```

Indexes: `(investor_id, cycle_id)` on snapshots, `(cycle_id)` on distributions, `(investor_id, status, type)` on entries.

This is documentation only — no code changes. After approval I can either keep this as the canonical entity design doc or also start wiring the snapshot/cycle layer into `LTIContext`.
