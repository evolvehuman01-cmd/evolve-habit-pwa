import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Area
} from 'recharts'

// ── CONFIG ────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZweQ_P43NjgQ-s9hQNZ3VPGu7E35g4_Un-Ffrt3NvUwLS82pOWuA61iIABpb4mg6Q/exec'

// ── BRAND ─────────────────────────────────────────────────
const C = {
  orange: '#F26419',
  navy:   '#1C2B3A',
  deep:   '#232F3E',
  mid:    '#2A3F54',
  white:  '#FFFFFF',
  green:  '#4caf50',
  amber:  '#ffb300',
  red:    '#ef5350',
}
const PRIDE = ['#E03131','#F26419','#F5C800','#2E7D32','#1565C0','#6A1B9A']

// ── EVIDENCE-BASED HABIT HIERARCHY ───────────────────────
// 1. Sleep      — strongest predictor of all-cause mortality & wellbeing
// 2. Steps      — 15% mortality reduction per 1,000 steps (meta-analysis)
// 3. Hydration  — immediate physiological impact; enables all other habits
// 4. Meals      — circadian alignment reduces metabolic risk
// 5. Mindfulness— strong stress & cortisol evidence, primarily psychological
// 6. Mobility   — injury prevention; priority when recovery flagged

const ALL_HABITS = [
  { id:'sleep',       label:'Sleep Routine', icon:'🌙', desc:'Hours of sleep last night',         unit:'hrs',   min:0, max:14,    step:0.5, target:7.5,  green:7,    amber:6,    tip:'A consistent wake time anchors your circadian rhythm more than a fixed bedtime.' },
  { id:'steps',       label:'Daily Steps',   icon:'👟', desc:'Total steps today',                  unit:'steps', min:0, max:30000, step:100, target:8000, green:8000, amber:5000, tip:'Walking after meals is one of the most effective strategies for post-meal glucose control.' },
  { id:'hydration',   label:'Hydration',     icon:'💧', desc:'Total fluid intake today',           unit:'L',     min:0, max:6,     step:0.25,target:2.5,  green:2,    amber:1.5,  tip:'Front-load hydration — most people fall behind by mid-afternoon.' },
  { id:'meals',       label:'Meal Structure',icon:'🥗', desc:'Planned, structured meals today',    unit:'meals', min:0, max:6,     step:1,   target:3,    green:3,    amber:2,    tip:'Protein at breakfast is consistently associated with reduced afternoon hunger.' },
  { id:'mindfulness', label:'Mindfulness',   icon:'🧠', desc:'Mindfulness or breathwork today',   unit:'min',   min:0, max:60,    step:1,   target:10,   green:10,   amber:5,    tip:'Consistency matters far more than duration. 5 minutes daily beats 60 once a week.' },
  { id:'mobility',    label:'Mobility',      icon:'🧘', desc:'Dedicated mobility or flexibility', unit:'min',   min:0, max:120,   step:5,   target:10,   green:10,   amber:5,    tip:'5 minutes of hip flexor and thoracic work daily outperforms a single long session weekly.' },
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
  get: (k, def=null) => { try { const v=localStorage.getItem(k); return v!==null ? JSON.parse(v) : def } catch { return def } },
  set: (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  del: (k)     => { try { localStorage.removeItem(k) } catch {} },
}

// ── COLOUR HELPERS ────────────────────────────────────────
function habitColor(h, v) {
  if (v===''||v===null||v===undefined) return 'rgba(255,255,255,0.25)'
  const n = Number(v)
  if (n >= h.green) return C.green
  if (n >= h.amber) return C.amber
  return C.red
}
function metricColor(m, v) {
  const n = Number(v??5)
  if (m.invert) { if(n<=5) return C.green; if(n<=7) return C.amber; return C.red }
  if (n>=7) return C.green; if (n>=5) return C.amber; return C.red
}

// ── PRIDE BAND ────────────────────────────────────────────
const PrideBand = ({ h=7 }) => (
  <div style={{ display:'flex', width:'100%', height:h }}>
    {PRIDE.map(c => <div key={c} style={{ flex:1, background:c }} />)}
  </div>
)

// ── SAFE AREA HELPERS ─────────────────────────────────────
const safeTop    = 'env(safe-area-inset-top, 0px)'
const safeBottom = 'env(safe-area-inset-bottom, 0px)'

// ── TOOLTIP ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:C.navy, border:`1px solid ${C.orange}`, borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:C.orange, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||C.white, marginBottom:2 }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

// ── SETUP SCREEN ──────────────────────────────────────────
function SetupScreen({ onComplete }) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [err,   setErr]   = useState('')

  const submit = () => {
    if (!name.trim())  { setErr('Please enter your name'); return }
    if (!email.trim()||!email.includes('@')) { setErr('Please enter a valid email'); return }
    onComplete({ name:name.trim(), email:email.trim() })
  }

  const inp = {
    width:'100%', background:'rgba(255,255,255,0.08)',
    border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:12,
    padding:'14px 16px', color:C.white,
    fontFamily:"'Barlow',sans-serif", fontSize:16,
    outline:'none', marginTop:10, boxSizing:'border-box',
  }

  return (
    <div style={{ minHeight:'100vh', background:C.deep, display:'flex', flexDirection:'column' }}>
      <PrideBand h={8} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
        {/* Icon */}
        <div style={{ width:88, height:88, background:C.navy, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28, overflow:'hidden', flexShrink:0 }}>
          <img src="/icons/icon-192x192.png" alt="Evolve" style={{ width:88, height:88 }} />
        </div>

        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, letterSpacing:'0.06em', marginBottom:6, textAlign:'center' }}>
          EVOLVE<span style={{ color:C.orange }}>:</span>WELLBEING
        </div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:C.orange, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:32, textAlign:'center' }}>
          Daily Habit Tracker
        </div>

        <div style={{ width:'100%', maxWidth:400, background:'rgba(255,255,255,0.04)', borderRadius:18, padding:28, border:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:6 }}>
            Let's Get You Set Up
          </div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:24 }}>
            This takes 30 seconds. We'll save your details to this device so every log is ready to go.
          </div>

          <label style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.85)', display:'block' }}>
            Your Name <span style={{ color:C.orange }}>*</span>
          </label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)}
            placeholder="e.g. Sarah Jones" style={inp} />

          <label style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.85)', display:'block', marginTop:20 }}>
            Email Address <span style={{ color:C.orange }}>*</span>
          </label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="e.g. sarah@email.com" style={inp}
            onKeyDown={e => e.key==='Enter' && submit()} />

          {err && <div style={{ color:C.red, fontSize:13, marginTop:10 }}>{err}</div>}

          <button onClick={submit} style={{
            width:'100%', marginTop:24, background:C.orange, border:'none',
            borderRadius:12, padding:'16px', color:C.white,
            fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
            fontSize:18, letterSpacing:'0.06em', textTransform:'uppercase',
            cursor:'pointer',
          }}>
            Start Tracking →
          </button>

          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', textAlign:'center', marginTop:16, lineHeight:1.5 }}>
            Your information is kept private and secure.<br />Used only by your Evolve:Wellbeing coach.
          </div>
        </div>
      </div>
      <PrideBand h={8} />
    </div>
  )
}

// ── INSTALL PROMPT ────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
      background:C.navy, borderTop:`3px solid ${C.orange}`,
      padding:'16px 20px', paddingBottom:`calc(16px + ${safeBottom})`,
    }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, textTransform:'uppercase', marginBottom:6 }}>
          Add to Home Screen
        </div>
        {isIOS ? (
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:14 }}>
            Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> to install Evolve:Wellbeing as an app.
          </div>
        ) : (
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:14 }}>
            Install Evolve:Wellbeing on your home screen for the best experience.
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          {!isIOS && (
            <button id="pwa-install-btn" style={{
              flex:2, background:C.orange, border:'none', borderRadius:10,
              padding:'12px', color:C.white, fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:700, fontSize:15, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
            }}>Install</button>
          )}
          <button onClick={onDismiss} style={{
            flex:1, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10,
            padding:'12px', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:700, fontSize:14, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
          }}>Not Now</button>
        </div>
      </div>
    </div>
  )
}

// ── NOTIFICATION PERMISSION ───────────────────────────────
function NotifPrompt({ onDone }) {
  const request = async () => {
    if (!('Notification' in window)) { onDone(); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.active?.postMessage({ type:'SCHEDULE_REMINDER' })
      })
    }
    onDone()
  }
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9998,
      background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div style={{ background:C.navy, borderRadius:18, padding:28, maxWidth:380, width:'100%', border:`1px solid ${C.orange}` }}>
        <div style={{ fontSize:36, marginBottom:14, textAlign:'center' }}>🔔</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, textTransform:'uppercase', marginBottom:10, textAlign:'center' }}>
          Daily Reminders
        </div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:24, textAlign:'center' }}>
          Get a nudge at 8pm every evening to log your habits. Your coach reviews every submission.
        </div>
        <button onClick={request} style={{
          width:'100%', background:C.orange, border:'none', borderRadius:12,
          padding:'15px', color:C.white, fontFamily:"'Barlow Condensed',sans-serif",
          fontWeight:900, fontSize:17, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', marginBottom:10,
        }}>Enable Reminders</button>
        <button onClick={onDone} style={{
          width:'100%', background:'transparent', border:'none',
          color:'rgba(255,255,255,0.4)', fontFamily:"'Barlow',sans-serif",
          fontSize:14, cursor:'pointer', padding:'8px',
        }}>Not now</button>
      </div>
    </div>
  )
}

// ── METRIC SLIDER ─────────────────────────────────────────
function MetricSlider({ metric, value, onChange }) {
  const val = value ?? 5
  const color = metricColor(metric, val)
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', minWidth:68 }}>{metric.low}</span>
        <div style={{ flex:1 }}>
          <input type="range" min={1} max={10} value={val}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width:'100%', accentColor:color, cursor:'pointer' }} />
        </div>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', minWidth:68, textAlign:'right' }}>{metric.high}</span>
        <div style={{ minWidth:40, textAlign:'center', background:color, color:C.white, borderRadius:8, padding:'3px 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22 }}>{val}</div>
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>{metric.note}</div>
    </div>
  )
}

// ── SECTION LABEL ─────────────────────────────────────────
const SL = ({ children }) => (
  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.12em', borderBottom:'1px solid rgba(255,255,255,0.07)', paddingBottom:7, marginTop:22, marginBottom:10 }}>
    {children}
  </div>
)

// ── CHART CARD ────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 14px', marginBottom:14 }}>
    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:C.white, marginBottom:2 }}>{title}</div>
    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:12 }}>{subtitle}</div>
    {children}
  </div>
)

// ── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [client,       setClient]       = useState(null)
  const [view,         setView]         = useState('log')
  const [activeHabits, setActiveHabits] = useState(['sleep','steps','hydration','meals','mindfulness'])
  const [showCycle,    setShowCycle]    = useState(false)
  const [habitValues,  setHabitValues]  = useState({})
  const [metricValues, setMetricValues] = useState({ stressRPE:5, mood:6, energy:6, digestion:7 })
  const [cyclePhase,   setCyclePhase]   = useState('')
  const [reflection,   setReflection]   = useState('')
  const [sendStatus,   setSendStatus]   = useState('idle')
  const [historicData, setHistoricData] = useState([])
  const [graphDays,    setGraphDays]    = useState(30)
  const [loadingGraphs,setLoadingGraphs]= useState(false)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)
  const [showInstall,     setShowInstall]     = useState(false)
  const [deferredPrompt,  setDeferredPrompt]  = useState(null)
  const todayKey = new Date().toISOString().split('T')[0]
  const isoDate  = todayKey
  const dateStr  = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const promptIdx = new Date().getDay()

  // ── Boot ────────────────────────────────────────────────
  useEffect(() => {
    const saved = LS.get('evolve_client')
    if (saved) setClient(saved)

    // PWA install prompt
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari — show install hint if not in standalone
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone
    if (isIOS && !isStandalone && !LS.get('install_dismissed')) setShowInstall(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ── PWA install button ───────────────────────────────────
  useEffect(() => {
    const btn = document.getElementById('pwa-install-btn')
    if (!btn || !deferredPrompt) return
    const handler = async () => {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') { setShowInstall(false); setDeferredPrompt(null) }
    }
    btn.addEventListener('click', handler)
    return () => btn.removeEventListener('click', handler)
  }, [deferredPrompt, showInstall])

  // ── Load today's saved log ───────────────────────────────
  useEffect(() => {
    const saved = LS.get(`log_${todayKey}`)
    if (saved) {
      setHabitValues(saved.habits || {})
      setMetricValues(saved.metrics || { stressRPE:5, mood:6, energy:6, digestion:7 })
      setCyclePhase(saved.cyclePhase || '')
      setReflection(saved.reflection || '')
    }
  }, [todayKey])

  // ── Auto-save log locally ────────────────────────────────
  useEffect(() => {
    if (!client) return
    LS.set(`log_${todayKey}`, { habits:habitValues, metrics:metricValues, cyclePhase, reflection })
  }, [habitValues, metricValues, cyclePhase, reflection, client, todayKey])

  // ── Load config ──────────────────────────────────────────
  useEffect(() => {
    const cfg = LS.get('evolve_config')
    if (cfg) {
      if (cfg.activeHabits) setActiveHabits(cfg.activeHabits)
      if (cfg.showCycle !== undefined) setShowCycle(cfg.showCycle)
    }
  }, [])

  // ── Save config ──────────────────────────────────────────
  useEffect(() => {
    LS.set('evolve_config', { activeHabits, showCycle })
  }, [activeHabits, showCycle])

  // ── Client setup complete ────────────────────────────────
  const handleSetupComplete = useCallback(info => {
    LS.set('evolve_client', info)
    setClient(info)
    setTimeout(() => setShowNotifPrompt(true), 800)
  }, [])

  // ── Derived ──────────────────────────────────────────────
  const visibleHabits   = ALL_HABITS.filter(h => activeHabits.includes(h.id))
  const completedHabits = visibleHabits.filter(h => habitValues[h.id] !== undefined && habitValues[h.id] !== '')
  const completionPct   = visibleHabits.length ? Math.round(completedHabits.length / visibleHabits.length * 100) : 0

  // ── Fetch historic data ──────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!client || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') return
    setLoadingGraphs(true)
    try {
      const url = `${APPS_SCRIPT_URL}?clientId=${encodeURIComponent(client.name)}&days=${graphDays}`
      const res  = await fetch(url)
      const json = await res.json()
      if (json.success && json.data) setHistoricData(json.data)
    } catch (e) { console.warn('Fetch failed:', e) }
    setLoadingGraphs(false)
  }, [client, graphDays])

  useEffect(() => { if (view === 'graphs') fetchData() }, [view, fetchData])

  // ── Send log ─────────────────────────────────────────────
  const handleSend = async () => {
    if (sendStatus !== 'idle') return
    setSendStatus('sending')

    const payload = {
      date:            isoDate,
      clientId:        client?.name?.toLowerCase().replace(/\s+/g,'-') || 'unknown',
      clientName:      client?.name || '',
      clientEmail:     client?.email || '',
      habits:          habitValues,
      metrics:         metricValues,
      cyclePhase:      showCycle ? cyclePhase : '',
      reflectionPrompt:PROMPTS[promptIdx % PROMPTS.length],
      reflection,
      habitsCompleted: completedHabits.length,
      habitsTotal:     visibleHabits.length,
    }

    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
      setTimeout(() => setSendStatus('success'), 1200)
      return
    }

    try {
      await fetch(APPS_SCRIPT_URL, {
        method:'POST', mode:'no-cors',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(payload),
      })
      setTimeout(() => setSendStatus('success'), 1200)
    } catch {
      // Queue for background sync
      try {
        const cache = await caches.open('evolve-queue-v1')
        const key   = `${APPS_SCRIPT_URL}?q=${Date.now()}`
        await cache.put(key, new Response(JSON.stringify({ url:APPS_SCRIPT_URL, data:payload })))
        const sw = await navigator.serviceWorker.ready
        await sw.sync?.register('sync-logs')
      } catch {}
      setTimeout(() => setSendStatus('success'), 1200)
    }
  }

  // ── Chart data ────────────────────────────────────────────
  const chartData = historicData
    .sort((a,b) => new Date(a['Date']) - new Date(b['Date']))
    .map(row => ({
      date:       new Date(row['Date']).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
      sleep:      parseFloat(row['Sleep (hrs)'])      || null,
      steps:      parseInt(row['Steps'])              || null,
      hydration:  parseFloat(row['Hydration (L)'])    || null,
      stress:     parseFloat(row['Stress RPE (1-10)'])|| null,
      mood:       parseFloat(row['Mood (1-10)'])       || null,
      energy:     parseFloat(row['Energy (1-10)'])     || null,
      completion: parseFloat(row['Completion %'])      || null,
    }))

  const calcAvg = key => {
    const vals = chartData.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v))
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : null
  }

  // ── Render ────────────────────────────────────────────────
  if (!client) return <SetupScreen onComplete={handleSetupComplete} />

  return (
    <div style={{ minHeight:'100vh', background:C.deep, color:C.white, fontFamily:"'Barlow',sans-serif", display:'flex', flexDirection:'column', paddingTop:safeTop }}>
      {showNotifPrompt && <NotifPrompt onDone={() => setShowNotifPrompt(false)} />}
      {showInstall && <InstallBanner onDismiss={() => { setShowInstall(false); LS.set('install_dismissed', true) }} />}

      <PrideBand h={6} />

      {/* Header */}
      <div style={{ background:C.navy, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:'0.07em' }}>
            EVOLVE<span style={{ color:C.orange }}>:</span>WELLBEING
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1 }}>{client.name}</div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {[['log','📋'],['graphs','📊'],['config','⚙']].map(([v,icon]) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view===v ? C.orange : 'rgba(255,255,255,0.08)',
              border:'none', borderRadius:8, padding:'7px 10px',
              color:C.white, fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:700, fontSize:11, letterSpacing:'0.05em',
              textTransform:'uppercase', cursor:'pointer', transition:'background .15s',
            }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* ── LOG ── */}
      {view === 'log' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 100px' }}>
          {/* Date + progress */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{dateStr}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:7 }}>
              <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${completionPct}%`, background:completionPct===100?C.green:C.orange, borderRadius:3, transition:'width .3s' }} />
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:completionPct===100?C.green:C.orange, minWidth:40 }}>
                {completedHabits.length}/{visibleHabits.length}
              </div>
            </div>
          </div>

          <SL>Today's Habits</SL>
          {visibleHabits.map(h => {
            const val = habitValues[h.id]
            const col = habitColor(h, val)
            const filled = val!==undefined && val!==''
            return (
              <div key={h.id} style={{ background:filled?'rgba(255,255,255,0.055)':'rgba(255,255,255,0.03)', border:`1px solid ${filled?col+'55':'rgba(255,255,255,0.08)'}`, borderRadius:13, padding:16, marginBottom:9 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:20 }}>{h.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{h.label}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{h.desc}</div>
                  </div>
                  {filled && <div style={{ width:8, height:8, borderRadius:'50%', background:col, marginTop:5, flexShrink:0 }} />}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="number" min={h.min} max={h.max} step={h.step} value={val??''}
                    onChange={e => setHabitValues(prev => ({ ...prev, [h.id]: e.target.value===''?'':Number(e.target.value) }))}
                    placeholder={`Enter ${h.unit}`}
                    style={{ flex:1, background:'rgba(255,255,255,0.08)', border:`1.5px solid ${filled?col+'88':'rgba(255,255,255,0.13)'}`, borderRadius:9, padding:'10px 13px', color:C.white, fontFamily:"'Barlow',sans-serif", fontSize:15, fontWeight:600, outline:'none', inputMode:'decimal' }} />
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', minWidth:50 }}>
                    {h.unit}
                    <div style={{ color:'rgba(255,255,255,0.2)', marginTop:2, fontSize:11 }}>↑ {h.target}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.27)', marginTop:9, fontStyle:'italic', lineHeight:1.5 }}>💡 {h.tip}</div>
              </div>
            )
          })}

          <SL>Wellness Metrics</SL>
          {METRICS.map(m => (
            <div key={m.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:16, marginBottom:9 }}>
              <div style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{m.icon} {m.label}</div>
              <MetricSlider metric={m} value={metricValues[m.id]} onChange={v => setMetricValues(prev=>({...prev,[m.id]:v}))} />
            </div>
          ))}

          {showCycle && (
            <>
              <SL>Cycle Phase</SL>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:4 }}>
                {CYCLE_OPTS.map(opt => (
                  <button key={opt} onClick={() => setCyclePhase(opt)} style={{
                    background: cyclePhase===opt ? 'rgba(242,100,25,0.2)' : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${cyclePhase===opt?C.orange:'rgba(255,255,255,0.08)'}`,
                    borderRadius:9, padding:'9px 11px',
                    color: cyclePhase===opt?C.white:'rgba(255,255,255,0.6)',
                    fontFamily:"'Barlow',sans-serif", fontSize:12,
                    fontWeight:cyclePhase===opt?600:400, cursor:'pointer', textAlign:'left', lineHeight:1.4,
                  }}>{opt}</button>
                ))}
              </div>
            </>
          )}

          <SL>Daily Reflection</SL>
          <div style={{ background:'rgba(242,100,25,0.07)', border:'1px solid rgba(242,100,25,0.2)', borderRadius:10, padding:13, marginBottom:9, fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6, fontStyle:'italic' }}>
            {PROMPTS[promptIdx % PROMPTS.length]}
          </div>
          <textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={4} placeholder="Your thoughts..."
            style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:11, padding:13, color:C.white, fontFamily:"'Barlow',sans-serif", fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:18 }} />

          {/* Send */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:15, padding:22 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Send Today's Log</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:14, lineHeight:1.5 }}>
              Sends your {isoDate} log to your coach and saves it to your progress tracker.
            </div>
            <button onClick={handleSend} disabled={sendStatus!=='idle'} style={{
              width:'100%',
              background: sendStatus==='success'?C.green:sendStatus==='error'?C.red:C.orange,
              border:'none', borderRadius:11, padding:'15px', color:C.white,
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
              <div style={{ fontSize:12, color:C.green, textAlign:'center', marginTop:10 }}>
                Log saved. Your coach will review it shortly.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GRAPHS ── */}
      {view === 'graphs' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 100px' }}>
          <div style={{ display:'flex', gap:7, marginBottom:20 }}>
            {[7,14,30].map(d => (
              <button key={d} onClick={() => setGraphDays(d)} style={{
                flex:1, background:graphDays===d?C.orange:'rgba(255,255,255,0.07)',
                border:`1px solid ${graphDays===d?C.orange:'rgba(255,255,255,0.12)'}`,
                borderRadius:9, padding:'9px', color:C.white,
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12,
                letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
              }}>{d} Days</button>
            ))}
          </div>

          {loadingGraphs && (
            <div style={{ textAlign:'center', padding:48, color:'rgba(255,255,255,0.4)', fontSize:14 }}>
              Loading your progress data...
            </div>
          )}

          {!loadingGraphs && chartData.length === 0 && (
            <div style={{ textAlign:'center', padding:48, background:'rgba(255,255,255,0.03)', borderRadius:14, border:'1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:34, marginBottom:12 }}>📊</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', marginBottom:8 }}>No data yet</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)' }}>Send your first daily log to start building your progress charts.</div>
            </div>
          )}

          {!loadingGraphs && chartData.length > 0 && (
            <>
              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
                {[
                  { label:'Avg Sleep',   val:calcAvg('sleep')  ?`${calcAvg('sleep')}h`:'—',   target:'7.5h', ok:calcAvg('sleep')>=7 },
                  { label:'Avg Stress',  val:calcAvg('stress') ??'—',                           target:'≤5',   ok:calcAvg('stress')<=5 },
                  { label:'Avg Mood',    val:calcAvg('mood')   ??'—',                           target:'≥6',   ok:calcAvg('mood')>=6 },
                  { label:'Avg Energy',  val:calcAvg('energy') ??'—',                           target:'≥6',   ok:calcAvg('energy')>=6 },
                  { label:'Completion',  val:calcAvg('completion')?`${calcAvg('completion')}%`:'—', target:'100%', ok:calcAvg('completion')>=80 },
                  { label:'Total Logs',  val:chartData.length,                                  target:`${graphDays}d`, ok:true },
                ].map(card => (
                  <div key={card.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:card.ok?C.green:C.amber }}>{card.val}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{card.label}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:1 }}>target: {card.target}</div>
                  </div>
                ))}
              </div>

              <ChartCard title="Sleep Duration" subtitle="Hours per night · green = 7h target">
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <YAxis domain={[0,12]} tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={7} stroke={C.green} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="sleep" stroke={C.orange} fill="rgba(242,100,25,0.15)" strokeWidth={2} dot={{fill:C.orange,r:3}} name="Sleep (hrs)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Daily Steps" subtitle="Steps per day · green = 8,000 target">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <YAxis tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={8000} stroke={C.green} strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="steps" fill={C.orange} radius={[4,4,0,0]} name="Steps" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Hydration" subtitle="Litres per day · green = 2.5L target">
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <YAxis domain={[0,5]} tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={2.5} stroke={C.green} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="hydration" stroke="#42a5f5" fill="rgba(66,165,245,0.15)" strokeWidth={2} dot={{fill:'#42a5f5',r:3}} name="Hydration (L)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Stress · Mood · Energy" subtitle="Daily scores /10">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <YAxis domain={[0,10]} tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize:11,color:'rgba(255,255,255,0.5)'}} />
                    <ReferenceLine y={5} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="stress"  stroke={C.red}   strokeWidth={2} dot={{r:2}} name="Stress"  connectNulls />
                    <Line type="monotone" dataKey="mood"    stroke={C.green} strokeWidth={2} dot={{r:2}} name="Mood"    connectNulls />
                    <Line type="monotone" dataKey="energy"  stroke={C.amber} strokeWidth={2} dot={{r:2}} name="Energy"  connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Habit Completion" subtitle="% completed · green = 80% target">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <YAxis domain={[0,100]} tick={{fill:'rgba(255,255,255,0.4)',fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={80} stroke={C.green} strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="completion" name="Completion %" fill={C.orange} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </div>
      )}

      {/* ── CONFIG ── */}
      {view === 'config' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 100px' }}>
          {/* Client info */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, marginBottom:16 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Your Details</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{client.name}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{client.email}</div>
            <button onClick={() => { LS.del('evolve_client'); setClient(null) }} style={{ marginTop:14, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'8px 16px', color:'rgba(255,255,255,0.5)', fontFamily:"'Barlow',sans-serif", fontSize:12, cursor:'pointer' }}>
              Sign Out
            </button>
          </div>

          {/* Habit selection */}
          <div style={{ background:'rgba(242,100,25,0.07)', border:`1px solid ${C.orange}`, borderRadius:14, padding:22, marginBottom:16 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:C.orange, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Coach Setup</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:18, lineHeight:1.5 }}>Active habits for this client. Select up to 5.</div>
            {ALL_HABITS.map(h => {
              const on = activeHabits.includes(h.id)
              return (
                <button key={h.id} onClick={() => {
                  if (on) setActiveHabits(prev => prev.filter(x=>x!==h.id))
                  else if (activeHabits.length < 5) setActiveHabits(prev => [...prev, h.id])
                }} style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%',
                  background:on?'rgba(242,100,25,0.15)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${on?C.orange:'rgba(255,255,255,0.1)'}`,
                  borderRadius:9, padding:'11px 14px', marginBottom:7,
                  color:on?C.white:'rgba(255,255,255,0.5)',
                  fontFamily:"'Barlow',sans-serif", fontSize:13,
                  cursor:on||activeHabits.length<5?'pointer':'not-allowed', textAlign:'left',
                }}>
                  <span style={{fontSize:18}}>{h.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{h.label}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:1}}>{h.desc}</div>
                  </div>
                  {on && <span style={{background:C.orange,color:C.white,borderRadius:10,padding:'2px 8px',fontSize:11,fontWeight:700}}>Active</span>}
                </button>
              )
            })}
            <div style={{fontSize:12,color:'rgba(255,255,255,0.25)',marginTop:4}}>{activeHabits.length}/5 habits selected</div>

            {/* Cycle toggle */}
            <div style={{marginTop:18,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>Cycle Tracking</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>Enable for peri/menopausal clients</div>
              </div>
              <button onClick={() => setShowCycle(v=>!v)} style={{background:showCycle?C.orange:'rgba(255,255,255,0.1)',border:'none',borderRadius:18,padding:'8px 16px',color:C.white,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,textTransform:'uppercase',cursor:'pointer'}}>
                {showCycle?'On':'Off'}
              </button>
            </div>
          </div>

          {/* Connection status */}
          <div style={{background:APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'rgba(239,83,80,0.08)':'rgba(76,175,80,0.08)',border:`1px solid ${APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?C.red:C.green}`,borderRadius:12,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:5,color:APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?C.red:C.green}}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'⚠ Not connected to Google Sheets':'✓ Connected to Google Sheets'}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'Paste your Apps Script Web App URL into the APPS_SCRIPT_URL constant in App.jsx, then redeploy.':'Logs are saving to your coach\'s Google Sheet automatically.'}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:C.navy, borderTop:`2px solid rgba(255,255,255,0.08)`, paddingBottom:safeBottom, zIndex:50 }}>
        <div style={{ display:'flex', maxWidth:600, margin:'0 auto' }}>
          {[['log','📋','Log'],['graphs','📊','Progress'],['config','⚙','Setup']].map(([v,icon,label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              flex:1, background:'transparent', border:'none', padding:'12px 8px 10px',
              color: view===v?C.orange:'rgba(255,255,255,0.4)', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              transition:'color .15s',
            }}>
              <span style={{fontSize:18}}>{icon}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
