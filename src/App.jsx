import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Area
} from 'recharts'
import {
  getGoogleFitToken, initiateGoogleFitAuth,
  revokeGoogleFit, autoFillFromHealth
} from './useHealthData.js'
import { queueLog, getQueueLength, flushQueue } from './useOfflineQueue.js'

// ── CONFIG ────────────────────────────────────────────────
const APPS_SCRIPT_URL    = 'https://script.google.com/macros/s/AKfycbyE5QFzwd-FD2sIe00GY5G-qMv2Qg3bFFTga27sQ5xJlJ9G2x9HLeNpMmpbdjvcaKyi/exec'
const CHECKIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyU2Ic2aczSqqDbb5oRb55s8iboXTIev_tVnUSXQxwySw78MZ5tsVibD-psRlvEii2QHg/exec'
const REPORT_SCRIPT_URL  = 'YOUR_REPORT_APPS_SCRIPT_URL_HERE'

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
  h1:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:52, lineHeight:1.0, textTransform:'uppercase', color:NAVY },
  h2:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, lineHeight:1.05, textTransform:'uppercase', color:NAVY },
  h3:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, textTransform:'uppercase', letterSpacing:'0.04em', color:NAVY },
  body:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:17, lineHeight:1.7, color:'#2d3748' },
  label: { fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:16, color:NAVY },
  small: { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:14, color:'#718096', lineHeight:1.5 },
  tiny:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:12, color:'#a0aec0' },
}

// ── HABITS ────────────────────────────────────────────────
const ALL_HABITS = [
  { id:'sleep',       label:'Sleep Routine', icon:'🌙', desc:'Hours of sleep last night',        unit:'hrs',   min:0, max:14,    step:0.5, target:7.5,  green:7,    amber:6,    autoFill:'sleep',       tip:'A consistent wake time anchors your circadian rhythm more than a fixed bedtime.' },
  { id:'steps',       label:'Daily Steps',   icon:'👟', desc:'Total steps today',                 unit:'steps', min:0, max:30000, step:100, target:8000, green:8000, amber:5000, autoFill:'steps',       tip:'Walking after meals is one of the most effective strategies for post-meal glucose control.' },
  { id:'hydration',   label:'Hydration',     icon:'💧', desc:'Total fluid intake today',          unit:'L',     min:0, max:6,     step:0.25,target:2.5,  green:2,    amber:1.5,  autoFill:null,          tip:'Front-load hydration — most people fall behind by mid-afternoon.' },
  { id:'meals',       label:'Meal Structure',icon:'🥗', desc:'Planned, structured meals today',   unit:'meals', min:0, max:6,     step:1,   target:3,    green:3,    amber:2,    autoFill:null,          tip:'Protein at breakfast is consistently associated with reduced afternoon hunger.' },
  { id:'mindfulness', label:'Mindfulness',   icon:'🧠', desc:'Mindfulness or breathwork today',  unit:'min',   min:0, max:60,    step:1,   target:10,   green:10,   amber:5,    autoFill:'mindfulness', tip:'Consistency matters far more than duration. 5 minutes daily beats 60 once a week.' },
  { id:'mobility',    label:'Mobility',      icon:'🧘', desc:'Dedicated mobility or flexibility',unit:'min',   min:0, max:120,   step:5,   target:10,   green:10,   amber:5,    autoFill:null,          tip:'5 minutes of hip flexor and thoracic work daily outperforms one long session weekly.' },
]

const METRICS = [
  { id:'stressRPE', label:'Stress Level', icon:'⚡', low:'Very calm', high:'Extreme',     invert:true,  note:'1 = very calm · 10 = extreme' },
  { id:'mood',      label:'Mood',         icon:'😊', low:'Very low',  high:'Excellent',   invert:false, note:'1 = very low · 10 = excellent' },
  { id:'energy',    label:'Energy',       icon:'🔋', low:'Exhausted', high:'Full energy', invert:false, note:'1 = exhausted · 10 = full' },
  { id:'digestion', label:'Digestion',    icon:'🫁', low:'Very poor', high:'Excellent',   invert:false, note:'1 = very poor · 10 = excellent' },
]

const CYCLE_OPTS = ['Day 1–5 — Menstruation','Day 6–13 — Follicular','Day 14 — Ovulation','Day 15–20 — Early Luteal','Day 21–28 — Late Luteal','Perimenopause — irregular','Not applicable today']

const DAILY_PROMPTS = [
  "What made today's habits easier or harder than usual?",
  "What's one win from today, however small?",
  "Was there a moment today where you chose your health over convenience?",
  "Did your energy match your expectations today? Why or why not?",
  "What's one thing you'd do differently tomorrow?",
  "Did anything unexpected disrupt your routine today?",
  "Rate your overall self-care today. What contributed most?",
]

const WEEKLY_QUESTIONS = [
  { id:'weekRating',     label:'How would you rate your overall week?',                       type:'slider', min:1, max:10, low:'Really tough', high:'Outstanding' },
  { id:'habitHighlight', label:'Which habit felt most natural this week?',                    type:'select', options:['Sleep Routine','Daily Steps','Hydration','Meal Structure','Mindfulness','Mobility','None felt natural'] },
  { id:'biggestBarrier', label:'What was your biggest barrier this week?',                    type:'select', options:['Time','Energy','Motivation','Stress','Travel / disruption','Illness','Nothing significant'] },
  { id:'weekWin',        label:'What is one win from this week, however small?',              type:'text',   placeholder:'e.g. hit my step target 5 out of 7 days...' },
  { id:'weekFocus',      label:'What is your #1 focus for next week?',                       type:'text',   placeholder:'e.g. drink water first thing every morning...' },
  { id:'coachNote',      label:'Anything you want your coach to know?',                      type:'text',   placeholder:'Optional...' },
]

const MONTHLY_QUESTIONS = [
  { id:'monthRating',     label:'How would you rate this month overall?',                    type:'slider', min:1, max:10, low:'Very difficult', high:'My best month' },
  { id:'biggestChange',   label:'What is the biggest positive change you have noticed?',     type:'text',   placeholder:'In your energy, mood, sleep, body, mindset...' },
  { id:'stillStruggling', label:'What are you still finding difficult?',                     type:'text',   placeholder:'Be honest — this is for your coach...' },
  { id:'habitToAdd',      label:'Is there a habit you would like to add or swap?',           type:'select', options:['No changes needed','Sleep Routine','Daily Steps','Hydration','Meal Structure','Mindfulness','Mobility','Discuss with coach'] },
  { id:'goalProgress',    label:'How close do you feel to your original programme goal?',    type:'slider', min:1, max:10, low:'Far away', high:'Achieved it' },
  { id:'monthNote',       label:'Anything else for your coach this month?',                  type:'text',   placeholder:'Open space...' },
]

const QUOTES = [
  { text:"You don't rise to the level of your goals. You fall to the level of your systems.", author:"James Clear", theme:"consistency" },
  { text:"Small steps. Every day. That's how everything changes.", author:"Evolve:Wellbeing", theme:"consistency" },
  { text:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author:"Aristotle", theme:"consistency" },
  { text:"Show up. Even when it's hard. Especially when it's hard.", author:"Evolve:Wellbeing", theme:"consistency" },
  { text:"Progress, not perfection. Every log counts.", author:"Evolve:Wellbeing", theme:"progress" },
  { text:"You are allowed to be both a work in progress and a masterpiece simultaneously.", author:"Sophia Bush", theme:"progress" },
  { text:"It always seems impossible until it's done.", author:"Nelson Mandela", theme:"progress" },
  { text:"You have been through harder things than this. Keep going.", author:"Evolve:Wellbeing", theme:"resilience" },
  { text:"Fall seven times, stand up eight.", author:"Japanese Proverb", theme:"resilience" },
  { text:"A bad day is not a bad life. Log it, learn from it, move forward.", author:"Evolve:Wellbeing", theme:"resilience" },
  { text:"Rest is not quitting. Rest is reloading.", author:"Evolve:Wellbeing", theme:"recovery" },
  { text:"Sleep is the single most effective thing you can do for your body and brain.", author:"Matthew Walker", theme:"recovery" },
  { text:"Energy is the currency of high performance. Invest in yours daily.", author:"Evolve:Wellbeing", theme:"energy" },
  { text:"Movement is medicine. A walk, a stretch, a breath — it all counts.", author:"Evolve:Wellbeing", theme:"energy" },
  { text:"Your only competition is who you were yesterday.", author:"Evolve:Wellbeing", theme:"mindset" },
  { text:"How you do anything is how you do everything.", author:"Unknown", theme:"mindset" },
  { text:"Believe you can and you're halfway there.", author:"Theodore Roosevelt", theme:"mindset" },
  { text:"The mind is everything. What you think, you become.", author:"Buddha", theme:"mindset" },
  { text:"You don't need to be motivated. You need to be disciplined.", author:"Evolve:Wellbeing", theme:"mindset" },
  { text:"Take care of your body. It's the only place you have to live.", author:"Jim Rohn", theme:"energy" },
]

const STREAK_MILESTONES = [3,7,14,21,30,60,90,180,365]

// ── STORAGE ───────────────────────────────────────────────
const LS = {
  get: (k,d=null) => { try { const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d } catch { return d } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} },
  del: (k)   => { try { localStorage.removeItem(k) } catch {} },
}

// ── DATE HELPERS ──────────────────────────────────────────
const todayISO   = () => new Date().toISOString().split('T')[0]
const yesterday  = () => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0] }
const dayOfWeek  = () => new Date().getDay()
const hourOfDay  = () => new Date().getHours()

function getWeekKey() {
  const d=new Date(), day=d.getDay()
  const sun=new Date(d); sun.setDate(d.getDate()+(7-day)%7)
  return sun.toISOString().split('T')[0]
}
function getMonthKey() {
  const d=new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function isWeeklyCheckInDue() {
  if(dayOfWeek()!==0||hourOfDay()<18) return false
  const wk=getWeekKey()
  return !LS.get(`checkin_weekly_done_${wk}`)
}
function isMonthlyCheckInDue(client) {
  const mk=getMonthKey()
  if(LS.get(`checkin_monthly_done_${mk}`)) return false
  const startDay=client?.startDay||1, today=new Date().getDate()
  return today>=startDay && today<=startDay+3
}

// ── STREAK HELPERS ────────────────────────────────────────
function calculateStreaks() {
  return {
    logStreak:    LS.get('streak_log',    {count:0,lastDate:null,best:0}),
    targetStreak: LS.get('streak_target', {count:0,lastDate:null,best:0}),
  }
}
function updateStreaks(habitValues, visibleHabits) {
  const today = todayISO(), yest = yesterday()
  const hasLogged  = Object.values(habitValues).some(v=>v!==''&&v!==undefined&&v!==null)
  const greenCount = visibleHabits.filter(h=>Number(habitValues[h.id]||0)>=h.green).length
  const onTarget   = greenCount >= Math.ceil(visibleHabits.length*0.6)

  let ls = LS.get('streak_log',{count:0,lastDate:null,best:0})
  if(hasLogged && ls.lastDate!==today) {
    const consec = ls.lastDate===yest||(hourOfDay()<6)
    ls.count=consec?ls.count+1:1; ls.lastDate=today; ls.best=Math.max(ls.best,ls.count)
    LS.set('streak_log',ls)
  }
  let ts = LS.get('streak_target',{count:0,lastDate:null,best:0})
  if(onTarget && ts.lastDate!==today) {
    const consec = ts.lastDate===yest||(hourOfDay()<6)
    ts.count=consec?ts.count+1:1; ts.lastDate=today; ts.best=Math.max(ts.best,ts.count)
    LS.set('streak_target',ts)
  }
  return {logStreak:ls,targetStreak:ts}
}
function wasMissed() {
  const ls = LS.get('streak_log',{count:0,lastDate:null,best:0})
  if(!ls.lastDate) return false
  const daysSince = Math.floor((Date.now()-new Date(ls.lastDate).getTime())/(86400000))
  return daysSince>=2 && ls.count>0
}
function getMissedStreak() {
  return LS.get('streak_broken_count',0)
}

// ── COLOUR HELPERS ────────────────────────────────────────
function habitColor(h,v) {
  if(v===''||v===null||v===undefined) return '#cbd5e0'
  const n=Number(v); if(n>=h.green) return GREEN; if(n>=h.amber) return AMBER; return RED
}
function habitBg(h,v) {
  if(v===''||v===null||v===undefined) return WHITE
  const n=Number(v); if(n>=h.green) return GREEN_LIGHT; if(n>=h.amber) return AMBER_LIGHT; return RED_LIGHT
}
function metricColor(m,v) {
  const n=Number(v??5)
  if(m.invert){if(n<=5)return GREEN;if(n<=7)return AMBER;return RED}
  if(n>=7)return GREEN;if(n>=5)return AMBER;return RED
}

// ── CONFETTI ──────────────────────────────────────────────
function ConfettiCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx    = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const pieces  = Array.from({length:80}, () => ({
      x:    Math.random()*canvas.width,
      y:    Math.random()*canvas.height - canvas.height,
      r:    Math.random()*6+3,
      d:    Math.random()*80,
      color:[ORANGE,'#FFB300',GREEN,'#1565C0','#7B1FA2',WHITE][Math.floor(Math.random()*6)],
      tilt: Math.floor(Math.random()*10)-10,
      tiltAngle:0, tiltAngleIncrement:Math.random()*0.07+0.05,
      vy: Math.random()*3+2, vx:(Math.random()-0.5)*2,
    }))
    let frame, running=true
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      pieces.forEach(p => {
        p.tiltAngle+=p.tiltAngleIncrement
        p.y+=p.vy; p.x+=p.vx; p.tilt=Math.sin(p.tiltAngle)*12
        ctx.beginPath()
        ctx.lineWidth=p.r
        ctx.strokeStyle=p.color
        ctx.moveTo(p.x+p.tilt+p.r/2, p.y)
        ctx.lineTo(p.x+p.tilt, p.y+p.tilt+p.r/2)
        ctx.stroke()
      })
      if(pieces.some(p=>p.y<canvas.height+20) && running)
        frame=requestAnimationFrame(draw)
    }
    draw()
    const t = setTimeout(() => { running=false; cancelAnimationFrame(frame) }, 3000)
    return () => { running=false; cancelAnimationFrame(frame); clearTimeout(t) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999 }} />
}

// ── STREAK BROKEN SCREEN ──────────────────────────────────
function StreakBrokenScreen({ streak, onDismiss }) {
  const msgs = [
    "Every champion has a reset. This is yours.",
    "One missed day doesn't define your journey.",
    "The streak is gone. The progress isn't.",
    "Starting again takes more courage than never stopping.",
    "Day 1 again. You know exactly what to do.",
  ]
  const msg = msgs[Math.floor(Math.random()*msgs.length)]
  return (
    <div style={{ position:'fixed', inset:0, zIndex:10001, background:NAVY, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:20 }}>🔥</div>
      <div style={{ ...T.super, marginBottom:8 }}>Streak Ended</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:48, color:WHITE, marginBottom:6 }}>{streak}</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:32 }}>Day streak</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, color:WHITE, maxWidth:340, lineHeight:1.3, marginBottom:40 }}>{msg}</div>
      <button onClick={onDismiss} style={{ background:ORANGE, border:'none', borderRadius:12, padding:'16px 48px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
        Start Again →
      </button>
    </div>
  )
}

// ── QUOTE SPLASH ──────────────────────────────────────────
function QuoteSplash({ onDismiss }) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random()*QUOTES.length)])
  const isEvolve = quote.author==='Evolve:Wellbeing'
  return (
    <div onClick={onDismiss} style={{ position:'fixed', inset:0, zIndex:10000, background:NAVY, display:'flex', flexDirection:'column', cursor:'pointer' }}>
      <div style={{ display:'flex', width:'100%', height:8, flexShrink:0 }}>
        {PRIDE.map(c=><div key={c} style={{flex:1,background:c}}/>)}
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, letterSpacing:'0.08em', color:WHITE, marginBottom:48 }}>
          EVOLVE<span style={{color:ORANGE}}>:</span>WELLBEING
        </div>
        <div style={{ maxWidth:480 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:80, color:ORANGE, lineHeight:0.6, marginBottom:24, opacity:0.8 }}>"</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:32, lineHeight:1.2, color:WHITE, letterSpacing:'0.01em', marginBottom:28 }}>
            {quote.text}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ height:1, width:32, background:ORANGE, opacity:0.6 }} />
            <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:15, color:isEvolve?ORANGE:'rgba(255,255,255,0.6)', letterSpacing:'0.04em' }}>{quote.author}</div>
            <div style={{ height:1, width:32, background:ORANGE, opacity:0.6 }} />
          </div>
        </div>
      </div>
      <div style={{ paddingBottom:40, textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
          Tap anywhere to continue
        </div>
      </div>
      <div style={{ display:'flex', width:'100%', height:8, flexShrink:0 }}>
        {PRIDE.map(c=><div key={c} style={{flex:1,background:c}}/>)}
      </div>
    </div>
  )
}

// ── OFFLINE BANNER ────────────────────────────────────────
function OfflineBanner({ queued, synced }) {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online',on); window.removeEventListener('offline',off) }
  }, [])

  if (online && !synced && queued === 0) return null

  if (!online) return (
    <div style={{ background:'#e65100', padding:'10px 16px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:WHITE, letterSpacing:'0.06em', textTransform:'uppercase' }}>
        📡 Offline — Log queued and will send when back online
      </div>
    </div>
  )

  if (synced > 0) return (
    <div style={{ background:GREEN, padding:'10px 16px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:WHITE, letterSpacing:'0.06em', textTransform:'uppercase' }}>
        ✓ {synced} queued log{synced>1?'s':''} sent to your coach
      </div>
    </div>
  )

  return null
}

// ── HABIT CALENDAR ────────────────────────────────────────
function HabitCalendar({ visibleHabits }) {
  const days = []
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i)
    const key = d.toISOString().split('T')[0]
    const log = LS.get(`log_${key}`)
    let status = 'none'
    if (log) {
      const greenCount = visibleHabits.filter(h => Number(log.habits?.[h.id]||0) >= h.green).length
      const pct = visibleHabits.length ? greenCount/visibleHabits.length : 0
      status = pct >= 0.8 ? 'green' : pct >= 0.5 ? 'amber' : 'red'
    }
    days.push({ key, day:d.getDate(), status, isToday:i===0 })
  }

  const statusColor = { green:GREEN, amber:AMBER, red:RED, none:'rgba(28,43,58,0.12)' }
  const weeks = []
  for (let i=0; i<days.length; i+=7) weeks.push(days.slice(i,i+7))

  return (
    <div style={{ background:WHITE, borderRadius:14, padding:18, marginBottom:14, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 4px rgba(28,43,58,0.07)' }}>
      <div style={{ ...T.super, marginBottom:4 }}>Last 30 Days</div>
      <div style={{ ...T.h3, fontSize:18, marginBottom:14 }}>Habit Calendar</div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display:'flex', gap:5 }}>
            {week.map(day => (
              <div key={day.key} style={{
                flex:1, aspectRatio:'1', borderRadius:5,
                background:statusColor[day.status],
                border:day.isToday?`2px solid ${NAVY}`:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative',
              }}>
                <span style={{ fontSize:9, color:day.status==='none'?'#a0aec0':WHITE, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif" }}>
                  {day.day}
                </span>
              </div>
            ))}
            {/* Pad last row */}
            {week.length < 7 && Array.from({length:7-week.length}).map((_,i) => (
              <div key={`pad-${i}`} style={{ flex:1 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:12, marginTop:12 }}>
        {[['green',GREEN,'On target'],['amber',AMBER,'Partial'],['red',RED,'Missed'],['none','rgba(28,43,58,0.12)','No log']].map(([k,c,l]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }} />
            <span style={{ ...T.tiny, fontSize:11 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── QUICK LOG ─────────────────────────────────────────────
function QuickLog({ visibleHabits, habitValues, setHabitValues, metricValues, setMetricValues, onExpand, healthData, autoFilled }) {
  const todayKey = todayISO()
  const yestKey  = yesterday()
  const yestLog  = LS.get(`log_${yestKey}`)

  return (
    <div>
      {/* Health auto-fill banner */}
      {Object.keys(autoFilled).length > 0 && (
        <div style={{ background:`${GREEN}15`, border:`1px solid ${GREEN}44`, borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16 }}>🔗</span>
          <div style={{ ...T.tiny, color:GREEN, fontWeight:600 }}>
            {Object.keys(autoFilled).map(k=>ALL_HABITS.find(h=>h.id===k)?.label).filter(Boolean).join(', ')} auto-filled from health data
          </div>
        </div>
      )}

      {/* Quick habit tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:12 }}>
        {visibleHabits.map(h => {
          const val    = habitValues[h.id]
          const filled = val!==undefined && val!=='' && val!==null
          const col    = habitColor(h, val)
          const bg     = habitBg(h, val)
          const prev   = yestLog?.habits?.[h.id]
          const isAuto = autoFilled[h.id] !== undefined

          return (
            <div key={h.id}
              onClick={() => {
                // Quick tap: pre-fill with yesterday's value or auto-fill
                if (!filled) {
                  const prefill = autoFilled[h.id] ?? prev ?? ''
                  setHabitValues(v => ({...v, [h.id]: prefill!==''?Number(prefill):'' }))
                }
              }}
              style={{
                background: filled ? bg : CREAM,
                border:`2px solid ${filled?col:'rgba(28,43,58,0.12)'}`,
                borderRadius:12, padding:'14px 12px',
                cursor:'pointer', position:'relative',
                transition:'all .15s',
              }}
            >
              {/* Auto-fill badge */}
              {isAuto && (
                <div style={{ position:'absolute', top:6, right:6, background:GREEN, color:WHITE, fontSize:9, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", borderRadius:4, padding:'1px 5px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Auto</div>
              )}
              <div style={{ fontSize:24, marginBottom:6 }}>{h.icon}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:NAVY, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>{h.label}</div>

              {filled ? (
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:col }}>
                  {val}<span style={{ fontSize:13, fontWeight:400, color:col, marginLeft:3 }}>{h.unit}</span>
                </div>
              ) : (
                <div>
                  <div style={{ ...T.tiny, marginBottom:6 }}>
                    {prev!==undefined ? `Yesterday: ${prev} ${h.unit}` : `Target: ${h.target} ${h.unit}`}
                  </div>
                  <div style={{ background:NAVY, color:WHITE, borderRadius:7, padding:'6px 10px', textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {prev!==undefined ? '↩ Use yesterday' : 'Tap to log'}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Metric sliders — compact row */}
      <div style={{ background:WHITE, borderRadius:12, padding:'14px 16px', marginBottom:10, border:'1px solid rgba(28,43,58,0.1)' }}>
        <div style={{ ...T.super, marginBottom:10 }}>Wellness</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {METRICS.map(m => {
            const v   = metricValues[m.id] ?? 5
            const col = metricColor(m, v)
            return (
              <div key={m.id} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{m.icon}</div>
                <input type="range" min={1} max={10} value={v}
                  onChange={e=>setMetricValues(p=>({...p,[m.id]:Number(e.target.value)}))}
                  style={{ width:'100%', accentColor:col }} />
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:col }}>{v}</div>
                <div style={{ ...T.tiny, fontSize:10 }}>{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Expand to full log */}
      <button onClick={onExpand} style={{ width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:10, padding:'11px', color:'#718096', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer', marginBottom:10 }}>
        ↓ Full Log (Reflection, Cycle, Edit Values)
      </button>
    </div>
  )
}

// ── STREAK CARD ───────────────────────────────────────────
function StreakCard({ logStreak, targetStreak }) {
  const logMil    = STREAK_MILESTONES.includes(logStreak.count)
  const targetMil = STREAK_MILESTONES.includes(targetStreak.count)
  const next      = STREAK_MILESTONES.find(m=>m>logStreak.count) || 365
  const prev      = STREAK_MILESTONES.slice().reverse().find(m=>m<=logStreak.count) || 0
  const pct       = prev===next?100:Math.round(((logStreak.count-prev)/(next-prev))*100)

  return (
    <div style={{ background:WHITE, borderRadius:14, marginBottom:11, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 4px rgba(28,43,58,0.07)', overflow:'hidden' }}>
      <div style={{ background:NAVY, padding:'10px 18px' }}>
        <div style={{ ...T.super, color:ORANGE }}>Your Streaks</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        {/* Log streak */}
        <div style={{ padding:'14px 18px', borderRight:'1px solid rgba(28,43,58,0.1)', background:logMil?`${ORANGE}08`:WHITE }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:22 }}>🔥</span>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:38, color:logStreak.count>0?ORANGE:'#cbd5e0', lineHeight:1 }}>{logStreak.count}</div>
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:NAVY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Days Logged</div>
          <div style={{ ...T.tiny, marginTop:2 }}>Best: {logStreak.best}</div>
          {logMil && logStreak.count>0 && (
            <div style={{ marginTop:7, background:ORANGE, color:WHITE, borderRadius:7, padding:'3px 9px', fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:'uppercase', letterSpacing:'0.05em', display:'inline-block' }}>🏆 Milestone!</div>
          )}
        </div>
        {/* Target streak */}
        <div style={{ padding:'14px 18px', background:targetMil?`${GREEN}08`:WHITE }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:22 }}>⭐</span>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:38, color:targetStreak.count>0?GREEN:'#cbd5e0', lineHeight:1 }}>{targetStreak.count}</div>
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:NAVY, textTransform:'uppercase', letterSpacing:'0.04em' }}>On Target</div>
          <div style={{ ...T.tiny, marginTop:2 }}>Best: {targetStreak.best}</div>
          {targetMil && targetStreak.count>0 && (
            <div style={{ marginTop:7, background:GREEN, color:WHITE, borderRadius:7, padding:'3px 9px', fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:'uppercase', letterSpacing:'0.05em', display:'inline-block' }}>🏆 Milestone!</div>
          )}
        </div>
      </div>
      {/* Progress to next milestone */}
      <div style={{ padding:'10px 18px 14px', borderTop:'1px solid rgba(28,43,58,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ ...T.tiny }}>Next milestone: {next} days</span>
          <span style={{ ...T.tiny }}>{logStreak.count}/{next}</span>
        </div>
        <div style={{ height:5, background:'rgba(28,43,58,0.1)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:ORANGE, borderRadius:3, transition:'width .4s' }} />
        </div>
      </div>
    </div>
  )
}

// ── CHECK-IN CARD ─────────────────────────────────────────
function CheckInCard({ type, questions, onSubmit, client }) {
  const [answers,  setAnswers]  = useState({})
  const [step,     setStep]     = useState(0)
  const [sending,  setSending]  = useState(false)
  const [done,     setDone]     = useState(false)

  const q      = questions[step]
  const isLast = step===questions.length-1
  const inp    = { width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:10, padding:'13px 15px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }

  const handleNext = async () => {
    if (isLast) {
      setSending(true)
      await onSubmit({ type, answers, client, submittedAt:new Date().toISOString() })
      setSending(false); setDone(true)
      if (type==='weekly') LS.set(`checkin_weekly_done_${getWeekKey()}`,true)
      else LS.set(`checkin_monthly_done_${getMonthKey()}`,true)
    } else { setStep(s=>s+1) }
  }

  const canAdvance = () => {
    const val=answers[q.id]
    if(q.type==='slider') return val!==undefined
    if(q.type==='select') return val&&val!==''
    return true
  }

  if (done) return (
    <div style={{ background:WHITE, borderRadius:14, padding:28, textAlign:'center', border:`1.5px solid ${GREEN}`, marginBottom:11 }}>
      <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
      <div style={{ ...T.h3, fontSize:18, marginBottom:6 }}>{type==='weekly'?'Weekly':'Monthly'} Check-In Complete</div>
      <div style={{ ...T.small }}>Your coach will review your responses before your next session.</div>
    </div>
  )

  return (
    <div style={{ background:WHITE, borderRadius:14, marginBottom:11, border:`1.5px solid ${ORANGE}`, overflow:'hidden' }}>
      <div style={{ background:ORANGE, padding:'12px 18px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:WHITE, textTransform:'uppercase', letterSpacing:'0.04em' }}>
          {type==='weekly'?'📋 Weekly Check-In':'📅 Monthly Check-In'}
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>Question {step+1} of {questions.length}</div>
      </div>
      <div style={{ display:'flex', gap:4, padding:'8px 18px', background:`${ORANGE}10` }}>
        {questions.map((_,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=step?ORANGE:'rgba(28,43,58,0.12)', transition:'background .2s' }} />
        ))}
      </div>
      <div style={{ padding:20 }}>
        <div style={{ ...T.label, marginBottom:14, lineHeight:1.5 }}>{q.label}</div>
        {q.type==='slider' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ ...T.tiny }}>{q.low}</span>
              <span style={{ ...T.tiny }}>{q.high}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input type="range" min={q.min} max={q.max} value={answers[q.id]??5}
                onChange={e=>setAnswers(p=>({...p,[q.id]:Number(e.target.value)}))}
                style={{ flex:1, accentColor:ORANGE }} />
              <div style={{ minWidth:40, textAlign:'center', background:ORANGE, color:WHITE, borderRadius:8, padding:'3px 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22 }}>{answers[q.id]??5}</div>
            </div>
          </div>
        )}
        {q.type==='select' && (
          <select value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))}
            style={{ ...inp, appearance:'none', cursor:'pointer' }}>
            <option value="">Select...</option>
            {q.options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {q.type==='text' && (
          <textarea value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))}
            placeholder={q.placeholder} rows={3} style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
        )}
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:10, padding:'12px', color:NAVY, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, textTransform:'uppercase', cursor:'pointer' }}>← Back</button>}
          <button onClick={handleNext} disabled={!canAdvance()||sending} style={{ flex:2, background:canAdvance()&&!sending?ORANGE:'rgba(28,43,58,0.15)', border:'none', borderRadius:10, padding:'12px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, textTransform:'uppercase', letterSpacing:'0.04em', cursor:canAdvance()&&!sending?'pointer':'not-allowed' }}>
            {sending?'Sending...':(isLast?'Submit ✓':'Next →')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── WEEKLY REPORT CARD ────────────────────────────────────
function WeeklyReportCard({ data }) {
  if (!data||data.length<3) return null
  const calcAvg = key => { const v=data.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v)); return v.length?(v.reduce((a,b)=>a+b,0)/v.length):null }
  const metrics = [
    {key:'sleep',     label:'Sleep',    target:7.5,  unit:'h',   good:'>=', icon:'🌙'},
    {key:'steps',     label:'Steps',    target:8000, unit:'',    good:'>=', icon:'👟'},
    {key:'hydration', label:'Hydration',target:2.5,  unit:'L',   good:'>=', icon:'💧'},
    {key:'stress',    label:'Stress',   target:5,    unit:'/10', good:'<=', icon:'⚡'},
    {key:'mood',      label:'Mood',     target:6,    unit:'/10', good:'>=', icon:'😊'},
    {key:'energy',    label:'Energy',   target:6,    unit:'/10', good:'>=', icon:'🔋'},
  ]
  const getStatus = (avg,target,good) => {
    if(avg===null) return 'none'
    if(good==='>=') return avg>=target?'green':avg>=target*0.8?'amber':'red'
    return avg<=target?'green':avg<=target*1.2?'amber':'red'
  }
  const statusColor = {green:GREEN,amber:AMBER,red:RED,none:'#cbd5e0'}
  const statusBg    = {green:GREEN_LIGHT,amber:AMBER_LIGHT,red:RED_LIGHT,none:CREAM}
  const compAvg     = calcAvg('completion')

  return (
    <div style={{ background:WHITE, borderRadius:14, marginBottom:11, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 4px rgba(28,43,58,0.07)', overflow:'hidden' }}>
      <div style={{ background:NAVY, padding:'12px 18px' }}>
        <div style={{ ...T.super, color:ORANGE, marginBottom:2 }}>This Week</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:WHITE, textTransform:'uppercase' }}>Weekly Summary</div>
      </div>
      {compAvg!==null && (
        <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(28,43,58,0.08)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:compAvg>=80?GREEN_LIGHT:compAvg>=60?AMBER_LIGHT:RED_LIGHT, border:`3px solid ${compAvg>=80?GREEN:compAvg>=60?AMBER:RED}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color:compAvg>=80?GREEN:compAvg>=60?AMBER:RED }}>{Math.round(compAvg)}%</span>
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:15, color:NAVY }}>Habit Completion</div>
            <div style={{ ...T.small, marginTop:1 }}>{compAvg>=80?'Great consistency this week':'Room to grow — every day counts'}</div>
          </div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(28,43,58,0.08)' }}>
        {metrics.map(m => {
          const avg=calcAvg(m.key), status=getStatus(avg,m.target,m.good)
          return (
            <div key={m.key} style={{ background:statusBg[status], padding:'10px 8px', textAlign:'center' }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{m.icon}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:statusColor[status] }}>
                {avg!==null?(m.key==='steps'?Math.round(avg).toLocaleString():Number(avg).toFixed(1)):'—'}{m.unit}
              </div>
              <div style={{ ...T.tiny, marginTop:1 }}>{m.label}</div>
            </div>
          )
        })}
      </div>
      <div style={{ padding:'10px 18px', background:CREAM }}>
        <div style={{ ...T.tiny, lineHeight:1.6 }}>Your coach will review this and send a full report with their notes. Check your email.</div>
      </div>
    </div>
  )
}

// ── SETUP SCREEN ──────────────────────────────────────────
function SetupScreen({ onComplete }) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr]     = useState('')
  const submit = () => {
    if (!name.trim())                        { setErr('Please enter your name'); return }
    if (!email.trim()||!email.includes('@')) { setErr('Please enter a valid email'); return }
    onComplete({ name:name.trim(), email:email.trim(), startDay:new Date().getDate(), joinedAt:new Date().toISOString() })
  }
  const inp = { width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.2)', borderRadius:11, padding:'14px 16px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }
  return (
    <div style={{ minHeight:'100vh', background:CREAM, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', width:'100%', height:8 }}>{PRIDE.map(c=><div key={c} style={{flex:1,background:c}}/>)}</div>
      <div style={{ background:NAVY, padding:'16px 20px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, letterSpacing:'0.07em', color:WHITE }}>EVOLVE<span style={{color:ORANGE}}>:</span>WELLBEING</div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ width:84, height:84, background:NAVY, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, overflow:'hidden' }}>
          <img src="/icons/icon-192x192.png" alt="Evolve" style={{ width:84, height:84 }} />
        </div>
        <div style={{ ...T.super, marginBottom:10, textAlign:'center' }}>Daily Habit Tracker</div>
        <div style={{ ...T.h1, fontSize:40, marginBottom:32, textAlign:'center' }}>Let's Get You Set Up</div>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ background:WHITE, borderRadius:14, padding:28, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 4px rgba(28,43,58,0.07)' }}>
            <div style={{ ...T.body, marginBottom:24, color:'#4a5568' }}>This takes 30 seconds. We'll save your details to this device so every log is ready to go.</div>
            <label style={{ ...T.label, display:'block', marginBottom:8 }}>Your Name <span style={{color:ORANGE}}>*</span></label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sarah Jones" style={inp} />
            <label style={{ ...T.label, display:'block', marginTop:20, marginBottom:8 }}>Email Address <span style={{color:ORANGE}}>*</span></label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="e.g. sarah@email.com" onKeyDown={e=>e.key==='Enter'&&submit()} style={inp} />
            {err && <div style={{ color:RED, fontSize:14, marginTop:10 }}>{err}</div>}
            <button onClick={submit} style={{ width:'100%', marginTop:24, background:ORANGE, border:'none', borderRadius:12, padding:'16px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>Start Tracking →</button>
            <div style={{ ...T.tiny, textAlign:'center', marginTop:16, lineHeight:1.7 }}>Your information is kept private and secure.<br/>Used only by your Evolve:Wellbeing coach.</div>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', width:'100%', height:8 }}>{PRIDE.map(c=><div key={c} style={{flex:1,background:c}}/>)}</div>
    </div>
  )
}

function NotifPrompt({ onDone }) {
  const request = async () => {
    if (!('Notification' in window)) { onDone(); return }
    const perm = await Notification.requestPermission()
    if (perm==='granted') navigator.serviceWorker.ready.then(r=>r.active?.postMessage({type:'SCHEDULE_REMINDER'}))
    onDone()
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(28,43,58,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:WHITE, borderRadius:18, padding:32, maxWidth:360, width:'100%', border:`2px solid ${ORANGE}` }}>
        <div style={{ fontSize:40, marginBottom:16, textAlign:'center' }}>🔔</div>
        <div style={{ ...T.h2, fontSize:26, textAlign:'center', marginBottom:12 }}>Daily Reminders</div>
        <div style={{ ...T.body, textAlign:'center', marginBottom:28, color:'#4a5568' }}>Get a nudge at 8pm every evening to log your habits, and reminders for weekly check-ins every Sunday.</div>
        <button onClick={request} style={{ width:'100%', background:ORANGE, border:'none', borderRadius:12, padding:'15px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', marginBottom:12 }}>Enable Reminders</button>
        <button onClick={onDone} style={{ width:'100%', background:'transparent', border:'none', color:'#a0aec0', fontFamily:"'Barlow',sans-serif", fontSize:15, cursor:'pointer', padding:'8px' }}>Not now</button>
      </div>
    </div>
  )
}

function InstallBanner({ onDismiss }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999, background:NAVY, borderTop:`3px solid ${ORANGE}`, padding:'16px 20px 22px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, textTransform:'uppercase', color:WHITE, marginBottom:8 }}>Add to Home Screen</div>
        <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:14 }}>{isIOS?'Tap Share then "Add to Home Screen" to install Evolve:Wellbeing as an app.':'Install Evolve:Wellbeing on your home screen for the best experience.'}</div>
        <div style={{ display:'flex', gap:8 }}>
          {!isIOS&&<button id="pwa-install-btn" style={{ flex:2, background:ORANGE, border:'none', borderRadius:10, padding:'12px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, textTransform:'uppercase', cursor:'pointer' }}>Install</button>}
          <button onClick={onDismiss} style={{ flex:1, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'12px', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow',sans-serif", fontSize:14, cursor:'pointer' }}>Not Now</button>
        </div>
      </div>
    </div>
  )
}

function CoachToast({ onDone }) {
  useEffect(() => { const t=setTimeout(onDone,2500); return ()=>clearTimeout(t) }, [onDone])
  return (
    <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', zIndex:9997, background:NAVY, border:`2px solid ${ORANGE}`, borderRadius:12, padding:'12px 24px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(28,43,58,0.3)' }}>
      ⚙ Coach Mode Unlocked
    </div>
  )
}

const Card = ({ children, style={} }) => (
  <div style={{ background:WHITE, borderRadius:14, padding:18, marginBottom:11, border:'1px solid rgba(28,43,58,0.1)', boxShadow:'0 1px 4px rgba(28,43,58,0.07)', ...style }}>{children}</div>
)
const SL = ({ children }) => (
  <div style={{ ...T.super, borderBottom:'1.5px solid rgba(28,43,58,0.1)', paddingBottom:8, marginTop:22, marginBottom:12 }}>{children}</div>
)
const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:NAVY, border:`1px solid ${ORANGE}`, borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <div style={{ color:ORANGE, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{ color:WHITE, marginBottom:2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  )
}
const ChartCard = ({ title, subtitle, children }) => (
  <Card style={{ padding:'18px 14px', marginBottom:14 }}>
    <div style={{ ...T.h3, fontSize:18, marginBottom:3 }}>{title}</div>
    <div style={{ ...T.small, marginBottom:14 }}>{subtitle}</div>
    {children}
  </Card>
)

// ── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [client,          setClient]          = useState(null)
  const [showQuote,       setShowQuote]       = useState(false)
  const [showStreakBroken,setShowStreakBroken] = useState(false)
  const [brokenStreak,    setBrokenStreak]    = useState(0)
  const [showConfetti,    setShowConfetti]    = useState(false)
  const [view,            setView]            = useState('log')
  const [logMode,         setLogMode]         = useState('quick') // 'quick' | 'full'
  const [coachUnlocked,   setCoachUnlocked]   = useState(false)
  const [showCoachToast,  setShowCoachToast]  = useState(false)
  const [activeHabits,    setActiveHabits]    = useState(['sleep','steps','hydration','meals','mindfulness'])
  const [showCycle,       setShowCycle]       = useState(false)
  const [habitValues,     setHabitValues]     = useState({})
  const [metricValues,    setMetricValues]    = useState({stressRPE:5,mood:6,energy:6,digestion:7})
  const [cyclePhase,      setCyclePhase]      = useState('')
  const [reflection,      setReflection]      = useState('')
  const [sendStatus,      setSendStatus]      = useState('idle')
  const [historicData,    setHistoricData]    = useState([])
  const [graphDays,       setGraphDays]       = useState(30)
  const [loadingGraphs,   setLoadingGraphs]   = useState(false)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)
  const [showInstall,     setShowInstall]     = useState(false)
  const [deferredPrompt,  setDeferredPrompt]  = useState(null)
  const [logStreak,       setLogStreak]       = useState({count:0,lastDate:null,best:0})
  const [targetStreak,    setTargetStreak]    = useState({count:0,lastDate:null,best:0})
  const [weeklyDue,       setWeeklyDue]       = useState(false)
  const [monthlyDue,      setMonthlyDue]      = useState(false)
  const [weekData,        setWeekData]        = useState([])
  const [isOnline,        setIsOnline]        = useState(navigator.onLine)
  const [syncedCount,     setSyncedCount]     = useState(0)
  const [fitToken,        setFitToken]        = useState(null)
  const [autoFilled,      setAutoFilled]      = useState({})

  const tapCount = useRef(0)
  const tapTimer = useRef(null)
  const todayKey = todayISO()
  const promptIdx = new Date().getDay()
  const visibleHabits   = ALL_HABITS.filter(h=>activeHabits.includes(h.id))
  const completedHabits = visibleHabits.filter(h=>habitValues[h.id]!==undefined&&habitValues[h.id]!=='')
  const completionPct   = visibleHabits.length?Math.round(completedHabits.length/visibleHabits.length*100):0
  const allGreen        = completedHabits.length===visibleHabits.length && visibleHabits.length>0 && visibleHabits.every(h=>Number(habitValues[h.id]||0)>=h.green)

  // ── Boot ───────────────────────────────────────────────
  useEffect(() => {
    const saved = LS.get('evolve_client')
    if (saved) {
      setClient(saved)
      setShowQuote(true)
      // Check streak broken
      if (wasMissed()) {
        const ls = LS.get('streak_log',{count:0,lastDate:null,best:0})
        setBrokenStreak(ls.count)
        LS.set('streak_broken_count', ls.count)
        setTimeout(() => setShowStreakBroken(true), 1000)
      }
    }
    const {logStreak:ls,targetStreak:ts} = calculateStreaks()
    setLogStreak(ls); setTargetStreak(ts)

    // Google Fit token check
    const token = getGoogleFitToken()
    if (token) setFitToken(token)

    // Online/offline
    const onOn  = async () => {
      setIsOnline(true)
      const sent = await flushQueue()
      if (sent>0) { setSyncedCount(sent); setTimeout(()=>setSyncedCount(0),4000) }
    }
    const onOff = () => setIsOnline(false)
    window.addEventListener('online', onOn)
    window.addEventListener('offline', onOff)

    // PWA install
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS&&!window.navigator.standalone&&!LS.get('install_dismissed')) setShowInstall(true)

    return () => {
      window.removeEventListener('online',onOn)
      window.removeEventListener('offline',onOff)
      window.removeEventListener('beforeinstallprompt',handler)
    }
  }, [])

  // ── Auto-fill from health ──────────────────────────────
  useEffect(() => {
    if (!fitToken) return
    autoFillFromHealth(fitToken).then(data => {
      if (Object.keys(data).length > 0) {
        setAutoFilled(data)
        setHabitValues(prev => {
          const next = {...prev}
          Object.entries(data).forEach(([k,v]) => {
            if (prev[k]===undefined||prev[k]==='') next[k] = v
          })
          return next
        })
      }
    })
  }, [fitToken])

  // ── Client-dependent setup ─────────────────────────────
  useEffect(() => {
    if (!client) return
    setWeeklyDue(isWeeklyCheckInDue())
    setMonthlyDue(isMonthlyCheckInDue(client))
    const last7 = []
    for (let i=6;i>=0;i--) {
      const d=new Date(); d.setDate(d.getDate()-i)
      const key=d.toISOString().split('T')[0]
      const log=LS.get(`log_${key}`)
      if (log) last7.push({
        date:key,
        sleep:    Number(log.habits?.sleep   ||0)||null,
        steps:    Number(log.habits?.steps   ||0)||null,
        hydration:Number(log.habits?.hydration||0)||null,
        stress:   Number(log.metrics?.stressRPE||0)||null,
        mood:     Number(log.metrics?.mood   ||0)||null,
        energy:   Number(log.metrics?.energy ||0)||null,
        completion: visibleHabits.length?Math.round(visibleHabits.filter(h=>log.habits?.[h.id]!==undefined&&log.habits?.[h.id]!=='').length/visibleHabits.length*100):0,
      })
    }
    setWeekData(last7)
  }, [client])

  // ── Load today ─────────────────────────────────────────
  useEffect(() => {
    const saved = LS.get(`log_${todayKey}`)
    if (saved) {
      setHabitValues(saved.habits||{})
      setMetricValues(saved.metrics||{stressRPE:5,mood:6,energy:6,digestion:7})
      setCyclePhase(saved.cyclePhase||'')
      setReflection(saved.reflection||'')
    }
  }, [todayKey])

  // ── Auto-save ──────────────────────────────────────────
  useEffect(() => {
    if (!client) return
    LS.set(`log_${todayKey}`,{habits:habitValues,metrics:metricValues,cyclePhase,reflection})
  }, [habitValues,metricValues,cyclePhase,reflection,client,todayKey])

  // ── Config ─────────────────────────────────────────────
  useEffect(() => {
    const cfg=LS.get('evolve_config')
    if (cfg) { if(cfg.activeHabits)setActiveHabits(cfg.activeHabits); if(cfg.showCycle!==undefined)setShowCycle(cfg.showCycle) }
  }, [])
  useEffect(() => { LS.set('evolve_config',{activeHabits,showCycle}) }, [activeHabits,showCycle])

  // ── Install button ─────────────────────────────────────
  useEffect(() => {
    const btn=document.getElementById('pwa-install-btn')
    if (!btn||!deferredPrompt) return
    const h=async()=>{ deferredPrompt.prompt(); const{outcome}=await deferredPrompt.userChoice; if(outcome==='accepted'){setShowInstall(false);setDeferredPrompt(null)} }
    btn.addEventListener('click',h)
    return ()=>btn.removeEventListener('click',h)
  },[deferredPrompt,showInstall])

  const handleSetupComplete = useCallback(info => {
    LS.set('evolve_client',info); setClient(info)
    setTimeout(()=>{setShowQuote(true);setTimeout(()=>setShowNotifPrompt(true),500)},300)
  },[])

  const handleWordmarkTap = () => {
    tapCount.current+=1; clearTimeout(tapTimer.current)
    if (tapCount.current>=5) {
      tapCount.current=0; setCoachUnlocked(true); setShowCoachToast(true); setView('config')
    } else { tapTimer.current=setTimeout(()=>{tapCount.current=0},2000) }
  }

  // ── Fetch graphs ────────────────────────────────────────
  const fetchData = useCallback(async()=>{
    if (!client||APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') return
    setLoadingGraphs(true)
    try {
      const res=await fetch(`${APPS_SCRIPT_URL}?clientId=${encodeURIComponent(client.name)}&days=${graphDays}`)
      const json=await res.json()
      if (json.success&&json.data) setHistoricData(json.data)
    } catch {}
    setLoadingGraphs(false)
  },[client,graphDays])
  useEffect(()=>{if(view==='graphs')fetchData()},[view,fetchData])

  // ── Send log ───────────────────────────────────────────
  const handleSend = async () => {
    if (sendStatus!=='idle') return
    setSendStatus('sending')
    const {logStreak:ls,targetStreak:ts} = updateStreaks(habitValues,visibleHabits)
    setLogStreak(ls); setTargetStreak(ts)
    const payload = {
      date:todayKey, clientId:client?.name?.toLowerCase().replace(/\s+/g,'-')||'unknown',
      clientName:client?.name||'', clientEmail:client?.email||'',
      habits:habitValues, metrics:metricValues,
      cyclePhase:showCycle?cyclePhase:'',
      reflectionPrompt:DAILY_PROMPTS[promptIdx%DAILY_PROMPTS.length],
      reflection, habitsCompleted:completedHabits.length, habitsTotal:visibleHabits.length,
      logStreak:ls.count, targetStreak:ts.count,
    }
    if (APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
      setTimeout(()=>{setSendStatus('success');if(allGreen)setShowConfetti(true)},1200)
      return
    }
    if (!navigator.onLine) {
      queueLog(payload, APPS_SCRIPT_URL)
      setSendStatus('queued')
      return
    }
    try {
      await fetch(APPS_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      setTimeout(()=>{
        setSendStatus('success')
        if (allGreen) { setShowConfetti(true); setTimeout(()=>setShowConfetti(false),3500) }
      },1200)
    } catch {
      queueLog(payload, APPS_SCRIPT_URL)
      setSendStatus('queued')
    }
  }

  const handleCheckIn = async (data) => {
    if (CHECKIN_SCRIPT_URL==='YOUR_CHECKIN_APPS_SCRIPT_URL_HERE') return
    try { await fetch(CHECKIN_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}) } catch {}
  }

  // ── Chart data ─────────────────────────────────────────
  const chartData = historicData.sort((a,b)=>new Date(a['Date'])-new Date(b['Date'])).map(row=>({
    date:     new Date(row['Date']).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
    sleep:    parseFloat(row['Sleep (hrs)'])||null,
    steps:    parseInt(row['Steps'])||null,
    hydration:parseFloat(row['Hydration (L)'])||null,
    stress:   parseFloat(row['Stress RPE (1-10)'])||null,
    mood:     parseFloat(row['Mood (1-10)'])||null,
    energy:   parseFloat(row['Energy (1-10)'])||null,
    completion:parseFloat(row['Completion %'])||null,
  }))
  const calcAvg = key => { const v=chartData.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v)); return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):null }

  const inp = { width:'100%', background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:10, padding:'13px 15px', color:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:16, outline:'none', boxSizing:'border-box' }

  const navTabs = [
    {v:'log',icon:'📋',label:'Log'},
    {v:'graphs',icon:'📊',label:'Progress'},
    ...(coachUnlocked?[{v:'config',icon:'⚙',label:'Setup'}]:[]),
  ]

  if (!client) return <SetupScreen onComplete={handleSetupComplete} />

  return (
    <div style={{ minHeight:'100vh', background:CREAM, color:NAVY, fontFamily:"'Barlow',sans-serif", display:'flex', flexDirection:'column' }}>
      {showConfetti    && <ConfettiCanvas />}
      {showQuote       && <QuoteSplash onDismiss={()=>setShowQuote(false)} />}
      {showStreakBroken && <StreakBrokenScreen streak={brokenStreak} onDismiss={()=>{ setShowStreakBroken(false); LS.del('streak_broken_count') }} />}
      {showNotifPrompt && <NotifPrompt onDone={()=>setShowNotifPrompt(false)} />}
      {showInstall     && <InstallBanner onDismiss={()=>{ setShowInstall(false); LS.set('install_dismissed',true) }} />}
      {showCoachToast  && <CoachToast onDone={()=>setShowCoachToast(false)} />}

      {/* Offline / sync banner */}
      <OfflineBanner queued={getQueueLength()} synced={syncedCount} />

      {/* Pride band */}
      <div style={{ display:'flex', width:'100%', height:6, flexShrink:0 }}>
        {PRIDE.map(c=><div key={c} style={{flex:1,background:c}}/>)}
      </div>

      {/* Header */}
      <div style={{ background:NAVY, padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div onClick={handleWordmarkTap} style={{ cursor:'default', userSelect:'none' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, letterSpacing:'0.07em', color:WHITE }}>EVOLVE<span style={{color:ORANGE}}>:</span>WELLBEING</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{client.name}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {logStreak.count>0&&<div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(242,100,25,0.2)', borderRadius:20, padding:'5px 10px' }}><span style={{fontSize:14}}>🔥</span><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:ORANGE }}>{logStreak.count}</span></div>}
          {targetStreak.count>0&&<div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(46,125,50,0.15)', borderRadius:20, padding:'5px 10px' }}><span style={{fontSize:14}}>⭐</span><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:GREEN }}>{targetStreak.count}</span></div>}
        </div>
      </div>

      {/* ── LOG ── */}
      {view==='log' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 110px' }}>
          {/* Date + progress */}
          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
              <div style={{ ...T.super }}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:completionPct===100?GREEN:ORANGE }}>{completedHabits.length}/{visibleHabits.length}</div>
            </div>
            <div style={{ height:7, background:'rgba(28,43,58,0.1)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${completionPct}%`, background:completionPct===100?GREEN:ORANGE, borderRadius:4, transition:'width .3s' }} />
            </div>
          </div>

          {/* Streak card */}
          <StreakCard logStreak={logStreak} targetStreak={targetStreak} />

          {/* Google Fit connect button (if not connected) */}
          {!fitToken && (
            <div style={{ background:WHITE, borderRadius:12, padding:'14px 16px', marginBottom:11, border:'1px solid rgba(28,43,58,0.1)', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(28,43,58,0.07)' }}>
              <span style={{fontSize:22}}>🔗</span>
              <div style={{flex:1}}>
                <div style={{ fontWeight:600, fontSize:15, color:NAVY, marginBottom:2 }}>Connect Google Fit</div>
                <div style={{ ...T.tiny }}>Auto-fill steps, sleep and activity from your phone</div>
              </div>
              <button onClick={initiateGoogleFitAuth} style={{ background:ORANGE, border:'none', borderRadius:8, padding:'8px 14px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer', flexShrink:0 }}>Connect</button>
            </div>
          )}

          {/* Check-ins */}
          {weeklyDue && <CheckInCard type="weekly" questions={WEEKLY_QUESTIONS} onSubmit={handleCheckIn} client={client} />}
          {monthlyDue&&!weeklyDue && <CheckInCard type="monthly" questions={MONTHLY_QUESTIONS} onSubmit={handleCheckIn} client={client} />}

          {/* Weekly report */}
          {weekData.length>=3&&!weeklyDue && <WeeklyReportCard data={weekData} />}

          {/* Habits */}
          <SL>Today's Habits</SL>

          {/* Mode toggle */}
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {[['quick','⚡ Quick'],['full','📝 Full']].map(([m,label])=>(
              <button key={m} onClick={()=>setLogMode(m)} style={{ flex:1, background:logMode===m?NAVY:WHITE, border:`1.5px solid ${logMode===m?NAVY:'rgba(28,43,58,0.18)'}`, borderRadius:9, padding:'9px', color:logMode===m?WHITE:NAVY, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer' }}>{label}</button>
            ))}
          </div>

          {/* Quick log mode */}
          {logMode==='quick' && (
            <QuickLog
              visibleHabits={visibleHabits}
              habitValues={habitValues}
              setHabitValues={setHabitValues}
              metricValues={metricValues}
              setMetricValues={setMetricValues}
              onExpand={()=>setLogMode('full')}
              healthData={autoFilled}
              autoFilled={autoFilled}
            />
          )}

          {/* Full log mode */}
          {logMode==='full' && (
            <>
              {visibleHabits.map(h=>{
                const val=habitValues[h.id], col=habitColor(h,val), bg=habitBg(h,val), filled=val!==undefined&&val!==''
                return (
                  <div key={h.id} style={{ background:filled?bg:WHITE, border:`1.5px solid ${filled?col+'55':'rgba(28,43,58,0.1)'}`, borderRadius:14, padding:18, marginBottom:10, boxShadow:'0 1px 4px rgba(28,43,58,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                      <span style={{fontSize:22}}>{h.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{ fontWeight:700, fontSize:17, color:NAVY }}>{h.label}</div>
                        <div style={{ fontSize:13, color:'#718096', marginTop:3 }}>{h.desc}</div>
                      </div>
                      {filled&&<div style={{ width:9, height:9, borderRadius:'50%', background:col, marginTop:6, flexShrink:0 }}/>}
                      {autoFilled[h.id]!==undefined&&<div style={{ background:GREEN, color:WHITE, fontSize:10, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", borderRadius:5, padding:'2px 7px', textTransform:'uppercase' }}>Auto</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <input type="number" min={h.min} max={h.max} step={h.step} value={val??''}
                        onChange={e=>setHabitValues(p=>({...p,[h.id]:e.target.value===''?'':Number(e.target.value)}))}
                        placeholder={`Enter ${h.unit}`}
                        style={{ ...inp, flex:1, fontSize:17, fontWeight:600, border:`1.5px solid ${filled?col+'77':'rgba(28,43,58,0.18)'}` }} />
                      <div style={{ fontSize:13, color:'#718096', minWidth:54 }}>{h.unit}<div style={{ color:'#a0aec0', marginTop:3, fontSize:12 }}>↑ {h.target}</div></div>
                    </div>
                  </div>
                )
              })}

              <SL>Wellness Metrics</SL>
              {METRICS.map(m=>(
                <Card key={m.id}>
                  <div style={{ fontWeight:700, fontSize:17, color:NAVY, marginBottom:4 }}>{m.icon} {m.label}</div>
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ ...T.tiny, minWidth:72 }}>{m.low}</span>
                      <div style={{flex:1}}>
                        <input type="range" min={1} max={10} value={metricValues[m.id]??5}
                          onChange={e=>setMetricValues(p=>({...p,[m.id]:Number(e.target.value)}))}
                          style={{ width:'100%', accentColor:metricColor(m,metricValues[m.id]??5), cursor:'pointer' }} />
                      </div>
                      <span style={{ ...T.tiny, minWidth:72, textAlign:'right' }}>{m.high}</span>
                      <div style={{ minWidth:44, textAlign:'center', background:metricColor(m,metricValues[m.id]??5), color:WHITE, borderRadius:9, padding:'4px 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24 }}>{metricValues[m.id]??5}</div>
                    </div>
                    <div style={{ ...T.tiny, marginTop:5 }}>{m.note}</div>
                  </div>
                </Card>
              ))}

              {showCycle&&(
                <>
                  <SL>Cycle Phase</SL>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:4 }}>
                    {CYCLE_OPTS.map(opt=>(
                      <button key={opt} onClick={()=>setCyclePhase(opt)} style={{ background:cyclePhase===opt?ORANGE:WHITE, border:`1.5px solid ${cyclePhase===opt?ORANGE:'rgba(28,43,58,0.15)'}`, borderRadius:10, padding:'11px 12px', color:cyclePhase===opt?WHITE:NAVY, fontFamily:"'Barlow',sans-serif", fontSize:14, fontWeight:cyclePhase===opt?600:400, cursor:'pointer', textAlign:'left', lineHeight:1.4 }}>{opt}</button>
                    ))}
                  </div>
                </>
              )}

              <SL>Daily Reflection</SL>
              <div style={{ background:WHITE, border:`1.5px solid ${ORANGE}55`, borderLeft:`4px solid ${ORANGE}`, borderRadius:11, padding:16, marginBottom:10, fontSize:15, color:'#4a5568', lineHeight:1.7, fontStyle:'italic' }}>
                {DAILY_PROMPTS[promptIdx%DAILY_PROMPTS.length]}
              </div>
              <textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={4} placeholder="Your thoughts..."
                style={{ ...inp, resize:'vertical', marginBottom:20, lineHeight:1.7, fontSize:15 }} />
            </>
          )}

          {/* Send button */}
          <Card style={{ padding:24 }}>
            <div style={{ ...T.super, marginBottom:6 }}>Send Today's Log</div>
            <div style={{ ...T.small, marginBottom:16 }}>Sends your log to your coach and saves it to your progress tracker.</div>
            <button onClick={handleSend} disabled={sendStatus!=='idle'} style={{
              width:'100%',
              background:sendStatus==='success'?GREEN:sendStatus==='queued'?AMBER:sendStatus==='error'?RED:ORANGE,
              border:'none', borderRadius:12, padding:'17px', color:WHITE,
              fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
              fontSize:19, letterSpacing:'0.06em', textTransform:'uppercase',
              cursor:sendStatus==='idle'?'pointer':'default', transition:'background .25s',
            }}>
              {sendStatus==='idle'    && 'Send to Coach →'}
              {sendStatus==='sending' && 'Sending...'}
              {sendStatus==='success' && (allGreen?'🎉 All Green — Sent!':'✓ Sent to Coach')}
              {sendStatus==='queued'  && '📡 Queued — Will Send When Online'}
              {sendStatus==='error'   && '⚠ Something went wrong'}
            </button>
            {sendStatus==='success'&&<div style={{ fontSize:14, color:GREEN, textAlign:'center', marginTop:12 }}>Log saved. Your coach will review it shortly.</div>}
          </Card>
        </div>
      )}

      {/* ── GRAPHS ── */}
      {view==='graphs' && (
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 110px' }}>
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {[7,14,30].map(d=>(
              <button key={d} onClick={()=>setGraphDays(d)} style={{ flex:1, background:graphDays===d?ORANGE:WHITE, border:`1.5px solid ${graphDays===d?ORANGE:'rgba(28,43,58,0.18)'}`, borderRadius:10, padding:'10px', color:graphDays===d?WHITE:NAVY, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>{d} Days</button>
            ))}
          </div>

          {/* Habit calendar — works from day 1 */}
          <HabitCalendar visibleHabits={visibleHabits} />

          {loadingGraphs&&<div style={{ textAlign:'center', padding:40, color:'#718096', fontSize:16 }}>Loading your progress data...</div>}

          {!loadingGraphs&&chartData.length===0&&(
            <Card style={{ textAlign:'center', padding:40 }}>
              <div style={{ fontSize:36, marginBottom:14 }}>📊</div>
              <div style={{ ...T.h3, marginBottom:10 }}>No synced data yet</div>
              <div style={{ ...T.small }}>Send your first daily log to start building your progress charts. Your calendar above shows local data from day one.</div>
            </Card>
          )}

          {!loadingGraphs&&chartData.length>0&&(
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:18 }}>
                {[
                  {label:'Avg Sleep',  val:calcAvg('sleep')?`${calcAvg('sleep')}h`:'—',        ok:calcAvg('sleep')>=7,    target:'7.5h'},
                  {label:'Avg Stress', val:calcAvg('stress')??'—',                              ok:calcAvg('stress')<=5,   target:'≤5'},
                  {label:'Avg Mood',   val:calcAvg('mood')??'—',                                ok:calcAvg('mood')>=6,     target:'≥6'},
                  {label:'Avg Energy', val:calcAvg('energy')??'—',                              ok:calcAvg('energy')>=6,   target:'≥6'},
                  {label:'Completion', val:calcAvg('completion')?`${calcAvg('completion')}%`:'—',ok:calcAvg('completion')>=80,target:'100%'},
                  {label:'Total Logs', val:chartData.length,                                    ok:true,                   target:`${graphDays}d`},
                ].map(card=>(
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
      {view==='config'&&coachUnlocked&&(
        <div style={{ flex:1, maxWidth:600, width:'100%', margin:'0 auto', padding:'20px 14px 110px' }}>
          <div style={{ ...T.super, marginBottom:4 }}>Coach Mode</div>
          <div style={{ ...T.h2, fontSize:28, marginBottom:20 }}>Client Setup</div>

          <Card style={{ padding:20, marginBottom:14 }}>
            <div style={{ ...T.super, marginBottom:10 }}>Current Client</div>
            <div style={{ fontSize:17, fontWeight:700, color:NAVY, marginBottom:3 }}>{client.name}</div>
            <div style={{ fontSize:14, color:'#718096', marginBottom:3 }}>{client.email}</div>
            <div style={{ fontSize:13, color:'#a0aec0', marginBottom:14 }}>Joined: {client.joinedAt?new Date(client.joinedAt).toLocaleDateString('en-GB'):'Unknown'} · Monthly check-in day: {client.startDay||1}</div>
            <button onClick={()=>{ LS.del('evolve_client'); setClient(null); setCoachUnlocked(false); setView('log') }} style={{ background:CREAM, border:'1px solid rgba(28,43,58,0.18)', borderRadius:8, padding:'9px 18px', color:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:14, cursor:'pointer' }}>Clear Client (Sign Out)</button>
          </Card>

          {/* Google Fit status */}
          <Card style={{ padding:18, marginBottom:14 }}>
            <div style={{ ...T.super, marginBottom:8 }}>Health Integration</div>
            {fitToken ? (
              <div>
                <div style={{ fontWeight:600, fontSize:15, color:GREEN, marginBottom:6 }}>✓ Google Fit Connected</div>
                <div style={{ ...T.small, marginBottom:12 }}>Steps, sleep and activity auto-fill daily.</div>
                <button onClick={()=>{ revokeGoogleFit(); setFitToken(null); setAutoFilled({}) }} style={{ background:CREAM, border:'1px solid rgba(28,43,58,0.18)', borderRadius:8, padding:'8px 16px', color:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:13, cursor:'pointer' }}>Disconnect</button>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight:600, fontSize:15, color:'#718096', marginBottom:6 }}>Google Fit not connected</div>
                <div style={{ ...T.small, marginBottom:12 }}>Connect to auto-fill steps, sleep and mindfulness minutes.</div>
                <button onClick={initiateGoogleFitAuth} style={{ background:ORANGE, border:'none', borderRadius:8, padding:'9px 18px', color:WHITE, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:'uppercase', cursor:'pointer' }}>Connect Google Fit</button>
              </div>
            )}
          </Card>

          <div style={{ background:WHITE, border:`1.5px solid ${ORANGE}`, borderRadius:14, padding:24, marginBottom:14, boxShadow:'0 1px 4px rgba(28,43,58,0.07)' }}>
            <div style={{ ...T.super, marginBottom:4 }}>Active Habits</div>
            <div style={{ ...T.h3, fontSize:20, marginBottom:6 }}>Select Up to 5</div>
            <div style={{ ...T.small, marginBottom:20 }}>Choose which habits appear in the client's daily log.</div>
            {ALL_HABITS.map(h=>{
              const on=activeHabits.includes(h.id)
              return (
                <button key={h.id} onClick={()=>{ if(on)setActiveHabits(p=>p.filter(x=>x!==h.id)); else if(activeHabits.length<5)setActiveHabits(p=>[...p,h.id]) }} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', background:on?`${ORANGE}10`:CREAM, border:`1.5px solid ${on?ORANGE:'rgba(28,43,58,0.12)'}`, borderRadius:10, padding:'13px 16px', marginBottom:8, color:on?NAVY:'#718096', fontFamily:"'Barlow',sans-serif", fontSize:15, cursor:on||activeHabits.length<5?'pointer':'not-allowed', textAlign:'left' }}>
                  <span style={{fontSize:20}}>{h.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:15,color:on?NAVY:'#718096'}}>{h.label}</div>
                    <div style={{fontSize:12,color:'#a0aec0',marginTop:2}}>{h.desc}</div>
                    {h.autoFill&&<div style={{fontSize:11,color:GREEN,marginTop:2}}>● Auto-fills from Google Fit</div>}
                  </div>
                  {on&&<span style={{background:ORANGE,color:WHITE,borderRadius:10,padding:'3px 10px',fontSize:12,fontWeight:700}}>Active</span>}
                </button>
              )
            })}
            <div style={{...T.tiny,marginTop:6}}>{activeHabits.length}/5 selected</div>
            <div style={{marginTop:20,paddingTop:18,borderTop:'1px solid rgba(28,43,58,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:600,fontSize:16,color:NAVY}}>Cycle Tracking</div><div style={{...T.tiny,marginTop:3}}>Enable for peri/menopausal clients</div></div>
              <button onClick={()=>setShowCycle(v=>!v)} style={{background:showCycle?ORANGE:CREAM,border:`1.5px solid ${showCycle?ORANGE:'rgba(28,43,58,0.18)'}`,borderRadius:20,padding:'9px 20px',color:showCycle?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,textTransform:'uppercase',cursor:'pointer'}}>
                {showCycle?'On':'Off'}
              </button>
            </div>
          </div>

          <Card style={{ padding:18 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:6, color:APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?RED:GREEN }}>
              {APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'⚠ Not connected to Google Sheets':'✓ Connected to Google Sheets'}
            </div>
            <div style={{...T.small}}>{APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'Paste your Apps Script URL into APPS_SCRIPT_URL in App.jsx and redeploy.':"Logs saving to coach's Google Sheet automatically."}</div>
          </Card>

          <button onClick={()=>{ setCoachUnlocked(false); setView('log') }} style={{ width:'100%', marginTop:8, background:CREAM, border:'1.5px solid rgba(28,43,58,0.18)', borderRadius:12, padding:'14px', color:'#718096', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer' }}>
            ← Exit Coach Mode
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:WHITE, borderTop:'1px solid rgba(28,43,58,0.12)', boxShadow:'0 -2px 10px rgba(28,43,58,0.08)', zIndex:50 }}>
        <div style={{ display:'flex', maxWidth:600, margin:'0 auto' }}>
          {navTabs.map(({v,icon,label})=>(
            <button key={v} onClick={()=>setView(v)} style={{ flex:1, background:'transparent', border:'none', padding:'13px 8px 11px', color:view===v?ORANGE:'#a0aec0', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'color .15s', position:'relative' }}>
              {v==='log'&&(weeklyDue||monthlyDue)&&<div style={{ position:'absolute', top:8, right:'25%', width:9, height:9, borderRadius:'50%', background:ORANGE, border:`2px solid ${WHITE}` }}/>}
              <span style={{fontSize:20}}>{icon}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:'0.06em',textTransform:'uppercase'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
