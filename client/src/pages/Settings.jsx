import { useState } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Button from '../components/ui/Button.jsx';
import Toggle from '../components/ui/Toggle.jsx';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    morningDigest: true,
    weeklyInsights: true,
    urgentAlerts: true
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-full">
      <TopBar title="Settings" />

      <div className="px-6 py-5 max-w-xl space-y-6 fade-in">
        {/* Notifications */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4E4E7]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Email Notifications</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#18181B]">Morning digest</div>
                <div className="text-xs text-[#71717A]">Daily 7:30am summary of pending content</div>
              </div>
              <Toggle
                checked={notifications.morningDigest}
                onChange={v => setNotifications(p => ({ ...p, morningDigest: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#18181B]">Weekly insights</div>
                <div className="text-xs text-[#71717A]">Monday performance summary</div>
              </div>
              <Toggle
                checked={notifications.weeklyInsights}
                onChange={v => setNotifications(p => ({ ...p, weeklyInsights: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#18181B]">Urgent alerts</div>
                <div className="text-xs text-[#71717A]">Notify when threads need immediate reply</div>
              </div>
              <Toggle
                checked={notifications.urgentAlerts}
                onChange={v => setNotifications(p => ({ ...p, urgentAlerts: v }))}
              />
            </div>
          </div>
        </div>

        {/* API Keys info */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4E4E7]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Integrations</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Claude AI', status: !!import.meta.env.VITE_CLAUDE_CONFIGURED, desc: 'Content generation' },
              { label: 'Adobe Firefly', status: false, desc: 'Image generation' },
              { label: 'Buffer', status: false, desc: 'Post scheduling' },
              { label: 'Resend', status: false, desc: 'Email delivery' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#18181B]">{item.label}</div>
                  <div className="text-xs text-[#71717A]">{item.desc}</div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${item.status ? 'text-[#22C55E]' : 'text-[#A1A1AA]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-[#22C55E]' : 'bg-[#A1A1AA]'}`} />
                  {item.status ? 'Configured' : 'Not configured'}
                </span>
              </div>
            ))}
            <p className="text-xs text-[#A1A1AA] pt-2">Configure API keys via environment variables on Railway.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>{saved ? '✓ Saved' : 'Save preferences'}</Button>
        </div>
      </div>
    </div>
  );
}
