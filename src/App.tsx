import { useEffect, useMemo, useRef, useState } from 'react';
import type { Coupon, FilterType } from './types';
import { getDaysUntilExpiration, getExpiringSoonCount, getStoreIcon } from './couponUtils';
import CouponList from './CouponList';
import CouponDetailModal from './CouponDetailModal';
import AddCouponForm from './AddCouponForm';
import Login from './Login';
import { onValue, push, ref, remove, set } from 'firebase/database';
import { db } from './firebase';
import { useAuthUser } from './useAuthUser';

type CouponState = {
  status: Coupon['status'];
  updatedAt: number;
  hidden?: boolean;
  previousStatus?: 'active' | 'used';
};

type CouponData = Omit<Coupon, 'id' | 'status'> & {
  createdAt?: number;
};

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuthUser();
  const [couponsById, setCouponsById] = useState<Record<string, CouponData>>({});
  const [userCouponsById, setUserCouponsById] = useState<Record<string, CouponData>>({});
  const [couponStates, setCouponStates] = useState<Record<string, CouponState>>({});
  const [savedCoupons, setSavedCoupons] = useState<Record<string, boolean> | null>(null);
  const [loadedFlags, setLoadedFlags] = useState({
    globalCoupons: false,
    userCoupons: false,
    saved: false,
    states: false,
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [storeQuery, setStoreQuery] = useState<string>('');
  const seededSavedCoupons = useRef(false);
  const TRASH_AUTO_DELETE_MS = 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!user) {
      setCouponStates({});
      setSavedCoupons(null);
      setUserCouponsById({});
      setCouponsById({});
      seededSavedCoupons.current = false;
      setSyncError(null);
      setLoadedFlags({
        globalCoupons: false,
        userCoupons: false,
        saved: false,
        states: false,
      });
      return;
    }

    setLoadedFlags((prev) => ({
      ...prev,
      globalCoupons: false,
      userCoupons: false,
      saved: false,
      states: false,
    }));

    const couponsRef = ref(db, 'coupons');
    const savedRef = ref(db, `users/${user.uid}/savedCoupons`);
    const statesRef = ref(db, `users/${user.uid}/couponStates`);
    const userCouponsRef = ref(db, `users/${user.uid}/coupons`);

    const unsubGlobal = onValue(
      couponsRef,
      (snapshot) => {
        setCouponsById(snapshot.val() ?? {});
        setLoadedFlags((prev) => ({ ...prev, globalCoupons: true }));
        setSyncError(null);
      },
      (error) => {
        console.error('Failed to load global coupons:', error);
        setSyncError('Could not load global coupons. Check your Firebase rules/connection.');
      }
    );

    const unsubSaved = onValue(
      savedRef,
      (snapshot) => {
        const data = snapshot.val();
        setSavedCoupons(data ?? null);
        setLoadedFlags((prev) => ({ ...prev, saved: true }));
        setSyncError(null);
      },
      (error) => {
        console.error('Failed to load saved coupons:', error);
        setSyncError('Could not load your saved coupons. Check your Firebase rules/connection.');
      }
    );

    const unsubStates = onValue(
      statesRef,
      (snapshot) => {
        setCouponStates(snapshot.val() ?? {});
        setLoadedFlags((prev) => ({ ...prev, states: true }));
        setSyncError(null);
      },
      (error) => {
        console.error('Failed to load coupon states:', error);
        setSyncError('Could not load your coupon states. Check your Firebase rules/connection.');
      }
    );

    const unsubUserCoupons = onValue(
      userCouponsRef,
      (snapshot) => {
        setUserCouponsById(snapshot.val() ?? {});
        setLoadedFlags((prev) => ({ ...prev, userCoupons: true }));
        setSyncError(null);
      },
      (error) => {
        console.error('Failed to load user coupons:', error);
        setSyncError('Could not load your personal coupons. Check your Firebase rules/connection.');
      }
    );

    return () => {
      unsubGlobal();
      unsubSaved();
      unsubStates();
      unsubUserCoupons();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const globalIds = Object.keys(couponsById);
    const userIds = Object.keys(userCouponsById);
    const allIds = [...globalIds, ...userIds];
    if (allIds.length === 0) return;

    if (savedCoupons === null && !seededSavedCoupons.current) {
      const seed: Record<string, boolean> = {};
      allIds.forEach((id) => {
        seed[id] = true;
      });
      seededSavedCoupons.current = true;
      void set(ref(db, `users/${user.uid}/savedCoupons`), seed);
      return;
    }

    if (savedCoupons) {
      const missing = allIds.filter((id) => savedCoupons[id] !== true && !couponStates[id]?.hidden);
      if (missing.length > 0) {
        const next = { ...savedCoupons };
        missing.forEach((id) => {
          next[id] = true;
        });
        void set(ref(db, `users/${user.uid}/savedCoupons`), next);
      }
    }
  }, [user, couponsById, userCouponsById, savedCoupons, couponStates]);

  useEffect(() => {
    if (!user || !savedCoupons) {
      return;
    }

    Object.entries(savedCoupons).forEach(([couponId, isSaved]) => {
      if (!isSaved) return;
      if (couponStates[couponId]?.hidden) return;
      const data = couponsById[couponId] ?? userCouponsById[couponId];
      if (!data) return;
      const daysUntil = getDaysUntilExpiration(data.expirationDate);
      if (daysUntil >= 0) return;
      const currentStatus = couponStates[couponId]?.status ?? 'active';
      if (currentStatus !== 'active') return;
      const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
      setCouponStates((prev) => ({
        ...prev,
        [couponId]: { status: 'deleted', updatedAt: Date.now() },
      }));
      void set(stateRef, { status: 'deleted', updatedAt: Date.now() });
    });
  }, [user, savedCoupons, couponsById, userCouponsById, couponStates]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const now = Date.now();
    Object.entries(couponStates).forEach(([couponId, state]) => {
      if (state.status !== 'deleted') return;
      if (state.hidden) return;
      const data = couponsById[couponId] ?? userCouponsById[couponId];
      if (data) {
        const daysUntil = getDaysUntilExpiration(data.expirationDate);
        if (daysUntil < 0) {
          const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
          const savedRef = ref(db, `users/${user.uid}/savedCoupons/${couponId}`);
          setCouponStates((prev) => ({
            ...prev,
            [couponId]: { status: 'deleted', updatedAt: Date.now(), hidden: true },
          }));
          setSavedCoupons((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            delete next[couponId];
            return next;
          });
          void set(stateRef, { status: 'deleted', updatedAt: Date.now(), hidden: true });
          void remove(savedRef);
          return;
        }
      }
      if (now - state.updatedAt < TRASH_AUTO_DELETE_MS) return;
      const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
      const savedRef = ref(db, `users/${user.uid}/savedCoupons/${couponId}`);
      void remove(stateRef);
      void remove(savedRef);
    });
  }, [user, couponStates, couponsById, userCouponsById]);

  const coupons = useMemo(() => {
    const globalCoupons = Object.entries(couponsById).map(([id, data]) => {
      const state = couponStates[id];
      return {
        id,
        status: state?.status ?? 'active',
        source: 'global',
        ...data,
      } as Coupon;
    });

    const personalCoupons = Object.entries(userCouponsById).map(([id, data]) => {
      const state = couponStates[id];
      return {
        id,
        status: state?.status ?? 'active',
        source: 'personal',
        ...data,
      } as Coupon;
    });

    const allCoupons = [...globalCoupons, ...personalCoupons];

    if (savedCoupons) {
      return allCoupons.filter(
        (coupon) => savedCoupons[coupon.id] !== false && !couponStates[coupon.id]?.hidden
      );
    }

    return allCoupons.filter((coupon) => !couponStates[coupon.id]?.hidden);
  }, [couponsById, userCouponsById, couponStates, savedCoupons]);

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

  const stores = useMemo(() => {
    // Normalize store names and group similar ones
    const storeMap = new Map<string, string>();
    
    activeCoupons.forEach(coupon => {
      if (!coupon.store) return;
      const normalized = coupon.store.trim().toLowerCase();
      
      // If we haven't seen this normalized version, or if the current one is better capitalized
      if (!storeMap.has(normalized)) {
        storeMap.set(normalized, coupon.store.trim());
      } else {
        const existing = storeMap.get(normalized)!;
        // Prefer properly capitalized versions (first letter uppercase)
        if (coupon.store[0] === coupon.store[0].toUpperCase() && 
            existing[0] === existing[0].toLowerCase()) {
          storeMap.set(normalized, coupon.store.trim());
        }
      }
    });
    
    return Array.from(storeMap.values()).sort();
  }, [activeCoupons]);

  const filteredStores = useMemo(() => {
    const query = storeQuery.trim().toLowerCase();
    if (!query) return stores;
    return stores.filter((store) => store.trim().toLowerCase().includes(query));
  }, [stores, storeQuery]);

  useEffect(() => {
    if (activeFilter !== 'by-store') return;
    if (storeQuery.trim()) {
      setSelectedStore('all');
    }
  }, [activeFilter, storeQuery]);

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
        if (selectedStore !== 'all') {
          // Normalize both store names for comparison to match similar variations
          const normalizedSelected = selectedStore.trim().toLowerCase();
          filtered = filtered.filter(coupon => 
            coupon.store.trim().toLowerCase() === normalizedSelected
          );
        } else if (storeQuery.trim()) {
          const normalizedQuery = storeQuery.trim().toLowerCase();
          filtered = filtered.filter(coupon =>
            coupon.store.trim().toLowerCase().includes(normalizedQuery)
          );
        }
        break;
    }

    // Default sort by expiration date
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      return dateA - dateB;
    });
  }, [activeCoupons, activeFilter, selectedCategory, selectedStore, storeQuery, usedCoupons, deletedCoupons, expiredCoupons]);

  const setCouponStatus = async (couponId: string, status: Coupon['status']) => {
    if (!user) return;
    const prevState = couponStates[couponId];
    const prevSaved = savedCoupons?.[couponId];
    const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
    const savedRef = ref(db, `users/${user.uid}/savedCoupons/${couponId}`);
    const computedPrevStatus: 'active' | 'used' =
      prevState?.status === 'used' ? 'used' : 'active';
    const nextState: CouponState = {
      status,
      updatedAt: Date.now(),
      ...(status === 'deleted' ? { previousStatus: computedPrevStatus } : {}),
    };
    setCouponStates((prev) => ({
      ...prev,
      [couponId]: nextState,
    }));
    setSavedCoupons((prev) => ({ ...(prev ?? {}), [couponId]: true }));
    try {
      await set(savedRef, true);
      if (status === 'deleted') {
        await set(stateRef, {
          status,
          updatedAt: Date.now(),
          previousStatus: computedPrevStatus,
        });
      } else {
        await set(stateRef, { status, updatedAt: Date.now() });
      }
    } catch (error) {
      console.error('Failed to update coupon status:', error);
      setCouponStates((prev) => {
        const next = { ...prev };
        if (prevState) {
          next[couponId] = prevState;
        } else {
          delete next[couponId];
        }
        return next;
      });
      setSavedCoupons((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (prevSaved === undefined) {
          delete next[couponId];
        } else {
          next[couponId] = prevSaved;
        }
        return next;
      });
      alert('Could not save changes. Please check your connection and try again.');
    }
  };

  const handleMarkAsUsed = (couponId: string) => {
    void setCouponStatus(couponId, 'used');
  };

  const handleDelete = (couponId: string) => {
    void setCouponStatus(couponId, 'deleted');
  };

  const handleRestore = (couponId: string) => {
    const prevStatus = couponStates[couponId]?.previousStatus;
    const restoredStatus: Coupon['status'] = prevStatus === 'used' ? 'used' : 'active';
    setCouponStates((prev) => ({
      ...prev,
      [couponId]: { status: restoredStatus, updatedAt: Date.now(), hidden: false },
    }));
    setSavedCoupons((prev) => ({ ...(prev ?? {}), [couponId]: true }));
    void setCouponStatus(couponId, restoredStatus);
  };

  const handleClearTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in trash?')) {
      if (!user) return;
      setCouponStates((prev) => {
        const next = { ...prev };
        deletedCoupons.forEach((coupon) => {
          next[coupon.id] = { status: 'deleted', updatedAt: Date.now(), hidden: true };
        });
        return next;
      });
      setSavedCoupons((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        deletedCoupons.forEach((coupon) => {
          delete next[coupon.id];
        });
        return next;
      });
      deletedCoupons.forEach((coupon) => {
        const stateRef = ref(db, `users/${user.uid}/couponStates/${coupon.id}`);
        const savedRef = ref(db, `users/${user.uid}/savedCoupons/${coupon.id}`);
        void set(stateRef, { status: 'deleted', updatedAt: Date.now(), hidden: true });
        void remove(savedRef);
      });
    }
  };

  const handlePermanentDelete = (couponId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this coupon?')) {
      if (!user) return;
      setCouponStates((prev) => ({
        ...prev,
        [couponId]: { status: 'deleted', updatedAt: Date.now(), hidden: true },
      }));
      setSavedCoupons((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[couponId];
        return next;
      });
      const stateRef = ref(db, `users/${user.uid}/couponStates/${couponId}`);
      void set(stateRef, { status: 'deleted', updatedAt: Date.now(), hidden: true });
    }
  };

  const handleAddCoupon = async (newCoupon: Omit<Coupon, 'id' | 'status'>, shareGlobally: boolean) => {
    if (!user) return;
    const couponsRef = shareGlobally
      ? ref(db, 'coupons')
      : ref(db, `users/${user.uid}/coupons`);
    const newRef = push(couponsRef);
    const couponData: CouponData = {
      ...newCoupon,
      icon: newCoupon.icon || getStoreIcon(newCoupon.store, newCoupon.category),
      createdAt: Date.now(),
    };
    await set(newRef, couponData);
    if (newRef.key) {
      if (shareGlobally) {
        setCouponsById((prev) => ({ ...prev, [newRef.key as string]: couponData }));
      } else {
        setUserCouponsById((prev) => ({ ...prev, [newRef.key as string]: couponData }));
      }
      setSavedCoupons((prev) => ({ ...(prev ?? {}), [newRef.key as string]: true }));
      setCouponStates((prev) => ({
        ...prev,
        [newRef.key as string]: { status: 'active', updatedAt: Date.now() },
      }));
      await set(ref(db, `users/${user.uid}/savedCoupons/${newRef.key}`), true);
      await set(ref(db, `users/${user.uid}/couponStates/${newRef.key}`), {
        status: 'active',
        updatedAt: Date.now(),
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 font-semibold">Loading...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login onSignIn={signInWithGoogle} />;
  }

  const tabClass = (isActive: boolean) =>
    `px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-all border ${
      isActive
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200/60'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
    }`;

  const dataReady =
    loadedFlags.globalCoupons &&
    loadedFlags.userCoupons &&
    loadedFlags.saved &&
    loadedFlags.states;

  const usedCountLabel = dataReady ? usedCoupons.length : '—';
  const expiredCountLabel = dataReady ? expiredCoupons.length : '—';
  const trashCountLabel = dataReady ? deletedCoupons.length : '—';

  return (
    <div className="h-screen flex flex-col overflow-hidden text-slate-900">
      {/* Header */}
      <header className="bg-slate-950/90 backdrop-blur text-white shadow-xl z-40 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-4 justify-between items-center px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-lg">
              💰
            </div>
            <div>
              <h1 className="text-2xl font-display tracking-tight">CouponMaxxing</h1>
              <p className="text-xs text-emerald-200/90">Smart coupon tracking for real savings</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {dataReady && expiringSoonCount > 0 && (
              <div className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-sm">
                {expiringSoonCount}
              </div>
            )}
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border-2 border-white/80 shadow-sm"
                />
              )}
              <button
                onClick={signOut}
                className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200 z-30 shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={tabClass(activeFilter === 'all')}
            >
              All Coupons
            </button>
            <button
              onClick={() => setActiveFilter('expiring-soon')}
              className={tabClass(activeFilter === 'expiring-soon')}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => {
                setActiveFilter('by-category');
                setSelectedCategory('all');
              }}
              className={tabClass(activeFilter === 'by-category')}
            >
              By Category
            </button>
            <button
              onClick={() => {
                setActiveFilter('by-store');
                setSelectedStore('all');
                setStoreQuery('');
              }}
              className={tabClass(activeFilter === 'by-store')}
            >
              By Store
            </button>
            <button
              onClick={() => setActiveFilter('used')}
              className={tabClass(activeFilter === 'used')}
            >
              ✓ Used ({usedCountLabel})
            </button>
            <button
              onClick={() => setActiveFilter('expired')}
              className={tabClass(activeFilter === 'expired')}
            >
              ⏰ Expired ({expiredCountLabel})
            </button>
            <button
              onClick={() => setActiveFilter('trash')}
              className={tabClass(activeFilter === 'trash')}
            >
              🗑️ Trash ({trashCountLabel})
            </button>
          </div>
        </div>
        {!dataReady && (
          <div className="border-t border-slate-200 bg-slate-50">
            <div className="max-w-5xl mx-auto px-4 py-2 text-xs text-slate-600 font-semibold">
              Syncing your data…
              {syncError && <span className="text-rose-600"> {syncError}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Alert Banner */}
        {dataReady && expiringSoonCount > 0 && (
          <div className="px-4 pt-4">
            <div className="max-w-5xl mx-auto">
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-rose-50 to-white p-4 shadow-lg">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-amber-700 font-semibold">Expiring Soon</p>
                    <p className="text-amber-900 font-semibold text-lg">
                      {expiringSoonCount} coupon{expiringSoonCount > 1 ? 's' : ''} expire in the next 2 days
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveFilter('expiring-soon')}
                    className="bg-amber-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    View List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Selector */}
        {activeFilter === 'by-category' && (
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="max-w-5xl mx-auto">
              <label htmlFor="category-select" className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Category
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Store Selector */}
        {activeFilter === 'by-store' && (
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="max-w-5xl mx-auto space-y-3">
              <label htmlFor="store-search" className="block text-sm font-semibold text-slate-700">
                Search Stores
              </label>
              <div className="relative">
                <input
                  id="store-search"
                  type="text"
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  placeholder="Type a store name..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                {storeQuery.trim() === '' && (
                  <button
                    onClick={() => setSelectedStore('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      selectedStore === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Stores
                  </button>
                )}
                {filteredStores.map(store => (
                  <button
                    key={store}
                    onClick={() => setSelectedStore(store)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      selectedStore === store
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {store}
                  </button>
                ))}
                {filteredStores.length === 0 && (
                  <p className="text-sm text-slate-500">No stores match your search.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trash Actions */}
        {activeFilter === 'trash' && deletedCoupons.length > 0 && (
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="max-w-5xl mx-auto flex flex-wrap gap-3 justify-between items-center">
              <p className="text-slate-700">
                {deletedCoupons.length} item{deletedCoupons.length !== 1 ? 's' : ''} in trash
              </p>
              <button
                onClick={handleClearTrash}
                className="bg-rose-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-rose-700 transition-colors"
              >
                Clear All Trash
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-5xl mx-auto p-4 pb-28">
          <CouponList
            coupons={filteredCoupons}
            onCouponClick={setSelectedCoupon}
            isTrashView={activeFilter === 'trash'}
            isUsedView={activeFilter === 'used'}
          />
        </main>
      </div>

      {/* Add Coupon Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full px-6 py-4 flex items-center gap-2 shadow-xl hover:from-emerald-500 hover:to-teal-500 transition-colors z-30"
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
