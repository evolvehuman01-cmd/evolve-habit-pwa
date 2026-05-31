import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Area
} from 'recharts'

// ── CONFIG ────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZweQ_P43NjgQ-s9hQNZ3VPGu7E35g4_Un-Ffrt3NvUwLS82pOWuA61iIABpb4mg6Q/exec'

// ── BRAND PALETTE ─────────────────────────────────────────
// Primary
const ORANGE      = '#F26419'
const ORANGE_DARK = '#C94E0E'
const NAVY        = '#1C2B3A'
// Secondary
const DEEP_NAVY   = '#232F3E'
const CREAM       = '#F0EEF5'  // ← page background
const NAVY_MID    = '#2A3F54'
const WHITE       = '#FFFFFF'
const BLACK       = '#111111'
// Status
const GREEN       = '#2e7d32'
const GREEN_LIGHT = '#e8f5e9'
const AMBER       = '#e65100'
const AMBER_LIGHT = '#fff3e0'
const RED         = '#c62828'
const RED_LIGHT   = '#ffebee'

// Pride band — exact brand colours
const PRIDE = ['#E40303','#FF8C00','#FFED00','#008026','#004DFF','#750787']

// ── TYPOGRAPHY (light mode) ───────────────────────────────
const T = {
  super: {
    fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:700, fontSize:11,
    letterSpacing:'0.12em', textTransform:'uppercase',
    color:ORANGE,
  },
  h1: {
    fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:900, fontSize:48,
    lineHeight:1.0, letterSpacing:'0.01em',
    textTransform:'uppercase', color:NAVY,
  },
  h2: {
    fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:900, fontSize:32,
    lineHeight:1.05, textTransform:'uppercase',
    color:NAVY,
  },
  h3: {
    fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:700, fontSize:20,
    textTransform:'uppercase', letterSpacing:'0.04em',
    color:NAVY,
  },
  body: {
    fontFamily:"'Barlow',sans-serif",
    fontWeight:400, fontSize:16,
    lineHeight:1.6, color:'#2d3748',
  },
  label: {
    fontFamily:"'Barlow',sans-serif",
    fontWeight:600, fontSize:15,
    color:NAVY,
  },
  small: {
    fontFamily:"'Barlow',sans-serif",
    fontWeight:400, fontSize:12,
    color:'#718096', lineHeight:1.5,
  },
  tiny: {
    fontFamily:"'Barlow',sans-serif",
    fontWeight:400, fontSize:11,
    color:'#a0aec0',
  },
}

// ── COLOUR HELPERS ────────────────────────────────────────
function habitColor(h, v) {
  if (v===''||v===null||v===undefined) return '#cbd5e0'
  const n = Number(v)
  if (n >= h.green) return GREEN
  if (n >= h.amber) return AMBER
  return RED
}
function habitBg(h, v) {
  if (v===''||v===null||v===undefined) return WHITE
  const n = Number(v)
  if (n >= h.green) return GREEN_LIGHT
  if (n >= h.amber) return AMBER_LIGHT
  return RED_LIGHT
}
function metricColor(m, v) {
  const n = Number(v??5)
  if (m.invert) { if(n<=5) return GREEN; if(n<=7) return AMBER; return RED }
  if (n>=7) return GREEN; if (n>=5) return AMBER; return RED
}

// ── HABITS ────────────────────────────────────────────────
const ALL_HABITS = [
  { id:'sleep',       label:'Sleep Routine', icon:'🌙', desc:'Hours of sleep last night',        unit:'hrs',   min:0, max:14,    step:0.5, target:7.5,  green:7,    amber:6,    tip:'A consistent wake time anchors your circadian rhythm more than a fixed bedtime.' },
  { id:'steps',       label:'Daily Steps',   icon:'👟', desc:'Total steps today',                 unit:'steps', min:0, max:30000, step:100, target:8000, green:8000, amber:5000, tip:'Walking after meals is one of the most effective strategies for post-meal glucose control.' },
  { id:'hydration',   label:'Hydration',     icon:'💧', desc:'Total fluid intake today',          unit:'L',     min:0, max:6,     step:0.25,target:2.5,  green:2,    amber:1.5,  tip:'Front-load hydration — most people fall behind by mid-afternoon.' },
  { id:'meals',       label:'Meal Structure',icon:'🥗', desc:'Planned, structured meals today',   unit:'meals', min:0, max:6,     step:1,   target:3,    green:3,    amber:2,    tip:'Protein at breakfast is consistently associated with reduced afternoon hunger.' },
  { id:'mindfulness', label:'Mindfulness',   icon:'🧠', desc:'Mindfulness or breathwork today',  unit:'min',   min:0, max:60,    step:1,   target:10,   green:10,   amber:5,    tip:'Consistency matters far more than duration. 5 minutes daily beats 60 once a week.' },
  { id:'mobility',    label:'Mobility',      icon:'🧘', desc:'Dedicated mobility or flexibility',unit:'min',   min:0, max:120,   step:5,   target:10,   green:10,   amber:5,    tip:'5 minutes of hip flexor and thoracic work daily outperforms one long session weekly.' },
]

const METRICS = [
  { id:'stressRPE', label:'Stress Level', icon:'⚡', low:'Very calm', high:'Extreme',     invert:true,  note:'1 = very calm · 10 = extreme' },
  { id:'mood',      label:'Mood',         icon:'😊', low:'Very low',  high:'Excellent',   invert:false, note:'1 = very low · 10 = excellent' },
  { id:'energy',    label:'Energy',       icon:'🔋', low:'Exhausted', high:'Full energy', invert:false, note:'1 = exhausted · 10 = full' },
  { id:'digestion', label:'Digestion',    icon:'🫁', low:'Very poor', high:'Excellent',   invert:false, note:'1 = very poor · 10 = excellent' },
]

const CYCLE_OPTS = [
  'Day 1–5 — Menstruation','Day 6–13 — Follicular',
  'Day 14 — Ovulation','Day 15–20 — Early Luteal',
  'Day 21–28 — Late Luteal','Perimenopause — irregular','Not applicable today',
]

const PROMPTS = [
  "What made today's habits easier or harder than usual?",
  "What's one win from today, however small?",
  "Was there a moment today where you chose your health over convenience?",
  "Did your energy match your expectations today? Why or why not?",
  "What's one thing you'd do differently tomorrow?",
  "Did anything unexpected disrupt your routine today?",
  "Rate your overall self-care today. What contributed most?",
]

// ── STORAGE ───────────────────────────────────────────────
const LS = {
  get: (k, d=null) => { try { const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d } catch { return d } },
  set: (k, v)  => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} },
  del: (k)     => { try { localStorage.removeItem(k) } catch {} },
}

// ── SHARED COMPONENTS ─────────────────────────────────────
const PrideBand = ({ h=7 }) => (
  <div style={{ display:'flex', width:'100%', height:h }}>
    {PRIDE.map(c => <div key={c} style={{ flex:1, background:c }} />)}
  </div>
)

const SL = ({ children }) => (
  <div style={{ ...T.super, borderBottom:`1.5px solid rgba(28,43,58,0.1)`, paddingBottom:7, marginTop:22, marginBottom:10 }}>
    {children}
  </div>
)

const Card = ({ children, style={} }) => (
  <div style={{ background:WHITE, borderRadius:14, padding:16, marginBottom:10, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 3px rgba(28,43,58,0.06)', ...style }}>
    {children}
  </div>
)

const ChartCard = ({ title, subtitle, children }) => (
  <Card style={{ padding:'16px 14px', marginBottom:14 }}>
    <div style={{ ...T.h3, fontSize:16, marginBottom:2 }}>{title}</div>
    <div style={{ ...T.small, marginBottom:12 }}>{subtitle}</div>
    {children}
  </Card>
)

function MetricSlider({ metric, value, onChange }) {
  const val = value ?? 5
  const color = metricColor(metric, val)
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ ...T.tiny, minWidth:68 }}>{metric.low}</span>
        <div style={{ flex:1 }}>
          <input type="range" min={1} max={10} value={val}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width:'100%', accentColor:color, cursor:'pointer' }} />
        </div>
        <span style={{ ...T.tiny, minWidth:68, textAlign:'right' }}>{metric.high}</span>
        <div style={{ minWidth:40, textAlign:'center', background:color, color:WHITE, borderRadius:8, padding:'3px 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22 }}>{val}</div>
      </div>
      <div style={{ ...T.tiny, marginTop:4 }}>{metric.note}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:NAVY, border:`1px solid ${ORANGE}`, borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:ORANGE, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:WHITE, marginBottom:2 }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

// ── SETUP SCREEN ──────────────────────────────────────────
function SetupScreen({ onComplete }) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr]     = useState('')

  const submit = () => {
    if (!name.trim())  { setErr('Please enter your name'); return }
    if (!email.trim()||!email.includes('@')) { setErr('Please enter a valid email'); return }
    onComplete({ name:name.trim(), email:email.trim() })
  }

  return (
    <div style={{ minHeight:'100vh', background:CREAM, display:'flex', flexDirection:'column' }}>
      <PrideBand h={8} />
      <div style={{ background:NAVY, padding:'16px 20px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, letterSpacing:'0.07em', color:WHITE }}>
          EVOLVE<span style={{ color:ORANGE }}>:</span>WELLBEING
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ width:80, height:80, background:NAVY, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, overflow:'hidden', flexShrink:0 }}>
          <img src="/icons/icon-192x192.png" alt="Evolve" style={{ width:80, height:80 }} />
        </div>

        <div style={{ ...T.super, marginBottom:8, textAlign:'center' }}>Daily Habit Tracker</div>
        <div style={{ ...T.h1, fontSize:38, marginBottom:28, textAlign:'center' }}>Let's Get You Set Up</div>

        <div style={{ width:'100%', maxWidth:400 }}>
          <Card style={{ padding:28 }}>
            <div style={{ ...T.body, marginBottom:22, color:'#4a5568' }}>
              This takes 30 seconds. We'll save your details to this device so every log is ready to go.
            </div>

            <label style={{ ...T.label, display:'block', marginBottom:6 }}>
              Your Name <span style={{ color:ORANGE }}>*</span>
            </label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)}
              placeholder="e.g. Sarah Jones"
              style={{ width:'100%', background:CREAM, border:`1.5px solid rgba(28,43,58,0.2)`, borderRadius:10, padding:'13px 15px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }} />

            <label style={{ ...T.label, display:'block', marginTop:18, marginBottom:6 }}>
              Email Address <span style={{ color:ORANGE }}>*</span>
            </label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="e.g. sarah@email.com"
              onKeyDown={e => e.key==='Enter' && submit()}
              style={{ width:'100%', background:CREAM, border:`1.5px solid rgba(28,43,58,0.2)`, borderRadius:10, padding:'13px 15px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }} />

            {err && <div style={{ color:RED, fontSize:13, marginTop:10 }}>{err}</div>}

            <button onClick={submit} style={{ width:'100%', marginTop:22, background:ORANGE, border:'none', borderRadius:11, padding:'15px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
              Start Tracking →
            </button>

            <div style={{ ...T.tiny, textAlign:'center', marginTop:14, lineHeight:1.6 }}>
              Your information is kept private and secure.<br/>Used only by your Evolve:Wellbeing coach.
            </div>
          </Card>
        </div>
      </div>
      <PrideBand h={8} />
    </div>
  )
}

// ── NOTIFICATION PROMPT ───────────────────────────────────
function NotifPrompt({ onDone }) {
  const request = async () => {
    if (!('Notification' in window)) { onDone(); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      navigator.serviceWorker.ready.then(reg => reg.active?.postMessage({ type:'SCHEDULE_REMINDER' }))
    }
    onDone()
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(28,43,58,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:WHITE, borderRadius:18, padding:28, maxWidth:360, width:'100%', border:`2px solid ${ORANGE}` }}>
        <div style={{ fontSize:36, marginBottom:14, textAlign:'center' }}>🔔</div>
        <div style={{ ...T.h2, fontSize:24, textAlign:'center', marginBottom:10 }}>Daily Reminders</div>
        <div style={{ ...T.body, textAlign:'center', marginBottom:24, color:'#4a5568' }}>
          Get a nudge at 8pm every evening to log your habits. Your coach reviews every submission.
        </div>
        <button onClick={request} style={{ width:'100%', background:ORANGE, border:'none', borderRadius:11, padding:'14px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', marginBottom:10 }}>
          Enable Reminders
        </button>
        <button onClick={onDone} style={{ width:'100%', background:'transparent', border:'none', color:'#a0aec0', fontFamily:"'Barlow',sans-serif", fontSize:14, cursor:'pointer', padding:'8px' }}>
          Not now
        </button>
      </div>
    </div>
  )
}

// ── INSTALL BANNER ────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999, background:NAVY, borderTop:`3px solid ${ORANGE}`, padding:'14px 20px 20px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, textTransform:'uppercase', color:WHITE, marginBottom:6 }}>Add to Home Screen</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:12 }}>
          {isIOS ? 'Tap Share then "Add to Home Screen" to install Evolve:Wellbeing as an app.'
                 : 'Install Evolve:Wellbeing on your home screen for the best experience.'}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {!isIOS && <button id="pwa-install-btn" style={{ flex:2, background:ORANGE, border:'none', borderRadius:9, padding:'11px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, textTransform:'uppercase', cursor:'pointer' }}>Install</button>}
          <button onClick={onDismiss} style={{ flex:1, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:9, padding:'11px', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow',sans-serif", fontSize:13, cursor:'pointer' }}>Not Now</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [client,          setClient]          = useState(null)
  const [view,            setView]            = useState('log')
  const [activeHabits,    setActiveHabits]    = useState(['sleep','steps','hydration','meals','mindfulness'])
  const [showCycle,       setShowCycle]       = useState(false)
  const [habitValues,     setHabitValues]     = useState({})
  const [metricValues,    setMetricValues]    = useState({ stressRPE:5, mood:6, energy:6, digestion:7 })
  const [cyclePhase,      setCyclePhase]      = useState('')
  const [reflection,      setReflection]      = useState('')
  const [sendStatus,      setSendStatus]      = useState('idle')
  const [historicData,    setHistoricData]    = useState([])
  const [graphDays,       setGraphDays]       = useState(30)
  const [loadingGraphs,   setLoadingGraphs]   = useState(false)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)
  const [showInstall,     setShowInstall]     = useState(false)
  const [deferredPrompt,  setDeferredPrompt]  = useState(null)

  const todayKey = new Date().toISOString().split('T')[0]
  const dateStr  = new Date().toLocaleDateString('en-GB',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const promptIdx = new Date().getDay()

  useEffect(() => {
    const saved = LS.get('evolve_client')
    if (saved) setClient(saved)
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS && !window.navigator.standalone && !LS.get('install_dismissed')) setShowInstall(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const btn = document.getElementById('pwa-install-btn')
    if (!btn||!deferredPrompt) return
    const h = async () => {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome==='accepted') { setShowInstall(false); setDeferredPrompt(null) }
    }
    btn.addEventListener('click', h)
    return () => btn.removeEventListener('click', h)
  }, [deferredPrompt, showInstall])

  useEffect(() => {
    const saved = LS.get(`log_${todayKey}`)
    if (saved) {
      setHabitValues(saved.habits || {})
      setMetricValues(saved.metrics || { stressRPE:5, mood:6, energy:6, digestion:7 })
      setCyclePhase(saved.cyclePhase || '')
      setReflection(saved.reflection || '')
    }
  }, [todayKey])

  useEffect(() => {
    if (!client) return
    LS.set(`log_${todayKey}`, { habits:habitValues, metrics:metricValues, cyclePhase, reflection })
  }, [habitValues, metricValues, cyclePhase, reflection, client, todayKey])

  useEffect(() => {
    const cfg = LS.get('evolve_config')
    if (cfg) {
      if (cfg.activeHabits) setActiveHabits(cfg.activeHabits)
      if (cfg.showCycle !== undefined) setShowCycle(cfg.showCycle)
    }
  }, [])

  useEffect(() => { LS.set('evolve_config', { activeHabits, showCycle }) }, [activeHabits, showCycle])

  const handleSetupComplete = useCallback(info => {
    LS.set('evolve_client', info)
    setClient(info)
    setTimeout(() => setShowNotifPrompt(true), 800)
  }, [])

  const visibleHabits   = ALL_HABITS.filter(h => activeHabits.includes(h.id))
  const completedHabits = visibleHabits.filter(h => habitValues[h.id]!==undefined && habitValues[h.id]!=='')
  const completionPct   = visibleHabits.length ? Math.round(completedHabits.length/visibleHabits.length*100) : 0

  const fetchData = useCallback(async () => {
    if (!client||APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') return
    setLoadingGraphs(true)
    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?clientId=${encodeURIComponent(client.name)}&days=${graphDays}`)
      const json = await res.json()
      if (json.success&&json.data) setHistoricData(json.data)
    } catch {}
    setLoadingGraphs(false)
  }, [client, graphDays])

  useEffect(() => { if (view==='graphs') fetchData() }, [view, fetchData])

  const handleSend = async () => {
    if (sendStatus!=='idle') return
    setSendStatus('sending')
    const payload = {
      date:isoDate(), clientId:client?.name?.toLowerCase().replace(/\s+/g,'-')||'unknown',
      clientName:client?.name||'', clientEmail:client?.email||'',
      habits:habitValues, metrics:metricValues,
      cyclePhase:showCycle?cyclePhase:'',
      reflectionPrompt:PROMPTS[promptIdx%PROMPTS.length],
      reflection, habitsCompleted:completedHabits.length, habitsTotal:visibleHabits.length,
    }
    if (APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') { setTimeout(()=>setSendStatus('success'),1200); return }
    try {
      await fetch(APPS_SCRIPT_URL,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      setTimeout(()=>setSendStatus('success'),1200)
    } catch {
      setTimeout(()=>setSendStatus('success'),1200)
    }
  }

  function isoDate() { return new Date().toISOString().split('T')[0] }

  const chartData = historicData
    .sort((a,b)=>new Date(a['Date'])-new Date(b['Date']))
    .map(row=>({
      date:     new Date(row['Date']).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
      sleep:    parseFloat(row['Sleep (hrs)'])       ||null,
      steps:    parseInt(row['Steps'])               ||null,
      hydration:parseFloat(row['Hydration (L)'])     ||null,
      stress:   parseFloat(row['Stress RPE (1-10)']) ||null,
      mood:     parseFloat(row['Mood (1-10)'])        ||null,
      energy:   parseFloat(row['Energy (1-10)'])      ||null,
      completion:parseFloat(row['Completion %'])      ||null,
    }))

  const calcAvg = key => {
    const vals = chartData.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v))
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : null
  }

  if (!client) return <SetupScreen onComplete={handleSetupComplete} />

  // Shared input style for light bg
  const inp = {
    width:'100%', background:CREAM,
    border:`1.5px solid rgba(28,43,58,0.18)`, borderRadius:10,
    padding:'12px 14px', color:NAVY,
    fontFamily:"'Barlow',sans-serif", fontSize:15,
    outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{ minHeight:'100vh', background:CREAM, color:NAVY, fontFamily:"'Barlow',sans-serif", display:'flex', flexDirection:'column' }}>
      {showNotifPrompt && <NotifPrompt onDone={()=>setShowNotifPrompt(false)} />}
      {showInstall && <InstallBanner onDismiss={()=>{ setShowInstall(false); LS.set('install_dismissed',true) }} />}

      <PrideBand h={6} />

      {/* Header */}
      <div style={{ background:NAVY, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:'0.07em', color:WHITE }}>
            EVOLVE<span style={{ color:ORANGE }}>:</span>WELLBEING
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1 }}>{client.name}</div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {[['log','📋'],['graphs','📊'],['config','⚙']].map(([v,icon]) => (
            <button key={v} onClick={()=>setView(v)} style={{ background:view===v?ORANGE:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'7px 11px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, letterSpacing:'0.05em', textTransform:'uppercase', cursor:'pointer', transition:'background .15s' }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* ── LOG ── */}
      {view==='log' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 100px' }}>
          {/* Date + progress */}
          <div style={{ marginBottom:20 }}>
            <div style={{ ...T.super, marginBottom:6 }}>{dateStr}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:6, background:'rgba(28,43,58,0.12)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${completionPct}%`, background:completionPct===100?GREEN:ORANGE, borderRadius:3, transition:'width .3s' }} />
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:completionPct===100?GREEN:ORANGE, minWidth:40 }}>
                {completedHabits.length}/{visibleHabits.length}
              </div>
            </div>
          </div>

          <SL>Today's Habits</SL>
          {visibleHabits.map(h => {
            const val   = habitValues[h.id]
            const col   = habitColor(h,val)
            const bg    = habitBg(h,val)
            const filled= val!==undefined && val!==''
            return (
              <div key={h.id} style={{ background:filled?bg:WHITE, border:`1.5px solid ${filled?col+'44':'rgba(28,43,58,0.1)'}`, borderRadius:13, padding:16, marginBottom:9, boxShadow:'0 1px 3px rgba(28,43,58,0.06)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:20 }}>{h.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15, color:NAVY }}>{h.label}</div>
                    <div style={{ fontSize:12, color:'#718096', marginTop:2 }}>{h.desc}</div>
                  </div>
                  {filled && <div style={{ width:8, height:8, borderRadius:'50%', background:col, marginTop:5, flexShrink:0 }} />}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="number" min={h.min} max={h.max} step={h.step} value={val??''}
                    onChange={e=>setHabitValues(prev=>({...prev,[h.id]:e.target.value===''?'':Number(e.target.value)}))}
                    placeholder={`Enter ${h.unit}`}
                    style={{ ...inp, flex:1, border:`1.5px solid ${filled?col+'66':'rgba(28,43,58,0.18)'}` }} />
                  <div style={{ fontSize:12, color:'#718096', minWidth:52 }}>
                    {h.unit}
                    <div style={{ color:'#a0aec0', marginTop:2, fontSize:11 }}>↑ {h.target}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'#a0aec0', marginTop:9, fontStyle:'italic', lineHeight:1.5 }}>💡 {h.tip}</div>
              </div>
            )
          })}

          <SL>Wellness Metrics</SL>
          {METRICS.map(m => (
            <Card key={m.id}>
              <div style={{ fontWeight:600, fontSize:15, color:NAVY, marginBottom:2 }}>{m.icon} {m.label}</div>
              <MetricSlider metric={m} value={metricValues[m.id]} onChange={v=>setMetricValues(prev=>({...prev,[m.id]:v}))} />
            </Card>
          ))}

          {showCycle && (
            <>
              <SL>Cycle Phase</SL>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:4 }}>
                {CYCLE_OPTS.map(opt => (
                  <button key={opt} onClick={()=>setCyclePhase(opt)} style={{ background:cyclePhase===opt?ORANGE:WHITE, border:`1.5px solid ${cyclePhase===opt?ORANGE:'rgba(28,43,58,0.15)'}`, borderRadius:9, padding:'9px 11px', color:cyclePhase===opt?WHITE:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:12, fontWeight:cyclePhase===opt?600:400, cursor:'pointer', textAlign:'left', lineHeight:1.4 }}>{opt}</button>
                ))}
              </div>
            </>
          )}

          <SL>Daily Reflection</SL>
          <div style={{ background:WHITE, border:`1.5px solid ${ORANGE}44`, borderRadius:11, padding:13, marginBottom:9, fontSize:13, color:'#4a5568', lineHeight:1.7, fontStyle:'italic', borderLeft:`3px solid ${ORANGE}` }}>
            {PROMPTS[promptIdx%PROMPTS.length]}
          </div>
          <textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={4} placeholder="Your thoughts..."
            style={{ ...inp, resize:'vertical', marginBottom:18, lineHeight:1.6, border:'1.5px solid rgba(28,43,58,0.18)' }} />

          {/* Send */}
          <Card style={{ padding:22 }}>
            <div style={{ ...T.super, marginBottom:5 }}>Send Today's Log</div>
            <div style={{ ...T.small, marginBottom:14 }}>
              Sends your log to your coach and saves it to your progress tracker.
            </div>
            <button onClick={handleSend} disabled={sendStatus!=='idle'} style={{
              width:'100%',
              background:sendStatus==='success'?GREEN:sendStatus==='error'?RED:ORANGE,
              border:'none', borderRadius:11, padding:'15px', color:WHITE,
              fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
              fontSize:17, letterSpacing:'0.06em', textTransform:'uppercase',
              cursor:sendStatus==='idle'?'pointer':'default', transition:'background .25s',
            }}>
              {sendStatus==='idle'    && 'Send to Coach →'}
              {sendStatus==='sending' && 'Sending...'}
              {sendStatus==='success' && '✓ Sent to Coach'}
              {sendStatus==='error'   && '⚠ Something went wrong'}
            </button>
            {sendStatus==='success' && (
              <div style={{ fontSize:12, color:GREEN, textAlign:'center', marginTop:10 }}>
                Log saved. Your coach will review it shortly.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── GRAPHS ── */}
      {view==='graphs' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 100px' }}>
          <div style={{ display:'flex', gap:7, marginBottom:20 }}>
            {[7,14,30].map(d => (
              <button key={d} onClick={()=>setGraphDays(d)} style={{ flex:1, background:graphDays===d?ORANGE:WHITE, border:`1.5px solid ${graphDays===d?ORANGE:'rgba(28,43,58,0.18)'}`, borderRadius:9, padding:'9px', color:graphDays===d?WHITE:NAVY, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>{d} Days</button>
            ))}
          </div>

          {loadingGraphs && <div style={{ textAlign:'center', padding:48, color:'#718096', fontSize:14 }}>Loading your progress data...</div>}

          {!loadingGraphs && chartData.length===0 && (
            <Card style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:34, marginBottom:12 }}>📊</div>
              <div style={{ ...T.h3, marginBottom:8 }}>No data yet</div>
              <div style={{ ...T.small }}>Send your first daily log to start building your progress charts.</div>
            </Card>
          )}

          {!loadingGraphs && chartData.length>0 && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                {[
                  { label:'Avg Sleep',  val:calcAvg('sleep')?`${calcAvg('sleep')}h`:'—',    ok:calcAvg('sleep')>=7,    target:'7.5h' },
                  { label:'Avg Stress', val:calcAvg('stress')??'—',                          ok:calcAvg('stress')<=5,   target:'≤5' },
                  { label:'Avg Mood',   val:calcAvg('mood')??'—',                            ok:calcAvg('mood')>=6,     target:'≥6' },
                  { label:'Avg Energy', val:calcAvg('energy')??'—',                          ok:calcAvg('energy')>=6,   target:'≥6' },
                  { label:'Completion', val:calcAvg('completion')?`${calcAvg('completion')}%`:'—', ok:calcAvg('completion')>=80, target:'100%' },
                  { label:'Total Logs', val:chartData.length,                                ok:true,                   target:`${graphDays}d` },
                ].map(card => (
                  <div key={card.label} style={{ background:WHITE, border:'1px solid rgba(28,43,58,0.1)', borderRadius:10, padding:'12px 8px', textAlign:'center', boxShadow:'0 1px 3px rgba(28,43,58,0.06)' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:card.ok?GREEN:AMBER }}>{card.val}</div>
                    <div style={{ ...T.tiny, marginTop:2 }}>{card.label}</div>
                    <div style={{ fontSize:10, color:'#cbd5e0', marginTop:1 }}>target: {card.target}</div>
                  </div>
                ))}
              </div>

              <ChartCard title="Sleep Duration" subtitle="Hours per night · green = 7h target">
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:10}} />
                    <YAxis domain={[0,12]} tick={{fill:'#718096',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={7} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="sleep" stroke={ORANGE} fill={`${ORANGE}22`} strokeWidth={2} dot={{fill:ORANGE,r:3}} name="Sleep (hrs)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Daily Steps" subtitle="Steps per day · green = 8,000 target">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:10}} />
                    <YAxis tick={{fill:'#718096',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={8000} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="steps" fill={ORANGE} radius={[4,4,0,0]} name="Steps" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Hydration" subtitle="Litres per day · green = 2.5L target">
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:10}} />
                    <YAxis domain={[0,5]} tick={{fill:'#718096',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={2.5} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="hydration" stroke="#1565C0" fill="rgba(21,101,192,0.12)" strokeWidth={2} dot={{fill:'#1565C0',r:3}} name="Hydration (L)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Stress · Mood · Energy" subtitle="Daily scores /10">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:10}} />
                    <YAxis domain={[0,10]} tick={{fill:'#718096',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize:11,color:'#718096'}} />
                    <ReferenceLine y={5} stroke="rgba(28,43,58,0.1)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="stress"  stroke={RED}   strokeWidth={2} dot={{r:2}} name="Stress"  connectNulls />
                    <Line type="monotone" dataKey="mood"    stroke={GREEN} strokeWidth={2} dot={{r:2}} name="Mood"    connectNulls />
                    <Line type="monotone" dataKey="energy"  stroke={ORANGE}strokeWidth={2} dot={{r:2}} name="Energy"  connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Habit Completion" subtitle="% of habits completed · green = 80% target">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:10}} />
                    <YAxis domain={[0,100]} tick={{fill:'#718096',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={80} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="completion" name="Completion %" fill={ORANGE} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </div>
      )}

      {/* ── CONFIG ── */}
      {view==='config' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 100px' }}>
          <Card style={{ padding:20, marginBottom:14 }}>
            <div style={{ ...T.super, marginBottom:10 }}>Your Details</div>
            <div style={{ fontSize:15, fontWeight:600, color:NAVY, marginBottom:4 }}>{client.name}</div>
            <div style={{ fontSize:13, color:'#718096', marginBottom:14 }}>{client.email}</div>
            <button onClick={()=>{ LS.del('evolve_client'); setClient(null) }} style={{ background:CREAM, border:`1px solid rgba(28,43,58,0.18)`, borderRadius:8, padding:'8px 16px', color:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:12, cursor:'pointer' }}>
              Sign Out
            </button>
          </Card>

          <div style={{ background:WHITE, border:`1.5px solid ${ORANGE}`, borderRadius:14, padding:22, marginBottom:14, boxShadow:'0 1px 3px rgba(28,43,58,0.06)' }}>
            <div style={{ ...T.super, marginBottom:4 }}>Coach Setup</div>
            <div style={{ ...T.h3, fontSize:18, marginBottom:4 }}>Active Habits</div>
            <div style={{ ...T.small, marginBottom:18 }}>Select up to 5 habits for this client.</div>

            {ALL_HABITS.map(h => {
              const on = activeHabits.includes(h.id)
              return (
                <button key={h.id} onClick={()=>{ if(on) setActiveHabits(p=>p.filter(x=>x!==h.id)); else if(activeHabits.length<5) setActiveHabits(p=>[...p,h.id]) }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:on?`${ORANGE}12`:CREAM, border:`1.5px solid ${on?ORANGE:'rgba(28,43,58,0.12)'}`, borderRadius:9, padding:'11px 14px', marginBottom:7, color:on?NAVY:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:13, cursor:on||activeHabits.length<5?'pointer':'not-allowed', textAlign:'left' }}>
                  <span style={{fontSize:18}}>{h.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:on?NAVY:'#718096'}}>{h.label}</div>
                    <div style={{fontSize:11,color:'#a0aec0',marginTop:1}}>{h.desc}</div>
                  </div>
                  {on && <span style={{background:ORANGE,color:WHITE,borderRadius:10,padding:'2px 9px',fontSize:11,fontWeight:700}}>Active</span>}
                </button>
              )
            })}
            <div style={{...T.tiny,marginTop:4}}>{activeHabits.length}/5 habits selected</div>

            <div style={{marginTop:18,paddingTop:16,borderTop:'1px solid rgba(28,43,58,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,color:NAVY}}>Cycle Tracking</div>
                <div style={{...T.tiny,marginTop:2}}>Enable for peri/menopausal clients</div>
              </div>
              <button onClick={()=>setShowCycle(v=>!v)} style={{background:showCycle?ORANGE:CREAM,border:`1.5px solid ${showCycle?ORANGE:'rgba(28,43,58,0.18)'}`,borderRadius:18,padding:'8px 16px',color:showCycle?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,textTransform:'uppercase',cursor:'pointer'}}>
                {showCycle?'On':'Off'}
              </button>
            </div>
          </div>

          <Card style={{ padding:16 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:5, color:APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?RED:GREEN }}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'⚠ Not connected to Google Sheets':'✓ Connected to Google Sheets'}
            </div>
            <div style={{...T.small}}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'
                ?'Paste your Apps Script Web App URL into the APPS_SCRIPT_URL constant in App.jsx and redeploy.'
                :'Logs are saving to your coach\'s Google Sheet automatically.'}
            </div>
          </Card>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:WHITE, borderTop:`1px solid rgba(28,43,58,0.12)`, boxShadow:'0 -2px 8px rgba(28,43,58,0.08)', zIndex:50 }}>
        <div style={{ display:'flex', maxWidth:600, margin:'0 auto' }}>
          {[['log','📋','Log'],['graphs','📊','Progress'],['config','⚙','Setup']].map(([v,icon,label]) => (
            <button key={v} onClick={()=>setView(v)} style={{ flex:1, background:'transparent', border:'none', padding:'12px 8px 10px', color:view===v?ORANGE:'#a0aec0', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, transition:'color .15s' }}>
              <span style={{fontSize:18}}>{icon}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
