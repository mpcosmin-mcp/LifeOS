import { useState } from 'react';
import { Plus, Check, AlertCircle, Utensils, Wallet, Activity, Heart, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

type InputTab = 'nutrition' | 'expense' | 'workout' | 'health' | 'event';

export default function InputPage() {
  const [tab, setTab] = useState<InputTab>('nutrition');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const tabs: { key: InputTab; label: string; icon: React.ReactNode }[] = [
    { key: 'nutrition', label: 'Food', icon: <Utensils size={14} /> },
    { key: 'expense', label: 'Expense', icon: <Wallet size={14} /> },
    { key: 'workout', label: 'Workout', icon: <Activity size={14} /> },
    { key: 'health', label: 'Health', icon: <Heart size={14} /> },
    { key: 'event', label: 'Event', icon: <Calendar size={14} /> },
  ];

  const submit = async (endpoint: string, data: any) => {
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) setStatus({ ok: true, msg: 'Saved!' });
      else setStatus({ ok: false, msg: json.error || 'Error' });
    } catch {
      setStatus({ ok: false, msg: 'Connection failed' });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-black text-xl flex items-center gap-2 anim-fade">
        <Plus size={20} style={{ color: 'var(--neon-green)' }} /> Log Data
      </h2>

      {/* Scrollable tab bar on mobile */}
      <div className="drag-scroll anim-fade -mx-3 px-3">
        <div className="tab-bar inline-flex w-max sm:w-auto">
          {tabs.map(t => (
            <button key={t.key} className={`tab flex items-center gap-1.5 min-h-[36px] ${tab === t.key ? 'on' : ''}`}
              onClick={() => { setTab(t.key); setStatus(null); }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {status && (
        <div className={`glass p-3 flex items-center gap-2 text-sm anim-fade`}
          style={{ borderColor: status.ok ? 'var(--neon-green)' : 'var(--neon-red)', borderWidth: 1 }}>
          {status.ok ? <Check size={16} style={{ color: 'var(--neon-green)' }} /> : <AlertCircle size={16} style={{ color: 'var(--neon-red)' }} />}
          {status.msg}
        </div>
      )}

      <div className="glass p-4 md:p-5 anim-fade d1">
        {tab === 'nutrition' && <NutritionForm onSubmit={d => submit('/api/nutrition', d)} />}
        {tab === 'expense' && <ExpenseForm onSubmit={d => submit('/api/transactions', d)} />}
        {tab === 'workout' && <WorkoutForm onSubmit={d => submit('/api/workouts', d)} />}
        {tab === 'health' && <HealthForm onSubmit={d => submit('/api/health', d)} />}
        {tab === 'event' && <EventForm onSubmit={d => submit('/api/events', d)} />}
      </div>
    </div>
  );
}

const today = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NutritionForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ date: today(), time: nowTime(), item: '', protein_g: '', carbs_g: '', fat_g: '', calories: '', water_ml: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, protein_g: +form.protein_g || 0, carbs_g: +form.carbs_g || 0, fat_g: +form.fat_g || 0, calories: +form.calories || 0, water_ml: +form.water_ml || 0 }); }}>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Date"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" /></Field>
        <Field label="Time"><input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="input-field" /></Field>
      </div>
      <Field label="What did you eat?"><input value={form.item} onChange={e => set('item', e.target.value)} placeholder="e.g. 4 ouă + pâine" className="input-field" required /></Field>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        <Field label="Calories"><input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="kcal" className="input-field" /></Field>
        <Field label="Protein (g)"><input type="number" value={form.protein_g} onChange={e => set('protein_g', e.target.value)} placeholder="g" className="input-field" /></Field>
        <Field label="Carbs (g)"><input type="number" value={form.carbs_g} onChange={e => set('carbs_g', e.target.value)} placeholder="g" className="input-field" /></Field>
        <Field label="Fat (g)"><input type="number" value={form.fat_g} onChange={e => set('fat_g', e.target.value)} placeholder="g" className="input-field" /></Field>
      </div>
      <Field label="Water (ml)"><input type="number" value={form.water_ml} onChange={e => set('water_ml', e.target.value)} placeholder="ml" className="input-field" /></Field>
      <button type="submit" className="btn-submit" style={{ background: 'var(--neon-green)', color: '#0f172a' }}>Log Meal</button>
    </form>
  );
}

function ExpenseForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ date: today(), description: '', amount: '', category: 'food', roi_flag: '0', quantity: '', unit_price: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const categories = ['food', 'transport', 'social', 'health', 'household', 'subscriptions', 'other'];

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, amount: +form.amount, quantity: +form.quantity || null, unit_price: +form.unit_price || null }); }}>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Date"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" /></Field>
        <Field label="Amount (lei)"><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="lei" className="input-field" required /></Field>
      </div>
      <Field label="Description"><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What did you spend on?" className="input-field" required /></Field>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Category">
          <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="ROI">
          <div className="flex gap-1.5">
            {['+', '0', '-'].map(r => (
              <button key={r} type="button" onClick={() => set('roi_flag', r)}
                className="flex-1 py-2.5 rounded-xl font-mono-data font-bold text-sm transition-all min-h-[44px]"
                style={{
                  background: r === '+' ? 'rgba(0,255,136,0.15)' : r === '-' ? 'rgba(255,59,59,0.15)' : 'rgba(255,255,255,0.05)',
                  color: r === '+' ? 'var(--neon-green)' : r === '-' ? 'var(--neon-red)' : 'var(--text3)',
                  boxShadow: form.roi_flag === r ? `inset 0 0 0 2px ${r === '+' ? 'var(--neon-green)' : r === '-' ? 'var(--neon-red)' : 'var(--text3)'}` : 'none',
                }}>
                {r === '+' ? '+ROI' : r === '-' ? '-ROI' : '~'}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Qty (optional)"><input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="input-field" /></Field>
        <Field label="Unit Price"><input type="number" value={form.unit_price} onChange={e => set('unit_price', e.target.value)} className="input-field" /></Field>
      </div>
      <button type="submit" className="btn-submit" style={{ background: 'var(--neon-blue)', color: '#fff' }}>Log Expense</button>
    </form>
  );
}

function WorkoutForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ date: today(), type: 'running', duration_min: '', distance_km: '', heart_rate_avg: '', calories: '', max_hr: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const types = ['running', 'gym', 'indoor_cardio', 'cardio+sauna', 'cardio+sauna+cold plunge', 'cycling', 'swimming', 'other'];

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, duration_min: +form.duration_min || null, distance_km: +form.distance_km || null, heart_rate_avg: +form.heart_rate_avg || null, calories: +form.calories || null, max_hr: +form.max_hr || null }); }}>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Date"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" /></Field>
        <Field label="Type">
          <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field">
            {types.map(t => <option key={t} value={t}>{t.replace(/[_+]/g, ' ')}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        <Field label="Duration (min)"><input type="number" value={form.duration_min} onChange={e => set('duration_min', e.target.value)} className="input-field" /></Field>
        <Field label="Distance (km)"><input type="number" step="0.1" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} className="input-field" /></Field>
        <Field label="Avg HR"><input type="number" value={form.heart_rate_avg} onChange={e => set('heart_rate_avg', e.target.value)} className="input-field" /></Field>
        <Field label="Max HR"><input type="number" value={form.max_hr} onChange={e => set('max_hr', e.target.value)} className="input-field" /></Field>
      </div>
      <Field label="Calories"><input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} className="input-field" /></Field>
      <Field label="Notes"><input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How was it?" className="input-field" /></Field>
      <button type="submit" className="btn-submit" style={{ background: 'var(--neon-orange)', color: '#0f172a' }}>Log Workout</button>
    </form>
  );
}

function HealthForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ date: today(), weight_kg: '', body_fat_pct: '', visceral_fat: '', rhr: '', hrv: '', sleep_score: '', steps: '', water_pct: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); const d: any = { date: form.date }; if (form.weight_kg) d.weight_kg = +form.weight_kg; if (form.body_fat_pct) d.body_fat_pct = +form.body_fat_pct; if (form.visceral_fat) d.visceral_fat = +form.visceral_fat; if (form.rhr) d.rhr = +form.rhr; if (form.hrv) d.hrv = +form.hrv; if (form.sleep_score) d.sleep_score = +form.sleep_score; if (form.steps) d.steps = +form.steps; if (form.water_pct) d.water_pct = +form.water_pct; if (form.notes) d.notes = form.notes; onSubmit(d); }}>
      <Field label="Date"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" /></Field>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
        <Field label="Weight (kg)"><input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="input-field" /></Field>
        <Field label="Body Fat (%)"><input type="number" step="0.1" value={form.body_fat_pct} onChange={e => set('body_fat_pct', e.target.value)} className="input-field" /></Field>
        <Field label="Visceral Fat"><input type="number" value={form.visceral_fat} onChange={e => set('visceral_fat', e.target.value)} className="input-field" /></Field>
        <Field label="RHR (bpm)"><input type="number" value={form.rhr} onChange={e => set('rhr', e.target.value)} className="input-field" /></Field>
        <Field label="HRV (ms)"><input type="number" value={form.hrv} onChange={e => set('hrv', e.target.value)} className="input-field" /></Field>
        <Field label="Sleep Score"><input type="number" value={form.sleep_score} onChange={e => set('sleep_score', e.target.value)} className="input-field" /></Field>
        <Field label="Steps"><input type="number" value={form.steps} onChange={e => set('steps', e.target.value)} className="input-field" /></Field>
        <Field label="Water (%)"><input type="number" step="0.1" value={form.water_pct} onChange={e => set('water_pct', e.target.value)} className="input-field" /></Field>
      </div>
      <Field label="Notes"><input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" className="input-field" /></Field>
      <button type="submit" className="btn-submit" style={{ background: 'var(--neon-red)', color: '#fff' }}>Log Health Data</button>
      <p className="text-[10px] text-[var(--text3)] text-center">Only filled fields will be saved. Existing data for same date will be updated.</p>
    </form>
  );
}

function EventForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({ date: today(), title: '', type: 'event', cost: '', location: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const types = ['event', 'bill', 'birthday', 'sport', 'reminder'];

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, cost: +form.cost || 0 }); }}>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Date"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" /></Field>
        <Field label="Type">
          <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field">
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Title"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event name" className="input-field" required /></Field>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Field label="Cost (lei)"><input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} className="input-field" /></Field>
        <Field label="Location"><input value={form.location} onChange={e => set('location', e.target.value)} className="input-field" /></Field>
      </div>
      <Field label="Notes"><input value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field" /></Field>
      <button type="submit" className="btn-submit" style={{ background: 'var(--neon-purple)', color: '#fff' }}>Add Event</button>
    </form>
  );
}
