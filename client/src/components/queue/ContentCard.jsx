import { useState } from 'react';
import { platformLabel, platformColor, urgencyColor, engagementStars, timeAgo } from '../../lib/utils.js';
import Button from '../ui/Button';
import EditModal from './EditModal.jsx';

export default function ContentCard({ item, onApprove, onSkip, onRegenerate, compact }) {
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState('');

  const urgency = urgencyColor(item.urgency);

  async function handleApprove() {
    setLoading('approve');
    await onApprove(item.id);
    setLoading('');
  }

  async function handleSkip() {
    setLoading('skip');
    await onSkip(item.id);
    setLoading('');
  }

  const platformDot = { color: platformColor(item.platform) };

  return (
    <>
      <div className={`bg-white border border-[#E4E4E7] rounded-xl shadow-sm hover:shadow-md hover:border-[#D4D4D8] transition-all duration-150 ${compact ? 'p-4' : 'p-5'}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {item.urgency === 'urgent' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF2F2] text-[#EF4444]">
                🔴 URGENT
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A]">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: platformColor(item.platform) }} />
              {platformLabel(item.platform)}
              {item.content_type !== 'reply' && ` · ${item.content_type}`}
            </span>
            {item.products?.name && (
              <span className="text-xs text-[#A1A1AA]">· {item.products.name}</span>
            )}
          </div>
          <div className="text-xs text-[#A1A1AA] whitespace-nowrap flex-shrink-0">
            {timeAgo(item.created_at)}
          </div>
        </div>

        {/* Thread context for Reddit replies */}
        {item.platform === 'reddit' && item.link && (
          <div className="mb-3 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs text-orange-700 font-medium">Thread:</p>
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="text-xs text-orange-600 hover:underline line-clamp-2 mt-0.5">
              {item.link}
            </a>
          </div>
        )}

        {/* Image preview for Pinterest */}
        {item.image_url && (
          <div className="mb-3">
            <img src={item.image_url} alt="Pin" className="w-16 h-16 object-cover rounded-lg" />
          </div>
        )}

        {/* Content body */}
        <div className="bg-[#F4F4F5] rounded-lg p-3 mb-3">
          <p className="text-sm text-[#18181B] leading-relaxed whitespace-pre-line">{item.body}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-[#71717A]">
            Predicted: <span className="text-[#F59E0B] tracking-tighter">{engagementStars(item.predicted_eng || 3)}</span>
          </span>
          {item.scheduled_for && (
            <span className="text-xs text-[#71717A]">
              Scheduled {new Date(item.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)} className="flex-1 text-[#71717A]">
            ✏️ Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onRegenerate(item.id)} className="flex-1 text-[#71717A]">
            🔄 Redo
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSkip} loading={loading === 'skip'} className="flex-1">
            ✗ Skip
          </Button>
          <Button variant="success" size="sm" onClick={handleApprove} loading={loading === 'approve'} className="flex-1">
            ✓ Approve
          </Button>
        </div>
      </div>

      <EditModal
        open={showEdit}
        item={item}
        onClose={() => setShowEdit(false)}
        onSave={async (body) => {
          await onApprove(item.id, body);
          setShowEdit(false);
        }}
        onRegenerate={onRegenerate}
      />
    </>
  );
}
