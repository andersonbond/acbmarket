# Multi-Account Prevention Analysis

## Problem Statement
Prevent a single person from creating multiple accounts to place multiple forecasts on the same market, bypassing the one-forecast-per-user-per-market constraint.

## Current System State
- ✅ Unique constraint: One forecast per `user_id` per `market_id`
- ✅ Contact number field: Required, format `+63XXXXXXXXXX`
- ✅ Email field: Unique constraint
- ❌ No verification mechanisms in place
- ❌ No device/IP tracking

## Prevention Strategies (Ranked by Effectiveness)

### 1. **Phone Number Verification (SMS OTP) - RECOMMENDED**
**How it works:**
- Require SMS verification during registration
- Store verified phone numbers
- Enforce unique phone number per account
- Check phone number uniqueness before allowing forecast

**Pros:**
- ✅ High effectiveness (most people have 1 phone number)
- ✅ Already have `contact_number` field
- ✅ Standard practice in many platforms
- ✅ Can use services like Twilio, Vonage, or local PH providers (Globe, Smart APIs)
- ✅ Relatively low cost per verification

**Cons:**
- ❌ Users can use multiple SIM cards
- ❌ Cost per SMS (but minimal for verification)
- ❌ Requires SMS service integration
- ❌ Some users may not have phone access

**Implementation Complexity:** Medium
**Cost:** Low-Medium (SMS costs ~₱0.50-2.00 per verification)

**Recommended Approach:**
```python
# Add to User model:
- phone_verified: Boolean (default=False)
- phone_verification_code: String (nullable)
- phone_verified_at: DateTime (nullable)

# Add verification endpoint:
POST /api/v1/auth/verify-phone
- Send OTP to contact_number
- Store code with expiry (5-10 minutes)
- User submits code to verify

# Modify forecast endpoint:
- Check if phone_verified == True before allowing forecast
- Optionally: Check for duplicate phone numbers across accounts
```

---

### 2. **Device Fingerprinting + IP Tracking**
**How it works:**
- Track device fingerprint (browser, OS, screen resolution, etc.)
- Track IP addresses
- Flag accounts with same device/IP
- Require manual review or additional verification

**Pros:**
- ✅ No user action required
- ✅ Can detect patterns automatically
- ✅ Works in background

**Cons:**
- ❌ Can be bypassed (VPN, different devices, incognito mode)
- ❌ False positives (shared computers, public WiFi)
- ❌ Privacy concerns
- ❌ Requires fingerprinting library

**Implementation Complexity:** Medium-High
**Cost:** Low (mostly development time)

**Recommended Libraries:**
- `fingerprintjs2` (frontend)
- `user-agents` (backend)
- Custom IP + User-Agent tracking

---

### 3. **Email Verification - BASIC**
**How it works:**
- Require email verification before allowing forecasts
- Enforce unique email (already done)
- Check email patterns for suspicious accounts

**Pros:**
- ✅ Easy to implement
- ✅ Already have email field
- ✅ Low cost (just email service)

**Cons:**
- ❌ Easy to create multiple email accounts (Gmail, etc.)
- ❌ Low effectiveness alone
- ❌ Users can use temporary email services

**Implementation Complexity:** Low
**Cost:** Very Low

**Note:** Should be combined with other methods, not used alone.

---

### 4. **Payment Method Verification (Future)**
**How it works:**
- When real payment is integrated, track payment methods
- One payment method (credit card, GCash, PayMaya) = one account
- Link accounts by payment method

**Pros:**
- ✅ Very high effectiveness
- ✅ Hard to bypass (requires real payment methods)
- ✅ Natural integration with purchase system

**Cons:**
- ❌ Only works when real payments are enabled
- ❌ Users can use multiple payment methods
- ❌ Privacy concerns with payment data
- ❌ Requires payment provider integration

**Implementation Complexity:** High
**Cost:** Medium (payment processing fees)

**Note:** Best for production when real payments are enabled.

---

### 5. **Identity Verification (KYC) - STRICTEST**
**How it works:**
- Require government ID verification
- Use services like Jumio, Onfido, or local PH KYC providers
- One verified identity = one account

**Pros:**
- ✅ Highest effectiveness
- ✅ Legally compliant for real money
- ✅ Industry standard for financial platforms

**Cons:**
- ❌ High cost per verification
- ❌ Complex implementation
- ❌ High friction for users
- ❌ May reduce user adoption
- ❌ Requires third-party service integration

**Implementation Complexity:** Very High
**Cost:** High (₱50-200 per verification)

**Note:** Overkill for virtual chips, but necessary if real money is involved.

---

### 6. **Behavioral Analysis & Rate Limiting**
**How it works:**
- Track registration patterns (same IP, similar timing)
- Rate limit forecasts per IP/device
- Flag suspicious activity patterns
- Require additional verification for flagged accounts

**Pros:**
- ✅ Can catch patterns automatically
- ✅ Low user friction
- ✅ Works alongside other methods

**Cons:**
- ❌ Can have false positives
- ❌ Requires ML/pattern detection
- ❌ Can be bypassed with time delays

**Implementation Complexity:** High
**Cost:** Low-Medium

---

## Recommended Multi-Layered Approach

### Phase 1: Quick Win (Immediate)
1. **Email Verification** (Low effort, basic protection)
   - Require email verification before first forecast
   - Already have email field, just add verification flow

2. **Contact Number Uniqueness Check**
   - Enforce unique `contact_number` in database
   - Check for duplicate phone numbers before allowing forecast
   - Simple but effective for casual abuse

### Phase 2: Enhanced Protection (Short-term)
3. **SMS Phone Verification** (Best ROI)
   - Implement SMS OTP verification
   - Require verified phone before forecasts
   - Use local PH SMS provider (Globe, Smart) or Twilio

4. **Device/IP Tracking** (Background)
   - Track device fingerprints
   - Track IP addresses
   - Flag suspicious patterns for review
   - Don't block automatically, just flag

### Phase 3: Advanced (Long-term)
5. **Payment Method Verification** (When real payments enabled)
   - Link accounts by payment method
   - One payment method = one account

6. **Behavioral Analysis** (Optional)
   - ML-based pattern detection
   - Automatic flagging of suspicious accounts

---

## Implementation Priority

### Immediate (This Week):
1. ✅ Add `phone_verified` field to User model
2. ✅ Add unique constraint on `contact_number`
3. ✅ Check phone uniqueness before forecast
4. ✅ Add email verification requirement

### Short-term (Next 2 Weeks):
5. ✅ Implement SMS OTP verification
6. ✅ Require phone verification before forecast
7. ✅ Add device fingerprinting (basic)

### Long-term (When Needed):
8. ⏳ Payment method tracking
9. ⏳ Advanced behavioral analysis

---

## Database Schema Changes Needed

```sql
-- Add to users table:
ALTER TABLE users 
  ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN phone_verification_code VARCHAR(10),
  ADD COLUMN phone_verified_at TIMESTAMP,
  ADD COLUMN device_fingerprint VARCHAR(255),
  ADD COLUMN last_ip_address VARCHAR(45),
  ADD CONSTRAINT uq_users_contact_number UNIQUE (contact_number);

-- Create tracking table:
CREATE TABLE account_activity_log (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  ip_address VARCHAR(45),
  device_fingerprint VARCHAR(255),
  action VARCHAR(50), -- 'register', 'login', 'forecast', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_ip ON account_activity_log(ip_address);
CREATE INDEX idx_activity_device ON account_activity_log(device_fingerprint);
CREATE INDEX idx_activity_user ON account_activity_log(user_id);
```

---

## Code Changes Needed

### Backend:
1. **User Model**: Add verification fields
2. **Auth API**: Add phone verification endpoints
3. **Forecast API**: Add verification checks before forecast
4. **Middleware**: Track IP addresses and device info
5. **New Service**: SMS service integration

### Frontend:
1. **Registration**: Add phone verification step
2. **Profile**: Show verification status
3. **Forecast**: Show warning if not verified

---

## Cost Analysis

| Method | Setup Cost | Per-User Cost | Effectiveness |
|--------|-----------|---------------|--------------|
| Email Verification | Low | Free | Low |
| Phone Verification | Medium | ₱0.50-2.00 | High |
| Device Fingerprinting | Low | Free | Medium |
| Payment Verification | High | Payment fees | Very High |
| KYC | Very High | ₱50-200 | Highest |

---

## Recommendation

**Start with Phone Verification (SMS OTP)** because:
1. ✅ Already have contact_number field
2. ✅ High effectiveness (most people have 1 phone)
3. ✅ Reasonable cost
4. ✅ Standard practice
5. ✅ Good user experience (one-time verification)

**Combine with:**
- Email verification (free, easy)
- Contact number uniqueness (database constraint)
- Basic device/IP tracking (for flagging, not blocking)

This provides strong protection without being too restrictive or expensive.

