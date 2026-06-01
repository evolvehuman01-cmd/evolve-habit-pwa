import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Area
} from 'recharts'

// ── CONFIG ────────────────────────────────────────────────
const APPS_SCRIPT_URL       = 'https://script.google.com/macros/s/AKfycbyE5QFzwd-FD2sIe00GY5G-qMv2Qg3bFFTga27sQ5xJlJ9G2x9HLeNpMmpbdjvcaKyi/exec'
const CHECKIN_SCRIPT_URL    = 'https://script.google.com/macros/s/AKfycbyU2Ic2aczSqqDbb5oRb55s8iboXTIev_tVnUSXQxwySw78MZ5tsVibD-psRlvEii2QHg/exec'
const REPORT_SCRIPT_URL     = 'YOUR_REPORT_APPS_SCRIPT_URL_HERE'

// ── BRAND ─────────────────────────────────────────────────
const ORANGE      = '#F26419'
const NAVY        = '#1C2B3A'
const CREAM       = '#F0EEF5'
const WHITE       = '#FFFFFF'
const GREEN       = '#2e7d32'
const GREEN_LIGHT = '#e8f5e9'
const AMBER       = '#e65100'
const AMBER_LIGHT = '#fff3e0'
const RED         = '#c62828'
const RED_LIGHT   = '#ffebee'
const PRIDE       = ['#E40303','#FF8C00','#FFED00','#008026','#004DFF','#750787']

// ── TYPOGRAPHY ────────────────────────────────────────────
const T = {
  super: { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:'0.12em', textTransform:'uppercase', color:ORANGE },
  h1:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:52, lineHeight:1.0, letterSpacing:'0.01em', textTransform:'uppercase', color:NAVY },
  h2:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, lineHeight:1.05, textTransform:'uppercase', color:NAVY },
  h3:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, textTransform:'uppercase', letterSpacing:'0.04em', color:NAVY },
  body:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:17, lineHeight:1.7, color:'#2d3748' },
  label: { fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:16, color:NAVY },
  small: { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:14, color:'#718096', lineHeight:1.5 },
  tiny:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:12, color:'#a0aec0' },
}

// ── MOTIVATIONAL QUOTES ───────────────────────────────────
// Mix of attributed and Evolve-original, categorised by theme
const QUOTES = [
  // Consistency
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", theme: "consistency" },
  { text: "Small steps. Every day. That's how everything changes.", author: "Evolve:Wellbeing", theme: "consistency" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", theme: "consistency" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock", theme: "consistency" },
  { text: "Show up. Even when it's hard. Especially when it's hard.", author: "Evolve:Wellbeing", theme: "consistency" },
  // Progress
  { text: "Progress, not perfection. Every log counts.", author: "Evolve:Wellbeing", theme: "progress" },
  { text: "You are allowed to be both a work in progress and a masterpiece simultaneously.", author: "Sophia Bush", theme: "progress" },
  { text: "Don't compare your chapter one to someone else's chapter twenty.", author: "Evolve:Wellbeing", theme: "progress" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", theme: "progress" },
  { text: "Every expert was once a beginner. Every pro started where you are.", author: "Evolve:Wellbeing", theme: "progress" },
  // Resilience
  { text: "You have been through harder things than this. Keep going.", author: "Evolve:Wellbeing", theme: "resilience" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", theme: "resilience" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", theme: "resilience" },
  { text: "A bad day is not a bad life. Log it, learn from it, move forward.", author: "Evolve:Wellbeing", theme: "resilience" },
  { text: "You are stronger than you think. Your habits are the proof.", author: "Evolve:Wellbeing", theme: "resilience" },
  // Recovery
  { text: "Rest is not quitting. Rest is reloading.", author: "Evolve:Wellbeing", theme: "recovery" },
  { text: "Almost everything will work again if you unplug it for a few minutes. Including you.", author: "Anne Lamott", theme: "recovery" },
  { text: "Sleep is the single most effective thing you can do for your body and brain.", author: "Matthew Walker", theme: "recovery" },
  { text: "Recovery is where the growth actually happens.", author: "Evolve:Wellbeing", theme: "recovery" },
  // Energy
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", theme: "energy" },
  { text: "Energy is the currency of high performance. Invest in yours daily.", author: "Evolve:Wellbeing", theme: "energy" },
  { text: "Movement is medicine. A walk, a stretch, a breath — it all counts.", author: "Evolve:Wellbeing", theme: "energy" },
  { text: "The groundwork of all happiness is health.", author: "Leigh Hunt", theme: "energy" },
  // Mindset
  { text: "Your only competition is who you were yesterday.", author: "Evolve:Wellbeing", theme: "mindset" },
  { text: "What you do today is important because you are exchanging a day of your life for it.", author: "Unknown", theme: "mindset" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", theme: "mindset" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha", theme: "mindset" },
  { text: "You don't need to be motivated. You need to be disciplined.", author: "Evolve:Wellbeing", theme: "mindset" },
  { text: "How you do anything is how you do everything.", author: "Unknown", theme: "mindset" },
]

// ── HABITS ────────────────────────────────────────────────
const ALL_HABITS = [
  { id:'sleep',       label:'Sleep Routine', icon:'🌙', desc:'Hours of sleep last night',        unit:'hrs',   min:0, max:14,    step:0.5, target:7.5,  green:7,    amber:6 },
  { id:'steps',       label:'Daily Steps',   icon:'👟', desc:'Total steps today',                 unit:'steps', min:0, max:30000, step:100, target:8000, green:8000, amber:5000 },
  { id:'hydration',   label:'Hydration',     icon:'💧', desc:'Total fluid intake today',          unit:'L',     min:0, max:6,     step:0.25,target:2.5,  green:2,    amber:1.5 },
  { id:'meals',       label:'Meal Structure',icon:'🥗', desc:'Planned, structured meals today',   unit:'meals', min:0, max:6,     step:1,   target:3,    green:3,    amber:2 },
  { id:'mindfulness', label:'Mindfulness',   icon:'🧠', desc:'Mindfulness or breathwork today',  unit:'min',   min:0, max:60,    step:1,   target:10,   green:10,   amber:5 },
  { id:'mobility',    label:'Mobility',      icon:'🧘', desc:'Dedicated mobility or flexibility',unit:'min',   min:0, max:120,   step:5,   target:10,   green:10,   amber:5 },
]

const METRICS = [
  { id:'stressRPE', label:'Stress Level', icon:'⚡', low:'Very calm', high:'Extreme',     invert:true,  note:'1 = very calm · 10 = extreme' },
  { id:'mood',      label:'Mood',         icon:'😊', low:'Very low',  high:'Excellent',   invert:false, note:'1 = very low · 10 = excellent' },
  { id:'energy',    label:'Energy',       icon:'🔋', low:'Exhausted', high:'Full energy', invert:false, note:'1 = exhausted · 10 = full' },
  { id:'digestion', label:'Digestion',    icon:'🫁', low:'Very poor', high:'Excellent',   invert:false, note:'1 = very poor · 10 = excellent' },
]

const CYCLE_OPTS = [
  'Day 1–5 — Menstruation','Day 6–13 — Follicular','Day 14 — Ovulation',
  'Day 15–20 — Early Luteal','Day 21–28 — Late Luteal','Perimenopause — irregular','Not applicable today',
]

const DAILY_PROMPTS = [
  "What made today's habits easier or harder than usual?",
  "What's one win from today, however small?",
  "Was there a moment today where you chose your health over convenience?",
  "Did your energy match your expectations today? Why or why not?",
  "What's one thing you'd do differently tomorrow?",
  "Did anything unexpected disrupt your routine today?",
  "Rate your overall self-care today. What contributed most?",
]

// Weekly check-in questions (market standard mix)
const WEEKLY_QUESTIONS = [
  { id:'weekRating',     label:'How would you rate your overall week?',                    type:'slider', min:1, max:10, low:'Really tough', high:'Outstanding' },
  { id:'habitHighlight', label:'Which habit felt most natural this week?',                 type:'select', options:['Sleep Routine','Daily Steps','Hydration','Meal Structure','Mindfulness','Mobility','None felt natural'] },
  { id:'biggestBarrier', label:'What was your biggest barrier this week?',                 type:'select', options:['Time','Energy','Motivation','Stress','Travel / disruption','Illness','Nothing significant'] },
  { id:'weekWin',        label:'What is one win from this week, however small?',           type:'text',   placeholder:'e.g. hit my step target 5 out of 7 days...' },
  { id:'weekFocus',      label:'What is your #1 focus for next week?',                    type:'text',   placeholder:'e.g. drink water first thing every morning...' },
  { id:'coachNote',      label:'Anything you want your coach to know before your check-in?', type:'text', placeholder:'Optional — no detail is too small...' },
]

const MONTHLY_QUESTIONS = [
  { id:'monthRating',    label:'How would you rate this month overall?',                   type:'slider', min:1, max:10, low:'Very difficult', high:'My best month' },
  { id:'biggestChange',  label:'What is the biggest positive change you have noticed this month?', type:'text', placeholder:'In your energy, mood, sleep, body, mindset...' },
  { id:'stillStruggling',label:'What are you still finding difficult?',                   type:'text',   placeholder:'Be honest — this is for your coach, not social media...' },
  { id:'habitToAdd',     label:'Is there a habit you would like to add or swap next month?', type:'select', options:['No changes needed','Sleep Routine','Daily Steps','Hydration','Meal Structure','Mindfulness','Mobility','I want to discuss with my coach'] },
  { id:'goalProgress',   label:'How close do you feel to your original programme goal?',  type:'slider', min:1, max:10, low:'Far away', high:'Achieved it' },
  { id:'monthNote',      label:'Anything else you want your coach to know this month?',   type:'text',   placeholder:'Open space — use it however you like...' },
]

// ── STREAK MILESTONES ─────────────────────────────────────
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365]

// ── STORAGE ───────────────────────────────────────────────
const LS = {
  get: (k,d=null) => { try { const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d } catch { return d } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} },
  del: (k)   => { try { localStorage.removeItem(k) } catch {} },
}

// ── DATE HELPERS ──────────────────────────────────────────
const todayISO   = () => new Date().toISOString().split('T')[0]
const dayOfWeek  = () => new Date().getDay() // 0=Sun
const hourOfDay  = () => new Date().getHours()

function getWeekKey() {
  const d = new Date()
  const day = d.getDay()
  // Week runs Mon–Sun. Get the Sunday of this week
  const sunday = new Date(d)
  sunday.setDate(d.getDate() + (7 - day) % 7)
  return sunday.toISOString().split('T')[0]
}

function getMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

function isWeeklyCheckInDue() {
  if (dayOfWeek() !== 0) return false // Sunday only
  if (hourOfDay() < 18)  return false // After 6pm
  const wk  = getWeekKey()
  const done = LS.get(`checkin_weekly_done_${wk}`)
  const exp  = LS.get(`checkin_weekly_exp_${wk}`)
  if (done) return false
  if (exp && new Date() > new Date(exp)) return false
  return true
}

function isMonthlyCheckInDue(client) {
  const mk   = getMonthKey()
  const done = LS.get(`checkin_monthly_done_${mk}`)
  if (done) return false
  // Due on start-of-month anniversary
  const startDay = client?.startDay || 1
  const today    = new Date().getDate()
  if (today < startDay || today > startDay + 3) return false // 3-day window
  return true
}

// ── STREAK CALCULATION ────────────────────────────────────
function calculateStreaks() {
  const logStreak    = LS.get('streak_log',    { count:0, lastDate:null, best:0 })
  const targetStreak = LS.get('streak_target', { count:0, lastDate:null, best:0 })
  return { logStreak, targetStreak }
}

function updateStreaks(habitValues, visibleHabits) {
  const today     = todayISO()
  // Grace: allow logging up to 6am next day
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1)
  const yStr      = yesterday.toISOString().split('T')[0]

  const hasLogged  = Object.values(habitValues).some(v => v!==''&&v!==undefined&&v!==null)
  const greenCount = visibleHabits.filter(h => {
    const v = Number(habitValues[h.id]||0)
    return v >= h.green
  }).length
  const onTarget   = greenCount >= Math.ceil(visibleHabits.length * 0.6) // 60% green = on target

  // Log streak
  let ls = LS.get('streak_log', { count:0, lastDate:null, best:0 })
  if (hasLogged && ls.lastDate !== today) {
    const isConsecutive = ls.lastDate === yStr || hourOfDay() < 6
    ls.count    = isConsecutive ? ls.count + 1 : 1
    ls.lastDate = today
    ls.best     = Math.max(ls.best, ls.count)
    LS.set('streak_log', ls)
  }

  // Target streak
  let ts = LS.get('streak_target', { count:0, lastDate:null, best:0 })
  if (onTarget && ts.lastDate !== today) {
    const isConsecutive = ts.lastDate === yStr || hourOfDay() < 6
    ts.count    = isConsecutive ? ts.count + 1 : 1
    ts.lastDate = today
    ts.best     = Math.max(ts.best, ts.count)
    LS.set('streak_target', ts)
  }

  return { logStreak:ls, targetStreak:ts }
}

function isMilestone(count) {
  return STREAK_MILESTONES.includes(count)
}

// ── SHARED UI ─────────────────────────────────────────────
const PrideBand = ({ h=7 }) => (
  <div style={{ display:'flex', width:'100%', height:h, flexShrink:0 }}>
    {PRIDE.map(c => <div key={c} style={{ flex:1, background:c }} />)}
  </div>
)

const SL = ({ children }) => (
  <div style={{ ...T.super, borderBottom:'1.5px solid rgba(28,43,58,0.1)', paddingBottom:8, marginTop:26, marginBottom:12 }}>
    {children}
  </div>
)

const Card = ({ children, style={} }) => (
  <div style={{ background:WHITE, borderRadius:14, padding:18, marginBottom:11, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 4px rgba(28,43,58,0.07)', ...style }}>
    {children}
  </div>
)

const ChartCard = ({ title, subtitle, children }) => (
  <Card style={{ padding:'18px 14px', marginBottom:14 }}>
    <div style={{ ...T.h3, fontSize:18, marginBottom:3 }}>{title}</div>
    <div style={{ ...T.small, marginBottom:14 }}>{subtitle}</div>
    {children}
  </Card>
)

function MetricSlider({ field, value, onChange, showLabels=true }) {
  const val = value ?? Math.round(((field.min||1)+(field.max||10))/2)
  const pct = ((val-(field.min||1))/((field.max||10)-(field.min||1)))*100
  const color = pct>=60?GREEN:pct>=40?AMBER:RED
  return (
    <div style={{ marginTop:10 }}>
      {showLabels && (
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ ...T.tiny }}>{field.low}</span>
          <span style={{ ...T.tiny }}>{field.high}</span>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <input type="range" min={field.min||1} max={field.max||10} value={val}
            onChange={e=>onChange(Number(e.target.value))}
            style={{ width:'100%', accentColor:color, cursor:'pointer' }} />
        </div>
        <div style={{ minWidth:44, textAlign:'center', background:color, color:WHITE, borderRadius:9, padding:'4px 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24 }}>{val}</div>
      </div>
      {showLabels && field.low && (
        <div style={{ ...T.tiny, marginTop:4 }}>{field.low} → {field.high}</div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:NAVY, border:`1px solid ${ORANGE}`, borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <div style={{ color:ORANGE, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:WHITE, marginBottom:2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  )
}

// ── QUOTE SPLASH ──────────────────────────────────────────
function QuoteSplash({ onDismiss }) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random()*QUOTES.length)])
  const isEvolve = quote.author === 'Evolve:Wellbeing'

  return (
    <div onClick={onDismiss} style={{ position:'fixed', inset:0, zIndex:10000, background:NAVY, display:'flex', flexDirection:'column', cursor:'pointer' }}>
      <PrideBand h={8} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, letterSpacing:'0.08em', color:WHITE, marginBottom:48 }}>
          EVOLVE<span style={{ color:ORANGE }}>:</span>WELLBEING
        </div>

        <div style={{ maxWidth:480 }}>
          {/* Opening quote mark */}
          <div style={{ fontFamily:'Georgia,serif', fontSize:80, color:ORANGE, lineHeight:0.6, marginBottom:24, opacity:0.8 }}>"</div>

          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:32, lineHeight:1.2, color:WHITE, letterSpacing:'0.01em', marginBottom:28 }}>
            {quote.text}
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ height:1, width:32, background:ORANGE, opacity:0.6 }} />
            <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:15, color:isEvolve?ORANGE:'rgba(255,255,255,0.6)', letterSpacing:'0.04em' }}>
              {quote.author}
            </div>
            <div style={{ height:1, width:32, background:ORANGE, opacity:0.6 }} />
          </div>
        </div>
      </div>

      <div style={{ paddingBottom:40, textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
          Tap anywhere to continue
        </div>
      </div>
      <PrideBand h={8} />
    </div>
  )
}

// ── STREAK DISPLAY ────────────────────────────────────────
function StreakCard({ logStreak, targetStreak }) {
  const logMilestone    = isMilestone(logStreak.count)
  const targetMilestone = isMilestone(targetStreak.count)

  return (
    <Card style={{ padding:0, overflow:'hidden', marginBottom:11 }}>
      <div style={{ background:NAVY, padding:'12px 18px 10px' }}>
        <div style={{ ...T.super, color:ORANGE }}>Your Streaks</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
        {/* Log streak */}
        <div style={{ padding:'16px 18px', borderRight:'1px solid rgba(28,43,58,0.1)', background:logMilestone?`${ORANGE}08`:WHITE }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:24 }}>🔥</span>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:40, color:logStreak.count>0?ORANGE:'#cbd5e0', lineHeight:1 }}>
              {logStreak.count}
            </div>
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:NAVY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Days Logged</div>
          <div style={{ ...T.tiny, marginTop:3 }}>Best: {logStreak.best}</div>
          {logMilestone && logStreak.count > 0 && (
            <div style={{ marginTop:8, background:ORANGE, color:WHITE, borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:'uppercase', letterSpacing:'0.06em', display:'inline-block' }}>
              🏆 Milestone!
            </div>
          )}
        </div>
        {/* Target streak */}
        <div style={{ padding:'16px 18px', background:targetMilestone?`${GREEN}08`:WHITE }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:24 }}>⭐</span>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:40, color:targetStreak.count>0?GREEN:'#cbd5e0', lineHeight:1 }}>
              {targetStreak.count}
            </div>
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:NAVY, textTransform:'uppercase', letterSpacing:'0.04em' }}>On Target</div>
          <div style={{ ...T.tiny, marginTop:3 }}>Best: {targetStreak.best}</div>
          {targetMilestone && targetStreak.count > 0 && (
            <div style={{ marginTop:8, background:GREEN, color:WHITE, borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:'uppercase', letterSpacing:'0.06em', display:'inline-block' }}>
              🏆 Milestone!
            </div>
          )}
        </div>
      </div>
      {/* Milestone progress bar */}
      {(() => {
        const next = STREAK_MILESTONES.find(m => m > logStreak.count) || STREAK_MILESTONES[STREAK_MILESTONES.length-1]
        const prev = STREAK_MILESTONES.slice().reverse().find(m => m <= logStreak.count) || 0
        const pct  = prev===next ? 100 : Math.round(((logStreak.count-prev)/(next-prev))*100)
        return (
          <div style={{ padding:'10px 18px 14px', borderTop:'1px solid rgba(28,43,58,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ ...T.tiny }}>Next milestone: {next} days</span>
              <span style={{ ...T.tiny }}>{logStreak.count}/{next}</span>
            </div>
            <div style={{ height:5, background:'rgba(28,43,58,0.1)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:ORANGE, borderRadius:3, transition:'width .4s' }} />
            </div>
          </div>
        )
      })()}
    </Card>
  )
}

// ── WEEKLY REPORT CARD ────────────────────────────────────
function WeeklyReportCard({ data }) {
  if (!data || data.length < 3) return null

  const calcAvg = (key) => {
    const vals = data.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v)&&v!==undefined)
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null
  }

  const metrics = [
    { key:'sleep',      label:'Sleep',      target:7.5,  unit:'h',  good:'>=', icon:'🌙' },
    { key:'steps',      label:'Steps',      target:8000, unit:'',   good:'>=', icon:'👟' },
    { key:'hydration',  label:'Hydration',  target:2.5,  unit:'L',  good:'>=', icon:'💧' },
    { key:'stress',     label:'Stress RPE', target:5,    unit:'/10',good:'<=', icon:'⚡' },
    { key:'mood',       label:'Mood',       target:6,    unit:'/10',good:'>=', icon:'😊' },
    { key:'energy',     label:'Energy',     target:6,    unit:'/10',good:'>=', icon:'🔋' },
  ]

  const getStatus = (avg, target, good) => {
    if (avg===null) return 'none'
    if (good==='>=') return avg>=target?'green':avg>=target*0.8?'amber':'red'
    return avg<=target?'green':avg<=target*1.2?'amber':'red'
  }

  const statusColor = { green:GREEN, amber:AMBER, red:RED, none:'#cbd5e0' }
  const statusBg    = { green:GREEN_LIGHT, amber:AMBER_LIGHT, red:RED_LIGHT, none:CREAM }

  const completionAvg = calcAvg('completion')

  return (
    <Card style={{ padding:0, overflow:'hidden' }}>
      <div style={{ background:NAVY, padding:'14px 18px' }}>
        <div style={{ ...T.super, color:ORANGE, marginBottom:2 }}>This Week</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:WHITE, textTransform:'uppercase' }}>Weekly Summary</div>
      </div>

      {/* Completion ring */}
      {completionAvg !== null && (
        <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,58,0.08)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:completionAvg>=80?GREEN_LIGHT:completionAvg>=60?AMBER_LIGHT:RED_LIGHT, border:`3px solid ${completionAvg>=80?GREEN:completionAvg>=60?AMBER:RED}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:completionAvg>=80?GREEN:completionAvg>=60?AMBER:RED }}>{Math.round(completionAvg)}%</span>
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:15, color:NAVY }}>Habit Completion</div>
            <div style={{ ...T.small, marginTop:2 }}>{completionAvg>=80?'Great consistency this week':'Room to grow — every day counts'}</div>
          </div>
        </div>
      )}

      {/* Metric grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, background:'rgba(28,43,58,0.08)' }}>
        {metrics.map(m => {
          const avg    = calcAvg(m.key)
          const status = getStatus(avg, m.target, m.good)
          return (
            <div key={m.key} style={{ background:statusBg[status], padding:'12px 10px', textAlign:'center' }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{m.icon}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:statusColor[status] }}>
                {avg!==null ? (m.key==='steps'?Math.round(avg).toLocaleString():Number(avg).toFixed(1)) : '—'}{m.unit}
              </div>
              <div style={{ ...T.tiny, marginTop:2 }}>{m.label}</div>
            </div>
          )
        })}
      </div>

      {/* Trend text */}
      <div style={{ padding:'12px 18px', background:CREAM }}>
        <div style={{ ...T.tiny, lineHeight:1.6 }}>
          Your coach will review this and send a full report with their notes. Check your email.
        </div>
      </div>
    </Card>
  )
}

// ── CHECK-IN CARD ─────────────────────────────────────────
function CheckInCard({ type, questions, onSubmit, client }) {
  const [answers, setAnswers]   = useState({})
  const [step,    setStep]      = useState(0)
  const [sending, setSending]   = useState(false)
  const [done,    setDone]      = useState(false)

  const q      = questions[step]
  const isLast = step === questions.length - 1

  const setAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]:val }))

  const handleNext = async () => {
    if (isLast) {
      setSending(true)
      await onSubmit({ type, answers, client, submittedAt:new Date().toISOString() })
      setSending(false)
      setDone(true)
      if (type==='weekly') {
        const wk = getWeekKey()
        LS.set(`checkin_weekly_done_${wk}`, true)
      } else {
        const mk = getMonthKey()
        LS.set(`checkin_monthly_done_${mk}`, true)
      }
    } else {
      setStep(s => s+1)
    }
  }

  const canAdvance = () => {
    const val = answers[q.id]
    if (q.type==='slider') return val !== undefined
    if (q.type==='select') return val !== undefined && val !== ''
    return true // text is optional
  }

  const inp = { width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:10, padding:'13px 15px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }

  if (done) return (
    <Card style={{ textAlign:'center', padding:28 }}>
      <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
      <div style={{ ...T.h3, fontSize:18, marginBottom:8 }}>{type==='weekly'?'Weekly':'Monthly'} Check-In Complete</div>
      <div style={{ ...T.small }}>Your coach will review your responses before your next session.</div>
    </Card>
  )

  return (
    <Card style={{ padding:0, overflow:'hidden', border:`1.5px solid ${ORANGE}` }}>
      <div style={{ background:ORANGE, padding:'14px 18px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:WHITE, textTransform:'uppercase', letterSpacing:'0.04em' }}>
          {type==='weekly'?'📋 Weekly Check-In':'📅 Monthly Check-In'}
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginTop:2 }}>
          Question {step+1} of {questions.length}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display:'flex', gap:5, padding:'10px 18px', background:'rgba(242,100,25,0.06)' }}>
        {questions.map((_,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=step?ORANGE:'rgba(28,43,58,0.12)', transition:'background .2s' }} />
        ))}
      </div>

      <div style={{ padding:20 }}>
        <div style={{ ...T.label, marginBottom:14, lineHeight:1.5 }}>{q.label}</div>

        {q.type==='slider' && (
          <MetricSlider field={q} value={answers[q.id]} onChange={v=>setAnswer(q.id,v)} showLabels={true} />
        )}

        {q.type==='select' && (
          <select value={answers[q.id]||''} onChange={e=>setAnswer(q.id,e.target.value)}
            style={{ ...inp, appearance:'none', cursor:'pointer' }}>
            <option value="">Select...</option>
            {q.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        {q.type==='text' && (
          <textarea value={answers[q.id]||''} onChange={e=>setAnswer(q.id,e.target.value)}
            placeholder={q.placeholder} rows={3}
            style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
        )}

        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          {step > 0 && (
            <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:11, padding:'13px', color:NAVY, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, textTransform:'uppercase', cursor:'pointer' }}>
              ← Back
            </button>
          )}
          <button onClick={handleNext} disabled={!canAdvance()||sending} style={{ flex:2, background:canAdvance()&&!sending?ORANGE:'rgba(28,43,58,0.15)', border:'none', borderRadius:11, padding:'13px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, textTransform:'uppercase', letterSpacing:'0.04em', cursor:canAdvance()&&!sending?'pointer':'not-allowed', transition:'background .2s' }}>
            {sending?'Sending...':(isLast?'Submit ✓':'Next →')}
          </button>
        </div>
      </div>
    </Card>
  )
}

// ── SETUP SCREEN ──────────────────────────────────────────
function SetupScreen({ onComplete }) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [err,   setErr]   = useState('')

  const submit = () => {
    if (!name.trim())                       { setErr('Please enter your name'); return }
    if (!email.trim()||!email.includes('@')){ setErr('Please enter a valid email'); return }
    const startDay = new Date().getDate()
    onComplete({ name:name.trim(), email:email.trim(), startDay, joinedAt:new Date().toISOString() })
  }

  const inp = { width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.2)', borderRadius:11, padding:'14px 16px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'100vh', background:CREAM, display:'flex', flexDirection:'column' }}>
      <PrideBand h={8} />
      <div style={{ background:NAVY, padding:'16px 20px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, letterSpacing:'0.07em', color:WHITE }}>
          EVOLVE<span style={{ color:ORANGE }}>:</span>WELLBEING
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ width:84, height:84, background:NAVY, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, overflow:'hidden', flexShrink:0 }}>
          <img src="/icons/icon-192x192.png" alt="Evolve" style={{ width:84, height:84 }} />
        </div>
        <div style={{ ...T.super, marginBottom:10, textAlign:'center' }}>Daily Habit Tracker</div>
        <div style={{ ...T.h1, fontSize:40, marginBottom:32, textAlign:'center' }}>Let's Get You Set Up</div>
        <div style={{ width:'100%', maxWidth:420 }}>
          <Card style={{ padding:28 }}>
            <div style={{ ...T.body, marginBottom:24, color:'#4a5568' }}>
              This takes 30 seconds. We'll save your details to this device so every log is ready to go.
            </div>
            <label style={{ ...T.label, display:'block', marginBottom:8 }}>Your Name <span style={{ color:ORANGE }}>*</span></label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sarah Jones" style={inp} />
            <label style={{ ...T.label, display:'block', marginTop:20, marginBottom:8 }}>Email Address <span style={{ color:ORANGE }}>*</span></label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="e.g. sarah@email.com" onKeyDown={e=>e.key==='Enter'&&submit()} style={inp} />
            {err && <div style={{ color:RED, fontSize:14, marginTop:10 }}>{err}</div>}
            <button onClick={submit} style={{ width:'100%', marginTop:24, background:ORANGE, border:'none', borderRadius:12, padding:'16px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
              Start Tracking →
            </button>
            <div style={{ ...T.tiny, textAlign:'center', marginTop:16, lineHeight:1.7 }}>
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
    if (perm==='granted') navigator.serviceWorker.ready.then(r=>r.active?.postMessage({ type:'SCHEDULE_REMINDER' }))
    onDone()
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(28,43,58,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:WHITE, borderRadius:18, padding:32, maxWidth:360, width:'100%', border:`2px solid ${ORANGE}` }}>
        <div style={{ fontSize:40, marginBottom:16, textAlign:'center' }}>🔔</div>
        <div style={{ ...T.h2, fontSize:26, textAlign:'center', marginBottom:12 }}>Daily Reminders</div>
        <div style={{ ...T.body, textAlign:'center', marginBottom:28, color:'#4a5568' }}>
          Get a nudge at 8pm every evening to log your habits, and reminders for weekly check-ins every Sunday.
        </div>
        <button onClick={request} style={{ width:'100%', background:ORANGE, border:'none', borderRadius:12, padding:'15px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', marginBottom:12 }}>Enable Reminders</button>
        <button onClick={onDone} style={{ width:'100%', background:'transparent', border:'none', color:'#a0aec0', fontFamily:"'Barlow',sans-serif", fontSize:15, cursor:'pointer', padding:'8px' }}>Not now</button>
      </div>
    </div>
  )
}

// ── INSTALL BANNER ────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999, background:NAVY, borderTop:`3px solid ${ORANGE}`, padding:'16px 20px 22px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, textTransform:'uppercase', color:WHITE, marginBottom:8 }}>Add to Home Screen</div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:14 }}>
          {isIOS?'Tap Share then "Add to Home Screen" to install Evolve:Wellbeing as an app.':'Install Evolve:Wellbeing on your home screen for the best experience.'}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {!isIOS && <button id="pwa-install-btn" style={{ flex:2, background:ORANGE, border:'none', borderRadius:10, padding:'12px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, textTransform:'uppercase', cursor:'pointer' }}>Install</button>}
          <button onClick={onDismiss} style={{ flex:1, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'12px', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow',sans-serif", fontSize:14, cursor:'pointer' }}>Not Now</button>
        </div>
      </div>
    </div>
  )
}

// ── COACH TOAST ───────────────────────────────────────────
function CoachToast({ onDone }) {
  useEffect(() => { const t=setTimeout(onDone,2500); return ()=>clearTimeout(t) }, [onDone])
  return (
    <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', zIndex:9997, background:NAVY, border:`2px solid ${ORANGE}`, borderRadius:12, padding:'12px 24px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(28,43,58,0.3)' }}>
      ⚙ Coach Mode Unlocked
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [client,          setClient]          = useState(null)
  const [showQuote,       setShowQuote]       = useState(false)
  const [view,            setView]            = useState('log')
  const [coachUnlocked,   setCoachUnlocked]   = useState(false)
  const [showCoachToast,  setShowCoachToast]  = useState(false)
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
  const [logStreak,       setLogStreak]       = useState({ count:0, lastDate:null, best:0 })
  const [targetStreak,    setTargetStreak]    = useState({ count:0, lastDate:null, best:0 })
  const [weeklyDue,       setWeeklyDue]       = useState(false)
  const [monthlyDue,      setMonthlyDue]      = useState(false)
  const [weekData,        setWeekData]        = useState([])

  const tapCount = useRef(0)
  const tapTimer = useRef(null)

  const todayKey  = todayISO()
  const dateStr   = new Date().toLocaleDateString('en-GB',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const promptIdx = new Date().getDay()

  const visibleHabits   = ALL_HABITS.filter(h => activeHabits.includes(h.id))
  const completedHabits = visibleHabits.filter(h => habitValues[h.id]!==undefined && habitValues[h.id]!=='')
  const completionPct   = visibleHabits.length ? Math.round(completedHabits.length/visibleHabits.length*100) : 0

  // ── Boot ───────────────────────────────────────────────
  useEffect(() => {
    const saved = LS.get('evolve_client')
    if (saved) {
      setClient(saved)
      // Show quote on open
      setShowQuote(true)
    }
    // Load streaks
    const { logStreak:ls, targetStreak:ts } = calculateStreaks()
    setLogStreak(ls)
    setTargetStreak(ts)

    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS && !window.navigator.standalone && !LS.get('install_dismissed')) setShowInstall(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!client) return
    setWeeklyDue(isWeeklyCheckInDue())
    setMonthlyDue(isMonthlyCheckInDue(client))
    // Load last 7 days of data for weekly report card
    const last7 = []
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i)
      const key = d.toISOString().split('T')[0]
      const log = LS.get(`log_${key}`)
      if (log) {
        last7.push({
          date:key,
          sleep:    Number(log.habits?.sleep   ||0)||null,
          steps:    Number(log.habits?.steps   ||0)||null,
          hydration:Number(log.habits?.hydration||0)||null,
          stress:   Number(log.metrics?.stressRPE||0)||null,
          mood:     Number(log.metrics?.mood   ||0)||null,
          energy:   Number(log.metrics?.energy ||0)||null,
          completion: visibleHabits.length ? Math.round(
            visibleHabits.filter(h=>log.habits?.[h.id]!==undefined&&log.habits?.[h.id]!=='').length
            /visibleHabits.length*100) : 0,
        })
      }
    }
    setWeekData(last7)
  }, [client])

  // ── Load today ─────────────────────────────────────────
  useEffect(() => {
    const saved = LS.get(`log_${todayKey}`)
    if (saved) {
      setHabitValues(saved.habits || {})
      setMetricValues(saved.metrics || { stressRPE:5, mood:6, energy:6, digestion:7 })
      setCyclePhase(saved.cyclePhase || '')
      setReflection(saved.reflection || '')
    }
  }, [todayKey])

  // ── Auto-save ──────────────────────────────────────────
  useEffect(() => {
    if (!client) return
    LS.set(`log_${todayKey}`, { habits:habitValues, metrics:metricValues, cyclePhase, reflection })
  }, [habitValues, metricValues, cyclePhase, reflection, client, todayKey])

  // ── Config ─────────────────────────────────────────────
  useEffect(() => {
    const cfg = LS.get('evolve_config')
    if (cfg) {
      if (cfg.activeHabits) setActiveHabits(cfg.activeHabits)
      if (cfg.showCycle !== undefined) setShowCycle(cfg.showCycle)
    }
  }, [])

  useEffect(() => { LS.set('evolve_config', { activeHabits, showCycle }) }, [activeHabits, showCycle])

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

  const handleSetupComplete = useCallback(info => {
    LS.set('evolve_client', info)
    setClient(info)
    setTimeout(() => {
      setShowQuote(true)
      setTimeout(() => setShowNotifPrompt(true), 500)
    }, 300)
  }, [])

  // ── Secret tap ─────────────────────────────────────────
  const handleWordmarkTap = () => {
    tapCount.current += 1
    clearTimeout(tapTimer.current)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      setCoachUnlocked(true)
      setShowCoachToast(true)
      setView('config')
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 2000)
    }
  }

  // ── Fetch graphs ────────────────────────────────────────
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

  // ── Send daily log ──────────────────────────────────────
  const handleSend = async () => {
    if (sendStatus!=='idle') return
    setSendStatus('sending')
    // Update streaks
    const { logStreak:ls, targetStreak:ts } = updateStreaks(habitValues, visibleHabits)
    setLogStreak(ls)
    setTargetStreak(ts)
    const payload = {
      date:todayKey, clientId:client?.name?.toLowerCase().replace(/\s+/g,'-')||'unknown',
      clientName:client?.name||'', clientEmail:client?.email||'',
      habits:habitValues, metrics:metricValues,
      cyclePhase:showCycle?cyclePhase:'',
      reflectionPrompt:DAILY_PROMPTS[promptIdx%DAILY_PROMPTS.length],
      reflection, habitsCompleted:completedHabits.length, habitsTotal:visibleHabits.length,
      logStreak:ls.count, targetStreak:ts.count,
    }
    if (APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') { setTimeout(()=>setSendStatus('success'),1200); return }
    try {
      await fetch(APPS_SCRIPT_URL,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      setTimeout(()=>setSendStatus('success'),1200)
    } catch { setTimeout(()=>setSendStatus('success'),1200) }
  }

  // ── Submit check-in ─────────────────────────────────────
  const handleCheckIn = async (data) => {
    if (CHECKIN_SCRIPT_URL==='YOUR_CHECKIN_APPS_SCRIPT_URL_HERE') return
    try {
      await fetch(CHECKIN_SCRIPT_URL,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    } catch {}
  }

  // ── Chart data ─────────────────────────────────────────
  const chartData = historicData
    .sort((a,b)=>new Date(a['Date'])-new Date(b['Date']))
    .map(row=>({
      date:      new Date(row['Date']).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
      sleep:     parseFloat(row['Sleep (hrs)'])       ||null,
      steps:     parseInt(row['Steps'])               ||null,
      hydration: parseFloat(row['Hydration (L)'])     ||null,
      stress:    parseFloat(row['Stress RPE (1-10)']) ||null,
      mood:      parseFloat(row['Mood (1-10)'])        ||null,
      energy:    parseFloat(row['Energy (1-10)'])      ||null,
      completion:parseFloat(row['Completion %'])       ||null,
    }))

  const calcAvg = key => {
    const vals = chartData.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v))
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : null
  }

  const habitColor = (h, v) => {
    if (v===''||v===null||v===undefined) return '#cbd5e0'
    const n=Number(v); if(n>=h.green) return GREEN; if(n>=h.amber) return AMBER; return RED
  }
  const habitBg = (h, v) => {
    if (v===''||v===null||v===undefined) return WHITE
    const n=Number(v); if(n>=h.green) return GREEN_LIGHT; if(n>=h.amber) return AMBER_LIGHT; return RED_LIGHT
  }
  const metricColor = (m, v) => {
    const n=Number(v??5); if(m.invert){if(n<=5)return GREEN;if(n<=7)return AMBER;return RED}
    if(n>=7)return GREEN;if(n>=5)return AMBER;return RED
  }

  if (!client) return <SetupScreen onComplete={handleSetupComplete} />

  const inp = { width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:10, padding:'13px 15px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }

  const navTabs = [
    { v:'log',    icon:'📋', label:'Log' },
    { v:'graphs', icon:'📊', label:'Progress' },
    ...(coachUnlocked ? [{ v:'config', icon:'⚙', label:'Setup' }] : []),
  ]

  return (
    <div style={{ minHeight:'100vh', background:CREAM, color:NAVY, fontFamily:"'Barlow',sans-serif", display:'flex', flexDirection:'column' }}>
      {showQuote       && <QuoteSplash onDismiss={()=>setShowQuote(false)} />}
      {showNotifPrompt && <NotifPrompt onDone={()=>setShowNotifPrompt(false)} />}
      {showInstall     && <InstallBanner onDismiss={()=>{ setShowInstall(false); LS.set('install_dismissed',true) }} />}
      {showCoachToast  && <CoachToast onDone={()=>setShowCoachToast(false)} />}

      <PrideBand h={6} />

      {/* Header */}
      <div style={{ background:NAVY, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div onClick={handleWordmarkTap} style={{ cursor:'default', userSelect:'none' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, letterSpacing:'0.07em', color:WHITE }}>
            EVOLVE<span style={{ color:ORANGE }}>:</span>WELLBEING
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{client.name}</div>
        </div>
        {/* Streak badges in header */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {logStreak.count > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(242,100,25,0.2)', borderRadius:20, padding:'5px 10px' }}>
              <span style={{ fontSize:14 }}>🔥</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:ORANGE }}>{logStreak.count}</span>
            </div>
          )}
          {targetStreak.count > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(46,125,50,0.15)', borderRadius:20, padding:'5px 10px' }}>
              <span style={{ fontSize:14 }}>⭐</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:GREEN }}>{targetStreak.count}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── LOG ── */}
      {view==='log' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'22px 16px 110px' }}>

          {/* Date + progress */}
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ ...T.super }}>{dateStr}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:completionPct===100?GREEN:ORANGE }}>
                {completedHabits.length}/{visibleHabits.length}
              </div>
            </div>
            <div style={{ height:7, background:'rgba(28,43,58,0.1)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${completionPct}%`, background:completionPct===100?GREEN:ORANGE, borderRadius:4, transition:'width .3s' }} />
            </div>
          </div>

          {/* Streak card */}
          <StreakCard logStreak={logStreak} targetStreak={targetStreak} />

          {/* Check-in cards — appear when due */}
          {weeklyDue && (
            <CheckInCard type="weekly" questions={WEEKLY_QUESTIONS} onSubmit={handleCheckIn} client={client} />
          )}
          {monthlyDue && !weeklyDue && (
            <CheckInCard type="monthly" questions={MONTHLY_QUESTIONS} onSubmit={handleCheckIn} client={client} />
          )}

          {/* Weekly report card */}
          {weekData.length >= 3 && !weeklyDue && (
            <WeeklyReportCard data={weekData} />
          )}

          {/* Habits */}
          <SL>Today's Habits</SL>
          {visibleHabits.map(h => {
            const val    = habitValues[h.id]
            const col    = habitColor(h, val)
            const bg     = habitBg(h, val)
            const filled = val!==undefined && val!==''
            return (
              <div key={h.id} style={{ background:filled?bg:WHITE, border:`1.5px solid ${filled?col+'55':'rgba(28,43,58,0.1)'}`, borderRadius:14, padding:18, marginBottom:10, boxShadow:'0 1px 4px rgba(28,43,58,0.06)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <span style={{ fontSize:22 }}>{h.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:17, color:NAVY }}>{h.label}</div>
                    <div style={{ fontSize:13, color:'#718096', marginTop:3 }}>{h.desc}</div>
                  </div>
                  {filled && <div style={{ width:9, height:9, borderRadius:'50%', background:col, marginTop:6, flexShrink:0 }} />}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="number" min={h.min} max={h.max} step={h.step} value={val??''}
                    onChange={e=>setHabitValues(prev=>({...prev,[h.id]:e.target.value===''?'':Number(e.target.value)}))}
                    placeholder={`Enter ${h.unit}`}
                    style={{ ...inp, flex:1, fontSize:17, fontWeight:600, border:`1.5px solid ${filled?col+'77':'rgba(28,43,58,0.18)'}` }} />
                  <div style={{ fontSize:13, color:'#718096', minWidth:54 }}>
                    {h.unit}
                    <div style={{ color:'#a0aec0', marginTop:3, fontSize:12 }}>↑ {h.target}</div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Metrics */}
          <SL>Wellness Metrics</SL>
          {METRICS.map(m => (
            <Card key={m.id}>
              <div style={{ fontWeight:700, fontSize:17, color:NAVY, marginBottom:4 }}>{m.icon} {m.label}</div>
              <div style={{ marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ ...T.tiny, minWidth:72 }}>{m.low}</span>
                  <div style={{ flex:1 }}>
                    <input type="range" min={1} max={10} value={metricValues[m.id]??5}
                      onChange={e=>setMetricValues(prev=>({...prev,[m.id]:Number(e.target.value)}))}
                      style={{ width:'100%', accentColor:metricColor(m,metricValues[m.id]??5), cursor:'pointer' }} />
                  </div>
                  <span style={{ ...T.tiny, minWidth:72, textAlign:'right' }}>{m.high}</span>
                  <div style={{ minWidth:44, textAlign:'center', background:metricColor(m,metricValues[m.id]??5), color:WHITE, borderRadius:9, padding:'4px 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24 }}>{metricValues[m.id]??5}</div>
                </div>
                <div style={{ ...T.tiny, marginTop:5 }}>{m.note}</div>
              </div>
            </Card>
          ))}

          {/* Cycle */}
          {showCycle && (
            <>
              <SL>Cycle Phase</SL>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:4 }}>
                {CYCLE_OPTS.map(opt => (
                  <button key={opt} onClick={()=>setCyclePhase(opt)} style={{ background:cyclePhase===opt?ORANGE:WHITE, border:`1.5px solid ${cyclePhase===opt?ORANGE:'rgba(28,43,58,0.15)'}`, borderRadius:10, padding:'11px 12px', color:cyclePhase===opt?WHITE:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:14, fontWeight:cyclePhase===opt?600:400, cursor:'pointer', textAlign:'left', lineHeight:1.4 }}>{opt}</button>
                ))}
              </div>
            </>
          )}

          {/* Reflection */}
          <SL>Daily Reflection</SL>
          <div style={{ background:WHITE, border:`1.5px solid ${ORANGE}55`, borderLeft:`4px solid ${ORANGE}`, borderRadius:11, padding:16, marginBottom:10, fontSize:15, color:'#4a5568', lineHeight:1.7, fontStyle:'italic' }}>
            {DAILY_PROMPTS[promptIdx%DAILY_PROMPTS.length]}
          </div>
          <textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={4} placeholder="Your thoughts..."
            style={{ ...inp, resize:'vertical', marginBottom:20, lineHeight:1.7, fontSize:15 }} />

          {/* Send */}
          <Card style={{ padding:24 }}>
            <div style={{ ...T.super, marginBottom:6 }}>Send Today's Log</div>
            <div style={{ ...T.small, marginBottom:16 }}>Sends your log to your coach and saves it to your progress tracker.</div>
            <button onClick={handleSend} disabled={sendStatus!=='idle'} style={{ width:'100%', background:sendStatus==='success'?GREEN:sendStatus==='error'?RED:ORANGE, border:'none', borderRadius:12, padding:'17px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, letterSpacing:'0.06em', textTransform:'uppercase', cursor:sendStatus==='idle'?'pointer':'default', transition:'background .25s' }}>
              {sendStatus==='idle'    && 'Send to Coach →'}
              {sendStatus==='sending' && 'Sending...'}
              {sendStatus==='success' && '✓ Sent to Coach'}
              {sendStatus==='error'   && '⚠ Something went wrong'}
            </button>
            {sendStatus==='success' && <div style={{ fontSize:14, color:GREEN, textAlign:'center', marginTop:12 }}>Log saved. Your coach will review it shortly.</div>}
          </Card>
        </div>
      )}

      {/* ── GRAPHS ── */}
      {view==='graphs' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'22px 16px 110px' }}>
          <div style={{ display:'flex', gap:8, marginBottom:22 }}>
            {[7,14,30].map(d => (
              <button key={d} onClick={()=>setGraphDays(d)} style={{ flex:1, background:graphDays===d?ORANGE:WHITE, border:`1.5px solid ${graphDays===d?ORANGE:'rgba(28,43,58,0.18)'}`, borderRadius:10, padding:'10px', color:graphDays===d?WHITE:NAVY, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>{d} Days</button>
            ))}
          </div>

          {loadingGraphs && <div style={{ textAlign:'center', padding:48, color:'#718096', fontSize:16 }}>Loading your progress data...</div>}

          {!loadingGraphs && chartData.length===0 && (
            <Card style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:36, marginBottom:14 }}>📊</div>
              <div style={{ ...T.h3, marginBottom:10 }}>No data yet</div>
              <div style={{ ...T.small }}>Send your first daily log to start building your progress charts.</div>
            </Card>
          )}

          {!loadingGraphs && chartData.length>0 && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:18 }}>
                {[
                  { label:'Avg Sleep',   val:calcAvg('sleep')?`${calcAvg('sleep')}h`:'—',         ok:calcAvg('sleep')>=7,    target:'7.5h' },
                  { label:'Avg Stress',  val:calcAvg('stress')??'—',                               ok:calcAvg('stress')<=5,   target:'≤5' },
                  { label:'Avg Mood',    val:calcAvg('mood')??'—',                                 ok:calcAvg('mood')>=6,     target:'≥6' },
                  { label:'Avg Energy',  val:calcAvg('energy')??'—',                               ok:calcAvg('energy')>=6,   target:'≥6' },
                  { label:'Completion',  val:calcAvg('completion')?`${calcAvg('completion')}%`:'—',ok:calcAvg('completion')>=80, target:'100%' },
                  { label:'Total Logs',  val:chartData.length,                                     ok:true,                   target:`${graphDays}d` },
                ].map(card => (
                  <div key={card.label} style={{ background:WHITE, border:'1px solid rgba(28,43,58,0.1)', borderRadius:11, padding:'14px 10px', textAlign:'center', boxShadow:'0 1px 4px rgba(28,43,58,0.06)' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:card.ok?GREEN:AMBER }}>{card.val}</div>
                    <div style={{ fontSize:12, color:'#718096', marginTop:3 }}>{card.label}</div>
                    <div style={{ fontSize:11, color:'#cbd5e0', marginTop:2 }}>target: {card.target}</div>
                  </div>
                ))}
              </div>

              <ChartCard title="Sleep Duration" subtitle="Hours per night · green = 7h target">
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:11}} />
                    <YAxis domain={[0,12]} tick={{fill:'#718096',fontSize:11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={7} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="sleep" stroke={ORANGE} fill={`${ORANGE}22`} strokeWidth={2.5} dot={{fill:ORANGE,r:3}} name="Sleep (hrs)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Daily Steps" subtitle="Steps per day · green = 8,000 target">
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:11}} />
                    <YAxis tick={{fill:'#718096',fontSize:11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={8000} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="steps" fill={ORANGE} radius={[5,5,0,0]} name="Steps" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Hydration" subtitle="Litres per day · green = 2.5L target">
                <ResponsiveContainer width="100%" height={170}>
                  <ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:11}} />
                    <YAxis domain={[0,5]} tick={{fill:'#718096',fontSize:11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={2.5} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="hydration" stroke="#1565C0" fill="rgba(21,101,192,0.12)" strokeWidth={2.5} dot={{fill:'#1565C0',r:3}} name="Hydration (L)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Stress · Mood · Energy" subtitle="Daily scores /10">
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:11}} />
                    <YAxis domain={[0,10]} tick={{fill:'#718096',fontSize:11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize:13,color:'#718096'}} />
                    <ReferenceLine y={5} stroke="rgba(28,43,58,0.1)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="stress"  stroke={RED}   strokeWidth={2.5} dot={{r:2}} name="Stress"  connectNulls />
                    <Line type="monotone" dataKey="mood"    stroke={GREEN} strokeWidth={2.5} dot={{r:2}} name="Mood"    connectNulls />
                    <Line type="monotone" dataKey="energy"  stroke={ORANGE}strokeWidth={2.5} dot={{r:2}} name="Energy"  connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Habit Completion" subtitle="% of habits completed · green = 80% target">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)" />
                    <XAxis dataKey="date" tick={{fill:'#718096',fontSize:11}} />
                    <YAxis domain={[0,100]} tick={{fill:'#718096',fontSize:11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={80} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="completion" name="Completion %" fill={ORANGE} radius={[5,5,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </div>
      )}

      {/* ── CONFIG — coach only ── */}
      {view==='config' && coachUnlocked && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'22px 16px 110px' }}>
          <div style={{ ...T.super, marginBottom:4 }}>Coach Mode</div>
          <div style={{ ...T.h2, fontSize:28, marginBottom:20 }}>Client Setup</div>

          <Card style={{ padding:20, marginBottom:16 }}>
            <div style={{ ...T.super, marginBottom:10 }}>Current Client</div>
            <div style={{ fontSize:17, fontWeight:700, color:NAVY, marginBottom:4 }}>{client.name}</div>
            <div style={{ fontSize:14, color:'#718096', marginBottom:4 }}>{client.email}</div>
            <div style={{ fontSize:13, color:'#a0aec0', marginBottom:14 }}>Joined: {client.joinedAt ? new Date(client.joinedAt).toLocaleDateString('en-GB') : 'Unknown'} · Monthly check-in day: {client.startDay || 1}</div>
            <button onClick={()=>{ LS.del('evolve_client'); setClient(null); setCoachUnlocked(false); setView('log') }} style={{ background:CREAM, border:'1px solid rgba(28,43,58,0.18)', borderRadius:8, padding:'9px 18px', color:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:14, cursor:'pointer' }}>
              Clear Client (Sign Out)
            </button>
          </Card>

          <div style={{ background:WHITE, border:`1.5px solid ${ORANGE}`, borderRadius:14, padding:24, marginBottom:14, boxShadow:'0 1px 4px rgba(28,43,58,0.07)' }}>
            <div style={{ ...T.super, marginBottom:4 }}>Active Habits</div>
            <div style={{ ...T.h3, fontSize:20, marginBottom:6 }}>Select Up to 5</div>
            <div style={{ ...T.small, marginBottom:20 }}>Choose which habits appear in the client's daily log.</div>

            {ALL_HABITS.map(h => {
              const on = activeHabits.includes(h.id)
              return (
                <button key={h.id} onClick={()=>{ if(on) setActiveHabits(p=>p.filter(x=>x!==h.id)); else if(activeHabits.length<5) setActiveHabits(p=>[...p,h.id]) }} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', background:on?`${ORANGE}10`:CREAM, border:`1.5px solid ${on?ORANGE:'rgba(28,43,58,0.12)'}`, borderRadius:10, padding:'13px 16px', marginBottom:8, color:on?NAVY:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:15, cursor:on||activeHabits.length<5?'pointer':'not-allowed', textAlign:'left' }}>
                  <span style={{fontSize:20}}>{h.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:15,color:on?NAVY:'#718096'}}>{h.label}</div>
                    <div style={{fontSize:12,color:'#a0aec0',marginTop:2}}>{h.desc}</div>
                  </div>
                  {on && <span style={{background:ORANGE,color:WHITE,borderRadius:10,padding:'3px 10px',fontSize:12,fontWeight:700}}>Active</span>}
                </button>
              )
            })}
            <div style={{...T.tiny,marginTop:6}}>{activeHabits.length}/5 selected</div>

            <div style={{marginTop:20,paddingTop:18,borderTop:'1px solid rgba(28,43,58,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600,fontSize:16,color:NAVY}}>Cycle Tracking</div>
                <div style={{...T.tiny,marginTop:3}}>Enable for peri/menopausal clients</div>
              </div>
              <button onClick={()=>setShowCycle(v=>!v)} style={{background:showCycle?ORANGE:CREAM,border:`1.5px solid ${showCycle?ORANGE:'rgba(28,43,58,0.18)'}`,borderRadius:20,padding:'9px 20px',color:showCycle?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,textTransform:'uppercase',cursor:'pointer'}}>
                {showCycle?'On':'Off'}
              </button>
            </div>
          </div>

          <Card style={{ padding:18 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:6, color:APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?RED:GREEN }}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'⚠ Not connected to Google Sheets':'✓ Connected to Google Sheets'}
            </div>
            <div style={{...T.small}}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'Paste your Apps Script URL into APPS_SCRIPT_URL in App.jsx and redeploy.':"Logs saving to coach's Google Sheet automatically."}
            </div>
          </Card>

          <button onClick={()=>{ setCoachUnlocked(false); setView('log') }} style={{ width:'100%', marginTop:8, background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:12, padding:'14px', color:'#718096', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer' }}>
            ← Exit Coach Mode
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:WHITE, borderTop:'1px solid rgba(28,43,58,0.12)', boxShadow:'0 -2px 10px rgba(28,43,58,0.08)', zIndex:50 }}>
        <div style={{ display:'flex', maxWidth:600, margin:'0 auto' }}>
          {navTabs.map(({ v,icon,label }) => (
            <button key={v} onClick={()=>setView(v)} style={{ flex:1, background:'transparent', border:'none', padding:'13px 8px 11px', color:view===v?ORANGE:'#a0aec0', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'color .15s', position:'relative' }}>
              {/* Badge for check-in due */}
              {v==='log' && (weeklyDue||monthlyDue) && (
                <div style={{ position:'absolute', top:8, right:'25%', width:9, height:9, borderRadius:'50%', background:ORANGE, border:`2px solid ${WHITE}` }} />
              )}
              <span style={{fontSize:20}}>{icon}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:'0.06em',textTransform:'uppercase'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
