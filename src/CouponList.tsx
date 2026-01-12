import type { Coupon } from './types';
import { getDaysUntilExpiration, getExpirationColor, getExpirationBgColor, formatExpirationDate } from './couponUtils';

interface CouponListProps {
  coupons: Coupon[];
  onCouponClick: (coupon: Coupon) => void;
  isTrashView?: boolean;
  isUsedView?: boolean;
}

export default function CouponList({ coupons, onCouponClick, isTrashView = false, isUsedView = false }: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">
          {isTrashView ? 'Trash is empty' : isUsedView ? 'No used coupons yet' : 'No coupons found'}
        </p>
        <p className="text-sm mt-2">
          {isTrashView ? 'Deleted coupons will appear here' : isUsedView ? 'Coupons you mark as used will appear here' : 'Add a new coupon to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coupons.map((coupon) => {
        const daysUntil = getDaysUntilExpiration(coupon.expirationDate);
        const expirationColor = getExpirationColor(daysUntil);
        const bgColor = getExpirationBgColor(daysUntil);
        const expirationText = formatExpirationDate(coupon.expirationDate, daysUntil);

        return (
          <div
            key={coupon.id}
            onClick={() => onCouponClick(coupon)}
            className={`${bgColor} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${isTrashView || isUsedView ? 'opacity-75' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {coupon.icon && <span className="text-2xl">{coupon.icon}</span>}
                  <h3 className="font-bold text-lg text-gray-800">{coupon.store}</h3>
                </div>
                <p className="text-gray-700 mt-1">{coupon.discount}</p>
                <p className={`${expirationColor} text-sm mt-2 font-semibold`}>
                  {expirationText}
                </p>
              </div>
              {daysUntil < 0 && (
                <div className="ml-2">
                  <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    EXPIRED
                  </span>
                </div>
              )}
              {daysUntil >= 0 && daysUntil <= 1 && (
                <div className="ml-2">
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    URGENT
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
