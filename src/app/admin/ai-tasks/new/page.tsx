'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAITask } from '@/hooks/useAITasks';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Bot, X, Tag, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

// ── Static Dify payload fields ─────────────────────────────────────────────
const STATIC_PAYLOAD = {
  response_mode: 'blocking',
  user: 'admin-user',
} as const;

// ── Content type options ───────────────────────────────────────────────────
const CONTENT_TYPE_OPTIONS = [
  { value: 'Product',  label: 'Product'  },
  { value: 'Category', label: 'Category' },
];

// ── Helper: "YYYY-MM-DDTHH:mm" in the browser's LOCAL timezone ────────────
// datetime-local inputs interpret their value as local time, so min must also
// be expressed in local time (NOT UTC) to allow near-future selections.
function nowLocalISOString() {
  const d = new Date();
  d.setSeconds(0, 0);
  // Offset in ms between UTC and local time
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

// Convert "YYYY-MM-DDTHH:mm" (local) → full ISO-8601 with timezone offset ──
// Example: "2026-05-13T20:30" in UTC+5:30 → "2026-05-13T20:30:00+05:30"
function localDatetimeToISO(value: string): string {
  if (!value) return '';
  const d = new Date(value); // browser interprets as local time — correct
  if (isNaN(d.getTime())) return '';
  return d.toISOString(); // convert to UTC ISO — Zod datetime() accepts Z offset
}

// ── Tag Input component ────────────────────────────────────────────────────
function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const trimmed = raw.replace(/,+$/, '').trim();
    if (!trimmed) return;
    const incoming = trimmed.split(',').map((t) => t.trim()).filter(Boolean);
    const unique = incoming.filter((t) => !tags.includes(t));
    if (unique.length) onChange([...tags, ...unique]);
    setInputValue('');
  };

  const removeTag = (index: number) => onChange(tags.filter((_, i) => i !== index));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(',')) { addTag(val); } else { setInputValue(val); }
  };

  return (
    <div
      className="min-h-[42px] w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent cursor-text flex flex-wrap gap-1.5"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium">
          {tag}
          <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(i); }} className="text-violet-400 hover:text-red-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
        placeholder={tags.length === 0 ? 'Type keywords, separate with comma or Enter' : 'Add more…'}
        className="flex-1 min-w-[160px] bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function NewAITaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createTask = useCreateAITask();

  const [contentType, setContentType]               = useState<'Product' | 'Category'>('Product');
  const [keywords, setKeywords]                     = useState<string[]>([]);
  const [url, setUrl]                               = useState('');
  const [productOrCategoryName, setProductOrCategoryName] = useState('');
  const [scheduleEnabled, setScheduleEnabled]       = useState(false);
  const [scheduleDatetime, setScheduleDatetime]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (keywords.length === 0) {
      toast.error('At least one keyword is required');
      return;
    }

    // Convert local datetime-local value → ISO-8601 UTC string for the API
    let scheduleDT: string | undefined;
    if (scheduleEnabled && scheduleDatetime) {
      scheduleDT = localDatetimeToISO(scheduleDatetime);
      if (!scheduleDT) {
        toast.error('Invalid schedule date/time selected');
        return;
      }
      if (new Date(scheduleDT) <= new Date()) {
        toast.error('Scheduled time must be in the future');
        return;
      }
    }

    try {
      await createTask.mutateAsync({
        contentType,
        keywords,
        targetUrl:         url || undefined,
        productName:       productOrCategoryName || undefined,
        schedule_datetime: scheduleDT,
        ...STATIC_PAYLOAD,
      });

      const msg = scheduleDT
        ? `Scheduled for ${new Date(scheduleDT).toLocaleString()}`
        : 'The AI will generate content shortly.';
      toast.success('AI Task created!', msg);
      router.push('/admin/ai-tasks');
    } catch (error) {
      toast.error('Failed to create task', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/ai-tasks">
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">New AI Task</h1>
          <p className="text-sm text-slate-400">Create a task for AI content generation</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-6">
        <Bot className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-violet-300">AI Content Generation</p>
          <p className="text-xs text-violet-400 mt-0.5">
            The AI will generate a complete blog post based on your inputs.
            Schedule it for later or run it immediately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">

        {/* content_type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">
            Content Type <span className="text-red-400">*</span>
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as 'Product' | 'Category')}
            required
            className="h-9 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            {CONTENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* keywords — tag input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Keywords <span className="text-red-400">*</span>
          </label>
          <TagInput tags={keywords} onChange={setKeywords} />
          <p className="text-xs text-slate-500">
            Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Enter</kbd>{' '}
            or{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">,</kbd>{' '}
            to add. Paste comma-separated values to bulk-add.
          </p>
        </div>

        {/* product_or_category_name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">
            Product / Category Name
          </label>
          <input
            type="text"
            value={productOrCategoryName}
            onChange={(e) => setProductOrCategoryName(e.target.value)}
            placeholder={contentType === 'Product' ? 'e.g. DeLonghi Espresso Machine' : 'e.g. Kitchen Appliances'}
            maxLength={200}
            className="h-9 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500">The main subject of the article</p>
        </div>

        {/* url */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/product-page"
            className="h-9 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500">Optional reference URL for context</p>
        </div>

        {/* schedule_datetime */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setScheduleEnabled((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Schedule for later</span>
              {!scheduleEnabled && (
                <span className="text-xs text-slate-500">(runs immediately if disabled)</span>
              )}
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors ${scheduleEnabled ? 'bg-violet-500' : 'bg-slate-700'}`}>
              <div className={`w-3 h-3 mt-0.5 rounded-full bg-white transition-transform ${scheduleEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {scheduleEnabled && (
            <div className="px-4 py-3 space-y-2 bg-slate-900/50">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Schedule Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={scheduleDatetime}
                onChange={(e) => setScheduleDatetime(e.target.value)}
                min={nowLocalISOString()}
                required={scheduleEnabled}
                className="h-9 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent w-full"
              />
              <p className="text-xs text-slate-500">
                The cron job runs every minute and will trigger this task at or after the scheduled time.
              </p>
            </div>
          )}
        </div>

        {/* Static payload preview */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Static Dify Payload Fields
          </p>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex gap-2">
              <span className="text-slate-500">response_mode</span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-400">&quot;{STATIC_PAYLOAD.response_mode}&quot;</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">user</span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-400">&quot;{STATIC_PAYLOAD.user}&quot;</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/ai-tasks" className="flex-1">
            <Button variant="outline" fullWidth type="button">Cancel</Button>
          </Link>
          <Button
            type="submit"
            loading={createTask.isPending}
            leftIcon={scheduleEnabled ? <Calendar className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            className="flex-1"
          >
            {createTask.isPending
              ? 'Creating…'
              : scheduleEnabled
                ? 'Schedule Task'
                : 'Create & Run Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}
