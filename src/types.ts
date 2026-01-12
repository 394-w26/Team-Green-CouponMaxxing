export interface Coupon {
  id: string;
  store: string;
  discount: string;
  expirationDate: string;
  category?: string;
  status: 'active' | 'used' | 'deleted';
  icon?: string;
}

export type FilterType = 'all' | 'expiring-soon' | 'by-category' | 'by-store' | 'used' | 'trash';

export type SortType = 'expiration' | 'store' | 'discount';
