# SMS OTP Setup (Twilio Verify)

Registration requires SMS OTP verification for Philippine (+63) numbers. OTP is sent and validated via **Twilio Verify** — no phone number purchase is required.

## Environment variables

Add these to your `backend/.env` file:

```env
# Twilio Verify (registration OTP - no phone number needed)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **TWILIO_ACCOUNT_SID**: From [Twilio Console](https://console.twilio.com) → Account Info.
- **TWILIO_AUTH_TOKEN**: Same page; keep secret.
- **TWILIO_VERIFY_SERVICE_SID**: From Twilio Console → **Verify** → **Services** → create a service (or use an existing one) and copy the Service SID (starts with `VA...`).

## Create a Verify Service

1. Log in to [Twilio Console](https://console.twilio.com).
2. Go to **Verify** → **Services**.
3. Click **Create new** and give the service a name (e.g. "ACBMarket Registration").
4. Copy the **Service SID** (starts with `VA...`) and set it as `TWILIO_VERIFY_SERVICE_SID` in `backend/.env`.

## Requirements

- **Redis**: Used only for optional rate limiting (one OTP request per contact number per 60 seconds). OTP codes are stored and validated by Twilio Verify, not in Redis. Ensure Redis is running if you use rate limiting.

## Flow

1. User submits the registration form → backend calls Twilio Verify **start** (Twilio sends the code via SMS).
2. User is redirected to `/register-otp`, enters the 6-digit code.
3. Backend calls Twilio Verify **check**; if approved, the account is created and the user is logged in.

Rate limit: one OTP request per contact number per 60 seconds (Redis).
