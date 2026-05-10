import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { platformLabel, platformColor, engagementStars } from '../../lib/utils';

export default function SwipeCard({ item, onApprove, onSkip, onTap }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -80, 0, 80, 200], [0, 1, 1, 1, 0]);

  const approveOpacity = useTransform(x, [20, 80], [0, 1]);
  const skipOpacity = useTransform(x, [-80, -20], [1, 0]);

  async function handleDragEnd(event, info) {
    const { offset } = info;
    if (offset.x > 100) {
      await animate(x, 500, { duration: 0.2 });
      onApprove(item.id);
    } else if (offset.x < -100) {
      await animate(x, -500, { duration: 0.2 });
      onSkip(item.id);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  }

  return (
    <div className="relative h-full flex items-center justify-center">
      {/* Approve hint */}
      <motion.div
        style={{ opacity: approveOpacity }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="bg-[#22C55E] text-white font-bold text-lg px-4 py-2 rounded-lg rotate-[-20deg] border-2 border-white shadow-lg">
          APPROVE
        </div>
      </motion.div>

      {/* Skip hint */}
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="bg-[#EF4444] text-white font-bold text-lg px-4 py-2 rounded-lg rotate-[20deg] border-2 border-white shadow-lg">
          SKIP
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        onClick={onTap}
        className="bg-white border border-[#E4E4E7] rounded-2xl shadow-lg p-6 w-full max-w-sm cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 mb-4">
          {item.urgency === 'urgent' && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FEF2F2] text-[#EF4444]">🔴 URGENT</span>
          )}
          <span className="text-xs font-medium text-[#71717A] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColor(item.platform) }} />
            {platformLabel(item.platform)}
          </span>
        </div>

        {item.image_url && (
          <img src={item.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />
        )}

        <p className="text-sm text-[#18181B] leading-relaxed mb-4 line-clamp-5">{item.body}</p>

        <div className="flex items-center justify-between text-xs text-[#71717A]">
          <span>{engagementStars(item.predicted_eng || 3)}</span>
          <span>← skip · approve →</span>
        </div>
      </motion.div>
    </div>
  );
}
