import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct, getProduct, addRedditMonitor, generateBatch } from '../lib/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const TONES = [
  { value: 'warm_helpful', label: 'Warm & friendly', description: 'Like a helpful neighbor' },
  { value: 'professional', label: 'Professional', description: 'Like a smart colleague' },
  { value: 'casual', label: 'Casual', description: 'Like a friend texting you' },
  { value: 'direct', label: 'Direct', description: 'No fluff, just facts' }
];

const ALL_PLATFORMS = [
  { id: 'reddit', label: 'Reddit', description: 'Monitors and replies to threads' },
  { id: 'pinterest', label: 'Pinterest', description: 'Visual pins with images' },
  { id: 'email', label: 'Email', description: 'Automated nurture sequences' },
  { id: 'facebook', label: 'Facebook Groups', description: 'Community posts' },
  { id: 'twitter', label: 'Twitter/X', description: 'Short posts' },
  { id: 'blog', label: 'Blog/SEO', description: 'Long-form articles' }
];

export default function ProductSetup() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', url: '', pitch: '',
    audience: '', pain_point: '', differentiator: '',
    tone: 'warm_helpful',
    platforms: ['reddit', 'pinterest', 'email'],
    subreddits: [],
    keywords: []
  });

  const [subredditInput, setSubredditInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [savedProduct, setSavedProduct] = useState(null);

  useEffect(() => {
    if (isEdit) {
      getProduct(id).then(p => {
        setForm(prev => ({
          ...prev,
          name: p.name, url: p.url, pitch: p.pitch,
          audience: p.audience, pain_point: p.pain_point,
          differentiator: p.differentiator, tone: p.tone || 'warm_helpful'
        }));
      });
    }
  }, [id, isEdit]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function togglePlatform(p) {
    set('platforms', form.platforms.includes(p)
      ? form.platforms.filter(x => x !== p)
      : [...form.platforms, p]
    );
  }

  function addChip(field, input, setInput) {
    const val = input.trim().replace(/^r\//, '');
    if (val && !form[field].includes(val)) {
      set(field, [...form[field], val]);
    }
    setInput('');
  }

  function removeChip(field, val) {
    set(field, form[field].filter(x => x !== val));
  }

  function validate() {
    const errs = {};
    if (step === 1) {
      if (!form.name) errs.name = 'Required';
      if (!form.url) errs.url = 'Required';
      if (!form.pitch) errs.pitch = 'Required';
    }
    if (step === 2) {
      if (!form.audience) errs.audience = 'Required';
      if (!form.pain_point) errs.pain_point = 'Required';
      if (!form.differentiator) errs.differentiator = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    if (step === 4 && !isEdit) {
      // Save product before Reddit step
      setLoading(true);
      try {
        const p = await createProduct({
          name: form.name, url: form.url, pitch: form.pitch,
          audience: form.audience, pain_point: form.pain_point,
          differentiator: form.differentiator, tone: form.tone
        });
        setSavedProduct(p);
        setStep(5);
      } catch (e) {
        setErrors({ submit: e.response?.data?.error || e.message });
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step < 5) setStep(s => s + 1);
  }

  async function handleFinish() {
    setGenerating(true);
    try {
      const productId = savedProduct?.id || id;

      // Add Reddit monitors
      if (form.platforms.includes('reddit') && form.subreddits.length > 0) {
        for (const sub of form.subreddits) {
          await addRedditMonitor({
            product_id: productId,
            subreddit: sub,
            keywords: form.keywords
          }).catch(() => {});
        }
      }

      if (!isEdit) {
        await generateBatch(productId);
      } else {
        await updateProduct(id, {
          name: form.name, url: form.url, pitch: form.pitch,
          audience: form.audience, pain_point: form.pain_point,
          differentiator: form.differentiator, tone: form.tone
        });
      }

      navigate('/queue');
    } catch (e) {
      console.error(e);
      navigate('/products');
    } finally {
      setGenerating(false);
    }
  }

  const totalSteps = form.platforms.includes('reddit') ? 5 : 4;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E4E4E7] bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#18181B]">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <button onClick={() => navigate(-1)} className="text-sm text-[#71717A] hover:text-[#18181B]">Cancel</button>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? 'bg-[#6366F1]' : 'bg-[#E4E4E7]'
            }`} />
          ))}
        </div>
        <p className="text-xs text-[#71717A] mt-2">Step {step} of {totalSteps}</p>
      </div>

      <div className="px-6 py-6 max-w-xl fade-in">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Info</h2>
            <Input label="Product name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Make Me Meals" error={errors.name} />
            <Input label="Product URL" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://makememeals.com" error={errors.url} />
            <Input label="One-line pitch" value={form.pitch} onChange={e => set('pitch', e.target.value)} placeholder="AI meal planning that cuts your grocery bill in half" error={errors.pitch} textarea />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Audience</h2>
            <Input label="Who are your target users?" value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="Budget-conscious families and meal preppers who want to save money on groceries" error={errors.audience} textarea />
            <Input label="What problem do they have?" value={form.pain_point} onChange={e => set('pain_point', e.target.value)} placeholder="They waste money on groceries they don't use, have no time to plan meals, and eat out too often" error={errors.pain_point} textarea />
            <Input label="Why is your product better?" value={form.differentiator} onChange={e => set('differentiator', e.target.value)} placeholder="AI generates personalized meal plans based on what's on sale at their local store" error={errors.differentiator} textarea />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Tone & Voice</h2>
            <p className="text-sm text-[#71717A]">How should your content sound?</p>
            <div className="grid grid-cols-2 gap-3">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => set('tone', t.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.tone === t.value
                      ? 'border-[#6366F1] bg-[#EEF2FF]'
                      : 'border-[#E4E4E7] hover:border-[#D4D4D8]'
                  }`}
                >
                  <div className="font-medium text-sm text-[#18181B]">{t.label}</div>
                  <div className="text-xs text-[#71717A] mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Platforms</h2>
            <p className="text-sm text-[#71717A]">Which platforms do you want to use?</p>
            <div className="space-y-2">
              {ALL_PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    form.platforms.includes(p.id)
                      ? 'border-[#6366F1] bg-[#EEF2FF]'
                      : 'border-[#E4E4E7] hover:border-[#D4D4D8]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    form.platforms.includes(p.id) ? 'border-[#6366F1] bg-[#6366F1]' : 'border-[#D4D4D8]'
                  }`}>
                    {form.platforms.includes(p.id) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[#18181B]">{p.label}</div>
                    <div className="text-xs text-[#71717A]">{p.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Reddit Setup</h2>
            <p className="text-sm text-[#71717A]">Add subreddits to monitor and keywords to watch for.</p>

            {/* Subreddits */}
            <div>
              <label className="block text-sm font-medium text-[#18181B] mb-2">Subreddits to monitor</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={subredditInput}
                  onChange={e => setSubredditInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChip('subreddits', subredditInput, setSubredditInput)}
                  placeholder="frugal, mealprep, budgetfood..."
                  className="flex-1 px-3 py-2 text-sm border border-[#E4E4E7] rounded-lg outline-none focus:border-[#6366F1]"
                />
                <Button variant="secondary" size="sm" onClick={() => addChip('subreddits', subredditInput, setSubredditInput)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.subreddits.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2FF] text-[#6366F1] rounded-lg text-sm">
                    r/{s}
                    <button onClick={() => removeChip('subreddits', s)} className="text-[#6366F1]/60 hover:text-[#6366F1]">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-[#18181B] mb-2">Keywords to watch</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChip('keywords', keywordInput, setKeywordInput)}
                  placeholder="meal planning, grocery budget, hello fresh..."
                  className="flex-1 px-3 py-2 text-sm border border-[#E4E4E7] rounded-lg outline-none focus:border-[#6366F1]"
                />
                <Button variant="secondary" size="sm" onClick={() => addChip('keywords', keywordInput, setKeywordInput)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.keywords.map(k => (
                  <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F4F4F5] text-[#71717A] rounded-lg text-sm">
                    {k}
                    <button onClick={() => removeChip('keywords', k)} className="text-[#71717A]/60 hover:text-[#71717A]">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {errors.submit && (
          <p className="text-sm text-[#EF4444] mt-2">{errors.submit}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
          ) : <div />}

          {step < totalSteps ? (
            <Button onClick={handleNext} loading={loading}>Continue →</Button>
          ) : (
            <Button onClick={handleFinish} loading={generating}>
              {generating ? 'Generating content...' : isEdit ? 'Save changes' : 'Generate first content →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
