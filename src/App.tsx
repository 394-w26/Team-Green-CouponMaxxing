import { useState, useMemo } from 'react';
import type { Coupon, FilterType } from './types';
import { initialCoupons, getDaysUntilExpiration, getExpiringSoonCount } from './couponUtils';
import CouponList from './CouponList';
import CouponDetailModal from './CouponDetailModal';
import AddCouponForm from './AddCouponForm';

function App() {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeCoupons = useMemo(() => 
    coupons.filter(c => c.status === 'active'), 
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

    let filtered = activeCoupons;

    switch (activeFilter) {
      case 'expiring-soon':
        filtered = filtered.filter(coupon => {
          const days = getDaysUntilExpiration(coupon.expirationDate);
          return days >= 0 && days <= 3;
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
  }, [activeCoupons, activeFilter, selectedCategory, usedCoupons, deletedCoupons]);

  const handleMarkAsUsed = (couponId: string) => {
    setCoupons(prev => 
      prev.map(c => c.id === couponId ? { ...c, status: 'used' as const } : c)
    );
  };

  const handleDelete = (couponId: string) => {
    setCoupons(prev => 
      prev.map(c => c.id === couponId ? { ...c, status: 'deleted' as const } : c)
    );
  };

  const handleRestore = (couponId: string) => {
    setCoupons(prev => 
      prev.map(c => c.id === couponId ? { ...c, status: 'active' as const } : c)
    );
  };

  const handleClearTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in trash?')) {
      setCoupons(prev => prev.filter(c => c.status !== 'deleted'));
    }
  };

  const handlePermanentDelete = (couponId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this coupon?')) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
  };

  const handleAddCoupon = (newCoupon: Omit<Coupon, 'id' | 'status'>) => {
    const coupon: Coupon = {
      ...newCoupon,
      id: Date.now().toString(),
      status: 'active',
    };
    setCoupons(prev => [...prev, coupon]);
  };

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
