# Payment Method Verification Implementation Analysis

## Overview
Implement payment method verification to prevent multi-account abuse by requiring users to provide their GCash or PayMaya number when purchasing chips, and ensuring only one account can use each payment number.

## Goals
1. ✅ Require payment method (GCash/PayMaya) during chip purchase
2. ✅ Store payment details in `user_payment_detail` table
3. ✅ Enforce uniqueness: One payment number = One account
4. ✅ Prevent forecasts if payment method is already used by another account
5. ✅ Link accounts by payment method for fraud detection

---

## Database Schema Design

### New Table: `user_payment_detail`

```sql
CREATE TABLE user_payment_detail (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payment method details
  payment_provider VARCHAR NOT NULL CHECK (payment_provider IN ('gcash', 'paymaya')),
  account_number VARCHAR NOT NULL,  -- GCash/PayMaya mobile number (format: +63XXXXXXXXXX or 09XXXXXXXXX)
  
  -- Verification status
  is_verified BOOLEAN DEFAULT FALSE,  -- For future: SMS verification of payment method
  verified_at TIMESTAMP,
  
  -- Metadata
  is_primary BOOLEAN DEFAULT TRUE,  -- User can have multiple payment methods, but one primary
  is_active BOOLEAN DEFAULT TRUE,   -- Can deactivate old payment methods
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(account_number, payment_provider),  -- One account number per provider globally
  UNIQUE(user_id, payment_provider) WHERE is_primary = TRUE  -- One primary per provider per user
);

CREATE INDEX idx_payment_user ON user_payment_detail(user_id);
CREATE INDEX idx_payment_account ON user_payment_detail(account_number, payment_provider);
CREATE INDEX idx_payment_verified ON user_payment_detail(is_verified);
```

### Key Design Decisions:

1. **Separate Table**: Keeps payment details separate from user table for security and flexibility
2. **Unique Constraint**: `(account_number, payment_provider)` ensures one account number can only be used by one user
3. **Provider + Account**: Combination allows same number on different providers (rare but possible)
4. **Primary Flag**: Users can have multiple payment methods, but one primary per provider
5. **Active Flag**: Allows deactivating old payment methods without deleting history
6. **Verification Field**: Future-proof for SMS verification of payment methods

---

## Data Flow

### Purchase Flow (New):
```
1. User clicks "Purchase Chips"
2. User enters chip amount
3. User selects payment provider (GCash or PayMaya)
4. User enters payment account number
5. System validates:
   - Account number format
   - Account number not already used by another user
   - User doesn't already have this payment method (if updating)
6. Create/Update user_payment_detail record
7. Process purchase
8. Link purchase to payment detail
```

### Forecast Flow (Updated):
```
1. User places forecast
2. System checks:
   - User has at least one verified payment method
   - OR user has made at least one purchase (has payment method)
3. If no payment method exists, require purchase first
4. Allow forecast if payment method exists
```

---

## API Changes Required

### 1. New Model: `user_payment_detail.py`

```python
class UserPaymentDetail(Base):
    __tablename__ = "user_payment_detail"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_provider = Column(String, nullable=False)  # 'gcash' or 'paymaya'
    account_number = Column(String, nullable=False, index=True)  # Phone number
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    is_primary = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('account_number', 'payment_provider', name='uq_payment_account'),
        CheckConstraint("payment_provider IN ('gcash', 'paymaya')", name='check_provider'),
    )
```

### 2. New Schemas: `payment_detail.py`

```python
class PaymentDetailBase(BaseModel):
    payment_provider: str = Field(..., pattern="^(gcash|paymaya)$")
    account_number: str = Field(..., min_length=10, max_length=15)
    
    @validator('account_number')
    def validate_account_number(cls, v):
        # Format: +63XXXXXXXXXX or 09XXXXXXXXX
        # Normalize to +63XXXXXXXXXX format
        v = v.strip().replace(' ', '').replace('-', '')
        if v.startswith('09'):
            v = '+63' + v[1:]
        if not v.startswith('+63'):
            raise ValueError('Account number must start with +63 or 09')
        if len(v) != 13:  # +63 + 10 digits
            raise ValueError('Account number must be 10 digits after +63')
        return v

class PaymentDetailCreate(PaymentDetailBase):
    is_primary: bool = Field(default=True)

class PaymentDetailResponse(PaymentDetailBase):
    id: str
    user_id: str
    is_verified: bool
    verified_at: Optional[datetime]
    is_primary: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### 3. Updated Purchase Schema

```python
class PurchaseCreate(PurchaseBase):
    """Purchase creation schema - now requires payment method"""
    payment_provider: str = Field(..., pattern="^(gcash|paymaya)$")
    payment_account_number: str = Field(..., description="GCash or PayMaya account number")
```

### 4. New API Endpoints

#### `POST /api/v1/payment-details`
- Create or update user's payment method
- Validate uniqueness
- Set as primary if first payment method

#### `GET /api/v1/payment-details`
- Get user's payment methods
- Show primary and active status

#### `PATCH /api/v1/payment-details/{id}`
- Update payment method (change number, set primary, deactivate)

#### `DELETE /api/v1/payment-details/{id}`
- Deactivate payment method (soft delete)

### 5. Updated Purchase Endpoint

```python
@router.post("/checkout", response_model=dict)
async def create_checkout(
    purchase_data: PurchaseCreate,  # Now includes payment_provider and payment_account_number
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a chip purchase with payment method verification
    """
    # 1. Validate payment method format
    # 2. Check if payment account number is already used by another user
    # 3. Create or update user_payment_detail
    # 4. Process purchase
    # 5. Link purchase to payment detail
```

### 6. Updated Forecast Endpoint

```python
@router.post("/markets/{market_id}/forecast", response_model=dict)
async def place_forecast(...):
    """
    Place a forecast - now checks for payment method
    """
    # Check if user has at least one payment method
    payment_detail = db.query(UserPaymentDetail).filter(
        UserPaymentDetail.user_id == current_user.id,
        UserPaymentDetail.is_active == True
    ).first()
    
    if not payment_detail:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment method required. Please make a purchase first to add your payment method."
        )
    
    # Continue with forecast...
```

---

## Frontend Changes Required

### 1. Purchase Page (`Purchase.tsx`)

**New Fields:**
- Payment Provider Selector (GCash / PayMaya)
- Payment Account Number Input (with format validation)
- Show existing payment methods (if any)
- Option to use existing payment method or add new one

**UI Flow:**
```
[Payment Method Section]
- Select Provider: [GCash ▼] [PayMaya ▼]
- Account Number: [+63___________]
- Format: +63XXXXXXXXXX or 09XXXXXXXXX
- [Use Existing] or [Add New]

[If using existing]
- Show saved payment methods
- Select one to use
```

### 2. New Payment Methods Page (Optional)

- View all payment methods
- Add new payment method
- Set primary payment method
- Deactivate old payment methods

### 3. Profile Page Updates

- Show linked payment methods
- Show verification status
- Add/remove payment methods

---

## Validation Logic

### Account Number Format Validation

```python
def validate_payment_account_number(account_number: str, provider: str) -> str:
    """
    Normalize and validate payment account number
    Returns normalized number or raises ValueError
    """
    # Remove spaces and dashes
    normalized = account_number.strip().replace(' ', '').replace('-', '')
    
    # Convert 09XXXXXXXXX to +63XXXXXXXXXX
    if normalized.startswith('09'):
        normalized = '+63' + normalized[1:]
    
    # Must start with +63
    if not normalized.startswith('+63'):
        raise ValueError('Account number must start with +63 or 09')
    
    # Must be exactly 13 characters (+63 + 10 digits)
    if len(normalized) != 13:
        raise ValueError('Account number must be 10 digits after +63')
    
    # Must be all digits after +63
    if not normalized[3:].isdigit():
        raise ValueError('Account number must contain only digits')
    
    return normalized
```

### Uniqueness Check

```python
def check_payment_account_uniqueness(
    account_number: str, 
    provider: str, 
    user_id: str,
    db: Session
) -> tuple[bool, Optional[UserPaymentDetail]]:
    """
    Check if payment account is already used by another user
    Returns: (is_unique, existing_payment_detail)
    """
    existing = db.query(UserPaymentDetail).filter(
        UserPaymentDetail.account_number == account_number,
        UserPaymentDetail.payment_provider == provider,
        UserPaymentDetail.is_active == True
    ).first()
    
    if existing and existing.user_id != user_id:
        return (False, existing)  # Used by another user
    elif existing and existing.user_id == user_id:
        return (True, existing)  # Same user, can update
    else:
        return (True, None)  # Available
```

---

## Security Considerations

### 1. **Data Privacy**
- ✅ Store payment numbers (sensitive data)
- ✅ Consider encryption at rest
- ✅ Don't expose full numbers in API responses (mask: +63******89)
- ✅ Only show last 2-3 digits in UI

### 2. **Validation**
- ✅ Server-side validation (never trust client)
- ✅ Format validation (must be valid PH mobile number)
- ✅ Uniqueness check in database (atomic transaction)
- ✅ Prevent SQL injection (use parameterized queries)

### 3. **Rate Limiting**
- ✅ Limit payment method additions per user (e.g., 3 per day)
- ✅ Prevent rapid account number changes (abuse prevention)

### 4. **Audit Trail**
- ✅ Log payment method changes
- ✅ Track which accounts use which payment methods
- ✅ Flag suspicious patterns (same payment method, multiple accounts)

---

## Edge Cases & Scenarios

### Scenario 1: User tries to use payment number already in use
**Solution:** 
- Reject purchase
- Show error: "This payment method is already linked to another account. Please use a different payment method."

### Scenario 2: User wants to change payment method
**Solution:**
- Allow updating existing payment method
- Deactivate old, create new
- Keep history for audit

### Scenario 3: User has multiple payment methods
**Solution:**
- Allow multiple payment methods per user
- One primary per provider
- User selects which to use for purchase

### Scenario 4: User deletes account with payment method
**Solution:**
- CASCADE delete payment details
- Payment number becomes available again
- Consider soft delete for fraud tracking

### Scenario 5: Same phone number, different providers
**Solution:**
- Allow same number for GCash and PayMaya separately
- Unique constraint is on (account_number, payment_provider)

### Scenario 6: User places forecast without payment method
**Solution:**
- Require purchase first (which requires payment method)
- OR allow forecast if user has existing payment method from previous purchase

---

## Migration Strategy

### Phase 1: Database Setup
1. Create `user_payment_detail` table
2. Add migration
3. Run migration

### Phase 2: Backend API
1. Create model and schemas
2. Create payment detail endpoints
3. Update purchase endpoint to require payment method
4. Update forecast endpoint to check payment method
5. Add validation logic

### Phase 3: Frontend
1. Update Purchase page with payment method fields
2. Add payment method selection/input
3. Add validation and error handling
4. Update types/interfaces

### Phase 4: Testing
1. Test payment method creation
2. Test uniqueness enforcement
3. Test purchase flow
4. Test forecast blocking without payment method
5. Test edge cases

---

## Implementation Checklist

### Backend:
- [ ] Create `UserPaymentDetail` model
- [ ] Create migration for `user_payment_detail` table
- [ ] Create payment detail schemas
- [ ] Create payment detail API endpoints
- [ ] Update `PurchaseCreate` schema to include payment method
- [ ] Update purchase endpoint to:
  - [ ] Validate payment method format
  - [ ] Check uniqueness
  - [ ] Create/update payment detail
  - [ ] Link purchase to payment detail
- [ ] Update forecast endpoint to check payment method exists
- [ ] Add validation utilities
- [ ] Add error handling

### Frontend:
- [ ] Update `PurchaseCreate` type to include payment method
- [ ] Add payment provider selector to Purchase page
- [ ] Add payment account number input
- [ ] Add format validation
- [ ] Add error messages for duplicate payment methods
- [ ] Show existing payment methods (if any)
- [ ] Update API calls to include payment method

### Database:
- [ ] Create migration
- [ ] Add indexes
- [ ] Add unique constraints
- [ ] Test constraints work correctly

---

## Benefits

1. ✅ **Strong Multi-Account Prevention**: One payment number = one account
2. ✅ **Natural Integration**: Payment method required for purchase anyway
3. ✅ **Future-Proof**: Ready for real payment integration
4. ✅ **Audit Trail**: Track which accounts use which payment methods
5. ✅ **User Experience**: Users provide payment method when they want to buy chips

## Limitations

1. ❌ Users can still use multiple payment methods (GCash + PayMaya)
2. ❌ Users can use family/friend's payment numbers
3. ❌ Doesn't prevent if user has multiple GCash/PayMaya accounts
4. ❌ Requires purchase to add payment method (can't forecast without purchasing)

## Recommendations

1. **Combine with Phone Verification**: Require phone verification + payment method for strongest protection
2. **Allow Payment Method Before Purchase**: Let users add payment method in profile, not just during purchase
3. **Future: SMS Verification**: Verify payment method ownership via SMS OTP
4. **Monitoring**: Track patterns (same payment method, multiple accounts) for manual review

---

## Alternative Approaches Considered

### Option A: Require Payment Method at Registration
- ❌ Too early (users haven't committed yet)
- ❌ Higher friction
- ❌ Users may not have payment method ready

### Option B: Require Payment Method Before First Forecast
- ✅ Good middle ground
- ✅ Users only need it when they want to participate
- ⚠️ Still allows browsing without payment method

### Option C: Require Payment Method at Purchase (SELECTED)
- ✅ Natural flow (need payment to buy chips)
- ✅ Lower friction (only when purchasing)
- ✅ Ready for real payment integration

---

## Next Steps (When Ready to Implement)

1. Review and approve this analysis
2. Create database migration
3. Implement backend changes
4. Implement frontend changes
5. Test thoroughly
6. Deploy

