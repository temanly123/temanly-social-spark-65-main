# Temanly Business Model & Monetization

## 📊 Revenue Structure

### 1. App Fee (10%)
- **Charged to:** Customer
- **Amount:** 10% of service amount
- **Purpose:** Platform operational costs
- **Example:** Service Rp 100,000 → App Fee Rp 10,000

### 2. Commission (Variable by Talent Level)
- **Charged to:** Talent (deducted from service amount)
- **Rates:**
  - **Fresh Talent:** 20%
  - **Elite Talent:** 18%
  - **VIP Talent:** 15%

## 🎯 Talent Level System

### Fresh Talent (Default)
- **Requirements:** New signup
- **Commission:** 20%
- **Benefits:**
  - Basic profile visibility
  - Standard customer support
  - Access to all services

### Elite Talent
- **Requirements:**
  - 30+ completed orders
  - 4.5+ average rating
- **Commission:** 18%
- **Benefits:**
  - Enhanced profile visibility
  - Priority customer support
  - Featured in search results
  - Access to premium tools

### VIP Talent
- **Requirements:**
  - 100+ completed orders
  - 4.5+ average rating
  - 6+ months active
- **Commission:** 15%
- **Benefits:**
  - Maximum profile visibility
  - VIP customer support
  - Top placement in search
  - Advanced analytics
  - Custom service rates
  - Priority booking notifications

## 💰 Payment Flow Example

### Example Transaction: Rp 300,000 Service

#### Fresh Talent (20% commission):
- **Customer Pays:** Rp 330,000 (300k + 30k app fee)
- **Platform Keeps:** Rp 90,000 (30k app fee + 60k commission)
- **Talent Receives:** Rp 240,000 (300k - 60k commission)

#### Elite Talent (18% commission):
- **Customer Pays:** Rp 330,000 (300k + 30k app fee)
- **Platform Keeps:** Rp 84,000 (30k app fee + 54k commission)
- **Talent Receives:** Rp 246,000 (300k - 54k commission)

#### VIP Talent (15% commission):
- **Customer Pays:** Rp 330,000 (300k + 30k app fee)
- **Platform Keeps:** Rp 75,000 (30k app fee + 45k commission)
- **Talent Receives:** Rp 255,000 (300k - 45k commission)

## 🔄 Financial Calculations

### Platform Revenue Components:
1. **App Fees:** 10% of all service amounts
2. **Commission Revenue:** Variable % of service amounts based on talent level
3. **Total Platform Revenue:** App Fees + Commission Revenue

### Talent Earnings:
- **Gross Earnings:** Service Amount - Commission
- **Available for Payout:** Gross Earnings - Pending Payouts
- **Payout Processing:** Bank transfer, manual approval

## 📈 Analytics Tracking

### Key Metrics:
- **Total Customer Payments:** Sum of all amounts charged to customers
- **Service Revenue:** Sum of all service amounts (excluding app fees)
- **App Fee Revenue:** 10% of service revenue
- **Commission Revenue:** Variable % based on talent levels
- **Total Platform Revenue:** App Fees + Commission Revenue
- **Talent Earnings:** Service Revenue - Commission Revenue

### Performance Indicators:
- **Average Transaction Value**
- **Monthly Revenue Growth**
- **Talent Level Distribution**
- **Commission Rate Effectiveness**
- **Payout Processing Efficiency**

## 🛠 Implementation Details

### Database Structure:
- **payment_transactions:** Stores all financial data
- **profiles:** Contains talent level and statistics
- **payout_requests:** Manages talent withdrawals

### Key Fields:
- `amount`: Total charged to customer
- `platform_fee`: 10% app fee
- `commission_rate`: Talent level-based rate
- `commission_amount`: Calculated commission
- `companion_earnings`: Amount talent receives
- `talent_level`: fresh/elite/vip

### Automatic Level Progression:
- System automatically calculates talent levels based on:
  - Total completed orders
  - Average rating
  - Account age
- Levels update after each completed booking with review

## 🎯 Business Benefits

### For Platform:
- **Predictable Revenue:** 10% app fee on all transactions
- **Performance-Based Commission:** Higher performing talents pay less
- **Growth Incentive:** Talent level system encourages quality service

### For Talents:
- **Clear Progression Path:** Visible requirements for level advancement
- **Reduced Commission:** Better performance = lower fees
- **Enhanced Visibility:** Higher levels get better placement

### For Customers:
- **Quality Assurance:** Level system indicates talent experience
- **Transparent Pricing:** Clear breakdown of fees
- **Better Service:** Incentivized talent performance

## 📊 Sample Data Breakdown

Based on seeded test data (8 transactions):
- **Total Service Revenue:** Rp 2,485,000
- **Total App Fees:** Rp 248,500 (10%)
- **Total Commission:** ~Rp 430,000 (varies by talent level)
- **Total Platform Revenue:** ~Rp 678,500
- **Total Talent Earnings:** ~Rp 2,055,000
- **Customer Payments:** Rp 2,733,500

This model ensures sustainable platform growth while rewarding talent performance and maintaining competitive rates.
