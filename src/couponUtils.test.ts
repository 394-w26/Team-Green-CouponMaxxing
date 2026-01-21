import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDaysUntilExpiration, getExpiringSoonCount } from './couponUtils';
import type { Coupon } from './types';

describe('couponUtils', () => {
  beforeEach(() => {
    // Mock the current date to January 21, 2026
    vi.setSystemTime(new Date('2026-01-21'));
  });

  describe('getDaysUntilExpiration', () => {
    it('should return 0 for today', () => {
      const result = getDaysUntilExpiration('2026-01-21');
      expect(result).toBe(0);
    });

    it('should return positive days for future dates', () => {
      expect(getDaysUntilExpiration('2026-01-22')).toBe(1);
      expect(getDaysUntilExpiration('2026-01-24')).toBe(3);
      expect(getDaysUntilExpiration('2026-01-31')).toBe(10);
    });

    it('should return negative days for past dates', () => {
      expect(getDaysUntilExpiration('2026-01-20')).toBe(-1);
      expect(getDaysUntilExpiration('2026-01-19')).toBe(-2);
      expect(getDaysUntilExpiration('2026-01-11')).toBe(-10);
    });

    it('should handle dates from different months', () => {
      expect(getDaysUntilExpiration('2026-02-21')).toBe(31);
      expect(getDaysUntilExpiration('2025-12-21')).toBe(-31);
    });
  });

  describe('getExpiringSoonCount', () => {
    const createCoupon = (expirationDate: string, id: string = '1'): Coupon => ({
      id,
      store: 'Test Store',
      discount: '$10 off',
      expirationDate,
      status: 'active',
    });

    it('should return 0 for empty array', () => {
      expect(getExpiringSoonCount([])).toBe(0);
    });

    it('should count coupons expiring today (0 days)', () => {
      const coupons = [createCoupon('2026-01-21')];
      expect(getExpiringSoonCount(coupons)).toBe(1);
    });

    it('should count coupons expiring tomorrow (1 day)', () => {
      const coupons = [createCoupon('2026-01-22')];
      expect(getExpiringSoonCount(coupons)).toBe(1);
    });

    it('should count coupons expiring in 2 days', () => {
      const coupons = [createCoupon('2026-01-23')];
      expect(getExpiringSoonCount(coupons)).toBe(1);
    });

    it('should NOT count coupons expiring in 3 days or more', () => {
      const coupons = [
        createCoupon('2026-01-24', '1'), // 3 days
        createCoupon('2026-01-25', '2'), // 4 days
        createCoupon('2026-02-21', '3'), // 31 days
      ];
      expect(getExpiringSoonCount(coupons)).toBe(0);
    });

    it('should NOT count already expired coupons (negative days)', () => {
      const coupons = [
        createCoupon('2026-01-20', '1'), // -1 days
        createCoupon('2026-01-19', '2'), // -2 days
      ];
      expect(getExpiringSoonCount(coupons)).toBe(0);
    });

    it('should count multiple expiring soon coupons correctly', () => {
      const coupons = [
        createCoupon('2026-01-21', '1'), // 0 days ✓
        createCoupon('2026-01-22', '2'), // 1 day ✓
        createCoupon('2026-01-23', '3'), // 2 days ✓
        createCoupon('2026-01-24', '4'), // 3 days ✗
        createCoupon('2026-01-20', '5'), // -1 days ✗
      ];
      expect(getExpiringSoonCount(coupons)).toBe(3);
    });

    it('should handle mixed dates correctly', () => {
      const coupons = [
        createCoupon('2026-01-21', '1'), // today ✓
        createCoupon('2026-01-23', '2'), // 2 days ✓
        createCoupon('2026-02-21', '3'), // far future ✗
        createCoupon('2025-12-21', '4'), // past ✗
      ];
      expect(getExpiringSoonCount(coupons)).toBe(2);
    });
  });
});
