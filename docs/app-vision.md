# Name
CouponMaxxing

# Users
College students and young adults who clip coupons but struggle to keep track of when they expire and which ones are worth using.
d
# Value Proposition
Stop letting good coupons go to waste. CouponMaxxing is a simple coupon-tracking app that organizes coupons by expiration date, highlights which coupons should be used next, and helps users make quick savings decisions.

# Key Features
Minimal, mobile-friendly interface focused on quick decision-making:
- 💰 App branding at the top with a notification badge showing expiring coupons
- Tabs to filter: All Coupons, Expiring Soon, By Category (with dropdown), By Store, Used, and Trash
- Alert banner when coupons are about to expire
- Coupon list showing intuitive emoji icons, store name, discount, and expiration date
- Clearly displayed expiration status with color coding (red = urgent/expired, orange = soon, gray = normal)
- Sort by expiration date (soonest first) or alphabetically by store
- "+ Add a Coupon" button to manually enter new coupons with store name, deal description, expiration date, and category
- Tap any coupon to see full details
- Mark coupons as used to track savings history (appears in Used tab)
- Move unwanted coupons to trash (can restore or permanently delete)
- View used coupons history in dedicated tab
- Manage trash with restore individual items or clear all

# Example Scenario

Charles is a junior at Northwestern moving into an apartment next spring. He's been collecting coupons from Target, CVS, and a few restaurants but keeps forgetting about them until they expire.

1. Charles opens CouponMaxxing on his phone after class.
2. He sees a red notification badge showing "3" - three coupons need attention.
3. The main screen shows an orange alert banner: "3 Coupons Expire in the Next 2 Days!" with a "VIEW" button.
4. Below that, his coupons are listed by expiration date:
   - Pizza Hut: 50% Off Any Large Pizza - Expires: Tomorrow (red text)
   - Target: $10 Off $50 Purchase - Expires: Jan 12, 2026 (red text)
   - CVS Pharmacy: Save $5 on $20+ - Expires: Jan 13, 2026 (orange text)
   - Bath & Body Works: 20% Off Entire Purchase - Expires: Jan 15, 2026
5. Charles taps the Target coupon since he needs to buy some dorm supplies anyway.
6. The detail view shows the full coupon info with three action buttons: "✓ Mark as Used" (green), "🗑️ Move to Trash" (orange), and "Close" (gray).
7. He uses the coupon at Target and clicks "✓ Mark as Used". A confirmation appears, then a success message: "✓ Coupon marked as used!" It disappears from his active list.
8. Later, Charles gets a coupon in his email for Chipotle. He taps "+ Add Coupon" and enters:
   - Store: Chipotle
   - Discount: Free Chips & Guac with Entree
   - Expiration: Jan 20, 2026
9. The new coupon shows up in his list, sorted in the right spot by date.
10. That evening, Charles checks the "Expiring Soon" tab to make quick decisions and decides to order Pizza Hut before that deal expires tomorrow.
11. He also finds an old Subway coupon that expired yesterday. He taps it and clicks "🗑️ Move to Trash" to keep his list clean.
12. The next day, Charles checks his "✓ Used" tab to see his savings history - the Target coupon he used is there.
13. He accidentally moved a Bath & Body Works coupon to trash. He goes to the "🗑️ Trash" tab, taps it, and clicks "Restore" to bring it back.
14. To clean up, Charles clicks "Clear All Trash" to permanently delete old coupons he no longer needs.

# Sample Data

| Store | Discount | Expiration | Status |
|-------|----------|------------|--------|
| Pizza Hut | 50% Off Any Large Pizza | Jan 11, 2026 | Active |
| Target | $10 Off $50 Purchase | Jan 12, 2026 | Active |
| CVS Pharmacy | Save $5 on $20+ | Jan 13, 2026 | Active |
| Bath & Body Works | 20% Off Entire Purchase | Jan 15, 2026 | Active |
| Chipotle | Free Chips & Guac with Entree | Jan 20, 2026 | Active |
| Walgreens | Buy One Get One 50% Off Vitamins | Jan 25, 2026 | Active |

# UI Notes
- Minimal interface focused on quick decision-making - users can glance and decide which coupon to use
- 💰 branding replaces dollar sign for visual appeal
- Coupons expiring within 1 day show "URGENT" badge and red text
- Coupons expiring within 3 days show orange text
- Expired coupons show "EXPIRED" badge and gray styling
- Each coupon card displays an intuitive emoji/icon (🍕 Pizza, 🎯 Target, 💊 Pharmacy, ☕ Coffee, etc.)
- Store name prominently displayed with discount description below
- Three distinct actions: Mark as Used (tracks savings), Move to Trash (soft delete), Close
- View all active coupons sorted by soonest expiration
- Category filter dropdown with dynamic categories (Food, Retail, Pharmacy, Entertainment, etc.)
- Used tab shows coupon history with count badge
- Trash tab shows deleted items count with "Clear All Trash" option
- Separate statuses: active, used, deleted

# Coding Notes
- Store coupons in React state with: id, store, discount, expirationDate, category, status (active/used/deleted), icon
- Calculate days until expiration from current date
- Filter functions for tabs (all, expiring soon, by category, by store, used, trash)
- Sort by expiration date ascending by default (descending for used coupons)
- Separate handlers: handleMarkAsUsed (status='used'), handleDelete (status='deleted'), handleRestore (back to 'active')
- handlePermanentDelete removes from array completely
- handleClearTrash filters out all deleted items
- Each coupon has an emoji icon for quick visual identification
- Dynamic category extraction from existing coupons

# Testing Notes
- Test that coupons sort correctly by expiration date
- Test filtering by "Expiring Soon" (within 3 days)
- Test filtering by category dropdown (Food, Retail, Pharmacy, Entertainment)
- Test filtering by store (alphabetical sort)
- Test adding a new coupon and seeing it in the correct sorted position
- Test marking a coupon as used shows confirmation and moves to Used tab
- Test moving coupon to trash and seeing it in Trash tab
- Test restoring from Used tab back to active
- Test restoring from Trash tab back to active
- Test permanently deleting individual coupon from trash
- Test "Clear All Trash" removes all deleted items
- Test that expiration badge count updates correctly
- Test that expired coupons display "Expired" status with badge
- Test that emoji icons display correctly for each store
- Test that Used and Trash tabs show correct counts