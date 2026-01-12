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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {coupon.icon && <span className="text-3xl">{coupon.icon}</span>}
            <h2 className="text-2xl font-bold text-gray-800">{coupon.store}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Discount</p>
            <p className="text-lg text-gray-800">{coupon.discount}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-semibold">Expiration</p>
            <p className={`text-lg font-semibold ${expirationColor}`}>{expirationText}</p>
          </div>

          {coupon.category && (
            <div>
              <p className="text-sm text-gray-600 font-semibold">Category</p>
              <p className="text-lg text-gray-800">{coupon.category}</p>
            </div>
          )}

          {daysUntil <= 3 && daysUntil >= 0 && (
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
              <p className="text-orange-800 font-semibold">
                ⚠️ This coupon expires soon! Use it before it's too late.
              </p>
            </div>
          )}

          {daysUntil < 0 && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-red-800 font-semibold">
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
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Restore to Active
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => {
                  onPermanentDelete?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
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
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                ✓ Mark as Used
              </button>
              <button
                onClick={() => {
                  onDelete?.(coupon.id);
                  onClose();
                }}
                className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                🗑️ Move to Trash
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
