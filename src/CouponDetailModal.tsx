import type { Coupon } from './types';
import { getDaysUntilExpiration, getExpirationColor, formatExpirationDate } from './couponUtils';

interface CouponDetailModalProps {
  coupon: Coupon | null;
  onClose: () => void;
  onMarkAsUsed: (couponId: string) => void;
  onDelete?: (couponId: string) => void;
  onRestore?: (couponId: string) => void;
  onPermanentDelete?: (couponId: string) => void;
  isTrashView?: boolean;
  isUsedView?: boolean;
}

export default function CouponDetailModal({ coupon, onClose, onMarkAsUsed, onDelete, onRestore, onPermanentDelete, isTrashView = false, isUsedView = false }: CouponDetailModalProps) {
  if (!coupon) return null;

  const daysUntil = getDaysUntilExpiration(coupon.expirationDate);
  const expirationColor = getExpirationColor(daysUntil);
  const expirationText = formatExpirationDate(coupon.expirationDate, daysUntil);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {coupon.icon && <span className="text-3xl">{coupon.icon}</span>}
            <h2 className="text-2xl font-display text-slate-900">{coupon.store}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 font-semibold">Discount</p>
            <p className="text-lg text-slate-800">{coupon.discount}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 font-semibold">Expiration</p>
            <p className={`text-lg font-semibold ${expirationColor}`}>{expirationText}</p>
          </div>

          {coupon.category && (
            <div>
              <p className="text-sm text-slate-600 font-semibold">Category</p>
              <p className="text-lg text-slate-800">{coupon.category}</p>
            </div>
          )}

          {daysUntil <= 3 && daysUntil >= 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-800 font-semibold">
                ⚠️ This coupon expires soon! Use it before it's too late.
              </p>
            </div>
          )}

          {daysUntil < 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-rose-800 font-semibold">
                ❌ This coupon has expired.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {isUsedView ? (
            <>
              <button
                onClick={() => {
                  onRestore?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Restore to Active
              </button>
              <button
                onClick={() => {
                  onDelete?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-amber-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                Move to Trash
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-800 py-3 px-4 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </>
          ) : isTrashView ? (
            <>
              <button
                onClick={() => {
                  onRestore?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => {
                  onPermanentDelete?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-rose-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-rose-700 transition-colors"
              >
                Delete Forever
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (window.confirm('Mark this coupon as used?')) {
                    onMarkAsUsed(coupon.id);
                    alert('✓ Coupon marked as used!');
                    onClose();
                  }
                }}
                className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                ✓ Mark as Used
              </button>
              <button
                onClick={() => {
                  onDelete?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-amber-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                🗑️ Move to Trash
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-800 py-3 px-4 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
