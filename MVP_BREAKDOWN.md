# Pilimarket.com - Detailed MVP Breakdown

## MVP 1: Foundation & Authentication (Weeks 1-2)

### Backend Deliverables

#### Database Schema
- [ ] Users table with: id (UUID), email (unique), password_hash, display_name, bio, chips (bigint, default 0), reputation (float, default 0), badges (JSONB array), created_at, last_active
- [ ] Alembic migrations set up
- [ ] Database connection pooling configured
- [ ] Indexes on email, created_at

#### Authentication API
- [ ] `POST /api/v1/auth/register`
  - Input: `{email, password, display_name}`
  - Output: `{success: true, data: {user: {...}, access_token, refresh_token}}`
  - Validates email format, password strength (min 8 chars)
  - Hashes password with Argon2
  - Returns JWT tokens
  
- [ ] `POST /api/v1/auth/login`
  - Input: `{email, password}`
  - Output: `{success: true, data: {access_token, refresh_token, user: {...}}}`
  - Validates credentials
  - Returns JWT tokens
  
- [ ] `POST /api/v1/auth/refresh`
  - Input: `{refresh_token}`
  - Output: `{success: true, data: {access_token}}`
  - Validates refresh token
  - Returns new access token

- [ ] `POST /api/v1/auth/forgot-password`
  - Input: `{email}`
  - Output: `{success: true, message: "Reset email sent"}`
  - Generates reset token
  - Sends email (or logs for dev)

- [ ] `POST /api/v1/auth/reset-password`
  - Input: `{token, new_password}`
  - Output: `{success: true, message: "Password reset"}`
  - Validates token
  - Updates password

#### User Profile API
- [ ] `GET /api/v1/users/:id/profile`
  - Returns: `{user: {...}, stats: {total_forecasts: 0, chips: 0, reputation: 0}}`
  - Public endpoint (or own profile if authenticated)
  
- [ ] `PATCH /api/v1/users/me`
  - Input: `{display_name?, bio?}`
  - Output: `{success: true, data: {user: {...}}}`
  - Requires authentication
  - Updates own profile

#### Security
- [ ] JWT middleware for protected routes
- [ ] Rate limiting: 10 requests/minute for auth endpoints
- [ ] CORS configured for frontend origin
- [ ] Input validation with Pydantic models
- [ ] Error handling with standardized responses

### Frontend Deliverables

#### Auth Pages
- [ ] Login page (`/login`)
  - Email and password inputs
  - "Forgot password?" link
  - "Sign up" link
  - Error message display
  - Loading state during login
  
- [ ] Sign up page (`/register`)
  - Email, password, confirm password, display name inputs
  - Password strength indicator
  - Terms of Service checkbox
  - Error message display
  - Loading state during registration
  
- [ ] Forgot password page (`/forgot-password`)
  - Email input
  - Submit button
  - Success message
  
- [ ] Reset password page (`/reset-password/:token`)
  - New password and confirm password inputs
  - Submit button
  - Token validation

#### Auth State Management
- [ ] Auth context/provider
  - Stores access token and refresh token
  - User data
  - Login/logout functions
  - Auto-refresh token logic (before expiry)
  
- [ ] Protected route guard
  - Redirects to login if not authenticated
  - Preserves intended destination
  
- [ ] Token storage
  - Secure storage (localStorage or secure cookie)
  - Token refresh on 401 responses

#### User Profile UI
- [ ] Profile page (`/profile/:id` or `/profile`)
  - Display name, bio
  - Avatar placeholder
  - Stats: chips, reputation, total forecasts
  - Edit button (if own profile)
  
- [ ] Edit profile modal/page
  - Update display name and bio
  - Save button
  - Success/error feedback

### Acceptance Criteria
- ✅ Users can register with email and password
- ✅ Users can login and receive JWT tokens
- ✅ Protected routes require authentication
- ✅ Tokens refresh automatically
- ✅ Users can view and edit their profile
- ✅ Password reset flow works
- ✅ All API responses follow standardized format

---

## MVP 2: Chip Purchase System (Week 3)

### Backend Deliverables

#### Database Schema
- [ ] Purchases table: id (UUID), user_id, amount_cents (bigint), provider (text), chips_added (bigint), provider_tx_id (text), created_at
- [ ] Index on user_id, created_at

#### Purchase API
- [ ] `POST /api/v1/purchases/checkout`
  - Input: `{amount_cents, chip_package_id?}`
  - Output: `{success: true, data: {client_secret, purchase_id}}`
  - Creates Stripe payment intent
  - Returns client secret for frontend
  - Stores purchase record (pending status)
  
- [ ] `POST /api/v1/purchases/webhook`
  - Handles Stripe webhook events
  - Verifies webhook signature
  - On `payment_intent.succeeded`: credits chips to user
  - Updates purchase record
  - Atomic transaction: update user chips + mark purchase complete
  
- [ ] `GET /api/v1/purchases`
  - Returns user's purchase history
  - Paginated
  - Shows: amount, chips_added, date, status

#### Chip Wallet
- [ ] User chips balance tracking (in users table)
- [ ] Chip transaction log (optional separate table)
- [ ] Daily purchase limit: 10,000 PHP equivalent per day
- [ ] Anti-fraud: IP-based rate limiting on purchases

#### Stripe Integration
- [ ] Stripe SDK configured
- [ ] Payment intent creation
- [ ] Webhook endpoint secured
- [ ] Error handling for failed payments
- [ ] Test mode configuration

### Frontend Deliverables

#### Purchase Flow
- [ ] Chip purchase page/modal (`/purchase-chips`)
  - Chip package options (e.g., 1000 chips = 100 PHP)
  - Custom amount input
  - Stripe payment form integration
  - **Clear disclaimer**: "Non-redeemable Forecast Points - for entertainment and research only. Cannot be cashed out."
  - Purchase button
  - Loading state
  
- [ ] Purchase confirmation
  - Success message
  - Chips credited amount
  - Link to markets
  
- [ ] Purchase history page (`/purchases`)
  - List of all purchases
  - Date, amount, chips added
  - Status (completed, pending, failed)

#### Chip Balance Display
- [ ] Chip balance in header/navbar
  - Shows current chip balance
  - "Buy Chips" button/link
  - Updates after purchase

#### Legal Pages
- [ ] Terms of Service page (`/terms`)
  - States chips are non-redeemable
  - No monetary value
  - For entertainment and research only
  
- [ ] Privacy Policy page (`/privacy`)
  - Data collection and usage
  - Cookie policy
  
- [ ] FAQ page (`/faq`)
  - Common questions about chips
  - How forecasting works
  
- [ ] Disclaimer page (`/disclaimer`)
  - Legal disclaimers
  - No gambling/betting language

### Acceptance Criteria
- ✅ Users can purchase chips via Stripe
- ✅ Chips credited immediately after successful payment
- ✅ Clear non-redeemable disclaimers throughout purchase flow
- ✅ Purchase history visible
- ✅ Legal pages accessible
- ✅ Daily purchase limits enforced
- ✅ Webhook security verified

---

## MVP 3: Market System (Week 4)

### Backend Deliverables

#### Database Schema
- [ ] Markets table: id (UUID), title (text), slug (unique), description (text), category (text), metadata (JSONB), status (text: open/suspended/resolved/cancelled), resolution_outcome (text), resolution_time (timestamptz), created_by (UUID), created_at
- [ ] Outcomes table: id (UUID), market_id (FK), name (text), total_points (bigint, default 0)
- [ ] Indexes: markets(status), markets(category), markets(created_at), outcomes(market_id)

#### Market API
- [ ] `GET /api/v1/markets`
  - Query params: `?category=election&status=open&page=1&limit=20`
  - Output: `{success: true, data: {markets: [...], pagination: {...}}}`
  - Filters by category and status
  - Paginated
  - Cached in Redis (30s-5m TTL)
  
- [ ] `GET /api/v1/markets/:id`
  - Output: `{success: true, data: {market: {...}, outcomes: [...], consensus: {...}}}`
  - Includes market details, outcomes with point totals
  - Calculates consensus percentages
  - Cached in Redis (60s TTL)
  
- [ ] `POST /api/v1/markets` (admin only)
  - Input: `{title, description, category, outcomes: [{name: "YES"}, {name: "NO"}]}`
  - Output: `{success: true, data: {market: {...}}}`
  - Creates market and outcomes
  - Generates slug from title
  - Sets status to "open"
  
- [ ] `PATCH /api/v1/markets/:id` (admin only)
  - Input: `{title?, description?, status?, ...}`
  - Output: `{success: true, data: {market: {...}}}`
  - Updates market
  - Invalidates cache

#### Caching
- [ ] Redis cache for market list
- [ ] Redis cache for market detail
- [ ] Cache invalidation on market updates
- [ ] Cache warming strategy

#### Admin Authorization
- [ ] Admin role check middleware
- [ ] Admin user seeding script
- [ ] Role-based access control

### Frontend Deliverables

#### Market List Page
- [ ] Market list page (`/markets`)
  - MarketCard components
  - Each card shows: title, category tag, consensus % (YES/NO), status badge, created date
  - Filter dropdowns: category, status
  - Search bar
  - Pagination or infinite scroll
  - Loading states
  - Empty state
  
- [ ] MarketCard component
  - Polymarket-inspired design
  - Clickable to market detail
  - Visual consensus indicator
  - Category badge

#### Market Detail Page
- [ ] Market detail page (`/markets/:slug`)
  - Market title and description
  - Category tag
  - Status indicator (open, resolved, etc.)
  - Outcomes list with:
    - Outcome name
    - Points allocated
    - Percentage of total
    - Visual bar chart
  - Consensus display (e.g., "YES: 65%, NO: 35%")
  - Created date
  - Resolution info (if resolved)
  
- [ ] Market detail loading state
- [ ] Market detail error state (404, etc.)

#### Admin Market Creation
- [ ] Admin market creation page (`/admin/markets/create`)
  - Title input
  - Description textarea
  - Category dropdown
  - Outcomes input (add/remove outcomes)
  - Preview button
  - Submit button
  - Form validation
  - Success redirect

### Acceptance Criteria
- ✅ Admins can create markets with outcomes
- ✅ Users can browse markets with filters
- ✅ Market detail shows all information
- ✅ Consensus calculated and displayed
- ✅ Markets cached for performance
- ✅ Admin-only routes protected
- ✅ Polymarket-inspired UI

---

## MVP 4: Forecast System (Week 5)

### Backend Deliverables

#### Database Schema
- [ ] Forecasts table: id (UUID), user_id (FK), market_id (FK), outcome_id (FK), points (bigint, >0), created_at, is_flagged (boolean, default false)
- [ ] Indexes: forecasts(user_id), forecasts(market_id), forecasts(created_at)

#### Forecast API
- [ ] `POST /api/v1/markets/:id/forecast`
  - Input: `{outcome_id, points}`
  - Output: `{success: true, data: {forecast: {...}}}`
  - Validates: user has enough chips, market is open, points > 0, per-market max not exceeded
  - Atomic transaction:
    1. Debit chips from user
    2. Create forecast record
    3. Update outcome.total_points
  - Returns updated forecast and market state
  
- [ ] `GET /api/v1/users/:id/forecasts`
  - Query params: `?market_id=&status=&page=1`
  - Output: `{success: true, data: {forecasts: [...], pagination: {...}}}`
  - Returns user's forecast history
  - Includes market and outcome info
  - Shows won/lost status if market resolved
  
- [ ] `GET /api/v1/markets/:id/forecasts`
  - Output: `{success: true, data: {forecasts: [...], user_forecast: {...}}}`
  - Returns all forecasts for market
  - Includes current user's forecast if exists
  - Paginated

#### Forecast Updates
- [ ] `PATCH /api/v1/forecasts/:id`
  - Input: `{points?}`
  - Output: `{success: true, data: {forecast: {...}}}`
  - Allows updating points (within limits)
  - Recalculates outcome totals
  - Audit trail (optional separate table)

#### Real-time Updates
- [ ] Redis pub/sub setup
- [ ] Publish to `market:updates:{market_id}` on forecast
- [ ] WebSocket/Socket.IO endpoint (optional, can use polling for MVP)

#### Anti-abuse
- [ ] Rate limiting: 10 forecasts per minute per user
- [ ] Per-market max points: 10,000 points per user per market
- [ ] Daily forecast limit: 50 forecasts per day
- [ ] Flag suspicious patterns (background job)

### Frontend Deliverables

#### Forecast UI
- [ ] ForecastSlip component (on market detail page)
  - Outcome selection (radio buttons or buttons)
  - Points input (number input with slider)
  - Current chip balance display
  - Max points indicator
  - "Place Forecast" button
  - Validation: points <= balance, points > 0
  
- [ ] Forecast confirmation modal
  - Shows: outcome, points, remaining chips
  - **Clear reminder**: "Chips are non-redeemable and cannot be cashed out"
  - Confirm and Cancel buttons
  
- [ ] Current forecast display
  - Shows user's existing forecast (if any)
  - Outcome and points
  - "Update Forecast" button
  - "Cancel Forecast" option (refund chips)

#### Market Detail Enhancements
- [ ] Real-time consensus updates
  - Polling every 5 seconds (or WebSocket)
  - Updates outcome percentages
  - Updates visual bars
  
- [ ] Forecast placement feedback
  - Success message
  - Updated consensus
  - Updated chip balance
  
- [ ] Points allocation visualization
  - Bar chart showing distribution
  - User's forecast highlighted

#### Forecast History
- [ ] Forecast history page (`/forecasts`)
  - List of all user forecasts
  - Shows: market, outcome, points, date, status (pending/won/lost)
  - Filter by market, status
  - Sort by date
  - Link to market detail

### Acceptance Criteria
- ✅ Users can place forecasts on open markets
- ✅ Chips debited correctly
- ✅ Outcome totals update
- ✅ Consensus updates in real-time (polling or WebSocket)
- ✅ Users can view forecast history
- ✅ Rate limiting prevents abuse
- ✅ Non-redeemable reminder shown
- ✅ Per-market and daily limits enforced

---

## MVP 5: Market Resolution (Week 6)

### Backend Deliverables

#### Database Schema
- [ ] Resolutions table: id (UUID), market_id (FK), outcome_id (FK), resolved_by (FK to users), evidence_urls (text[]), resolution_note (text), created_at
- [ ] Immutable (no updates allowed)
- [ ] Index on market_id

#### Resolution API
- [ ] `POST /api/v1/markets/:id/resolve` (admin only)
  - Input: `{outcome_id, evidence_urls: ["url1", "url2"], resolution_note}`
  - Output: `{success: true, data: {market: {...}, resolution: {...}}}`
  - Validates: market is open, outcome exists, minimum 2 evidence URLs for elections
  - Creates resolution record (immutable)
  - Updates market status to "resolved"
  - Sets market.resolution_outcome and resolution_time
  - Triggers forecast scoring (background job)
  
- [ ] `GET /api/v1/markets/:id/resolution`
  - Output: `{success: true, data: {resolution: {...}}}`
  - Returns resolution details with evidence and note

#### Forecast Scoring
- [ ] Background job: `score_forecasts_after_resolution(market_id)`
  - Marks forecasts as won/lost
  - Updates user stats
  - Triggers reputation recalculation
  - Updates leaderboard

#### Dispute System (Basic)
- [ ] `POST /api/v1/markets/:id/dispute`
  - Input: `{reason, evidence_urls?}`
  - Output: `{success: true, data: {dispute: {...}}}`
  - Creates dispute record
  - Only allowed within 7 days of resolution
  - Admin can review disputes

### Frontend Deliverables

#### Admin Resolution UI
- [ ] Admin resolve market page (`/admin/markets/:id/resolve`)
  - Market info display
  - Outcome selection (radio buttons)
  - Evidence URL inputs (minimum 2 for elections)
  - Resolution note textarea
  - Preview resolution
  - Submit button
  - Form validation
  
- [ ] Resolution confirmation
  - Shows what will happen
  - Confirmation dialog

#### Market Resolution Display
- [ ] Resolved market indicator
  - Badge showing "Resolved"
  - Winning outcome highlighted
  
- [ ] Resolution details section
  - Resolution date
  - Winning outcome
  - Evidence links (clickable)
  - Resolution note
  - Resolved by (admin name)
  
- [ ] User forecast result
  - Shows if user's forecast won or lost
  - Visual indicator (checkmark/X)
  - Points that were forecasted

#### Dispute UI (Basic)
- [ ] Dispute button (if within window)
  - Only shows if resolution < 7 days old
  - Opens dispute form
  
- [ ] Dispute form
  - Reason textarea
  - Evidence URL inputs (optional)
  - Submit button

### Acceptance Criteria
- ✅ Admins can resolve markets with evidence
- ✅ Minimum 2 evidence URLs required for elections
- ✅ Resolutions are immutable
- ✅ Forecasts marked as won/lost
- ✅ Resolution details visible on market
- ✅ Dispute system functional (basic)
- ✅ Background jobs process scoring

---

## MVP 6: Reputation & Badges (Week 7)

### Backend Deliverables

#### Reputation Engine
- [ ] Reputation calculation function
  - Formula: `reputation = 0.7 * accuracy_score + 0.3 * log(1 + total_forecast_points)`
  - Accuracy calculated using Brier score:
    - `brier_score = mean((forecast_probability - actual_outcome)^2)`
    - Lower is better, so accuracy = 1 - normalized_brier_score
  - Log loss alternative (optional)
  
- [ ] Background job: `recompute_reputation(user_id)`
  - Runs after market resolution (if user had forecast)
  - Calculates new reputation
  - Updates user.reputation
  - Triggers badge check
  
- [ ] `GET /api/v1/users/:id/reputation-history`
  - Returns reputation over time
  - For charts/graphs

#### Badge System
- [ ] Badge definitions (in code or database)
  - Newbie: 0-10 forecasts
  - Accurate: Brier score < 0.25 (or top 20%)
  - Climber: 3 consecutive weeks of improvement
  - Specialist: Top 10% in category (e.g., elections)
  
- [ ] Badge award logic
  - Checks eligibility on reputation update
  - Awards badge if criteria met
  - Stores in user.badges (JSONB array)
  - Prevents duplicate awards
  
- [ ] Background job: `check_and_award_badges(user_id)`
  - Runs after reputation update
  - Checks all badge criteria
  - Awards eligible badges

#### Badge API
- [ ] `GET /api/v1/users/:id/badges`
  - Returns user's badges with metadata
  - Badge name, icon, earned date

### Frontend Deliverables

#### Reputation Display
- [ ] Reputation score on profile
  - Large reputation number
  - Reputation meter/bar (0-100 scale)
  - Reputation rank (e.g., "Top 15%")
  
- [ ] Reputation history chart
  - Line chart showing reputation over time
  - X-axis: time
  - Y-axis: reputation score

#### Badge Display
- [ ] Badge collection on profile
  - Grid of badge icons
  - Badge names
  - Tooltip on hover: "Earned: [date], [description]"
  - Visual design (medals, ribbons, etc.)
  
- [ ] Badge showcase
  - Featured badges section
  - Badge descriptions
  - How to earn badges

#### Profile Enhancements
- [ ] Enhanced profile page
  - Reputation section (score, meter, history)
  - Badges section (collection, showcase)
  - Stats breakdown:
    - Total forecasts
    - Accuracy percentage
    - Winning forecasts
    - Favorite category
    - Streaks

### Acceptance Criteria
- ✅ Reputation calculated correctly using formula
- ✅ Reputation updates after market resolution
- ✅ Badges awarded automatically
- ✅ Badges visible on profile
- ✅ Reputation history chart works
- ✅ Background jobs run reliably

---

## MVP 7: Leaderboard System (Week 8)

### Backend Deliverables

#### Leaderboard Calculation
- [ ] LeaderboardRankScore formula
  - Combines: reputation (weighted 50%), streaks (25%), activity (25%)
  - Normalized to 0-1000 scale
  - Activity = log(1 + total_forecasts)
  - Streaks = winning_streak + activity_streak
  
- [ ] Background job: `recompute_leaderboard(period, category?)`
  - Periods: global, weekly, monthly
  - Categories: all, election, crypto, etc.
  - Calculates scores for all users
  - Sorts by rank score
  - Stores in Redis: `leaderboard:{period}:{category}`
  - Runs every 5 minutes
  
- [ ] Streak calculation
  - Winning streak: consecutive correct forecasts
  - Activity streak: days with at least 1 forecast
  - Updates on forecast placement and resolution

#### Leaderboard API
- [ ] `GET /api/v1/leaderboard`
  - Query params: `?period=weekly&category=election&page=1&limit=50`
  - Output: `{success: true, data: {leaderboard: [...], user_rank: {...}, pagination: {...}}}`
  - Returns ranked users with: rank, display_name, reputation, rank_score, badges
  - Includes current user's rank if authenticated
  - Cached from Redis

### Frontend Deliverables

#### Leaderboard Pages
- [ ] Global leaderboard page (`/leaderboard`)
  - Top 50 users
  - Shows: rank, avatar, display name, reputation, rank score, badges
  - Filter by period (global, weekly, monthly)
  - Filter by category
  - Pagination
  - User's rank highlighted
  
- [ ] Weekly leaderboard
  - Same as global but filtered to weekly
  - Reset indicator
  
- [ ] Category leaderboards
  - Election leaderboard
  - Other category leaderboards
  - Category filter

#### Leaderboard Widgets
- [ ] Homepage leaderboard widget
  - Top 10 users
  - "View Full Leaderboard" link
  - "Compete Now" CTA button
  
- [ ] Leaderboard badges/medals
  - Gold/Silver/Bronze for top 3
  - Visual indicators

#### Profile Leaderboard Stats
- [ ] Profile page enhancements
  - Current rank display
  - Rank in each category
  - Rank history (optional)
  - "Climb the leaderboard" CTA

### Acceptance Criteria
- ✅ Leaderboards calculated correctly
- ✅ Leaderboards cached in Redis
- ✅ Leaderboard pages functional
- ✅ Homepage widget displays top users
- ✅ User's rank visible
- ✅ Background job runs every 5 minutes
- ✅ Streaks calculated correctly

---

## MVP 8: Activity Feed & Notifications (Week 9)

### Backend Deliverables

#### Database Schema
- [ ] Activities table: id (UUID), user_id (FK, nullable), activity_type (text), market_id (FK, nullable), metadata (JSONB), created_at
- [ ] Notifications table: id (UUID), user_id (FK), type (text), message (text), read (boolean), created_at
- [ ] Indexes: activities(created_at), activities(user_id), notifications(user_id, read)

#### Activity Feed API
- [ ] `GET /api/v1/activity/feed`
  - Query params: `?page=1&limit=20`
  - Output: `{success: true, data: {activities: [...], pagination: {...}}}`
  - Returns user's personalized feed
  - Includes: forecast_placed, market_resolved, badge_earned, etc.
  
- [ ] `GET /api/v1/activity/global`
  - Returns global activity feed
  - Public endpoint
  - Shows recent market activity

#### Notification System
- [ ] `GET /api/v1/notifications`
  - Query params: `?unread_only=true&page=1`
  - Output: `{success: true, data: {notifications: [...], unread_count: N}}`
  - Returns user's notifications
  - Includes unread count
  
- [ ] `POST /api/v1/notifications/:id/read`
  - Marks notification as read
  - Returns success
  
- [ ] `POST /api/v1/notifications/read-all`
  - Marks all notifications as read

#### Background Jobs
- [ ] `send_notifications()`
  - Sends in-app notifications
  - Sends email notifications (optional for MVP)
  - Triggers on: market resolved, badge earned, new market in category

### Frontend Deliverables

#### Activity Feed UI
- [ ] Activity feed page (`/activity`)
  - List of activities
  - Activity cards showing:
    - Activity type icon
    - Description (e.g., "John forecasted 500 points on Market X")
    - Timestamp
    - Link to market (if applicable)
  - Filter by activity type
  - Infinite scroll
  - Empty state

#### Notifications UI
- [ ] Notification bell/icon (header)
  - Shows unread count badge
  - Click opens dropdown
  
- [ ] Notification dropdown
  - List of recent notifications (last 10)
  - Unread indicators
  - "Mark all as read" button
  - "View all" link
  
- [ ] Notification list page (`/notifications`)
  - Full list of notifications
  - Mark as read functionality
  - Filter by type
  - Pagination

#### Homepage Activity
- [ ] Recent activity widget
  - Shows last 5 activities
  - "View more" link
  
- [ ] Top forecasters widget
  - Shows users with most forecasts this week
  - Links to profiles

### Acceptance Criteria
- ✅ Activity feed displays user and global activities
- ✅ Notifications appear in-app
- ✅ Unread count updates correctly
- ✅ Users can mark notifications as read
- ✅ Background jobs send notifications
- ✅ Activity feed is paginated

---

## MVP 9: Admin Panel (Week 10)

### Backend Deliverables

#### Admin APIs
- [ ] `GET /api/v1/admin/flagged`
  - Returns flagged accounts and forecasts
  - Paginated
  - Includes flag reason
  
- [ ] `POST /api/v1/admin/markets/:id/suspend`
  - Suspends a market
  - Sets status to "suspended"
  
- [ ] `POST /api/v1/admin/users/:id/ban`
  - Bans a user
  - Sets user status to "banned"
  
- [ ] `POST /api/v1/admin/users/:id/freeze-chips`
  - Freezes user's chips
  - Prevents chip usage
  
- [ ] `GET /api/v1/admin/stats`
  - Returns dashboard statistics:
    - Total users
    - Total markets
    - Total forecasts
    - Total revenue
    - Active users (last 30 days)
    - Flagged items count
  
- [ ] `GET /api/v1/admin/users`
  - User management list
  - Search and filter
  - Paginated
  
- [ ] `GET /api/v1/admin/purchases`
  - Purchase monitoring
  - Filter by date, user, status

#### Moderation Tools
- [ ] Auto-flagging logic
  - Flags large chip transfers (if implemented)
  - Flags multiple accounts from same IP
  - Flags rapid repeated forecast changes
  - Background job: `check_for_suspicious_activity()`

### Frontend Deliverables

#### Admin Dashboard
- [ ] Admin login/access
  - Admin route protection
  - Admin role check
  
- [ ] Dashboard overview (`/admin`)
  - Stats cards (users, markets, forecasts, revenue)
  - Charts (user growth, forecast volume)
  - Recent activity
  - Flagged items alert
  
- [ ] User management (`/admin/users`)
  - Table of all users
  - Search by email/name
  - Filter by status
  - Actions: ban, suspend, freeze chips
  - User details modal
  
- [ ] Market management (`/admin/markets`)
  - Table of all markets
  - Search and filter
  - Actions: suspend, cancel, resolve
  - Market details modal
  
- [ ] Purchase monitoring (`/admin/purchases`)
  - List of purchases
  - Filter by date, user
  - Fraud indicators

#### Moderation UI
- [ ] Flagged items queue (`/admin/flagged`)
  - List of flagged items
  - Review and action buttons
  - Approve, reject, escalate
  
- [ ] User action panel
  - Ban user
  - Suspend user
  - Freeze chips
  - View user details
  
- [ ] Market action panel
  - Suspend market
  - Cancel market
  - Resolve market
  - Edit market

### Acceptance Criteria
- ✅ Admin panel accessible only to admins
- ✅ Dashboard shows key statistics
- ✅ Admins can manage users and markets
- ✅ Moderation tools functional
- ✅ Auto-flagging works
- ✅ All admin actions logged

---

## MVP 10: Polish & Deployment (Weeks 11-12)

### Tasks

#### UI/UX Polish
- [ ] Polymarket-inspired design fully implemented
- [ ] Mobile-first responsive design
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Loading states on all async operations
- [ ] Error handling with user-friendly messages
- [ ] Microcopy improvements (non-redeemable reminders everywhere)
- [ ] Consistent design system (colors, typography, spacing)

#### Performance Optimization
- [ ] Frontend code splitting
- [ ] Image optimization and lazy loading
- [ ] Database query optimization (N+1 queries, indexes)
- [ ] Redis caching strategy refined
- [ ] API response compression
- [ ] CDN setup (if needed)

#### Testing
- [ ] Unit tests (backend: pytest, frontend: Jest)
  - Coverage: >70% for critical paths
- [ ] Integration tests
  - API endpoint tests
  - Database transaction tests
- [ ] E2E tests (Playwright or Cypress)
  - Critical user flows
- [ ] Load testing
  - API performance under load
- [ ] Security testing
  - OWASP Top 10 checks

#### Documentation
- [ ] API documentation (OpenAPI/Swagger)
  - All endpoints documented
  - Request/response examples
- [ ] README files
  - Project setup instructions
  - Development guide
- [ ] Deployment guide
  - Environment setup
  - Database migrations
  - Docker deployment
- [ ] Admin guide
  - How to create markets
  - How to resolve markets
  - Moderation procedures

#### CI/CD Setup
- [ ] GitHub Actions workflows
  - Run tests on PR
  - Lint code
  - Build Docker images
  - Deploy to staging
  - Deploy to production (manual approval)
- [ ] Automated testing in CI
- [ ] Docker image builds
- [ ] Staging environment
- [ ] Production deployment process

#### Security Hardening
- [ ] Security headers (CSP, XSS protection, HSTS)
- [ ] Rate limiting refined
- [ ] Input sanitization
- [ ] SQL injection prevention (verified)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure cookie configuration

#### Monitoring & Logging
- [ ] Error tracking (Sentry)
- [ ] Application monitoring (uptime, response times)
- [ ] Database monitoring
- [ ] Log aggregation
- [ ] Alerting for critical errors

### Acceptance Criteria
- ✅ Application is production-ready
- ✅ Test coverage >70%
- ✅ CI/CD pipeline functional
- ✅ Monitoring in place
- ✅ Security best practices implemented
- ✅ Documentation complete
- ✅ Performance optimized
- ✅ Mobile-responsive design

---

## Summary

This MVP breakdown provides detailed deliverables and acceptance criteria for each phase. The project is organized into 10 MVPs over 12 weeks, with clear milestones and deliverables.

**Key Success Metrics:**
- Users can register, purchase chips, and place forecasts
- Markets can be created and resolved by admins
- Reputation and badges system works
- Leaderboards are functional
- Admin panel enables moderation
- Application is production-ready

**Next Steps:**
1. Review and adjust priorities
2. Begin Phase 0 (project setup)
3. Iterate based on feedback

