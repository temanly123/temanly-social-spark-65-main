# Review System Connectivity Fix Guide

## 🔍 **Problem Identified**

The review system is not showing reviews across dashboards because:

1. **No Real Bookings**: The database has 0 bookings, so there's nothing to review
2. **Mock Data in UI**: The user dashboard shows demo/placeholder data, not real database data  
3. **Schema Mismatch**: Some components use different column names (user_id vs reviewer_id)

## ✅ **Solution Steps**

### Step 1: Create Test Data (Required)

Since reviews can only be created for completed bookings, we need to create test bookings first.

**Option A: Using SQL (Recommended)**
1. Go to your Supabase Dashboard → SQL Editor
2. Run the script `create-test-bookings-and-reviews.sql`
3. This will create:
   - 3 completed bookings
   - 3 reviews (2 verified, 1 pending)
   - Updated talent statistics

**Option B: Using the Application**
1. Create a booking through the normal booking flow
2. Manually change the booking status to "completed" in the database
3. Submit a review through the review page

### Step 2: Fix Schema Consistency (Already Done)

The following files have been updated to use consistent schema:
- ✅ `src/services/reviewService.ts` - Updated to use `reviewer_id`, `reviewee_id`, `comment`
- ✅ `src/pages/ReviewPage.tsx` - Updated field names
- ✅ `src/pages/TalentProfile.tsx` - Updated queries

### Step 3: Verify Review System Components

After creating test data, check these components:

#### Admin Dashboard
- Go to `/admin-dashboard` → Review Management
- Should show all reviews with approval/rejection options
- Pending reviews need admin approval to appear publicly

#### User Dashboard  
- Go to `/user-dashboard` → Service History
- Should show completed bookings with review options
- Reviews should display with ratings

#### Talent Profile
- Go to `/talent-profile/[id]` → Reviews Tab
- Should show verified reviews only
- Rating summary should be calculated correctly

#### Talent Dashboard
- Go to `/talent-dashboard` → Reviews section
- Should show reviews received by the talent
- Statistics should be updated

### Step 4: Test Review Submission Flow

1. **Create a New Booking**:
   - Book a service through the normal flow
   - Set booking status to "completed" (in database or admin panel)

2. **Submit a Review**:
   - Go to user dashboard
   - Click "Review" button for completed booking
   - Submit rating and comment

3. **Admin Approval**:
   - Go to admin dashboard → Review Management
   - Approve the pending review
   - Check that it appears in all dashboards

## 🔧 **Database Schema Reference**

The reviews table uses these columns:
```sql
- id (UUID)
- booking_id (UUID) → references bookings(id)
- reviewer_id (UUID) → references profiles(id) [the user giving review]
- reviewee_id (UUID) → references profiles(id) [the talent being reviewed]
- rating (INTEGER 1-5)
- comment (TEXT)
- is_verified (BOOLEAN) → must be true to show publicly
- admin_notes (TEXT)
- created_at (TIMESTAMP)
```

## 🧪 **Testing Checklist**

After running the setup:

- [ ] Admin Dashboard shows reviews in Review Management
- [ ] User Dashboard shows completed bookings with ratings
- [ ] Talent Profile shows verified reviews in Reviews tab
- [ ] Talent Dashboard shows received reviews
- [ ] Review submission creates new pending reviews
- [ ] Admin approval makes reviews visible publicly
- [ ] Talent statistics (average_rating, total_orders) update correctly

## 🚨 **Common Issues & Solutions**

### Issue: "No reviews found"
- **Cause**: No completed bookings exist
- **Solution**: Create test bookings with status "completed"

### Issue: "Reviews not showing after submission"
- **Cause**: Reviews need admin approval (is_verified = false)
- **Solution**: Go to admin dashboard and approve pending reviews

### Issue: "Database query errors"
- **Cause**: Schema mismatch (user_id vs reviewer_id)
- **Solution**: Use the updated components provided

### Issue: "RLS policy violations"
- **Cause**: Row Level Security blocking operations
- **Solution**: Use service role key or temporarily disable RLS for testing

## 📝 **Next Steps**

1. Run the SQL script to create test data
2. Verify all dashboard components show reviews correctly
3. Test the complete review submission and approval flow
4. Update any remaining components that use old schema
5. Consider adding more robust error handling for edge cases

## 🎯 **Expected Results**

After completing these steps:
- User dashboard will show real booking history with ratings
- Admin dashboard will have functional review management
- Talent profiles will display authentic reviews
- The complete review workflow will be operational
- All dashboards will be connected and synchronized
