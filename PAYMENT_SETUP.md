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

#### 2. Get API Keys
1. Log in to Terminal3 Dashboard
2. Go to **Settings** → **API Keys**
3. Copy your:
   - **API Key**
   - **Webhook Secret** (from Webhooks section)

#### 3. Configure Environment Variables

Add these to your `.env` file:

```env
# Terminal3 Configuration
TERMINAL3_API_KEY=your_api_key_here
TERMINAL3_WEBHOOK_SECRET=your_webhook_secret_here
```

#### 4. Set Up Webhook (Pingback)

1. In Terminal3 Dashboard, go to **Settings** → **Webhooks**
2. Add a new webhook endpoint:
   - **URL**: `https://yourdomain.com/api/v1/purchases/webhook/terminal3`
   - **Events**: Select `payment.succeeded`, `payment.failed`
3. Copy the webhook secret and add it to your `.env` file

**Note**: Terminal3 uses "pingback" terminology instead of "webhook"

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
