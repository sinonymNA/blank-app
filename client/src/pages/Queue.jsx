import { useEffect, useState, useCallback } from 'react';
import { getQueue, approveItem, skipItem, editItem, regenerateItem, approveAll } from '../lib/api';
import TopBar from '../components/layout/TopBar';
import ContentCard from '../components/queue/ContentCard';
import SwipeCard from '../components/queue/SwipeCard';
import QueueEmpty from '../components/queue/QueueEmpty';
import Button from '../components/ui/Button';

const PLATFORMS = ['all', 'reddit', 'pinterest', 'email', 'facebook', 'blog'];

export default function Queue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mobileIndex, setMobileIndex] = useState(0);
  const [approvingAll, setApprovingAll] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { platform: filter } : {};
      const data = await getQueue(params);
      setItems(data);
      setMobileIndex(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id, editedBody) {
    if (editedBody) {
      await editItem(id, editedBody);
    } else {
      await approveItem(id);
    }
    setItems(prev => prev.filter(i => i.id !== id));
    if (isMobile) setMobileIndex(prev => Math.min(prev, items.length - 2));
  }

  async function handleSkip(id) {
    await skipItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (isMobile) setMobileIndex(prev => Math.min(prev, items.length - 2));
  }

  async function handleRegenerate(id, feedback) {
    try {
      const updated = await regenerateItem(id, feedback);
      setItems(prev => prev.map(i => i.id === id ? { ...i, body: updated.body } : i));
      return updated;
    } catch (e) {
      console.error(e);
    }
  }

  async function handleApproveAll() {
    setApprovingAll(true);
    try {
      const result = await approveAll();
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingAll(false);
    }
  }

  const urgentCount = items.filter(i => i.urgency === 'urgent').length;
  const byPlatform = PLATFORMS.reduce((acc, p) => {
    acc[p] = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
    return acc;
  }, {});

  const currentItem = isMobile && items[mobileIndex];

  return (
    <div className="min-h-full">
      <TopBar
        title="Approval Queue"
        subtitle={items.length > 0 ? `${items.length} items pending${urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}` : 'All clear'}
        action={items.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleApproveAll} loading={approvingAll}>
            ✓ Approve All Non-Urgent
          </Button>
        )}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 overflow-x-auto scrollbar-hide">
        {PLATFORMS.filter(p => byPlatform[p] > 0 || p === 'all').map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === p
                ? 'bg-[#6366F1] text-white'
                : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
            {byPlatform[p] > 0 && (
              <span className={`ml-1.5 text-xs ${filter === p ? 'text-white/80' : 'text-[#A1A1AA]'}`}>
                {byPlatform[p]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <QueueEmpty />
      ) : isMobile ? (
        // Mobile swipe view
        <div className="fixed inset-0 top-[120px] bottom-[64px] px-4 flex flex-col">
          <div className="text-center text-xs text-[#71717A] mb-4">
            {mobileIndex + 1} of {items.length}
          </div>
          {currentItem && (
            <div className="flex-1">
              <SwipeCard
                item={currentItem}
                onApprove={handleApprove}
                onSkip={handleSkip}
                onTap={() => {}}
              />
            </div>
          )}
        </div>
      ) : (
        // Desktop list view
        <div className="px-6 py-5 space-y-4 max-w-3xl fade-in">
          {items.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onSkip={handleSkip}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
