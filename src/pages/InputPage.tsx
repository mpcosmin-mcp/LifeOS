import { useState } from 'react';
import { Plus } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const today = () => new Date().toISOString().split('T')[0];

const TABS = ['Nutrition', 'Expense', 'Workout', 'Health', 'Event'] as const;
type Tab = typeof TABS[number];

export default function InputPage() {
  const [tab, setTab] = useState<Tab>('Nutrition');
  const [msg, setMsg] = useState('');

  const post = async (path: string, body: any) => {
    try {
      const r = await fetch(`${API}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) { setMsg('✓ Saved'); setTimeout(() => setMsg(''), 2000); }
      else setMsg('✗ Error');
    } catch { setMsg('✗ Offline'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="font-display fade" style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plus size={20} style={{ color: 'var(--green)' }} /> Log Data
      </h2>
      <div className="tabs fade" style={{ alignSelf: 'flex-start' }}>
        {TABS.map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {msg && <div className="font-data fade" style={{ fontSize: 11, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)', padding: '4px 0' }}>{msg}</div>}
      <div className="panel fade d1" style={{ padding: 16 }}>
        {tab === 'Nutrition' && <NutritionForm onSubmit={d => post('nutrition', d)} />}
        {tab === 'Expense' && <ExpenseForm onSubmit={d => post('transactions', d)} />}
        {tab === 'Workout' && <WorkoutForm onSubmit={d => post('workouts', d)} />}
        {tab === 'Health' && <HealthForm onSubmit={d => post('health', d)} />}
        {tab === 'Event' && <EventForm onSubmit={d => post('events', d)} />}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.03)', color: 'var(--t1)', fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace", outline: 'none',
};
const labelStyle: React.CSSProperties = { fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3, display: 'block' };
const btnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--cyan)', color: '#080b14',
  fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 8,
};
const Row = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div style={{ marginBottom: 8 }}><label style={labelStyle}>{label}</label>{children}</div>;

function NutritionForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [s, set] = useState({ date: today(), item: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', water_ml: '' });
  return <form onSubmit={e => { e.preventDefault(); onSubmit({ ...s, calories: +s.calories || 0, protein_g: +s.protein_g || 0, carbs_g: +s.carbs_g || 0, fat_g: +s.fat_g || 0, water_ml: +s.water_ml || 0 }); }}>
    <Row><Field label="Date"><input style={inputStyle} type="date" value={s.date} onChange={e => set({ ...s, date: e.target.value })} /></Field><Field label="Item"><input style={inputStyle} value={s.item} onChange={e => set({ ...s, item: e.target.value })} placeholder="What did you eat?" /></Field></Row>
    <Row><Field label="Calories"><input style={inputStyle} type="number" value={s.calories} onChange={e => set({ ...s, calories: e.target.value })} /></Field><Field label="Protein (g)"><input style={inputStyle} type="number" value={s.protein_g} onChange={e => set({ ...s, protein_g: e.target.value })} /></Field></Row>
    <Row><Field label="Carbs (g)"><input style={inputStyle} type="number" value={s.carbs_g} onChange={e => set({ ...s, carbs_g: e.target.value })} /></Field><Field label="Fat (g)"><input style={inputStyle} type="number" value={s.fat_g} onChange={e => set({ ...s, fat_g: e.target.value })} /></Field></Row>
    <Field label="Water (ml)"><input style={inputStyle} type="number" value={s.water_ml} onChange={e => set({ ...s, water_ml: e.target.value })} /></Field>
    <button type="submit" style={btnStyle}>Log Nutrition</button>
  </form>;
}

function ExpenseForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [s, set] = useState({ date: today(), description: '', amount: '', category: 'food', roi_flag: '0' });
  return <form onSubmit={e => { e.preventDefault(); onSubmit({ ...s, amount: +s.amount || 0 }); }}>
    <Row><Field label="Date"><input style={inputStyle} type="date" value={s.date} onChange={e => set({ ...s, date: e.target.value })} /></Field><Field label="Amount (lei)"><input style={inputStyle} type="number" value={s.amount} onChange={e => set({ ...s, amount: e.target.value })} /></Field></Row>
    <Field label="Description"><input style={inputStyle} value={s.description} onChange={e => set({ ...s, description: e.target.value })} placeholder="What did you buy?" /></Field>
    <Row><Field label="Category"><select style={inputStyle} value={s.category} onChange={e => set({ ...s, category: e.target.value })}><option value="food">Food</option><option value="transport">Transport</option><option value="social">Social</option><option value="health">Health</option><option value="household">Household</option><option value="subscriptions">Subscriptions</option><option value="other">Other</option></select></Field>
    <Field label="ROI"><select style={inputStyle} value={s.roi_flag} onChange={e => set({ ...s, roi_flag: e.target.value })}><option value="+">+ROI</option><option value="0">Neutral</option><option value="-">-ROI</option></select></Field></Row>
    <button type="submit" style={btnStyle}>Log Expense</button>
  </form>;
}

function WorkoutForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [s, set] = useState({ date: today(), type: 'running', duration_min: '', distance_km: '', heart_rate_avg: '' });
  return <form onSubmit={e => { e.preventDefault(); onSubmit({ ...s, duration_min: +s.duration_min || null, distance_km: +s.distance_km || null, heart_rate_avg: +s.heart_rate_avg || null }); }}>
    <Row><Field label="Date"><input style={inputStyle} type="date" value={s.date} onChange={e => set({ ...s, date: e.target.value })} /></Field><Field label="Type"><select style={inputStyle} value={s.type} onChange={e => set({ ...s, type: e.target.value })}><option value="running">Running</option><option value="gym">Gym</option><option value="indoor_cardio">Indoor Cardio</option><option value="cardio+sauna">Cardio+Sauna</option><option value="cardio+sauna+cold plunge">Cardio+Sauna+Cold</option></select></Field></Row>
    <Row><Field label="Duration (min)"><input style={inputStyle} type="number" value={s.duration_min} onChange={e => set({ ...s, duration_min: e.target.value })} /></Field><Field label="Distance (km)"><input style={inputStyle} type="number" step="0.1" value={s.distance_km} onChange={e => set({ ...s, distance_km: e.target.value })} /></Field></Row>
    <Field label="Avg HR"><input style={inputStyle} type="number" value={s.heart_rate_avg} onChange={e => set({ ...s, heart_rate_avg: e.target.value })} /></Field>
    <button type="submit" style={btnStyle}>Log Workout</button>
  </form>;
}

function HealthForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [s, set] = useState({ date: today(), weight_kg: '', body_fat_pct: '', sleep_score: '', rhr: '', hrv: '', steps: '' });
  return <form onSubmit={e => { e.preventDefault(); onSubmit({ date: s.date, weight_kg: +s.weight_kg || null, body_fat_pct: +s.body_fat_pct || null, sleep_score: +s.sleep_score || null, rhr: +s.rhr || null, hrv: +s.hrv || null, steps: +s.steps || null }); }}>
    <Field label="Date"><input style={inputStyle} type="date" value={s.date} onChange={e => set({ ...s, date: e.target.value })} /></Field>
    <Row><Field label="Weight (kg)"><input style={inputStyle} type="number" step="0.1" value={s.weight_kg} onChange={e => set({ ...s, weight_kg: e.target.value })} /></Field><Field label="Body Fat (%)"><input style={inputStyle} type="number" step="0.1" value={s.body_fat_pct} onChange={e => set({ ...s, body_fat_pct: e.target.value })} /></Field></Row>
    <Row><Field label="Sleep Score"><input style={inputStyle} type="number" value={s.sleep_score} onChange={e => set({ ...s, sleep_score: e.target.value })} /></Field><Field label="RHR"><input style={inputStyle} type="number" value={s.rhr} onChange={e => set({ ...s, rhr: e.target.value })} /></Field></Row>
    <Row><Field label="HRV"><input style={inputStyle} type="number" value={s.hrv} onChange={e => set({ ...s, hrv: e.target.value })} /></Field><Field label="Steps"><input style={inputStyle} type="number" value={s.steps} onChange={e => set({ ...s, steps: e.target.value })} /></Field></Row>
    <button type="submit" style={btnStyle}>Log Health</button>
  </form>;
}

function EventForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [s, set] = useState({ title: '', date: today(), type: 'event', cost: '', location: '' });
  return <form onSubmit={e => { e.preventDefault(); onSubmit({ ...s, cost: +s.cost || 0 }); }}>
    <Field label="Title"><input style={inputStyle} value={s.title} onChange={e => set({ ...s, title: e.target.value })} placeholder="Event name" /></Field>
    <Row><Field label="Date"><input style={inputStyle} type="date" value={s.date} onChange={e => set({ ...s, date: e.target.value })} /></Field><Field label="Type"><select style={inputStyle} value={s.type} onChange={e => set({ ...s, type: e.target.value })}><option value="event">Event</option><option value="birthday">Birthday</option><option value="bill">Bill</option><option value="reminder">Reminder</option><option value="sport">Sport</option></select></Field></Row>
    <Row><Field label="Cost (lei)"><input style={inputStyle} type="number" value={s.cost} onChange={e => set({ ...s, cost: e.target.value })} /></Field><Field label="Location"><input style={inputStyle} value={s.location} onChange={e => set({ ...s, location: e.target.value })} /></Field></Row>
    <button type="submit" style={btnStyle}>Add Event</button>
  </form>;
}
