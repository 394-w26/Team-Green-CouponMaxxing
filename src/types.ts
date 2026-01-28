export interface Coupon {
  id: string;
  store: string;
  discount: string;
  expirationDate: string;
  category?: string;
  status: 'active' | 'used' | 'deleted';
  icon?: string;
  source?: 'global' | 'personal';
}

export type FilterType = 'all' | 'expiring-soon' | 'by-category' | 'by-store' | 'used' | 'expired' | 'trash';

export type SortType = 'expiration' | 'store' | 'discount';
