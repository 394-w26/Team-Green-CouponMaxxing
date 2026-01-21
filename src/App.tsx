import { useEffect, useMemo, useRef, useState } from 'react';
import type { Coupon, FilterType } from './types';
import { getDaysUntilExpiration, getExpiringSoonCount, getStoreIcon } from './couponUtils';
import CouponList from './CouponList';
import CouponDetailModal from './CouponDetailModal';
import AddCouponForm from './AddCouponForm';
import { onValue, push, ref, remove, set } from 'firebase/database';
import { db } from './firebase';
import { useAuthUser } from './useAuthUser';

type CouponState = {
  status: Coupon['status'];
  updatedAt: number;
};

type CouponData = Omit<Coupon, 'id' | 'status'> & {
  createdAt?: number;
};

function App() {
  const { user, loading } = useAuthUser();
  const [couponsById, setCouponsById] = useState<Record<string, CouponData>>({});
  const [couponStates, setCouponStates] = useState<Record<string, CouponState>>({});
  const [savedCoupons, setSavedCoupons] = useState<Record<string, boolean> | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const seededSavedCoupons = useRef(false);

  useEffect(() => {
    const couponsRef = ref(db, 'coupons');
    return onValue(couponsRef, (snapshot) => {
      setCouponsById(snapshot.val() ?? {});
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setCouponStates({});
      setSavedCoupons(null);
      seededSavedCoupons.current = false;
      return;
    }

    const savedRef = ref(db, `users/${user.uid}/savedCoupons`);
    const statesRef = ref(db, `users/${user.uid}/couponStates`);

    const unsubSaved = onValue(savedRef, (snapshot) => {
      const data = snapshot.val();
      setSavedCoupons(data ?? null);
    });

    const unsubStates = onValue(statesRef, (snapshot) => {
      setCouponStates(snapshot.val() ?? {});
    });

    return () => {
      unsubSaved();
      unsubStates();
    };
  }, [user]);

  useEffect(() => {
    if (!user || savedCoupons !== null || seededSavedCoupons.current) {
      return;
    }

    const couponIds = Object.keys(couponsById);
    if (couponIds.length === 0) {
      return;
    }

    const seed: Record<string, boolean> = {};
    couponIds.forEach((id) => {
      seed[id] = true;
    });
    seededSavedCoupons.current = true;
    void set(ref(db, `users/${user.uid}/savedCoupons`), seed);
  }, [user, couponsById, savedCoupons]);

  const coupons = useMemo(() => {
    const allCoupons = Object.entries(couponsById).map(([id, data]) => {
      const state = couponStates[id];
      return {
        id,
        status: state?.status ?? 'active',
        ...data,
      } as Coupon;
    });

    if (savedCoupons) {
      return allCoupons.filter((coupon) => savedCoupons[coupon.id]);
    }

    return allCoupons;
  }, [couponsById, couponStates, savedCoupons]);

  const activeCoupons = useMemo(() => 
    coupons.filter(c => {
      // Only show coupons that are active AND not expired
      if (c.status !== 'active') return false;
      const daysUntil = getDaysUntilExpiration(c.expirationDate);
      return daysUntil >= 0; // Exclude expired coupons (negative days)
    }), 
    [coupons]
  );

  const expiredCoupons = useMemo(() =>
    coupons.filter(c => {
      // Coupons that are marked active but have expired
      if (c.status !== 'active') return false;
      const daysUntil = getDaysUntilExpiration(c.expirationDate);
      return daysUntil < 0;
    }),
    [coupons]
  );

  const usedCoupons = useMemo(() => 
    coupons.filter(c => c.status === 'used'), 
    [coupons]
  );

  const deletedCoupons = useMemo(() => 
    coupons.filter(c => c.status === 'deleted'), 
    [coupons]
  );

  const expiringSoonCount = useMemo(() => 
    getExpiringSoonCount(activeCoupons), 
    [activeCoupons]
  );

  const categories = useMemo(() => {
    const cats = new Set(activeCoupons.map(c => c.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [activeCoupons]);

  const filteredCoupons = useMemo(() => {
    if (activeFilter === 'used') {
      return [...usedCoupons].sort((a, b) => {
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateB - dateA; // Most recent first for used coupons
      });
    }

    if (activeFilter === 'trash') {
      return [...deletedCoupons].sort((a, b) => {
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateA - dateB;
      });
    }

    if (activeFilter === 'expired') {
      return [...expiredCoupons].sort((a, b) => {
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateB - dateA; // Most recently expired first
      });
    }

    let filtered = activeCoupons;

    switch (activeFilter) {
      case 'expiring-soon':
        filtered = filtered.filter(coupon => {
          const days = getDaysUntilExpiration(coupon.expirationDate);
          return days >= 0 && days <= 2;
        });
        break;
      case 'by-category':
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(coupon => coupon.category === selectedCategory);
        }
        break;
      case 'by-store':
        // Sort alphabetically by store
        filtered = [...filtered].sort((a, b) => a.store.localeCompare(b.store));
        return filtered;
    }

    // Default sort by expiration date
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      return dateA - dateB;
    });
  }, [activeCoupons, activeFilter, selectedCategory, usedCoupons, deletedCoupons, expiredCoupons]);

  const setCouponStatus = async (couponId: string, status: Coupon['status']) => {
    if (!user) return;
    const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
    const savedRef = ref(db, `users/${user.uid}/savedCoupons/${couponId}`);
    await set(savedRef, true);
    await set(stateRef, { status, updatedAt: Date.now() });
  };

  const handleMarkAsUsed = (couponId: string) => {
    void setCouponStatus(couponId, 'used');
  };

  const handleDelete = (couponId: string) => {
    void setCouponStatus(couponId, 'deleted');
  };

  const handleRestore = (couponId: string) => {
    void setCouponStatus(couponId, 'active');
  };

  const handleClearTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in trash?')) {
      if (!user) return;
      deletedCoupons.forEach((coupon) => {
        const stateRef = ref(db, `users/${user.uid}/couponStates/${coupon.id}`);
        const savedRef = ref(db, `users/${user.uid}/savedCoupons/${coupon.id}`);
        void remove(stateRef);
        void remove(savedRef);
      });
    }
  };

  const handlePermanentDelete = (couponId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this coupon?')) {
      if (!user) return;
      const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
      const savedRef = ref(db, `users/${user.uid}/savedCoupons/${couponId}`);
      void remove(stateRef);
      void remove(savedRef);
    }
  };

  const handleAddCoupon = async (newCoupon: Omit<Coupon, 'id' | 'status'>) => {
    if (!user) return;
    const couponsRef = ref(db, 'coupons');
    const newRef = push(couponsRef);
    const couponData: CouponData = {
      ...newCoupon,
      icon: newCoupon.icon || getStoreIcon(newCoupon.store, newCoupon.category),
      createdAt: Date.now(),
    };
    await set(newRef, couponData);
    if (newRef.key) {
      await set(ref(db, `users/${user.uid}/savedCoupons/${newRef.key}`), true);
      await set(ref(db, `users/${user.uid}/couponStates/${newRef.key}`), {
        status: 'active',
        updatedAt: Date.now(),
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 font-semibold">Connecting to your coupon vault...</p>
      </div>
    );
  }

  console.log('UID:', user.uid);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">💰CouponMaxxing</h1>
          {expiringSoonCount > 0 && (
            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              {expiringSoonCount}
            </div>
          )}
        </div>
      </header>

      {/* Alert Banner */}
      {expiringSoonCount > 0 && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <p className="text-orange-800 font-semibold">
              ⚠️ {expiringSoonCount} Coupon{expiringSoonCount > 1 ? 's' : ''} Expire in the Next 2 Days!
            </p>
            <button
              onClick={() => setActiveFilter('expiring-soon')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              VIEW
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-30">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Coupons
            </button>
            <button
              onClick={() => setActiveFilter('expiring-soon')}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'expiring-soon'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => {
                setActiveFilter('by-category');
                setSelectedCategory('all');
              }}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'by-category'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setActiveFilter('by-store')}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'by-store'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              By Store
            </button>
            <button
              onClick={() => setActiveFilter('used')}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'used'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ✓ Used ({usedCoupons.length})
            </button>
            <button
              onClick={() => setActiveFilter('expired')}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'expired'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ⏰ Expired ({expiredCoupons.length})
            </button>
            <button
              onClick={() => setActiveFilter('trash')}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeFilter === 'trash'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🗑️ Trash ({deletedCoupons.length})
            </button>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      {activeFilter === 'by-category' && (
        <div className="bg-gray-50 border-b p-4">
          <div className="max-w-4xl mx-auto">
            <label htmlFor="category-select" className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Category:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Trash Actions */}
      {activeFilter === 'trash' && deletedCoupons.length > 0 && (
        <div className="bg-gray-100 border-b p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <p className="text-gray-700">
              {deletedCoupons.length} item{deletedCoupons.length !== 1 ? 's' : ''} in trash
            </p>
            <button
              onClick={handleClearTrash}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Clear All Trash
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-24">
        <CouponList
          coupons={filteredCoupons}
          onCouponClick={setSelectedCoupon}
          isTrashView={activeFilter === 'trash'}
          isUsedView={activeFilter === 'used'}
        />
      </main>

      {/* Add Coupon Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full px-6 py-4 flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-colors z-30"
        aria-label="Add Coupon"
      >
        <span className="text-2xl leading-none">+</span>
        <span className="font-semibold">Add a Coupon</span>
      </button>

      {/* Modals */}
      {selectedCoupon && (
        <CouponDetailModal
          coupon={selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
          onMarkAsUsed={handleMarkAsUsed}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          isTrashView={activeFilter === 'trash'}
          isUsedView={activeFilter === 'used'}
        />
      )}

      {showAddForm && (
        <AddCouponForm
          onClose={() => setShowAddForm(false)}
          onAddCoupon={handleAddCoupon}
        />
      )}
    </div>
  );
}

export default App;
