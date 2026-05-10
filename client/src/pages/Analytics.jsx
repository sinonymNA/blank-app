import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProducts, getAnalytics, getBestContent } from '../lib/api';
import TopBar from '../components/layout/TopBar';
import MetricCard from '../components/analytics/MetricCard';
import FunnelChart from '../components/analytics/FunnelChart';
import PlatformBreakdown from '../components/analytics/PlatformBreakdown';
import ContentTable from '../components/analytics/ContentTable';

const RANGES = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: 'All time', value: '365' }
];

export default function Analytics() {
  const { productId: paramId } = useParams();
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(paramId || '');
  const [range, setRange] = useState('30');
  const [data, setData] = useState(null);
  const [bestContent, setBestContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then(p => {
      setProducts(p);
      if (!selectedId && p.length > 0) setSelectedId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([
      getAnalytics(selectedId, range),
      getBestContent(selectedId)
    ]).then(([analyticsData, best]) => {
      setData(analyticsData);
      setBestContent(best);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedId, range]);

  const summary = data?.summary || {};

  return (
    <div className="min-h-full">
      <TopBar
        title="Analytics"
        subtitle="Track your conversion funnel"
        action={
          <div className="flex items-center gap-2">
            {products.length > 1 && (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="text-sm border border-[#E4E4E7] rounded-lg px-3 py-1.5 outline-none focus:border-[#6366F1] bg-white"
              >
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
        }
      />

      {/* Range selector */}
      <div className="flex items-center gap-1 px-6 pt-4">
        {RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r.value ? 'bg-[#6366F1] text-white' : 'text-[#71717A] hover:bg-[#F4F4F5]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !selectedId ? (
        <div className="px-6 py-16 text-center text-[#71717A]">Add a product to see analytics</div>
      ) : (
        <div className="px-6 py-5 space-y-6 fade-in">
          {/* Hero metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Clicks" value={summary.total_clicks || 0} />
            <MetricCard label="Signups" value={summary.signups || 0} color="#22C55E" />
            <MetricCard label="Conversions" value={summary.conversions || 0} color="#6366F1" />
            <MetricCard label="MRR Added" value={`$${summary.mrr_added?.toFixed(0) || 0}`} color="#F59E0B" />
          </div>

          {/* Funnel */}
          <FunnelChart
            posts={summary.posts_published || 0}
            clicks={summary.total_clicks || 0}
            signups={summary.signups || 0}
            conversions={summary.conversions || 0}
          />

          {/* Platform breakdown */}
          <PlatformBreakdown data={data?.by_platform} />

          {/* Best content */}
          <ContentTable data={bestContent} />

          {/* Intelligence insights */}
          {data?.patterns?.length > 0 && (
            <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-4">Intelligence Insights</div>
              <div className="space-y-3">
                {data.patterns.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-start gap-3 p-3 bg-[#EEF2FF] rounded-lg">
                    <span className="text-[#6366F1] text-base mt-0.5">📊</span>
                    <div>
                      <div className="text-sm font-medium text-[#18181B]">{p.platform} performance</div>
                      <div className="text-xs text-[#71717A] mt-0.5">
                        Avg {p.avg_clicks?.toFixed(1)} clicks · {p.avg_signups?.toFixed(1)} signups per post
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
