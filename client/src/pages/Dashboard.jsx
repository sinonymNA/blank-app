import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getQueueCount, getPlatforms, getAnalytics } from '../lib/api.js';
import { formatMoney, timeAgo } from '../lib/utils.js';
import Button from '../components/ui/Button.jsx';
import ProductCard from '../components/products/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [platforms, setPlatforms] = useState({});
  const [queueCounts, setQueueCounts] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const prods = await getProducts();
        setProducts(prods);

        const [counts, ...rest] = await Promise.all([
          getQueueCount(),
          ...prods.map(p => getPlatforms(p.id)),
          ...prods.map(p => getAnalytics(p.id, '7').catch(() => null))
        ]);

        setQueueCounts(counts);

        const platMap = {};
        const analyticsMap = {};
        prods.forEach((p, i) => {
          platMap[p.id] = rest[i];
          const an = rest[prods.length + i];
          if (an) {
            analyticsMap[p.id] = {
              clicks: an.summary?.total_clicks || 0,
              signups: an.summary?.signups || 0,
              mrr: an.summary?.mrr_added?.toFixed(0) || 0
            };
          }
        });
        setPlatforms(platMap);
        setAnalytics(analyticsMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPending = Object.values(queueCounts).reduce((s, c) => s + (c.total || 0), 0);
  const totalUrgent = Object.values(queueCounts).reduce((s, c) => s + (c.urgent || 0), 0);

  const weekTotals = Object.values(analytics).reduce((acc, a) => ({
    clicks: acc.clicks + (a.clicks || 0),
    signups: acc.signups + (a.signups || 0),
    mrr: acc.mrr + parseFloat(a.mrr || 0)
  }), { clicks: 0, signups: 0, mrr: 0 });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="px-6 py-5 border-b border-[#E4E4E7] bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#18181B]">{GREETING()}</h1>
            <p className="text-sm text-[#71717A] mt-0.5">{today}</p>
          </div>
          {totalPending > 0 && (
            <Button onClick={() => navigate('/queue')}>
              Review Queue ({totalPending}) →
            </Button>
          )}
        </div>

        {totalPending > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF2FF] rounded-lg">
              <span className="text-[#6366F1] font-bold text-lg">{totalPending}</span>
              <span className="text-sm text-[#71717A]">posts ready for approval</span>
            </div>
            {totalUrgent > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#FFFBEB] rounded-lg">
                <span className="text-[#F59E0B]">⚠️</span>
                <span className="text-sm text-[#71717A]">{totalUrgent} urgent</span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="px-6 py-8">
          <EmptyState
            icon="⬡"
            title="Welcome to Ampere"
            description="Add your first product and Ampere will start monitoring Reddit, generating content, and building your audience automatically."
            action={() => navigate('/products/new')}
            actionLabel="Add your first product →"
          />
        </div>
      ) : (
        <div className="px-6 py-5 space-y-6 fade-in">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'This week clicks', value: weekTotals.clicks.toLocaleString() },
              { label: 'New signups', value: weekTotals.signups },
              { label: 'MRR added', value: formatMoney(weekTotals.mrr) }
            ].map(m => (
              <div key={m.label} className="bg-white border border-[#E4E4E7] rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-[#18181B]">{m.value}</div>
                <div className="text-xs text-[#71717A] mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Products grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Your Products</span>
              <button onClick={() => navigate('/products/new')} className="text-xs text-[#6366F1] hover:underline">
                + Add product
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  queueCount={queueCounts[p.id] || {}}
                  weekMetrics={analytics[p.id] || {}}
                  platforms={platforms[p.id] || []}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
