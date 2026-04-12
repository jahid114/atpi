

# React Native Mobile App Design Prompt for InvestFarm (Investor Platform)

Below is a ready-to-use prompt you can paste into any AI design tool or development assistant to generate a React Native mobile app that mirrors your investor web platform.

---

## The Prompt

```text
Design and build a React Native mobile app called "InvestFarm" — an investment management platform for investors. The app should follow a modern fintech aesthetic with the following brand and design specifications:

### BRAND & COLORS
- Primary color: Amber/Orange (HSL 37 92% 50% → approx #F59E0B)
- Background: Warm off-white (HSL 60 4% 95% → approx #F2F1EE)
- Cards: Light warm white (#F7F6F3)
- Text: Dark brown-black (HSL 24 9% 10%)
- Sidebar/Nav: Dark navy (HSL 222 47% 11% → approx #0F172A)
- Profit/Success: Green (#228B5A)
- Loss/Error: Red (#E04040)
- Warning: Amber (#F59E0B)
- Font: Source Sans Pro (or system sans-serif fallback)
- Border radius: 16px for cards, 12px for buttons, 8px for inputs
- Currency symbol: Bangladeshi Taka (৳) for wallet balances, US Dollar ($) for investments

### NAVIGATION
Bottom tab navigation with 4 tabs:
1. **Wallet** (Wallet icon) — Default/home tab
2. **LTI** (TrendingUp icon) — Long-Term Investment
3. **STI** (BarChart3 icon) — Short-Term Investment
4. **Profile** (User icon) — User profile & settings

### SCREEN 1: WALLET (Home)
- **Header**: "My Wallet" title
- **Balance Card**: Large prominent card showing current wallet balance in ৳ format (e.g., ৳25,000)
- **Quick Stats Row**: 3 mini KPI cards in a horizontal scroll:
  - Total Top Ups (green up-arrow icon)
  - Total Withdrawals (red down-arrow icon)
  - Total Spent on Investments (primary colored)
- **Action Buttons**: Two side-by-side buttons:
  - "Top Up" (primary/amber filled button)
  - "Withdraw" (outlined button)
  - Each opens a bottom sheet modal with fields: Amount (number input), Transfer Medium (dropdown: Cash, Check, Bank Transfer), Description (text input), Submit button
- **Linked Accounts Section**: Heading "Payment Accounts"
  - Bank account displayed as a premium dark gradient card (like a debit card) showing: Bank Name, Account Holder, Account Number (masked), Branch, Routing Number
  - Mobile banking accounts as colored cards with provider branding:
    - bKash: #E2136E (pink/magenta)
    - Nagad: #F6921E (orange)
    - Rocket: #8B2F8B (purple)
    - Upay: #00A550 (green)
  - Each shows: Provider name, Account Number, Account Holder Name
  - Limit: 1 bank account, multiple mobile banking accounts
- **Transaction History**: Scrollable list with pull-to-refresh
  - Each item shows: Type badge (Top Up/Withdraw/Invest LTI/Invest STI), Amount, Date, Status badge (Pending=gray, Approved=green, Rejected=red), Transfer medium if applicable

### SCREEN 2: LONG-TERM INVESTMENT (LTI)
- **Status-based rendering**:
  - If NOT registered: Show a card with info about LTI and a "Register Now" CTA button
  - If PENDING: Show status card "Your registration is under review"
  - If REJECTED: Show rejection notice
  - If APPROVED: Show full dashboard (below)
- **Registration Flow** (bottom sheet or full-screen modal):
  - Fields: Number of shares (number), Share price display ($10,000 per share), NID Number, Blood Group (dropdown), Jersey Size (dropdown: S/M/L/XL/XXL), Nominee Name, Nominee Relationship, Nominee Phone, Nominee NID
  - Total investment auto-calculated
  - Submit button
- **Approved Dashboard**:
  - KPI cards row (horizontal scroll): Shares Held, Total Invested ($), Projected Profit ($), Total Payouts ($)
  - Tab view with 3 sections:
    - **Overview**: Investment details card + Nominee info card
    - **Transactions**: List of investment transactions with status badges, filterable by status
    - **Profit Share**: Projected profit card, payout history list
  - Action buttons: "Buy More Shares" and "Withdraw" — each opens a bottom sheet

### SCREEN 3: SHORT-TERM INVESTMENT (STI)
- **Tab view** with 4 sections:
  - **Projects**: Browse available STI projects
    - KPI summary cards at top (horizontal scroll): Total Invested, Expected Profit, Active Projects, Distributed Profit
    - Project cards showing: Project name, image thumbnail, description, target amount with progress bar (percentage funded), start/end dates, status badge, "Invest" button
    - Tapping "Invest" opens bottom sheet: Project name displayed, Amount input, Submit button
  - **My Investments**: Per-project breakdown
    - Expandable cards per project showing individual investment entries with dates and status
  - **History**: Paginated transaction list (similar styling to wallet transactions)
  - **Profit**: Profit summary cards (Total Profit, Distributed, Pending) + per-project profit breakdown list

### SCREEN 4: PROFILE
- **Profile Header**: Avatar (tappable to change photo from camera/gallery), Name, Email, Status badge
- **Account Details Section** (card):
  - Phone, Address, NID Number, Blood Group, Jersey Size, Join Date
  - Edit button toggles inline editing mode
- **Nominee Information Section** (card):
  - Nominee Name, Relationship, Phone, NID
- **Investment Summary** (horizontal KPI cards):
  - LTI Shares, Total LTI Investment, STI Active Projects, Wallet Balance
- **Payment Accounts Section**:
  - Same card-style display as Wallet screen
  - "Add Bank Account" button (only if none exists)
  - "Add Mobile Account" button (always available)
  - Add Bank Account form: Bank Name, Account Holder, Account Number, Branch Name, Routing Number
  - Add Mobile Account form: Provider (dropdown: bKash/Nagad/Rocket/Upay), Account Number, Account Name
  - Swipe-to-delete on mobile accounts, tap-to-delete with confirmation on bank account
- **Security Section** (card):
  - "Change Password" button → opens modal with Current Password, New Password, Confirm Password fields with show/hide toggles
- **Logout Button**: Red/destructive styled at bottom

### NOTIFICATIONS
- Bell icon in the header (top-right) with unread count badge
- Tapping opens a notifications panel/screen
- Notification types: success (green), warning (amber), error (red), info (blue)
- Each notification shows: icon, title, message, time ago, read/unread state
- Actions: Mark as read, Read all, Clear all

### GENERAL UX PATTERNS
- Use bottom sheets (react-native-bottom-sheet or similar) for all modals/dialogs
- Pull-to-refresh on all list screens
- Skeleton loading states for data fetching
- Toast notifications for success/error feedback (react-native-toast-message)
- Status badges use consistent colors: Pending=gray/secondary, Approved=green, Rejected=red, Active=green
- All monetary values formatted with locale separators (e.g., ৳25,000 or $10,000)
- Tables from web should be converted to card-based lists on mobile
- Pagination should use "Load More" button or infinite scroll instead of page numbers

### TECH STACK SUGGESTIONS
- React Native with Expo
- React Navigation (bottom tabs + stack navigator)
- NativeWind or StyleSheet for styling (match the color tokens above)
- React Native Bottom Sheet for modals
- AsyncStorage for local auth state
- React Query for data fetching (when backend is connected)
```

---

## Notes

- This prompt captures all 4 investor-facing screens (Wallet, LTI, STI, Profile) plus notifications
- The color values are extracted directly from your current CSS theme variables
- Account card designs (bank + mobile banking) with provider-specific colors are included
- Currency formatting rules (৳ for wallet, $ for investments) are preserved
- All modal interactions are mapped to mobile-friendly bottom sheets
- Web tables are converted to card-based list patterns for mobile

