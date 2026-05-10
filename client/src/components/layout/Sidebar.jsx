import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getQueueCount } from '../../lib/api.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◈', exact: true },
  { to: '/queue', label: 'Queue', icon: '✓', badge: true },
  { to: '/analytics', label: 'Analytics', icon: '↗' },
  { to: '/products', label: 'Products', icon: '⬡' },
  { to: '/platforms', label: 'Platforms', icon: '⊕' },
  { to: '/settings', label: 'Settings', icon: '⚙' }
];

export default function Sidebar() {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getQueueCount().then(counts => {
      const total = Object.values(counts).reduce((s, c) => s + (c.total || 0), 0);
      setPendingCount(total);
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <aside className="hidden md:flex flex-col w-56 h-full bg-[#18181B] text-white flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#6366F1] rounded-md flex items-center justify-center text-sm font-bold">A</div>
          <span className="font-bold text-base tracking-tight">Ampere</span>
        </div>
        <p className="text-xs text-white/40 mt-1">Marketing on autopilot</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white font-medium border-l-2 border-[#6366F1] pl-[10px]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </span>
            {item.badge && pendingCount > 0 && (
              <span className="bg-[#6366F1] text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
