import { useEffect, useState } from 'react';
import { getProducts, getPlatforms, connectPlatform, disconnectPlatform, testPlatform, getRedditMonitors, addRedditMonitor, removeRedditMonitor } from '../lib/api';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const PLATFORM_INFO = {
  reddit: { label: 'Reddit', icon: '🔴', description: 'Monitor subreddits and reply to threads' },
  pinterest: { label: 'Pinterest', icon: '📌', description: 'Post visual pins' },
  facebook: { label: 'Facebook', icon: '👥', description: 'Post in groups' },
  twitter: { label: 'Twitter/X', icon: '🐦', description: 'Short posts' },
  linkedin: { label: 'LinkedIn', icon: '💼', description: 'Professional posts' },
  email: { label: 'Email (Resend)', icon: '✉️', description: 'Automated email sequences' },
  blog: { label: 'Blog', icon: '📝', description: 'SEO content generation' }
};

export default function Platforms() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [connections, setConnections] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState(null);
  const [monitorModal, setMonitorModal] = useState(false);
  const [form, setForm] = useState({});
  const [monitorForm, setMonitorForm] = useState({ subreddit: '', keywords: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProducts().then(p => {
      setProducts(p);
      if (p.length > 0) setSelectedProduct(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setLoading(true);
    Promise.all([
      getPlatforms(selectedProduct),
      getRedditMonitors(selectedProduct).catch(() => [])
    ]).then(([conns, mons]) => {
      setConnections(conns);
      setMonitors(mons);
    }).finally(() => setLoading(false));
  }, [selectedProduct]);

  const connectedPlatforms = connections.map(c => c.platform);

  async function handleConnect() {
    setSaving(true);
    try {
      await connectPlatform({
        product_id: selectedProduct,
        platform: connectModal,
        credentials: form,
        posting_freq: 'daily'
      });
      const updated = await getPlatforms(selectedProduct);
      setConnections(updated);
      setConnectModal(null);
      setForm({});
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(id) {
    await disconnectPlatform(id);
    setConnections(prev => prev.filter(c => c.id !== id));
  }

  async function handleAddMonitor() {
    setSaving(true);
    try {
      const keywords = monitorForm.keywords.split(',').map(k => k.trim()).filter(Boolean);
      await addRedditMonitor({
        product_id: selectedProduct,
        subreddit: monitorForm.subreddit.replace(/^r\//, ''),
        keywords
      });
      const updated = await getRedditMonitors(selectedProduct);
      setMonitors(updated);
      setMonitorModal(false);
      setMonitorForm({ subreddit: '', keywords: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMonitor(id) {
    await removeRedditMonitor(id);
    setMonitors(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="min-h-full">
      <TopBar
        title="Platforms"
        subtitle="Connect and manage your posting channels"
        action={products.length > 1 && (
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="text-sm border border-[#E4E4E7] rounded-lg px-3 py-1.5 outline-none focus:border-[#6366F1] bg-white"
          >
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      />

      <div className="px-6 py-5 space-y-6 fade-in max-w-2xl">
        {/* Platform connections */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">Connections</div>
          <div className="space-y-2">
            {Object.entries(PLATFORM_INFO).map(([key, info]) => {
              const conn = connections.find(c => c.platform === key);
              return (
                <div key={key} className="bg-white border border-[#E4E4E7] rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-[#18181B]">{info.label}</div>
                      <div className="text-xs text-[#71717A]">{info.description}</div>
                    </div>
                  </div>
                  {conn ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-[#22C55E] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Connected
                      </span>
                      <button
                        onClick={() => handleDisconnect(conn.id)}
                        className="text-xs text-[#EF4444] hover:underline ml-2"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setConnectModal(key)}>
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reddit monitors */}
        {connectedPlatforms.includes('reddit') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Reddit Monitors</span>
              <Button size="sm" variant="secondary" onClick={() => setMonitorModal(true)}>+ Add Monitor</Button>
            </div>
            {monitors.length === 0 ? (
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 text-center text-sm text-[#71717A] shadow-sm">
                No subreddits being monitored. Add one to start finding threads.
              </div>
            ) : (
              <div className="space-y-2">
                {monitors.map(m => (
                  <div key={m.id} className="bg-white border border-[#E4E4E7] rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">r/{m.subreddit}</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${m.active ? 'bg-[#22C55E]' : 'bg-[#A1A1AA]'}`} />
                        <button onClick={() => handleRemoveMonitor(m.id)} className="text-xs text-[#EF4444] hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.keywords?.map(k => (
                        <span key={k} className="px-2 py-0.5 bg-[#F4F4F5] text-[#71717A] rounded text-xs">{k}</span>
                      ))}
                    </div>
                    {m.last_checked && (
                      <p className="text-xs text-[#A1A1AA] mt-2">
                        Last checked: {new Date(m.last_checked).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connect modal */}
      <Modal open={!!connectModal} onClose={() => { setConnectModal(null); setForm({}); }}
        title={`Connect ${PLATFORM_INFO[connectModal]?.label || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-[#71717A]">
            Enter your API credentials for {PLATFORM_INFO[connectModal]?.label}. These are stored encrypted.
          </p>
          {connectModal === 'reddit' && <>
            <Input label="Client ID" value={form.client_id || ''} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} />
            <Input label="Client Secret" value={form.client_secret || ''} onChange={e => setForm(p => ({ ...p, client_secret: e.target.value }))} type="password" />
            <Input label="Username" value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            <Input label="Password" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} type="password" />
          </>}
          {connectModal === 'pinterest' && <>
            <Input label="Access Token" value={form.access_token || ''} onChange={e => setForm(p => ({ ...p, access_token: e.target.value }))} />
            <Input label="Board ID" value={form.board_id || ''} onChange={e => setForm(p => ({ ...p, board_id: e.target.value }))} />
          </>}
          {connectModal === 'email' && <>
            <Input label="Resend API Key" value={form.api_key || ''} onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))} />
            <Input label="From Email" value={form.from_email || ''} onChange={e => setForm(p => ({ ...p, from_email: e.target.value }))} placeholder="hello@yourdomain.com" />
          </>}
          {!['reddit', 'pinterest', 'email'].includes(connectModal) && (
            <Input label="Access Token / API Key" value={form.token || ''} onChange={e => setForm(p => ({ ...p, token: e.target.value }))} />
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setConnectModal(null); setForm({}); }}>Cancel</Button>
            <Button onClick={handleConnect} loading={saving} className="flex-1">Connect</Button>
          </div>
        </div>
      </Modal>

      {/* Monitor modal */}
      <Modal open={monitorModal} onClose={() => setMonitorModal(false)} title="Add Reddit Monitor">
        <div className="space-y-4">
          <Input
            label="Subreddit"
            value={monitorForm.subreddit}
            onChange={e => setMonitorForm(p => ({ ...p, subreddit: e.target.value }))}
            placeholder="frugal (without r/)"
          />
          <Input
            label="Keywords (comma separated)"
            value={monitorForm.keywords}
            onChange={e => setMonitorForm(p => ({ ...p, keywords: e.target.value }))}
            placeholder="meal planning, grocery budget, hello fresh"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setMonitorModal(false)}>Cancel</Button>
            <Button onClick={handleAddMonitor} loading={saving} className="flex-1">Add Monitor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
