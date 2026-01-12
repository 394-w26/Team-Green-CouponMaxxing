import type { Coupon } from './types';

export const initialCoupons: Coupon[] = [
  {
    id: '0',
    store: 'Subway',
    discount: 'Buy One Get One Free Footlong',
    expirationDate: '2026-01-10',
    category: 'Food',
    status: 'active',
    icon: '🥪',
  },
  {
    id: '1',
    store: 'Pizza Hut',
    discount: '50% Off Any Large Pizza',
    expirationDate: '2026-01-11',
    category: 'Food',
    status: 'active',
    icon: '🍕',
  },
  {
    id: '2',
    store: 'Target',
    discount: '$10 Off $50 Purchase',
    expirationDate: '2026-01-12',
    category: 'Retail',
    status: 'active',
    icon: '🎯',
  },
  {
    id: '3',
    store: 'CVS Pharmacy',
    discount: 'Save $5 on $20+',
    expirationDate: '2026-01-13',
    category: 'Pharmacy',
    status: 'active',
    icon: '💊',
  },
  {
    id: '7',
    store: 'Starbucks',
    discount: 'Free Drink with Purchase',
    expirationDate: '2026-01-14',
    category: 'Food',
    status: 'active',
    icon: '☕',
  },
  {
    id: '4',
    store: 'Bath & Body Works',
    discount: '20% Off Entire Purchase',
    expirationDate: '2026-01-15',
    category: 'Retail',
    status: 'active',
    icon: '🧴',
  },
  {
    id: '8',
    store: 'AMC Theatres',
    discount: '$5 Off Movie Ticket',
    expirationDate: '2026-01-16',
    category: 'Entertainment',
    status: 'active',
    icon: '🎬',
  },
  {
    id: '5',
    store: 'Chipotle',
    discount: 'Free Chips & Guac with Entree',
    expirationDate: '2026-01-20',
    category: 'Food',
    status: 'active',
    icon: '🌯',
  },
  {
    id: '6',
    store: 'Walgreens',
    discount: 'Buy One Get One 50% Off Vitamins',
    expirationDate: '2026-01-25',
    category: 'Pharmacy',
    status: 'active',
    icon: '💊',
  },
];

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getExpirationColor = (daysUntil: number): string => {
  if (daysUntil < 0) return 'text-red-700';
  if (daysUntil <= 1) return 'text-red-600';
  if (daysUntil <= 3) return 'text-orange-600';
  return 'text-gray-600';
};

export const getExpirationBgColor = (daysUntil: number): string => {
  if (daysUntil < 0) return 'bg-gray-200 border-gray-400';
  if (daysUntil <= 1) return 'bg-red-100 border-red-300';
  if (daysUntil <= 3) return 'bg-orange-100 border-orange-300';
  return 'bg-white';
};

export const formatExpirationDate = (date: string, daysUntil: number): string => {
  if (daysUntil < 0) return 'Expired';
  if (daysUntil === 0) return 'Expires: Today';
  if (daysUntil === 1) return 'Expires: Tomorrow';
  
  const expDate = new Date(date);
  const month = expDate.toLocaleString('default', { month: 'short' });
  const day = expDate.getDate();
  const year = expDate.getFullYear();
  return `Expires: ${month} ${day}, ${year}`;
};

export const getExpiringSoonCount = (coupons: Coupon[]): number => {
  return coupons.filter(coupon => {
    const days = getDaysUntilExpiration(coupon.expirationDate);
    return coupon.status === 'active' && days >= 0 && days <= 3;
  }).length;
};
