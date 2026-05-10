import { useNavigate } from 'react-router-dom';
import { platformColor } from '../../lib/utils';
import Button from '../ui/Button';

const PLATFORM_ICONS = {
  reddit: '🔴',
  pinterest: '📌',
  email: '✉️',
  facebook: '👥',
  twitter: '🐦',
  blog: '📝'
};

export default function ProductCard({ product, queueCount = {}, weekMetrics = {}, platforms = [] }) {
  const navigate = useNavigate();

  const pending = queueCount.total || 0;
  const urgent = queueCount.urgent || 0;

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm hover:shadow-md hover:border-[#D4D4D8] transition-all duration-150 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[#18181B]">{product.name}</h3>
          <a href={product.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#71717A] hover:text-[#6366F1] transition-colors truncate block max-w-[200px]">
            {product.url}
          </a>
        </div>
        <button
          onClick={() => navigate(`/products/${product.id}/edit`)}
          className="text-xs text-[#71717A] hover:text-[#18181B] px-2 py-1 rounded hover:bg-[#F4F4F5] transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Pending', value: pending, color: pending > 0 ? '#F59E0B' : '#71717A' },
          { label: 'Clicks', value: weekMetrics.clicks || 0, color: '#18181B' },
          { label: 'Signups', value: weekMetrics.signups || 0, color: '#22C55E' },
          { label: 'MRR', value: `$${weekMetrics.mrr || 0}`, color: '#22C55E' }
        ].map(m => (
          <div key={m.label} className="text-center">
            <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs text-[#A1A1AA]">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Platform dots */}
      {platforms.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {platforms.map(p => (
            <span key={p.id} title={p.platform}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#F4F4F5] text-[#71717A]">
              {PLATFORM_ICONS[p.platform] || '•'} {p.platform}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => navigate('/queue')} className="flex-1">
          Review Queue {pending > 0 && `(${pending})`}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/analytics/${product.id}`)}>
          Analytics
        </Button>
      </div>
    </div>
  );
}
