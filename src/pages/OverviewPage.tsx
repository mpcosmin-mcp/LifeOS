import { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Heart, Flame, Moon, Wallet, Calendar, Zap, Droplets, Activity } from 'lucide-react';
import { CrosshairCursor, FloatingTooltip } from '../components/ChartCrosshair';
import { f, fDateShort, d, dColor, categoryEmoji, workoutEmoji, scoreColor, scoreLabel, daysAgo } from '../lib/helpers';
import { calculateLifeScore } from '../lib/scoring';
import { generateInsights } from '../lib/insights';
import type { LifeOSData, Page, HealthMetric } from '../lib/types';

interface Props { data: LifeOSData; onNavigate: (p: Page) => void; }
const L = (h: HealthMetric[], k: keyof HealthMetric) => { for (let i = h.length - 1; i >= 0; i--) if (h[i][k] != null) return h[i]; return null; };
const P = (h: HealthMetric[], k: keyof HealthMetric) => { let f = false; for (let i = h.length - 1; i >= 0; i--) if (h[i][k] != null) { if (f) return h[i]; f = true; } return null; };

export default function OverviewPage({ data, onNavigate }: Props) {
  const ls = useMemo(() => calculateLifeScore(data.health, data.nutrition, data.transactions, data.workouts), [data]);
  const insights = useMemo(() => generateInsights(data.health, data.nutrition, data.transactions), [data]);
  const wt = useMemo(() => data.health.filter(h => h.weight_kg).map(h => ({ d: fDateShort(h.date), v: h.weight_kg })), [data]);
  const slp = useMemo(() => data.health.filter(h => h.sleep_score).slice(-14).map(h => ({ d: fDateShort(h.date), v: h.sleep_score })), [data]);
  const rhr = useMemo(() => data.health.filter(h => h.rhr).slice(-14).map(h => ({ d: fDateShort(h.date), v: h.rhr })), [data]);

  const fuel = useMemo(() => {
    const t = new Date().toISOString().split('T')[0], y = new Date(Date.now()-864e5).toISOString().split('T')[0];
    let m = data.nutrition.filter(n => n.date === t), lbl = 'Today';
    if (!m.length) { m = data.nutrition.filter(n => n.date === y); lbl = 'Yesterday'; }
    const s = (k: 'calories'|'protein_g'|'carbs_g'|'fat_g'|'water_ml') => m.reduce((a, x) => a + x[k], 0);
    return { lbl, n: m.length, cal: s('calories'), p: s('protein_g'), c: s('carbs_g'), f: s('fat_g'), w: s('water_ml') };
  }, [data]);

  const events = useMemo(() => { const t = new Date().toISOString().split('T')[0]; return data.events.filter(e => e.date >= t).sort((a,b) => a.date.localeCompare(b.date)).slice(0,5); }, [data]);

  const spend = useMemo(() => {
    const l = data.transactions.filter(t => daysAgo(t.date) <= 30);
    const m = new Map<string,number>(); l.forEach(t => m.set(t.category||'other', (m.get(t.category||'other')||0)+t.amount));
    const cc: Record<string,string> = { food:'var(--green)', social:'var(--pink)', transport:'var(--blue)', subscriptions:'var(--purple)', household:'var(--amber)', health:'var(--cyan)', other:'var(--t3)' };
    return { cats: [...m.entries()].map(([n,v]) => ({n, v:Math.round(v), c:cc[n]||'var(--t3)'})).sort((a,b)=>b.v-a.v), total: Math.round(l.reduce((s,t)=>s+t.amount,0)) };
  }, [data]);

  const kpis = [
    { l:'Weight', u:'kg', c:'var(--cyan)', lb:true, v:f(L(data.health,'weight_kg')?.weight_kg??null), dt:d(L(data.health,'weight_kg')?.weight_kg??null, P(data.health,'weight_kg')?.weight_kg??null) },
    { l:'Body Fat', u:'%', c:'var(--amber)', lb:true, v:f(L(data.health,'body_fat_pct')?.body_fat_pct??null), dt:d(L(data.health,'body_fat_pct')?.body_fat_pct??null, P(data.health,'body_fat_pct')?.body_fat_pct??null) },
    { l:'RHR', u:'bpm', c:'var(--red)', lb:true, v:f(L(data.health,'rhr')?.rhr??null,0), dt:d(L(data.health,'rhr')?.rhr??null, P(data.health,'rhr')?.rhr??null) },
    { l:'HRV', u:'ms', c:'var(--green)', lb:false, v:f(L(data.health,'hrv')?.hrv??null,0), dt:d(L(data.health,'hrv')?.hrv??null, P(data.health,'hrv')?.hrv??null) },
    { l:'Sleep', u:'', c:'var(--purple)', lb:false, v:f(L(data.health,'sleep_score')?.sleep_score??null,0), dt:d(L(data.health,'sleep_score')?.sleep_score??null, P(data.health,'sleep_score')?.sleep_score??null) },
    { l:'Steps', u:'', c:'var(--amber)', lb:false, v:L(data.health,'steps')?.steps?`${((L(data.health,'steps')?.steps??0)/1000).toFixed(1)}k`:'—', dt:d(L(data.health,'steps')?.steps??null, P(data.health,'steps')?.steps??null) },
  ];

  const factors = [
    { l:'Activity', v:ls.activity, c:'var(--green)', i:<Zap size={11}/> },
    { l:'Nutrition', v:ls.nutrition, c:'var(--amber)', i:<Flame size={11}/> },
    { l:'Sleep', v:ls.sleep, c:'var(--purple)', i:<Moon size={11}/> },
    { l:'Recovery', v:ls.recovery, c:'var(--red)', i:<Heart size={11}/> },
    { l:'Finance', v:ls.finance, c:'var(--blue)', i:<Wallet size={11}/> },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* ── Ticker ── */}
      {insights.length > 0 && (
        <div className="fade" style={{ overflow:'hidden', borderRadius:10, background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.03)' }}>
          <div className="ticker" style={{ display:'flex', whiteSpace:'nowrap', padding:'7px 0' }}>
            {[...insights,...insights].map((ins,i) => (
              <span key={i} className="font-data" style={{ display:'inline-block', margin:'0 16px', fontSize:9, fontWeight:600, flexShrink:0, color: ins.tone==='good'?'var(--green)':ins.tone==='warn'?'var(--amber)':'var(--t2)' }}>
                {ins.emoji} {ins.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Life Score ── */}
      <div className="panel fade" style={{ padding:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ position:'relative', width:68, height:68, flexShrink:0 }}>
            <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6"/>
              <circle cx="50" cy="50" r="43" fill="none" stroke={scoreColor(ls.total)} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${ls.total*2.7} 270`} style={{ filter:`drop-shadow(0 0 6px ${scoreColor(ls.total)})`, transition:'stroke-dasharray .8s ease' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span className="font-data" style={{ fontWeight:800, fontSize:19, lineHeight:1 }}>{ls.total}</span>
              <span style={{ fontSize:7, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em' }}>Score</span>
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="font-display" style={{ fontWeight:700, fontSize:14, color:scoreColor(ls.total), lineHeight:1 }}>{scoreLabel(ls.total)}</div>
            <div className="font-data" style={{ fontSize:8, color:'var(--t3)', margin:'3px 0 7px' }}>7-day composite</div>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {factors.map(sf => (
                <div key={sf.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0, width:56, color:sf.c }}>
                    {sf.i}<span style={{ fontSize:7, fontWeight:700, color:'var(--t3)', textTransform:'uppercase' }}>{sf.l}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}><div className="bar-track"><div className="bar-fill" style={{ width:`${sf.v}%`, background:sf.c }}/></div></div>
                  <span className="font-data" style={{ fontSize:8, fontWeight:700, flexShrink:0, width:18, textAlign:'right', color:sf.c }}>{sf.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid-kpi">
        {kpis.map((s,i) => (
          <div key={s.l} className={`panel stat-card fade d${i+1}`} style={{ padding:'10px 12px' }} onClick={()=>onNavigate('health')}>
            <div className="accent-line" style={{ background:s.c, opacity:.5 }}/>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'var(--t3)', marginBottom:3 }}>{s.l}</div>
            <div className="font-data" style={{ fontWeight:800, fontSize:17, lineHeight:1.1 }}>
              {s.v}<span style={{ fontSize:8, color:'var(--t3)', marginLeft:2 }}>{s.u}</span>
            </div>
            {s.dt != null && <div className="font-data" style={{ fontSize:9, marginTop:2, color:dColor(s.dt,s.lb) }}>
              {s.dt>0?'+':''}{s.dt.toFixed(1)}
              {s.dt!==0 && (s.dt>0===!s.lb ? <TrendingUp size={8} style={{display:'inline',marginLeft:2}}/> : <TrendingDown size={8} style={{display:'inline',marginLeft:2}}/>)}
            </div>}
          </div>
        ))}
      </div>

      {/* ── Weight + Fuel ── */}
      <div className="grid-main-side">
        <div className="panel fade d3" style={{ padding:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span className="font-display" style={{ fontWeight:600, fontSize:12 }}>Weight Trend</span>
            <span className="font-data" style={{ fontSize:9, color:'var(--t3)' }}>{wt.length} pts</span>
          </div>
          <div className="chart-wrap" style={{ height:150, '--chart-accent':'rgba(6,182,212,0.3)' } as any}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={wt}>
                <defs><linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={.2}><animate attributeName="stop-opacity" values=".2;.08;.2" dur="4s" repeatCount="indefinite"/></stop>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient></defs>
                <Tooltip cursor={<CrosshairCursor/>} content={<FloatingTooltip unit="kg" color="#06b6d4"/>} isAnimationActive={false}/>
                <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2} fill="url(#gW)" activeDot={{r:4,stroke:'#fff',strokeWidth:2}}/>
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fill:'#3e4759',fontSize:8,fontWeight:700}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel fade d4" style={{ padding:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
            <Flame size={13} style={{color:'var(--amber)'}}/><span className="font-display" style={{fontWeight:600,fontSize:12}}>Fuel</span>
            <span className="font-data" style={{fontSize:8,color:'var(--t3)',marginLeft:'auto'}}>{fuel.lbl} · {fuel.n}m</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
              <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',transform:'rotate(-90deg)'}}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke={fuel.cal>2200?'var(--red)':'var(--green)'} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${Math.min(100,(fuel.cal/2200)*100)*2.51} 251`}/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <span className="font-data" style={{fontWeight:800,fontSize:11}}>{fuel.cal||'—'}</span>
                <span style={{fontSize:6,color:'var(--t3)'}}>/ 2200</span>
              </div>
            </div>
            <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:5}}>
              <Bar l="Protein" v={fuel.p} t={120} u="g" c="var(--green)"/>
              <Bar l="Carbs" v={fuel.c} t={200} u="g" c="var(--cyan)"/>
              <Bar l="Fat" v={fuel.f} t={70} u="g" c="var(--amber)"/>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Droplets size={12} style={{color:'var(--cyan)'}}/>
            <div style={{flex:1}}><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,(fuel.w/3000)*100)}%`,background:'var(--cyan)'}}/></div></div>
            <span className="font-data" style={{fontSize:10,fontWeight:700,flexShrink:0}}>{fuel.w?`${(fuel.w/1000).toFixed(1)}L`:'—'}<span style={{color:'var(--t3)'}}>/3</span></span>
          </div>
        </div>
      </div>

      {/* ── Mini Charts ── */}
      <div className="grid-2">
        <Mini t="Sleep" data={slp} c="#a855f7" u="" i={<Moon size={11}/>}/>
        <Mini t="RHR" data={rhr} c="#ff3b3b" u="bpm" i={<Heart size={11}/>}/>
      </div>

      {/* ── Spending + Events ── */}
      <div className="grid-2">
        <div className="panel fade d5" style={{padding:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}><Wallet size={13} style={{color:'var(--green)'}}/><span className="font-display" style={{fontWeight:600,fontSize:12}}>Spending</span></div>
            <span className="font-data" style={{fontSize:12,fontWeight:800,color:spend.total>2500?'var(--red)':'var(--t1)'}}>{spend.total} lei</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {spend.cats.map(c=>(
              <div key={c.n} style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{fontSize:11,flexShrink:0}}>{categoryEmoji(c.n)}</span>
                <span style={{fontSize:9,color:'var(--t2)',textTransform:'capitalize',width:50,flexShrink:0}}>{c.n}</span>
                <div style={{flex:1,minWidth:0}}><div className="bar-track"><div className="bar-fill" style={{width:`${(c.v/(spend.cats[0]?.v||1))*100}%`,background:c.c}}/></div></div>
                <span className="font-data" style={{fontSize:10,fontWeight:700,flexShrink:0,minWidth:28,textAlign:'right'}}>{c.v}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>
            <ROI tx={data.transactions}/>
          </div>
        </div>
        <div className="panel fade d6" style={{padding:14}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8}}><Calendar size={13} style={{color:'var(--purple)'}}/><span className="font-display" style={{fontWeight:600,fontSize:12}}>Upcoming</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {!events.length&&<span style={{fontSize:10,color:'var(--t3)'}}>Nothing upcoming</span>}
            {events.map(e=>(
              <div key={e.id} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,cursor:'pointer'}} onClick={()=>onNavigate('calendar')}>
                <span style={{flexShrink:0}}>{categoryEmoji(e.type)}</span>
                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.title}</span>
                {e.cost>0&&<span className="font-data" style={{color:'var(--red)',flexShrink:0}}>{e.cost}</span>}
                <span className="font-data" style={{color:'var(--t3)',flexShrink:0,fontSize:9}}>{fDateShort(e.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Workouts ── */}
      <div className="panel fade d7" style={{padding:14}}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8}}><Activity size={13} style={{color:'var(--green)'}}/><span className="font-display" style={{fontWeight:600,fontSize:12}}>Workouts</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          {!data.workouts.length&&<span style={{fontSize:10,color:'var(--t3)'}}>No workouts</span>}
          {data.workouts.slice(0,4).map(w=>(
            <div key={w.id} style={{display:'flex',alignItems:'center',gap:5,fontSize:10}}>
              <span style={{flexShrink:0}}>{workoutEmoji(w.type)}</span>
              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textTransform:'capitalize'}}>{w.type.replace(/[_+]/g,' ')}{w.duration_min?` · ${Math.round(w.duration_min)}m`:''}{w.distance_km?` · ${w.distance_km}km`:''}</span>
              {w.heart_rate_avg&&<span className="font-data" style={{flexShrink:0,color:w.heart_rate_avg>160?'var(--red)':'var(--green)'}}>♥{w.heart_rate_avg}</span>}
              <span className="font-data" style={{color:'var(--t3)',flexShrink:0,fontSize:9}}>{fDateShort(w.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({l,v,t,u,c}:{l:string;v:number;t:number;u:string;c:string}) {
  return <div style={{minWidth:0}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:8,marginBottom:1}}>
      <span style={{color:'var(--t3)'}}>{l}</span>
      <span className="font-data" style={{fontWeight:700,flexShrink:0}}>{v||'—'}{u}</span>
    </div>
    <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,(v/t)*100)}%`,background:c}}/></div>
  </div>;
}

function Mini({t,data,c,u,i}:{t:string;data:{d:string;v:number|null}[];c:string;u:string;i:React.ReactNode}) {
  const gid=`g${t}`;
  return <div className="panel fade d5" style={{padding:10}}>
    <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:4,color:c}}>
      {i}<span style={{fontSize:7,fontWeight:700,textTransform:'uppercase',color:'var(--t3)'}}>{t}</span>
      {data.length>0&&<span className="font-data" style={{marginLeft:'auto',fontWeight:800,fontSize:12,color:c}}>{data[data.length-1].v}{u&&<span style={{fontSize:8,color:'var(--t3)',marginLeft:1}}>{u}</span>}</span>}
    </div>
    <div className="chart-wrap" style={{height:55,['--chart-accent' as any]:`${c}55`}}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data}>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={.18}/><stop offset="95%" stopColor={c} stopOpacity={0}/></linearGradient></defs>
          <Tooltip cursor={<CrosshairCursor/>} content={<FloatingTooltip unit={u} color={c}/>} isAnimationActive={false}/>
          <Area type="monotone" dataKey="v" stroke={c} strokeWidth={1.5} fill={`url(#${gid})`} activeDot={{r:3,stroke:'#fff',strokeWidth:1.5}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>;
}

function ROI({tx}:{tx:{roi_flag:string;amount:number;date:string}[]}) {
  const l=tx.filter(t=>daysAgo(t.date)<=30);
  const g={'+':0,'0':0,'-':0}; l.forEach(t=>{g[t.roi_flag as keyof typeof g]+=t.amount});
  const tot=g['+']+g['0']+g['-']||1;
  return <div>
    <div style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--t3)',marginBottom:4}}>ROI Split</div>
    <div style={{display:'flex',height:3,borderRadius:2,overflow:'hidden',gap:1}}>
      <div style={{width:`${(g['+']/tot)*100}%`,background:'var(--green)',borderRadius:2}}/>
      <div style={{width:`${(g['0']/tot)*100}%`,background:'var(--t3)',borderRadius:2}}/>
      <div style={{width:`${(g['-']/tot)*100}%`,background:'var(--red)',borderRadius:2}}/>
    </div>
    <div className="font-data" style={{display:'flex',justifyContent:'space-between',marginTop:3,fontSize:8}}>
      <span style={{color:'var(--green)'}}>+{Math.round(g['+'])}</span>
      <span style={{color:'var(--t3)'}}>~{Math.round(g['0'])}</span>
      <span style={{color:'var(--red)'}}>-{Math.round(g['-'])}</span>
    </div>
  </div>;
}
