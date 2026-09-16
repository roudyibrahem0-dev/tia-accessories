'use client';

import { getProductFinalPrice, money } from '@/lib/pricing';
import type { Coupon, Order, Product } from '@/lib/types';
import { Panel, StatCard, softCardClass } from './ui';

type Props = {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
};

export function OverviewTab({ products, orders, coupons }: Props) {
  const activeProducts = products.filter((p) => p.is_active !== false).length;
  const discounted = products.filter((p) => p.discount_active).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped' || o.status === 'pending_payment');
  const completed = orders.filter((o) => o.status === 'delivered' || o.status === 'paid');
  const revenue = completed.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const totalCostEstimate = products.reduce(
    (sum, p) => sum + Number(p.cost || 0) * Number(p.stock_qty || 0),
    0,
  );
  const activeCoupons = coupons.filter((c) => c.active).length;

  const recentOrders = orders.slice(0, 5);
  const topDiscounted = products
    .filter((p) => p.discount_active)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="القطع الظاهرة" value={activeProducts} hint={`من أصل ${products.length}`} />
        <StatCard label="طلبات قيد التنفيذ" value={pendingOrders.length} hint="طلبات قيد التجهيز أو الدفع" />
        <StatCard label="إيراد المكتمل" value={money(revenue)} hint={`${completed.length} طلب مكتمل`} />
        <StatCard
          label="القطع المتوفرة"
          value={products.reduce((sum, product) => sum + Number(product.stock_qty || 0), 0)}
          hint={`قيمة بضاعة: ${money(totalCostEstimate)}`}
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="عروض خصم نشطة على القطع" value={discounted} />
        <StatCard label="أكواد خصم مفعّلة" value={activeCoupons} />
        <StatCard label="إجمالي الطلبات" value={orders.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="آخر الطلبات">
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className={`${softCardClass} flex items-center justify-between gap-3 px-3 py-2.5 text-sm`}
              >
                <div>
                  <p className="font-semibold">#{o.id} · {o.customer_phone}</p>
                  <p className="text-xs text-muted">{o.customer_location}</p>
                </div>
                <div className="text-end">
                  <p className="font-bold text-copper-bright">{money(Number(o.total_price || 0))}</p>
                  <p className="text-xs text-muted">{o.status}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 ? <p className="text-sm text-muted">لا طلبات بعد.</p> : null}
          </div>
        </Panel>

        <Panel title="قطع عليها خصم للزبون">
          <div className="space-y-3">
            {topDiscounted.map((p) => (
              <div
                key={p.id}
                className={`${softCardClass} flex items-center justify-between gap-3 px-3 py-2.5 text-sm`}
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">
                    {p.discount_type === 'percent'
                      ? `${p.discount_value}%`
                      : money(Number(p.discount_value || 0))}{' '}
                    خصم
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted line-through">{money(Number(p.price))}</p>
                  <p className="font-bold text-copper-bright">{money(getProductFinalPrice(p))}</p>
                </div>
              </div>
            ))}
            {topDiscounted.length === 0 ? (
              <p className="text-sm text-muted">لا يوجد خصم على القطع حالياً.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
