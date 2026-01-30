# Payment Gateway Setup

## Overview

ACBMarket supports **two payment gateways** for the Philippines market:

### PayMongo
- 💳 Credit/Debit Cards
- 📱 GCash
- 📱 PayMaya (Maya)
- 🏪 Over-the-counter payments
- 📷 QR Ph payments

### Terminal3
- 📱 GCash (primary focus)
- 📱 ShopeePay
- 📱 GrabPay
- 🏦 Bank Transfers (BDO, BPI, etc.)
- 🏪 Cash-based payments (Seven-Eleven, etc.)

## Setup Instructions

### Option 1: PayMongo Setup

#### 1. Create PayMongo Account

1. Go to [https://paymongo.com](https://paymongo.com)
2. Sign up for an account
3. Complete business verification (required for production)

#### 2. Get API Keys

1. Log in to PayMongo Dashboard
2. Go to **Settings** → **API Keys**
3. Copy your:
   - **Secret Key** (starts with `sk_`)
   - **Public Key** (starts with `pk_`)
   - **Webhook Secret** (from Webhooks section)

#### 3. Configure Environment Variables

Add these to your `.env` file in the `backend/` directory:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Use sk_live_ for production
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx  # Use pk_live_ for production
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### 4. Set Up Webhook

1. In PayMongo Dashboard, go to **Settings** → **Webhooks**
2. Add a new webhook endpoint:
   - **URL**: `https://yourdomain.com/api/v1/purchases/webhook/paymongo`
   - **Events**: Select `payment_intent.succeeded`, `payment_intent.failed`, `payment_intent.payment_failed`
3. Copy the webhook secret and add it to your `.env` file

#### 5. Test Mode vs Production

- **Test Mode**: Use `sk_test_` and `pk_test_` keys
- **Production**: Use `sk_live_` and `pk_live_` keys

### Option 2: Terminal3 Setup

#### 1. Terminal3 Account
You already have a Terminal3 account. Get your API credentials from the Terminal3 dashboard.

#### 2. Get Widget Key and Widget Code
1. Log in to [Terminal3 Payments](https://payments.terminal3.com) (Merchant Area).
2. Go to **My Projects** → select your project.
3. On the project page, find:
   - **Project Key** (widget key) – used as `key` in the iframe URL.
   - **Widgets** section – your **widget code** (e.g. `p1`, `p1_1`). This is **not** always `t3_1`; it depends on your project type and how the widget was created.
4. If you see **"Payment widget can not be used for this action. Use a different widget code (error code 06)"**, the `widget` parameter does not match your project. Use the exact widget code shown in **Widgets** for your project (often `p1` or `p1_1` for Virtual Currency).

#### 3. Configure Custom Parameters (for pingback)
So that our backend can match a pingback to a purchase, Terminal3 must forward custom parameters in the pingback:

1. In Terminal3, go to **My Projects** → your project → **Project Settings** (or **Pingback** / **Custom Parameters**).
2. Add **custom pingback parameters** so that any custom params you pass in the widget URL are included in the pingback. Terminal3 docs: [Custom Parameters](https://docs.terminal3.com/reference/pingback/custom-parameters).
3. Configure forwarding for:
   - `purchase_id` – our pending purchase ID.
   - `chips_added` – optional; helps with validation.
4. Exact steps depend on your project type (Widget API vs Terminal3 E-Commerce Shop). If you don’t see “Custom Parameters”, contact Terminal3 (e.g. [integration@terminal3.com](mailto:integration@terminal3.com)) to enable custom pingback parameters for your project.

#### 4. Configure Environment Variables

Add these to your `backend/.env`:

```env
# Terminal3 – iframe on Purchase page
# For Checkout API: use TERMINAL3_PROJECT_KEY (error 04 = wrong project key if missing)
TERMINAL3_PROJECT_KEY=your_project_key_here
# Secret key from Merchant Area → My Projects (required to sign widget URL; error 06 without it)
TERMINAL3_SECRET_KEY=your_secret_key_here
TERMINAL3_WIDGET_ID=t3_2
# ps=test = sandbox (may auto-succeed); ps=all = show GCash, cards, etc.
TERMINAL3_PS=test
# evaluation=1 = test/sandbox; 0 or unset = live
TERMINAL3_EVALUATION=1
TERMINAL3_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: TERMINAL3_WIDGET_KEY as fallback if PROJECT_KEY not set (Widget API only)
# TERMINAL3_WIDGET_KEY=...
# Optional: for server-side Checkout API (redirect) instead of iframe
# TERMINAL3_API_KEY=your_api_key_here
```

- **TERMINAL3_PROJECT_KEY**: **Required for Checkout API.** Project key from [Merchant Area → My Projects](https://payments.terminal3.com). This is the `key` used in the payment page/iframe URL. Wrong key → error 04 “Wrong project key”.
- **TERMINAL3_SECRET_KEY**: **Required to fix error 06.** Secret key from Merchant Area → My Projects. The backend signs the widget URL with this key; without it Terminal3 returns “Payment widget can not be used for this action (error 06)”.
- **TERMINAL3_WIDGET_KEY**: Optional; used as the iframe `key` only when `TERMINAL3_PROJECT_KEY` is not set (e.g. Widget API–only projects).
- **TERMINAL3_WIDGET_ID**: Widget code from your project’s **Widgets** section (e.g. `t3_2`, `t3_1`, `p1`, `p1_1`). Use the correct one if you get error 06.
- **TERMINAL3_PS**: Payment methods shown in the widget. `test` = sandbox (may auto-succeed without payment). `all` = show all methods (GCash, cards, etc.). See [Terminal3 payment system shortcodes](https://docs.terminal3.com/apis).
- **TERMINAL3_EVALUATION**: `1` = test/sandbox mode; `0` or unset = live. Use `1` for testing without real charges.

#### 5. Set Up Webhook (Pingback)

1. In Terminal3 Dashboard, go to your project → **Pingback URL** (or **Settings** → **Webhooks**).
2. Set pingback URL to: `https://yourdomain.com/api/v1/purchases/webhook/terminal3`
3. For local testing, use a tunnel (e.g. [ngrok](https://ngrok.com)) so Terminal3 can reach your server.
4. Copy the webhook/pingback secret (if any) into `TERMINAL3_WEBHOOK_SECRET` in `.env`.

**Note**: Terminal3 uses "pingback" terminology instead of "webhook".

## API Usage

### Creating a Purchase

You can choose between PayMongo or Terminal3:

```typescript
// Using PayMongo
const purchaseData = {
  chips_added: 100,
  payment_provider: 'paymongo'
};

// Using Terminal3 (GCash only)
const purchaseData = {
  chips_added: 100,
  payment_provider: 'terminal3'
};

// Test mode (no payment)
const purchaseData = {
  chips_added: 100,
  payment_provider: null  // or omit the field
};
```

### Creating a Purchase with PayMongo

```typescript
// Frontend example
const purchaseData = {
  chips_added: 100,
  payment_provider: 'paymongo'
};

const response = await api.post('/api/v1/purchases/checkout', purchaseData);
const { payment_intent, public_key } = response.data.data;

// Use PayMongo JS SDK to complete payment
// See PayMongo documentation for frontend integration
```

### Creating a Purchase with Terminal3

```typescript
const purchaseData = {
  chips_added: 100,
  payment_provider: 'terminal3'
};

const response = await api.post('/api/v1/purchases/checkout', purchaseData);
const { checkout } = response.data.data;

// Redirect user to checkout.url or use Terminal3 Widget/SDK
// Terminal3 checkout is configured to only show GCash
```

### Test Mode (No Payment)

```typescript
const purchaseData = {
  chips_added: 100,
  payment_provider: null  // Uses test mode, immediately credits chips
};
```

## Webhook Events

### PayMongo Webhook (`/api/v1/purchases/webhook/paymongo`)

Handles:
- `payment_intent.succeeded`: Automatically credits chips to user
- `payment_intent.failed`: Marks purchase as failed
- `payment_intent.payment_failed`: Marks purchase as failed

### Terminal3 Pingback (`/api/v1/purchases/webhook/terminal3`)

Handles:
- `payment.succeeded`: Automatically credits chips to user
- `payment.failed`: Marks purchase as failed

## Frontend Integration

### PayMongo Integration
- [PayMongo Documentation](https://developers.paymongo.com/docs)
- [PayMongo JS SDK](https://github.com/paymongo/paymongo-js)

### Terminal3 Integration
- [Terminal3 Documentation](https://docs.terminal3.com)
- Terminal3 provides Widget API, Checkout API, and AppPay SDK for mobile
- For GCash-only, the checkout is automatically restricted to GCash payment method

## Important Notes

- ⚠️ **Chips are non-redeemable** and have no monetary value
- 💰 1 Chip = ₱1.00 (for display purposes only)
- 🔒 All webhook requests are verified using HMAC signature
- 📝 Purchase records are created with `pending` status and updated via webhook

## Troubleshooting

### Webhook Not Working

1. Check webhook URL is accessible from internet
2. Verify webhook secret matches in `.env`
3. Check PayMongo dashboard for webhook delivery logs
4. Ensure webhook endpoint returns 200 status

### Payment Intent Creation Fails

1. Verify API keys are correct
2. Check account is verified (for production)
3. Ensure amount is in centavos (e.g., ₱100 = 10000 centavos)

### Terminal3: "Wrong project key (error code 04)"

1. You must use the **project key** from Terminal3 **My Projects** in the iframe URL when using [Checkout API](https://docs.terminal3.com/integration/checkout-home).
2. Set `TERMINAL3_PROJECT_KEY` in `backend/.env` to your project key (from Merchant Area → My Projects). The app uses this as the `key` in the payment iframe.
3. Restart the backend after changing `.env`.

### Terminal3: "Payment widget can not be used for this action. Use a different widget code (error code 06)"

1. **Set the secret key** so the backend can sign the widget URL. Terminal3 requires a signed request for Digital Goods (onetime payment). In `backend/.env` set `TERMINAL3_SECRET_KEY` to your project’s **Secret Key** from Merchant Area → My Projects. The backend will then return a signed `checkout_url` and the iframe will use it.
2. The **widget code** must match your project. In Terminal3: **My Projects** → your project → **Widgets** section. Use the exact code shown there (e.g. `t3_2`, `p1`, `p1_1`). Set `TERMINAL3_WIDGET_ID` in `backend/.env` to that value.
3. Restart the backend so the new env is loaded.
