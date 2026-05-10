import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Home', icon: '◈', exact: true },
  { to: '/queue', label: 'Queue', icon: '✓' },
  { to: '/analytics', label: 'Stats', icon: '↗' },
  { to: '/products', label: 'Products', icon: '⬡' },
  { to: '/settings', label: 'Settings', icon: '⚙' }
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E4E4E7] z-20 flex">
      {NAV.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors ${
              isActive ? 'text-[#6366F1]' : 'text-[#71717A]'
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
