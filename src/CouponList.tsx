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
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg font-semibold text-slate-700">
          {isTrashView ? 'Trash is empty' : isUsedView ? 'No used coupons yet' : 'No coupons found'}
        </p>
        <p className="text-sm mt-2 text-slate-500">
          {isTrashView ? 'Deleted coupons will appear here' : isUsedView ? 'Coupons you mark as used will appear here' : 'Add a new coupon to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {coupons.map((coupon) => {
        const daysUntil = getDaysUntilExpiration(coupon.expirationDate);
        const expirationColor = getExpirationColor(daysUntil);
        const bgColor = getExpirationBgColor(daysUntil);
        const expirationText = formatExpirationDate(coupon.expirationDate, daysUntil);

        return (
          <div
            key={coupon.id}
            onClick={() => onCouponClick(coupon)}
            className={`${bgColor} border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm ${isTrashView || isUsedView ? 'opacity-75' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {coupon.icon && <span className="text-2xl">{coupon.icon}</span>}
                  <h3 className="font-semibold text-lg text-slate-900">{coupon.store}</h3>
                  {coupon.source && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        coupon.source === 'global'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {coupon.source === 'global' ? 'Global' : 'Private'}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 mt-1">{coupon.discount}</p>
                <p className={`${expirationColor} text-sm mt-2 font-semibold`}>
                  {expirationText}
                </p>
              </div>
              {daysUntil < 0 && (
                <div className="ml-2">
                  <span className="bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    EXPIRED
                  </span>
                </div>
              )}
              {daysUntil >= 0 && daysUntil <= 1 && (
                <div className="ml-2">
                  <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
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
