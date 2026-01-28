import { useState } from 'react';
import type { Coupon } from './types';

interface AddCouponFormProps {
  onClose: () => void;
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'status'>, shareGlobally: boolean) => void;
}

export default function AddCouponForm({ onClose, onAddCoupon }: AddCouponFormProps) {
  const [store, setStore] = useState('');
  const [discount, setDiscount] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [category, setCategory] = useState('');
  const [shareGlobally, setShareGlobally] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store || !discount || !expirationDate) {
      alert('Please fill in all required fields');
      return;
    }

    onAddCoupon(
      {
        store,
        discount,
        expirationDate,
        category: category || undefined,
      },
      shareGlobally
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-display text-slate-900">Add New Coupon</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="store" className="block text-sm font-semibold text-slate-700 mb-1">
              Store Name *
            </label>
            <input
              type="text"
              id="store"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Target, CVS, Pizza Hut"
              required
            />
          </div>

          <div>
            <label htmlFor="discount" className="block text-sm font-semibold text-slate-700 mb-1">
              Discount Details *
            </label>
            <input
              type="text"
              id="discount"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., $10 Off $50 Purchase"
              required
            />
          </div>

          <div>
            <label htmlFor="expirationDate" className="block text-sm font-semibold text-slate-700 mb-1">
              Expiration Date *
            </label>
            <input
              type="date"
              id="expirationDate"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1">
              Category (Optional)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">Select a category</option>
              <option value="Food">Food</option>
              <option value="Retail">Retail</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={shareGlobally}
              onChange={(e) => setShareGlobally(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Share to global catalog so others can see it
          </label>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Add Coupon
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-800 py-3 px-4 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
