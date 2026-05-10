import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function EditModal({ open, item, onClose, onSave, onRegenerate }) {
  const [body, setBody] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (item) setBody(item.body);
  }, [item]);

  async function handleSave() {
    setSaving(true);
    await onSave(body);
    setSaving(false);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const updated = await onRegenerate(item.id, feedback);
    if (updated?.body) setBody(updated.body);
    setFeedback('');
    setShowFeedback(false);
    setRegenerating(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Content" width="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">Content</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 text-sm bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 resize-none"
          />
          <p className="text-xs text-[#A1A1AA] mt-1">{body.length} characters</p>
        </div>

        {showFeedback && (
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">What to fix?</label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={2}
              placeholder="e.g. Too promotional, needs more helpful tips, shorter..."
              className="w-full px-3 py-2 text-sm bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#6366F1] resize-none"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="text-sm text-[#6366F1] hover:underline"
          >
            {showFeedback ? 'Hide feedback' : '🔄 Rewrite with Claude'}
          </button>
          <div className="flex-1" />
          {showFeedback && (
            <Button variant="secondary" onClick={handleRegenerate} loading={regenerating}>
              Regenerate
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save & Approve</Button>
        </div>
      </div>
    </Modal>
  );
}
