import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Coupon } from './types';

// Mock the current date to January 21, 2026
beforeEach(() => {
  vi.setSystemTime(new Date('2026-01-21'));
});

describe('Coupon Filtering Logic', () => {
  // Helper to create test coupons
  const createCoupon = (
    id: string,
    expirationDate: string,
    status: Coupon['status'] = 'active',
    category?: string,
    store: string = 'Test Store'
  ): Coupon => ({
    id,
    store,
    discount: '$10 off',
    expirationDate,
    category,
    status,
  });

  // Sample coupon dataset
  const allCoupons: Coupon[] = [
    createCoupon('1', '2026-01-21', 'active', 'Food', 'Pizza Hut'), // Expires today
    createCoupon('2', '2026-01-22', 'active', 'Food', 'McDonald\'s'), // Expires in 1 day
    createCoupon('3', '2026-01-23', 'active', 'Retail', 'Target'), // Expires in 2 days
    createCoupon('4', '2026-01-24', 'active', 'Retail', 'Walmart'), // Expires in 3 days
    createCoupon('5', '2026-01-31', 'active', 'Pharmacy', 'CVS'), // Expires in 10 days
    createCoupon('6', '2026-02-21', 'active', 'Food', 'Subway'), // Expires in 31 days
    createCoupon('7', '2026-01-20', 'active', 'Food', 'Burger King'), // Expired 1 day ago
    createCoupon('8', '2026-01-19', 'active', 'Retail', 'Amazon'), // Expired 2 days ago
    createCoupon('9', '2026-01-25', 'used', 'Food', 'Chipotle'), // Used coupon
    createCoupon('10', '2026-01-26', 'deleted', 'Retail', 'eBay'), // Deleted coupon
  ];

  describe('Active Coupons Filter', () => {
    it('should only include active non-expired coupons', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      expect(activeCoupons).toHaveLength(6);
      expect(activeCoupons.map(c => c.id)).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('should exclude expired coupons even if status is active', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const expired = activeCoupons.find(c => c.id === '7' || c.id === '8');
      expect(expired).toBeUndefined();
    });
  });

  describe('Expired Coupons Filter', () => {
    it('should only include coupons with past expiration dates', () => {
      const expiredCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff < 0;
      });

      expect(expiredCoupons).toHaveLength(2);
      expect(expiredCoupons.map(c => c.id)).toEqual(['7', '8']);
    });

    it('should not include used or deleted coupons', () => {
      const expiredCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff < 0;
      });

      const hasUsedOrDeleted = expiredCoupons.some(c => 
        c.status === 'used' || c.status === 'deleted'
      );
      expect(hasUsedOrDeleted).toBe(false);
    });
  });

  describe('Expiring Soon Filter', () => {
    it('should include coupons expiring in 0-2 days', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const expiringSoon = activeCoupons.filter(coupon => {
        const today = new Date('2026-01-21');
        const expDate = new Date(coupon.expirationDate);
        const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 2;
      });

      expect(expiringSoon).toHaveLength(3);
      expect(expiringSoon.map(c => c.id)).toEqual(['1', '2', '3']);
    });

    it('should not include coupons expiring in 3 or more days', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const expiringSoon = activeCoupons.filter(coupon => {
        const today = new Date('2026-01-21');
        const expDate = new Date(coupon.expirationDate);
        const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 2;
      });

      const farFuture = expiringSoon.find(c => c.id === '4' || c.id === '5' || c.id === '6');
      expect(farFuture).toBeUndefined();
    });
  });

  describe('Category Filter', () => {
    it('should filter by Food category', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const foodCoupons = activeCoupons.filter(c => c.category === 'Food');

      expect(foodCoupons).toHaveLength(3);
      expect(foodCoupons.map(c => c.id)).toEqual(['1', '2', '6']);
    });

    it('should filter by Retail category', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const retailCoupons = activeCoupons.filter(c => c.category === 'Retail');

      expect(retailCoupons).toHaveLength(2);
      expect(retailCoupons.map(c => c.id)).toEqual(['3', '4']);
    });

    it('should filter by Pharmacy category', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const pharmacyCoupons = activeCoupons.filter(c => c.category === 'Pharmacy');

      expect(pharmacyCoupons).toHaveLength(1);
      expect(pharmacyCoupons.map(c => c.id)).toEqual(['5']);
    });
  });

  describe('Store Sorting', () => {
    it('should sort alphabetically by store name', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const sortedByStore = [...activeCoupons].sort((a, b) => 
        a.store.localeCompare(b.store)
      );

      const storeNames = sortedByStore.map(c => c.store);
      expect(storeNames).toEqual([
        'CVS',
        'McDonald\'s',
        'Pizza Hut',
        'Subway',
        'Target',
        'Walmart',
      ]);
    });
  });

  describe('Used Coupons Filter', () => {
    it('should only include coupons with used status', () => {
      const usedCoupons = allCoupons.filter(c => c.status === 'used');

      expect(usedCoupons).toHaveLength(1);
      expect(usedCoupons[0].id).toBe('9');
    });

    it('should not include active or deleted coupons', () => {
      const usedCoupons = allCoupons.filter(c => c.status === 'used');

      const hasOtherStatuses = usedCoupons.some(c => 
        c.status === 'active' || c.status === 'deleted'
      );
      expect(hasOtherStatuses).toBe(false);
    });
  });

  describe('Trash (Deleted) Filter', () => {
    it('should only include coupons with deleted status', () => {
      const deletedCoupons = allCoupons.filter(c => c.status === 'deleted');

      expect(deletedCoupons).toHaveLength(1);
      expect(deletedCoupons[0].id).toBe('10');
    });

    it('should not include active or used coupons', () => {
      const deletedCoupons = allCoupons.filter(c => c.status === 'deleted');

      const hasOtherStatuses = deletedCoupons.some(c => 
        c.status === 'active' || c.status === 'used'
      );
      expect(hasOtherStatuses).toBe(false);
    });
  });

  describe('Date Sorting', () => {
    it('should sort by expiration date ascending (soonest first)', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      const sorted = [...activeCoupons].sort((a, b) => {
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateA - dateB;
      });

      const sortedIds = sorted.map(c => c.id);
      expect(sortedIds).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('should sort expired coupons by most recent first', () => {
      const expiredCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff < 0;
      });

      const sorted = [...expiredCoupons].sort((a, b) => {
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateB - dateA; // Most recently expired first
      });

      const sortedIds = sorted.map(c => c.id);
      expect(sortedIds).toEqual(['7', '8']); // Jan 20, then Jan 19
    });
  });

  describe('Tab Counts', () => {
    it('should calculate correct count for All Coupons tab', () => {
      const activeCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      expect(activeCoupons.length).toBe(6);
    });

    it('should calculate correct count for Expired tab', () => {
      const expiredCoupons = allCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff < 0;
      });

      expect(expiredCoupons.length).toBe(2);
    });

    it('should calculate correct count for Used tab', () => {
      const usedCoupons = allCoupons.filter(c => c.status === 'used');
      expect(usedCoupons.length).toBe(1);
    });

    it('should calculate correct count for Trash tab', () => {
      const deletedCoupons = allCoupons.filter(c => c.status === 'deleted');
      expect(deletedCoupons.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty coupon list', () => {
      const emptyCoupons: Coupon[] = [];
      
      const activeCoupons = emptyCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      expect(activeCoupons).toHaveLength(0);
    });

    it('should handle coupons without category', () => {
      const couponNoCategory = createCoupon('11', '2026-01-25', 'active', undefined, 'No Category Store');
      const testCoupons = [...allCoupons, couponNoCategory];

      const activeCoupons = testCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      expect(activeCoupons.some(c => c.id === '11')).toBe(true);
    });

    it('should handle same expiration date for multiple coupons', () => {
      const sameDateCoupons = [
        createCoupon('20', '2026-01-25', 'active', 'Food', 'Store A'),
        createCoupon('21', '2026-01-25', 'active', 'Food', 'Store B'),
        createCoupon('22', '2026-01-25', 'active', 'Food', 'Store C'),
      ];

      const activeCoupons = sameDateCoupons.filter(c => {
        if (c.status !== 'active') return false;
        const today = new Date('2026-01-21');
        const expDate = new Date(c.expirationDate);
        const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0;
      });

      expect(activeCoupons).toHaveLength(3);
    });
  });
});
