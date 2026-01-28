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
  if (daysUntil < 0) return 'text-slate-500';
  if (daysUntil <= 1) return 'text-rose-600';
  if (daysUntil <= 3) return 'text-amber-600';
  return 'text-slate-600';
};

export const getExpirationBgColor = (daysUntil: number): string => {
  if (daysUntil < 0) return 'bg-slate-100 border-slate-300';
  if (daysUntil <= 1) return 'bg-rose-50 border-rose-200';
  if (daysUntil <= 3) return 'bg-amber-50 border-amber-200';
  return 'bg-white/80 border-slate-200';
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
    return coupon.status === 'active' && days >= 0 && days <= 2;
  }).length;
};

export const getStoreIcon = (storeName: string, category?: string): string => {
  const lowerStore = storeName.toLowerCase();
  
  // Store-specific icons
  if (lowerStore.includes('pizza')) return '🍕';
  if (lowerStore.includes('subway')) return '🥪';
  if (lowerStore.includes('starbucks') || lowerStore.includes('coffee')) return '☕';
  if (lowerStore.includes('chipotle') || lowerStore.includes('taco') || lowerStore.includes('burrito')) return '🌯';
  if (lowerStore.includes('burger') || lowerStore.includes('mcdonald')) return '🍔';
  if (lowerStore.includes('donut') || lowerStore.includes('dunkin')) return '🍩';
  if (lowerStore.includes('ice cream') || lowerStore.includes('baskin')) return '🍦';
  if (lowerStore.includes('sushi')) return '🍣';
  if (lowerStore.includes('chicken') || lowerStore.includes('kfc') || lowerStore.includes('popeyes')) return '🍗';
  
  if (lowerStore.includes('target')) return '🎯';
  if (lowerStore.includes('walmart') || lowerStore.includes('costco') || lowerStore.includes('sam')) return '🛒';
  if (lowerStore.includes('amazon') || lowerStore.includes('ebay')) return '📦';
  if (lowerStore.includes('best buy') || lowerStore.includes('electronics')) return '💻';
  if (lowerStore.includes('home depot') || lowerStore.includes('lowe')) return '🔨';
  
  if (lowerStore.includes('cvs') || lowerStore.includes('walgreens') || lowerStore.includes('pharmacy') || lowerStore.includes('rite aid')) return '💊';
  
  if (lowerStore.includes('amc') || lowerStore.includes('cinema') || lowerStore.includes('movie') || lowerStore.includes('theatre')) return '🎬';
  if (lowerStore.includes('gym') || lowerStore.includes('fitness')) return '💪';
  if (lowerStore.includes('spa') || lowerStore.includes('salon')) return '💆';
  
  if (lowerStore.includes('bath') || lowerStore.includes('body')) return '🧴';
  if (lowerStore.includes('nike') || lowerStore.includes('adidas') || lowerStore.includes('shoe')) return '👟';
  if (lowerStore.includes('book') || lowerStore.includes('barnes')) return '📚';
  if (lowerStore.includes('gas') || lowerStore.includes('shell') || lowerStore.includes('exxon')) return '⛽';
  if (lowerStore.includes('hotel') || lowerStore.includes('airbnb')) return '🏨';
  if (lowerStore.includes('uber') || lowerStore.includes('lyft')) return '🚗';
  
  // Category-based fallbacks
  if (category) {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'food') return '🍽️';
    if (lowerCategory === 'retail') return '🛍️';
    if (lowerCategory === 'pharmacy') return '💊';
    if (lowerCategory === 'entertainment') return '🎭';
  }
  
  // Default icon
  return '🎟️';
};
