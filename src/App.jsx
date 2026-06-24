import { useState, useEffect, useCallback, useRef, Component } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Area
} from 'recharts'
import { queueLog, getQueueLength, flushQueue } from './useOfflineQueue.js'
import CoachDashboard from './CoachDashboard.jsx'
import { LearnHub, HowToGuidePage, ScienceTopicPage } from './LearnScreen.jsx'

// ── ERROR BOUNDARY ────────────────────────────────────────
// Catches runtime errors in any child component and shows a
// recovery UI instead of a blank screen.
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('Evolve:Wellbeing error boundary caught:', error, info) }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{minHeight:'100vh',background:'#F0EEF5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:'#1C2B3A',textTransform:'uppercase',marginBottom:12}}>Something went wrong</div>
        <div style={{fontSize:15,color:'#718096',marginBottom:28,textAlign:'center',maxWidth:320,lineHeight:1.6}}>
          The app hit an unexpected error. Your logged data is safe — it's saved to this device.
        </div>
        <button
          onClick={()=>{ this.setState({hasError:false,error:null}); window.location.reload() }}
          style={{background:'#F26419',border:'none',borderRadius:12,padding:'14px 28px',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,textTransform:'uppercase',letterSpacing:'0.06em',cursor:'pointer'}}
        >
          Reload App
        </button>
        {this.state.error&&(
          <pre style={{marginTop:20,fontSize:11,color:'#a0aec0',maxWidth:500,overflow:'auto',whiteSpace:'pre-wrap'}}>{this.state.error.toString()}</pre>
        )}
      </div>
    )
  }
};

// ── CONFIG ────────────────────────────────────────────────
const APP_VERSION       = 'v1.0.0'
const APPS_SCRIPT_URL    = 'https://script.google.com/macros/s/AKfycbyE5QFzwd-FD2sIe00GY5G-qMv2Qg3bFFTga27sQ5xJlJ9G2x9HLeNpMmpbdjvcaKyi/exec'
const CHECKIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyU2Ic2aczSqqDbb5oRb55s8iboXTIev_tVnUSXQxwySw78MZ5tsVibD-psRlvEii2QHg/exec'

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

// ── TYPOGRAPHY — increased globally ──────────────────────
const T = {
  super: { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.12em', textTransform:'uppercase', color:ORANGE },
  h1:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:56, lineHeight:1.0, textTransform:'uppercase', color:NAVY },
  h2:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:40, lineHeight:1.05, textTransform:'uppercase', color:NAVY },
  h3:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:26, textTransform:'uppercase', letterSpacing:'0.04em', color:NAVY },
  body:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:18, lineHeight:1.7, color:'#2d3748' },
  label: { fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:17, color:NAVY },
  small: { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:15, color:'#718096', lineHeight:1.5 },
  tiny:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:13, color:'#a0aec0' },
}

// ── DEFAULT TARGETS (evidence-based fallbacks) ────────────
const DEFAULT_TARGETS = {
  sleep: 7.5, steps: 8000, hydration: 2.5,
  meals: 3, mindfulness: 10, mobility: 10,
  stress: 5, mood: 6, energy: 6,
  workout: 1,
  breathwork: 1,
  pace: 50,
}

// ── HABITS — targets applied dynamically from coach ───────
const ALL_HABITS = [
  { id:'sleep',       label:'Sleep Routine', icon:'🌙', desc:'Hours of sleep last night',        unit:'hrs',   min:0, max:14,    step:0.5, autoFill:'sleep' },
  { id:'steps',       label:'Daily Steps',   icon:'👟', desc:'Total steps today',                 unit:'steps', min:0, max:30000, step:100, autoFill:'steps' },
  { id:'hydration',   label:'Hydration',     icon:'💧', desc:'Total fluid intake today',          unit:'L',     min:0, max:6,     step:0.25,autoFill:null },
  { id:'meals',       label:'Meal Structure',icon:'🥗', desc:'Planned, structured meals today',   unit:'meals', min:0, max:6,     step:1,   autoFill:null },
  { id:'mindfulness', label:'Mindfulness',   icon:'🧠', desc:'Mindfulness practice today',        unit:'min',   min:0, max:60,    step:1,   autoFill:null },
  { id:'mobility',    label:'Mobility',      icon:'🧘', desc:'Dedicated mobility or flexibility',unit:'min',   min:0, max:120,   step:5,   autoFill:null },
  { id:'workout',     label:'Workout',       icon:'💪', desc:'Did you work out today?',           unit:'',      min:0, max:1,     step:1,   autoFill:null,  type:'checkbox' },
  { id:'breathwork',  label:'Breathwork',    icon:'🫁', desc:'Breathwork protocol completed today', unit:'',      min:0, max:1,     step:1,   autoFill:null,  type:'checkbox' },
  { id:'pace',        label:'Pace Points',   icon:'🌡️', desc:'Total pace points used today',        unit:'pts',   min:0, max:100,   step:1,   autoFill:null,  invert:true },
]

// Merge static habit definitions with dynamic targets from coach
function buildHabitsWithTargets(targets) {
  const t = { ...DEFAULT_TARGETS, ...targets }
  return ALL_HABITS.map(h => ({
    ...h,
    target: t[h.id],
    green:  h.id === 'steps' ? t.steps      :
            h.id === 'sleep' ? t.sleep       :
            h.id === 'hydration' ? t.hydration :
            h.id === 'meals' ? t.meals        :
            h.id === 'mindfulness' ? t.mindfulness :
            h.id === 'mobility' ? t.mobility  :
            h.id === 'workout'    ? 1      :
            h.id === 'breathwork' ? 1      :
            h.id === 'pace'       ? t.pace  : t[h.id],
    amber:  h.id === 'steps' ? t.steps * 0.6      :
            h.id === 'sleep' ? t.sleep - 1          :
            h.id === 'hydration' ? t.hydration * 0.7 :
            h.id === 'meals' ? Math.max(1, t.meals - 1) :
            h.id === 'mindfulness' ? t.mindfulness * 0.5 :
            h.id === 'mobility' ? t.mobility * 0.5   :
            h.id === 'workout'    ? 0              :
            h.id === 'breathwork' ? 0              :
            h.id === 'pace'       ? t.pace * 1.2   : t[h.id] * 0.8,
  }))
}

const METRICS = [
  { id:'stressRPE', label:'Stress',   icon:'⚡', invert:true,  note:'1 = very calm · 10 = extreme' },
  { id:'mood',      label:'Mood',     icon:'😊', invert:false, note:'1 = very low · 10 = excellent' },
  { id:'energy',    label:'Energy',   icon:'🔋', invert:false, note:'1 = exhausted · 10 = full' },
  { id:'digestion', label:'Digestion',icon:'🔄', invert:false, note:'1 = very poor · 10 = excellent' },
]

// ── CYCLE PHASE CALCULATOR ───────────────────────────────
const CYCLE_PHASES = [
  { label: 'Menstruation',  days: [1,5],   icon: '🔴', desc: 'Days 1–5' },
  { label: 'Follicular',    days: [6,13],  icon: '🌱', desc: 'Days 6–13' },
  { label: 'Ovulation',     days: [14,14], icon: '⭐', desc: 'Day 14' },
  { label: 'Early Luteal',  days: [15,20], icon: '🌕', desc: 'Days 15–20' },
  { label: 'Late Luteal',   days: [21,28], icon: '🌘', desc: 'Days 21–28' },
]

function getCyclePhase(cycleDay1Str) {
  if (!cycleDay1Str) return null
  const start = new Date(cycleDay1Str)
  start.setHours(0,0,0,0)
  const today = new Date()
  today.setHours(0,0,0,0)
  const dayNum = Math.floor((today - start) / 86400000) + 1
  if (dayNum > 35) return { label: 'unknown', dayNum, expired: true }
  const phase = CYCLE_PHASES.find(p => dayNum >= p.days[0] && dayNum <= p.days[1])
  return phase ? { ...phase, dayNum, expired: false } : { label: 'Late Luteal', dayNum, expired: false, icon: '🌘', desc: 'Day ' + dayNum }
}

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
  { id:'weekRating',     label:'How would you rate your overall week?',           type:'slider', min:1, max:10, low:'Really tough', high:'Outstanding' },
  { id:'habitHighlight', label:'Which habit felt most natural this week?',         type:'select', options:['Sleep Routine','Daily Steps','Hydration','Meal Structure','Mindfulness','Mobility','Breathwork','Pace Points','None felt natural'] },
  { id:'biggestBarrier', label:'What was your biggest barrier this week?',         type:'select', options:['Time','Energy','Motivation','Stress','Travel / disruption','Illness','Nothing significant'] },
  { id:'weekWin',        label:'What is one win from this week, however small?',   type:'text',   placeholder:'e.g. hit my step target 5 out of 7 days...' },
  { id:'weekFocus',      label:'What is your #1 focus for next week?',             type:'text',   placeholder:'e.g. drink water first thing every morning...' },
  { id:'coachNote',      label:'Anything you want your coach to know?',            type:'text',   placeholder:'Optional...' },
]

const MONTHLY_QUESTIONS = [
  { id:'monthRating',     label:'How would you rate this month overall?',          type:'slider', min:1, max:10, low:'Very difficult', high:'My best month' },
  { id:'biggestChange',   label:'What is the biggest positive change you have noticed?', type:'text', placeholder:'In your energy, mood, sleep, body, mindset...' },
  { id:'stillStruggling', label:'What are you still finding difficult?',           type:'text',   placeholder:'Be honest — this is for your coach...' },
  { id:'habitToAdd',      label:'Is there a habit you would like to add or swap?', type:'select', options:['No changes needed','Sleep Routine','Daily Steps','Hydration','Meal Structure','Mindfulness','Mobility','Breathwork','Pace Points','Discuss with coach'] },
  { id:'goalProgress',    label:'How close do you feel to your original programme goal?', type:'slider', min:1, max:10, low:'Far away', high:'Achieved it' },
  { id:'monthNote',       label:'Anything else for your coach this month?',        type:'text',   placeholder:'Open space...' },
]

const QUOTES = [
  { text:"You don't rise to the level of your goals. You fall to the level of your systems.", author:"James Clear" },
  { text:"Small steps. Every day. That's how everything changes.", author:"Evolve:Wellbeing" },
  { text:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author:"Aristotle" },
  { text:"Show up. Even when it's hard. Especially when it's hard.", author:"Evolve:Wellbeing" },
  { text:"Progress, not perfection. Every log counts.", author:"Evolve:Wellbeing" },
  { text:"It always seems impossible until it's done.", author:"Nelson Mandela" },
  { text:"You have been through harder things than this. Keep going.", author:"Evolve:Wellbeing" },
  { text:"Fall seven times, stand up eight.", author:"Japanese Proverb" },
  { text:"A bad day is not a bad life. Log it, learn from it, move forward.", author:"Evolve:Wellbeing" },
  { text:"Rest is not quitting. Rest is reloading.", author:"Evolve:Wellbeing" },
  { text:"Sleep is the single most effective thing you can do for your body and brain.", author:"Matthew Walker" },
  { text:"Energy is the currency of high performance. Invest in yours daily.", author:"Evolve:Wellbeing" },
  { text:"Your only competition is who you were yesterday.", author:"Evolve:Wellbeing" },
  { text:"How you do anything is how you do everything.", author:"Unknown" },
  { text:"Believe you can and you're halfway there.", author:"Theodore Roosevelt" },
  { text:"You don't need to be motivated. You need to be disciplined.", author:"Evolve:Wellbeing" },
  { text:"Take care of your body. It's the only place you have to live.", author:"Jim Rohn" },
  { text:"The groundwork of all happiness is health.", author:"Leigh Hunt" },
  { text:"Movement is medicine. A walk, a stretch, a breath — it all counts.", author:"Evolve:Wellbeing" },
  { text:"Don't compare your chapter one to someone else's chapter twenty.", author:"Evolve:Wellbeing" },
]

const STREAK_MILESTONES = [3,7,14,21,30,60,90,180,365]

// ── STORAGE ───────────────────────────────────────────────
const LS = {
  get: (k,d=null) => { try { const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d } catch { return d } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} },
  del: (k)   => { try { localStorage.removeItem(k) } catch {} },
}

// ── DATE HELPERS ──────────────────────────────────────────
const todayISO  = () => new Date().toISOString().split('T')[0]
const yesterday = () => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0] }
const dayOfWeek = () => new Date().getDay()
const hourOfDay = () => new Date().getHours()
// Week key: Monday-start ISO date of the current week's Monday
// Matches getWeekSummaryMeta which also uses Monday as week start
const getWeekKey = () => {
  const d=new Date(), dow=d.getDay()
  const monOffset = dow===0 ? -6 : 1-dow
  const mon=new Date(d); mon.setDate(d.getDate()+monOffset)
  return mon.toISOString().split('T')[0]
}
const getMonthKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
// Weekly check-in: due Sunday 6pm onwards, OR Monday before noon (catch-up window)
const isWeeklyDue  = () => {
  const dow=dayOfWeek(), h=hourOfDay(), wk=getWeekKey()
  if (LS.get(`checkin_weekly_done_${wk}`)) return false
  return (dow===0 && h>=18) || (dow===1 && h<12)
}
const isMonthlyDue = (client) => { const mk=getMonthKey(); if(LS.get(`checkin_monthly_done_${mk}`)) return false; if(client?.joinedAt&&(new Date()-new Date(client.joinedAt))<28*86400000) return false; const sd=Math.min(client?.startDay||1,28),td=new Date().getDate(); return td>=sd&&td<=sd+3 }

// ── STREAK HELPERS ────────────────────────────────────────
const getStreaks = () => ({ ls:LS.get('streak_log',{count:0,lastDate:null,best:0}), ts:LS.get('streak_target',{count:0,lastDate:null,best:0}) })

function updateStreaks(habitValues, visibleHabits) {
  const today=todayISO(), yest=yesterday()
  const hasLogged  = Object.values(habitValues).some(v=>v!==''&&v!==undefined&&v!==null)
  const greenCount = visibleHabits.filter(h=>h.type==='checkbox'?habitValues[h.id]===1:h.invert?Number(habitValues[h.id]||0)<=h.green:Number(habitValues[h.id]||0)>=h.green).length
  const onTarget   = greenCount>=Math.ceil(visibleHabits.length*0.6)

  let ls=LS.get('streak_log',{count:0,lastDate:null,best:0})
  if (hasLogged&&ls.lastDate!==today) {
    // Grace period: if it's before 6am we also allow lastDate===2 days ago
    // (handles logging at 1am for "yesterday" without breaking the streak)
    const twoDaysAgo = (() => { const d=new Date(); d.setDate(d.getDate()-2); return d.toISOString().split('T')[0] })()
    const isConsec = ls.lastDate===yest || (hourOfDay()<6 && ls.lastDate===twoDaysAgo)
    ls.count=isConsec?ls.count+1:1; ls.lastDate=today; ls.best=Math.max(ls.best,ls.count)
    LS.set('streak_log',ls)
  }
  let ts=LS.get('streak_target',{count:0,lastDate:null,best:0})
  if (onTarget&&ts.lastDate!==today) {
    const twoDaysAgo = (() => { const d=new Date(); d.setDate(d.getDate()-2); return d.toISOString().split('T')[0] })()
    const isConsec = ts.lastDate===yest || (hourOfDay()<6 && ts.lastDate===twoDaysAgo)
    ts.count=isConsec?ts.count+1:1; ts.lastDate=today; ts.best=Math.max(ts.best,ts.count)
    LS.set('streak_target',ts)
  }
  return {ls,ts}
}

function wasMissed() {
  const ls=LS.get('streak_log',{count:0,lastDate:null,best:0})
  if (!ls.lastDate||ls.count===0) return false
  return Math.floor((Date.now()-new Date(ls.lastDate).getTime())/86400000)>=2
}

// ── COLOUR HELPERS ────────────────────────────────────────
const habitColor = (h,v) => { if(v===''||v===null||v===undefined) return '#cbd5e0'; const n=Number(v); if(h.invert) return n<=h.green?GREEN:n<=h.amber?AMBER:RED; return n>=h.green?GREEN:n>=h.amber?AMBER:RED }
const habitBg    = (h,v) => { if(v===''||v===null||v===undefined) return WHITE; const n=Number(v); if(h.invert) return n<=h.green?GREEN_LIGHT:n<=h.amber?AMBER_LIGHT:RED_LIGHT; return n>=h.green?GREEN_LIGHT:n>=h.amber?AMBER_LIGHT:RED_LIGHT }
const metricColor = (m,v) => { const n=Number(v??5); if(m.invert){return n<=5?GREEN:n<=7?AMBER:RED} return n>=7?GREEN:n>=5?AMBER:RED }

// ── PRIDE BAND ────────────────────────────────────────────
const PrideBand = ({h=6}) => (
  <div style={{display:'flex',width:'100%',height:h,flexShrink:0}}>
    {PRIDE.map(c=><div key={c} style={{flex:1,background:c}}/>)}
  </div>
)

// ── SHARED UI ─────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:WHITE,borderRadius:14,padding:18,marginBottom:12,border:'1px solid rgba(28,43,58,0.1)',boxShadow:'0 1px 4px rgba(28,43,58,0.07)',...style}}>{children}</div>
)
const SL = ({children}) => (
  <div style={{...T.super,borderBottom:'1.5px solid rgba(28,43,58,0.1)',paddingBottom:9,marginTop:24,marginBottom:14}}>{children}</div>
)
const CustomTooltip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null
  return <div style={{background:NAVY,border:`1px solid ${ORANGE}`,borderRadius:10,padding:'10px 14px',fontSize:14}}><div style={{color:ORANGE,fontWeight:700,marginBottom:6}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:WHITE,marginBottom:2}}>{p.name}: <strong>{p.value}</strong></div>)}</div>
}
const ChartCard = ({title,subtitle,children}) => (
  <Card style={{padding:'18px 14px',marginBottom:14}}>
    <div style={{...T.h3,fontSize:20,marginBottom:3}}>{title}</div>
    <div style={{...T.small,marginBottom:14}}>{subtitle}</div>
    {children}
  </Card>
)

// ── NUMBER PICKER (replaces sliders) ─────────────────────
function NumberPicker({ metric, value, onChange }) {
  const val = value ?? 5
  const col = metricColor(metric, val)
  return (
    <div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:10}}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const isSelected = n===val
          const nCol = metricColor(metric, n)
          return (
            <button key={n} onClick={()=>onChange(n)} style={{
              flex:'1 0 calc(10% - 5px)', minWidth:32, height:42,
              background:isSelected?nCol:'rgba(28,43,58,0.06)',
              border:`2px solid ${isSelected?nCol:'rgba(28,43,58,0.12)'}`,
              borderRadius:8, color:isSelected?WHITE:NAVY,
              fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
              fontSize:17, cursor:'pointer', transition:'all .12s',
            }}>{n}</button>
          )
        })}
      </div>
      <div style={{...T.tiny,marginTop:6}}>{metric.note}</div>
    </div>
  )
}

// ── CONFETTI ──────────────────────────────────────────────
function ConfettiCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas=ref.current; if(!canvas) return
    const ctx=canvas.getContext('2d')
    canvas.width=window.innerWidth; canvas.height=window.innerHeight
    const pieces=Array.from({length:90},()=>({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height-canvas.height,
      r:Math.random()*6+3, color:[ORANGE,'#FFB300',GREEN,'#1565C0',WHITE][Math.floor(Math.random()*5)],
      tiltAngle:0, tiltInc:Math.random()*0.07+0.05, vy:Math.random()*3+2, vx:(Math.random()-0.5)*2,
    }))
    let frame,running=true
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height)
      pieces.forEach(p=>{p.tiltAngle+=p.tiltInc;p.y+=p.vy;p.x+=p.vx;ctx.beginPath();ctx.lineWidth=p.r;ctx.strokeStyle=p.color;ctx.moveTo(p.x+Math.sin(p.tiltAngle)*12,p.y);ctx.lineTo(p.x,p.y+p.r);ctx.stroke()})
      if(pieces.some(p=>p.y<canvas.height+20)&&running) frame=requestAnimationFrame(draw)
    }
    draw()
    const t=setTimeout(()=>{running=false;cancelAnimationFrame(frame)},3500)
    return ()=>{running=false;cancelAnimationFrame(frame);clearTimeout(t)}
  },[])
  return <canvas ref={ref} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999}}/>
}

// ── STREAK BROKEN SCREEN ──────────────────────────────────
function StreakBrokenScreen({ streak, onDismiss }) {
  const msgs=["Every champion has a reset. This is yours.","One missed day doesn't define your journey.","The streak is gone. The progress isn't.","Starting again takes more courage than never stopping.","Day 1 again. You know exactly what to do."]
  const msg=msgs[Math.floor(Math.random()*msgs.length)]
  return (
    <div style={{position:'fixed',inset:0,zIndex:10001,background:NAVY,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,textAlign:'center'}}>
      <div style={{fontSize:72,marginBottom:20}}>🔥</div>
      <div style={{...T.super,marginBottom:8}}>Streak Ended</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:56,color:WHITE,marginBottom:4}}>{streak}</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:20,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:36}}>Day Streak</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:24,color:WHITE,maxWidth:340,lineHeight:1.3,marginBottom:44}}>{msg}</div>
      <button onClick={onDismiss} style={{background:ORANGE,border:'none',borderRadius:14,padding:'18px 52px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer'}}>
        Start Again →
      </button>
    </div>
  )
}

// ── QUOTE SPLASH ──────────────────────────────────────────
function QuoteSplash({ onDismiss }) {
  const [q] = useState(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)])
  const isEvolve = q.author==='Evolve:Wellbeing'
  return (
    <div onClick={onDismiss} style={{position:'fixed',inset:0,zIndex:10000,background:NAVY,display:'flex',flexDirection:'column',cursor:'pointer'}}>
      <PrideBand h={8}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,letterSpacing:'0.08em',color:WHITE,marginBottom:52}}>EVOLVE<span style={{color:ORANGE}}>:</span>WELLBEING</div>
        <div style={{maxWidth:500}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:88,color:ORANGE,lineHeight:0.6,marginBottom:28,opacity:0.8}}>"</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:34,lineHeight:1.25,color:WHITE,letterSpacing:'0.01em',marginBottom:32}}>{q.text}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}>
            <div style={{height:1,width:36,background:ORANGE,opacity:0.6}}/>
            <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:16,color:isEvolve?ORANGE:'rgba(255,255,255,0.55)',letterSpacing:'0.04em'}}>{q.author}</div>
            <div style={{height:1,width:36,background:ORANGE,opacity:0.6}}/>
          </div>
        </div>
      </div>
      <div style={{paddingBottom:44,textAlign:'center'}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:'rgba(255,255,255,0.28)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Tap anywhere to continue</div>
      </div>
      <PrideBand h={8}/>
    </div>
  )
}

// ── OFFLINE BANNER ────────────────────────────────────────
function OfflineBanner({ queued, synced }) {
  const [online,setOnline] = useState(navigator.onLine)
  useEffect(()=>{
    const on=()=>setOnline(true), off=()=>setOnline(false)
    window.addEventListener('online',on); window.addEventListener('offline',off)
    return ()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)}
  },[])
  if (online&&synced===0) return null
  if (!online) return (
    <div style={{background:AMBER,padding:'11px 16px',textAlign:'center',flexShrink:0}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:WHITE,letterSpacing:'0.06em',textTransform:'uppercase'}}>📡 Offline — Log queued, will send when back online</div>
    </div>
  )
  if (synced>0) return (
    <div style={{background:GREEN,padding:'11px 16px',textAlign:'center',flexShrink:0}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:WHITE,letterSpacing:'0.06em',textTransform:'uppercase'}}>✓ {synced} queued log{synced>1?'s':''} sent to your coach</div>
    </div>
  )
  return null
}

// ── HABIT CALENDAR ────────────────────────────────────────
function HabitCalendar({ visibleHabits, onDayTap }) {
  const days=[]
  for (let i=29;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i)
    const key=d.toISOString().split('T')[0]
    const log=LS.get(`log_${key}`)
    let status='none'
    if (log) {
      const gc=visibleHabits.filter(h=>h.type==='checkbox'?log.habits?.[h.id]===1:h.invert?Number(log.habits?.[h.id]||0)<=h.green:Number(log.habits?.[h.id]||0)>=h.green).length
      const pct=visibleHabits.length?gc/visibleHabits.length:0
      status=pct>=0.8?'green':pct>=0.5?'amber':'red'
    }
    days.push({key,day:d.getDate(),status,isToday:i===0})
  }
  const sc={green:GREEN,amber:AMBER,red:RED,none:'rgba(28,43,58,0.1)'}
  const weeks=[]
  for (let i=0;i<days.length;i+=7) weeks.push(days.slice(i,i+7))
  return (
    <Card>
      <div style={{...T.super,marginBottom:4}}>Last 30 Days</div>
      <div style={{...T.h3,fontSize:20,marginBottom:6}}>Habit Calendar</div>
      <div style={{...T.tiny,marginBottom:12,fontSize:12}}>Tap any day to view or log values</div>
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:'flex',gap:5}}>
            {week.map(day=>(
              <div key={day.key}
                onClick={()=>onDayTap&&onDayTap(day.key,day.status)}
                style={{flex:1,aspectRatio:'1',borderRadius:5,background:sc[day.status],border:day.isToday?`2px solid ${NAVY}`:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'opacity .1s'}}
              >
                <span style={{fontSize:10,color:day.status==='none'?'#a0aec0':WHITE,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}>{day.day}</span>
              </div>
            ))}
            {week.length<7&&Array.from({length:7-week.length}).map((_,i)=><div key={`p${i}`} style={{flex:1}}/>)}
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:14,marginTop:12,flexWrap:'wrap'}}>
        {[['green',GREEN,'On target'],['amber',AMBER,'Partial'],['red',RED,'Missed'],['none','rgba(28,43,58,0.1)','No log']].map(([k,c,l])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:12,height:12,borderRadius:3,background:c,flexShrink:0}}/>
            <span style={{...T.tiny,fontSize:12}}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── WEEK DATE RANGE HELPER ────────────────────────────────
function getWeekSummaryMeta() {
  const today = new Date()
  const dow = today.getDay() // 0=Sun
  const monOffset = dow === 0 ? -6 : 1 - dow
  const mon = new Date(today); mon.setDate(today.getDate() + monOffset)
  const sun = new Date(mon);   sun.setDate(mon.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
  const keys = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    keys.push(d.toISOString().split('T')[0])
  }
  const todayStr = new Date().toISOString().split('T')[0]
  const reached  = keys.filter(k => k <= todayStr).length
  const logged   = keys.filter(k => LS.get(`log_${k}`)).length
  return { from: fmt(mon), to: fmt(sun), daysLogged: logged, daysReached: reached }
}

// ── WEEKLY REPORT CARD ────────────────────────────────────
function WeeklyReportCard({ data, clientTargets }) {
  const meta = getWeekSummaryMeta()

  if (!data||data.length<3) return (
    <Card style={{textAlign:'center',padding:32}}>
      <div style={{fontSize:32,marginBottom:12}}>📊</div>
      <div style={{...T.h3,fontSize:20,marginBottom:4}}>Weekly Summary</div>
      <div style={{fontSize:13,color:'#a0aec0',marginBottom:10}}>{meta.from} → {meta.to}</div>
      <div style={{...T.small}}>Log at least 3 days this week to see your summary.</div>
    </Card>
  )
  // Use coach-set targets if available, fall back to evidence-based defaults
  const t = { ...DEFAULT_TARGETS, ...(clientTargets || {}) }
  const calcAvg=key=>{const v=data.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v));return v.length?(v.reduce((a,b)=>a+b,0)/v.length):null}
  const metrics=[
    {key:'sleep',    label:'Sleep',    target:t.sleep,    unit:'h',    good:'>=', icon:'🌙'},
    {key:'steps',    label:'Steps',    target:t.steps,    unit:'',     good:'>=', icon:'👟'},
    {key:'hydration',label:'Hydration',target:t.hydration,unit:'L',    good:'>=', icon:'💧'},
    {key:'stress',   label:'Stress',   target:t.stress,   unit:'/10',  good:'<=', icon:'⚡'},
    {key:'mood',     label:'Mood',     target:t.mood,     unit:'/10',  good:'>=', icon:'😊'},
    {key:'energy',   label:'Energy',   target:t.energy,   unit:'/10',  good:'>=', icon:'🔋'},
  ]
  const getStatus=(avg,target,good)=>{if(avg===null)return'none';if(good==='>=')return avg>=target?'green':avg>=target*0.8?'amber':'red';return avg<=target?'green':avg<=target*1.2?'amber':'red'}
  const sc={green:GREEN,amber:AMBER,red:RED,none:'#cbd5e0'}
  const sb={green:GREEN_LIGHT,amber:AMBER_LIGHT,red:RED_LIGHT,none:CREAM}
  const compAvg=calcAvg('completion')
  return (
    <div style={{background:WHITE,borderRadius:14,marginBottom:14,border:'1px solid rgba(28,43,58,0.1)',boxShadow:'0 1px 4px rgba(28,43,58,0.07)',overflow:'hidden'}}>
      <div style={{background:NAVY,padding:'14px 18px'}}>
        <div style={{...T.super,color:ORANGE,marginBottom:2}}>This Week</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:WHITE,textTransform:'uppercase'}}>Weekly Summary</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.55)'}}>{meta.from} → {meta.to}</div>
          <div style={{
            background: meta.daysLogged >= meta.daysReached ? 'rgba(46,125,50,0.35)' : 'rgba(242,100,25,0.35)',
            borderRadius:20, padding:'3px 10px', fontSize:13, fontWeight:700,
            color: meta.daysLogged >= meta.daysReached ? '#81c784' : ORANGE,
            fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.04em',
          }}>
            {meta.daysLogged}/{meta.daysReached} days logged
          </div>
        </div>
      </div>
      {compAvg!==null&&(
        <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(28,43,58,0.08)',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:54,height:54,borderRadius:'50%',background:compAvg>=80?GREEN_LIGHT:compAvg>=60?AMBER_LIGHT:RED_LIGHT,border:`3px solid ${compAvg>=80?GREEN:compAvg>=60?AMBER:RED}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:compAvg>=80?GREEN:compAvg>=60?AMBER:RED}}>{Math.round(compAvg)}%</span>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:NAVY}}>Habit Completion</div>
            <div style={{...T.small,marginTop:2}}>{compAvg>=80?'Great consistency this week':'Room to grow — every day counts'}</div>
          </div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'rgba(28,43,58,0.08)'}}>
        {metrics.map(m=>{const avg=calcAvg(m.key),status=getStatus(avg,m.target,m.good);return(
          <div key={m.key} style={{background:sb[status],padding:'12px 8px',textAlign:'center'}}>
            <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:sc[status]}}>{avg!==null?(m.key==='steps'?Math.round(avg).toLocaleString():Number(avg).toFixed(1)):'—'}{m.unit}</div>
            <div style={{...T.tiny,marginTop:2,fontSize:12}}>{m.label}</div>
          </div>
        )})}
      </div>
      <div style={{padding:'11px 18px',background:CREAM}}>
        <div style={{...T.tiny,lineHeight:1.6,fontSize:13}}>Your coach will review this and send a full report with their notes.</div>
      </div>
    </div>
  )
}

// ── CHECK-IN CARD ─────────────────────────────────────────
// ── WEEKLY CHECK-IN SUMMARY (client version) ─────────────
function WeeklyCheckinSummary({ answers }) {
  const ratingColor = (r) => r >= 8 ? GREEN : r >= 5 ? AMBER : RED
  const rating = answers.weekRating ?? 5
  return (
    <div style={{background:WHITE,borderRadius:14,marginBottom:12,border:`1.5px solid ${GREEN}`,overflow:'hidden'}}>
      <div style={{background:NAVY,padding:'14px 18px'}}>
        <div style={{...T.super,color:ORANGE,marginBottom:2}}>Weekly Check-In Complete</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:WHITE,textTransform:'uppercase'}}>Your Week at a Glance</div>
      </div>
      <div style={{padding:20}}>
        {/* Rating */}
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20,background:CREAM,borderRadius:12,padding:16}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:ratingColor(rating),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:WHITE}}>{rating}</span>
          </div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,color:NAVY,textTransform:'uppercase'}}>Overall Week Rating</div>
            <div style={{...T.small,marginTop:3}}>{rating>=8?'Strong week — keep that momentum.':rating>=5?'Solid effort. Small adjustments next week.':'Tough week. Your coach has got you.'}</div>
          </div>
        </div>

        {/* Win */}
        {answers.weekWin && (
          <div style={{marginBottom:14,background:`${GREEN}10`,borderLeft:`4px solid ${GREEN}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,color:GREEN,marginBottom:4}}>🏆 Your Win This Week</div>
            <div style={{fontSize:15,color:'#2d3748',lineHeight:1.6,fontStyle:'italic'}}>"{answers.weekWin}"</div>
          </div>
        )}

        {/* Focus next week */}
        {answers.weekFocus && (
          <div style={{marginBottom:14,background:`${ORANGE}10`,borderLeft:`4px solid ${ORANGE}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,color:ORANGE,marginBottom:4}}>🎯 Your Focus Next Week</div>
            <div style={{fontSize:15,color:'#2d3748',lineHeight:1.6}}>"{answers.weekFocus}"</div>
          </div>
        )}

        {/* Habit highlight + barrier */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          {answers.habitHighlight && (
            <div style={{background:CREAM,borderRadius:10,padding:'12px 14px'}}>
              <div style={{...T.tiny,fontSize:12,marginBottom:4}}>✅ Felt Natural</div>
              <div style={{fontWeight:700,fontSize:15,color:NAVY}}>{answers.habitHighlight}</div>
            </div>
          )}
          {answers.biggestBarrier && (
            <div style={{background:CREAM,borderRadius:10,padding:'12px 14px'}}>
              <div style={{...T.tiny,fontSize:12,marginBottom:4}}>⚡ Biggest Barrier</div>
              <div style={{fontWeight:700,fontSize:15,color:NAVY}}>{answers.biggestBarrier}</div>
            </div>
          )}
        </div>

        <div style={{background:`${GREEN}12`,border:`1px solid ${GREEN}33`,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
          <div style={{fontSize:13,color:GREEN,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:'0.04em',textTransform:'uppercase'}}>✓ Sent to your coach for review</div>
        </div>
      </div>
    </div>
  )
}

// ── MONTHLY CHECK-IN SUMMARY (client version) ────────────
function MonthlyCheckinSummary({ answers }) {
  const monthRating   = answers.monthRating   ?? 5
  const goalProgress  = answers.goalProgress  ?? 5
  const ratingColor   = (r) => r >= 8 ? GREEN : r >= 5 ? AMBER : RED
  const progressLabel = goalProgress >= 8 ? 'Nearly there!' : goalProgress >= 5 ? 'Good progress' : 'Keep going'

  return (
    <div style={{background:WHITE,borderRadius:14,marginBottom:12,border:`1.5px solid ${GREEN}`,overflow:'hidden'}}>
      {/* Header */}
      <div style={{background:NAVY,padding:'16px 18px'}}>
        <div style={{...T.super,color:ORANGE,marginBottom:2}}>Monthly Check-In Complete</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:WHITE,textTransform:'uppercase'}}>Your Month in Review</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:4}}>{new Date().toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</div>
      </div>

      <div style={{padding:20}}>
        {/* Two score rings */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div style={{background:CREAM,borderRadius:12,padding:'16px 12px',textAlign:'center'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:ratingColor(monthRating),display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px'}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:WHITE}}>{monthRating}</span>
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:NAVY,textTransform:'uppercase'}}>Month Rating</div>
            <div style={{...T.tiny,fontSize:12,marginTop:2}}>out of 10</div>
          </div>
          <div style={{background:CREAM,borderRadius:12,padding:'16px 12px',textAlign:'center'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:ratingColor(goalProgress),display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px'}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:WHITE}}>{goalProgress}</span>
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:NAVY,textTransform:'uppercase'}}>Goal Progress</div>
            <div style={{...T.tiny,fontSize:12,marginTop:2}}>{progressLabel}</div>
          </div>
        </div>

        {/* Biggest positive change */}
        {answers.biggestChange && (
          <div style={{marginBottom:14,background:`${GREEN}10`,borderLeft:`4px solid ${GREEN}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,color:GREEN,marginBottom:4}}>🌱 Biggest Positive Change</div>
            <div style={{fontSize:15,color:'#2d3748',lineHeight:1.6,fontStyle:'italic'}}>"{answers.biggestChange}"</div>
          </div>
        )}

        {/* Still struggling */}
        {answers.stillStruggling && (
          <div style={{marginBottom:14,background:`${AMBER}10`,borderLeft:`4px solid ${AMBER}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,color:AMBER,marginBottom:4}}>💪 Still Working On</div>
            <div style={{fontSize:15,color:'#2d3748',lineHeight:1.6,fontStyle:'italic'}}>"{answers.stillStruggling}"</div>
          </div>
        )}

        {/* Habit to add */}
        {answers.habitToAdd && answers.habitToAdd !== 'No changes needed' && answers.habitToAdd !== 'Discuss with coach' && (
          <div style={{marginBottom:14,background:`${ORANGE}10`,borderLeft:`4px solid ${ORANGE}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,color:ORANGE,marginBottom:4}}>🔄 Habit to Add or Swap</div>
            <div style={{fontSize:15,color:'#2d3748',fontWeight:600}}>{answers.habitToAdd}</div>
            <div style={{...T.tiny,marginTop:4,fontSize:13}}>Your coach will review this and update your programme.</div>
          </div>
        )}
        {answers.habitToAdd === 'Discuss with coach' && (
          <div style={{marginBottom:14,background:`${ORANGE}10`,borderLeft:`4px solid ${ORANGE}`,borderRadius:8,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,color:ORANGE,marginBottom:4}}>💬 Habit Changes</div>
            <div style={{fontSize:15,color:'#2d3748',fontWeight:600}}>Discuss with coach</div>
            <div style={{...T.tiny,marginTop:4,fontSize:13}}>Your coach will reach out to chat about your next steps.</div>
          </div>
        )}

        {/* Coach note */}
        {answers.monthNote && (
          <div style={{marginBottom:16,background:CREAM,borderRadius:10,padding:'12px 14px'}}>
            <div style={{...T.super,fontSize:12,marginBottom:4}}>📝 Your Note to Coach</div>
            <div style={{fontSize:14,color:'#4a5568',lineHeight:1.6,fontStyle:'italic'}}>"{answers.monthNote}"</div>
          </div>
        )}

        {/* What happens next */}
        <div style={{background:NAVY,borderRadius:12,padding:'14px 16px',marginBottom:0}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:ORANGE,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:8}}>What Happens Next</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {icon:'📊',text:'Your coach receives a full report with all your responses'},
              {icon:'🎯',text:'Targets may be updated based on your progress'},
              {icon:'💬',text:'Expect a message from your coach within 48 hours'},
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{item.icon}</span>
                <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.5}}>{item.text}</div>
              </div>
            ))}
          </div>
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
  const [submitted,setSubmitted]= useState(null) // saved answers for summary

  const q = questions[step], isLast = step === questions.length - 1
  const inp = {width:'100%',background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:10,padding:'14px 16px',color:NAVY,fontFamily:"'Barlow',sans-serif",fontSize:17,outline:'none',boxSizing:'border-box'}

  const handleNext = async () => {
    if (isLast) {
      setSending(true)
      await onSubmit({ type, answers, client, submittedAt: new Date().toISOString() })
      setSending(false)
      setSubmitted({...answers})
      setDone(true)
      if (type === 'weekly')  LS.set(`checkin_weekly_done_${getWeekKey()}`, true)
      else                    LS.set(`checkin_monthly_done_${getMonthKey()}`, true)
    } else {
      setStep(s => s + 1)
    }
  }

  const canAdvance = () => {
    const v = answers[q.id]
    if (q.type === 'slider') return v !== undefined
    if (q.type === 'select') return v && v !== ''
    return true
  }

  // Show summary card after submission
  if (done && submitted) {
    return type === 'monthly'
      ? <MonthlyCheckinSummary answers={submitted} />
      : <WeeklyCheckinSummary  answers={submitted} />
  }

  return (
    <div style={{background:WHITE,borderRadius:14,marginBottom:12,border:`1.5px solid ${ORANGE}`,overflow:'hidden'}}>
      <div style={{background:ORANGE,padding:'14px 18px'}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:19,color:WHITE,textTransform:'uppercase',letterSpacing:'0.04em'}}>{type==='weekly'?'📋 Weekly Check-In':'📅 Monthly Check-In'}</div>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.8)',marginTop:2}}>Question {step+1} of {questions.length}</div>
      </div>
      <div style={{display:'flex',gap:4,padding:'10px 18px',background:`${ORANGE}10`}}>
        {questions.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=step?ORANGE:'rgba(28,43,58,0.12)',transition:'background .2s'}}/>)}
      </div>
      <div style={{padding:20}}>
        <div style={{...T.label,marginBottom:16,lineHeight:1.5,fontSize:17}}>{q.label}</div>
        {q.type==='slider'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{...T.tiny,fontSize:13}}>{q.low}</span><span style={{...T.tiny,fontSize:13}}>{q.high}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="range" min={q.min} max={q.max} value={answers[q.id]??5} onChange={e=>setAnswers(p=>({...p,[q.id]:Number(e.target.value)}))} style={{flex:1,accentColor:ORANGE}}/>
              <div style={{minWidth:46,textAlign:'center',background:ORANGE,color:WHITE,borderRadius:9,padding:'5px 8px',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26}}>{answers[q.id]??5}</div>
            </div>
          </div>
        )}
        {q.type==='select'&&(<select value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{...inp,appearance:'none',cursor:'pointer'}}><option value="">Select...</option>{q.options.map(o=><option key={o} value={o}>{o}</option>)}</select>)}
        {q.type==='text'&&(<textarea value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} placeholder={q.placeholder} rows={3} style={{...inp,resize:'vertical',lineHeight:1.6}}/>)}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:10,padding:'14px',color:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,textTransform:'uppercase',cursor:'pointer'}}>← Back</button>}
          <button onClick={handleNext} disabled={!canAdvance()||sending} style={{flex:2,background:canAdvance()&&!sending?ORANGE:'rgba(28,43,58,0.15)',border:'none',borderRadius:10,padding:'14px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:17,textTransform:'uppercase',letterSpacing:'0.04em',cursor:canAdvance()&&!sending?'pointer':'not-allowed'}}>
            {sending?'Sending...':(isLast?'Submit ✓':'Next →')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── STREAK CARD ───────────────────────────────────────────
function StreakCard({ ls, ts }) {
  const lm=STREAK_MILESTONES.includes(ls.count), tm=STREAK_MILESTONES.includes(ts.count)
  const next=STREAK_MILESTONES.find(m=>m>ls.count)||365
  const prev=STREAK_MILESTONES.slice().reverse().find(m=>m<=ls.count)||0
  const pct=prev===next?100:Math.round(((ls.count-prev)/(next-prev))*100)
  return(
    <div style={{background:WHITE,borderRadius:14,marginBottom:12,border:'1px solid rgba(28,43,58,0.1)',boxShadow:'0 1px 4px rgba(28,43,58,0.07)',overflow:'hidden'}}>
      <div style={{background:NAVY,padding:'10px 18px'}}><div style={{...T.super,color:ORANGE}}>Your Streaks</div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
        <div style={{padding:'16px 18px',borderRight:'1px solid rgba(28,43,58,0.1)',background:lm?`${ORANGE}08`:WHITE}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><span style={{fontSize:24}}>🔥</span><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:42,color:ls.count>0?ORANGE:'#cbd5e0',lineHeight:1}}>{ls.count}</div></div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em'}}>Days Logged</div>
          <div style={{...T.tiny,marginTop:3,fontSize:13}}>Best: {ls.best}</div>
          {lm&&ls.count>0&&<div style={{marginTop:8,background:ORANGE,color:WHITE,borderRadius:7,padding:'3px 10px',fontSize:12,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',display:'inline-block'}}>🏆 Milestone!</div>}
        </div>
        <div style={{padding:'16px 18px',background:tm?`${GREEN}08`:WHITE}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><span style={{fontSize:24}}>⭐</span><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:42,color:ts.count>0?GREEN:'#cbd5e0',lineHeight:1}}>{ts.count}</div></div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em'}}>On Target</div>
          <div style={{...T.tiny,marginTop:3,fontSize:13}}>Best: {ts.best}</div>
          {tm&&ts.count>0&&<div style={{marginTop:8,background:GREEN,color:WHITE,borderRadius:7,padding:'3px 10px',fontSize:12,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',display:'inline-block'}}>🏆 Milestone!</div>}
        </div>
      </div>
      <div style={{padding:'10px 18px 14px',borderTop:'1px solid rgba(28,43,58,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{...T.tiny,fontSize:13}}>Next milestone: {next} days</span><span style={{...T.tiny,fontSize:13}}>{ls.count}/{next}</span></div>
        <div style={{height:6,background:'rgba(28,43,58,0.1)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:ORANGE,borderRadius:3,transition:'width .4s'}}/></div>
      </div>
    </div>
  )
}

// ── SETUP SCREEN — 3-step onboarding ─────────────────────
const PROGRAMME_GOALS = [
  { id:'lose_weight',    label:'Lose Weight',        icon:'⚖️',  desc:'Body composition and fat loss' },
  { id:'build_strength', label:'Build Strength',     icon:'💪',  desc:'Get stronger week on week' },
  { id:'improve_fitness',label:'Improve Fitness',    icon:'🏃',  desc:'Cardio, endurance and energy' },
  { id:'wellbeing',      label:'Improve Wellbeing',  icon:'🧠',  desc:'Stress, sleep and mental health' },
  { id:'general_health', label:'General Health',     icon:'❤️',  desc:'Balanced, sustainable lifestyle' },
  { id:'post_natal',     label:'Post-Natal Recovery',icon:'🌱',  desc:'Rebuilding after pregnancy' },
]

function SetupScreen({ onComplete }) {
  const [step,     setStep]    = useState(0) // 0=details, 1=goal, 2=confirm
  const [name,     setName]    = useState('')
  const [email,    setEmail]   = useState('')
  const [goal,     setGoal]    = useState('')
  const [err,      setErr]     = useState('')

  const inp = {width:'100%',background:CREAM,border:'1.5px solid rgba(28,43,58,0.2)',borderRadius:11,padding:'15px 16px',color:NAVY,fontFamily:"'Barlow',sans-serif",fontSize:17,outline:'none',boxSizing:'border-box'}

  const handleStep0 = () => {
    if (!name.trim())                       { setErr('Please enter your name'); return }
    if (!email.trim()||!email.includes('@')){ setErr('Please enter a valid email'); return }
    setErr(''); setStep(1)
  }
  const handleStep1 = () => {
    if (!goal) { setErr('Please select your primary goal'); return }
    setErr(''); setStep(2)
  }
  const handleComplete = () => {
    // Generate a stable UUID — this is the permanent identifier.
    // Name-derived IDs break if the client's name is ever corrected.
    const clientId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    onComplete({
      name:      name.trim(),
      email:     email.trim(),
      goal,
      clientId,
      startDay:  Math.min(new Date().getDate(), 28),
      joinedAt:  new Date().toISOString(),
    })
  }

  const steps = ['Your Details','Your Goal','Let\'s Go']
  const goalObj = PROGRAMME_GOALS.find(g=>g.id===goal)

  return(
    <div style={{minHeight:'100vh',background:CREAM,display:'flex',flexDirection:'column'}}>
      <PrideBand h={8}/>
      <div style={{background:NAVY,padding:'16px 20px',textAlign:'center'}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,letterSpacing:'0.07em',color:WHITE}}>EVOLVE<span style={{color:ORANGE}}>:</span>WELLBEING</div>
      </div>
      {/* Step progress */}
      <div style={{display:'flex',background:WHITE,borderBottom:'1px solid rgba(28,43,58,0.08)'}}>
        {steps.map((s,i)=>(
          <div key={i} style={{flex:1,padding:'12px 8px',textAlign:'center',borderBottom:`3px solid ${i===step?ORANGE:'transparent'}`}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,textTransform:'uppercase',letterSpacing:'0.06em',color:i===step?ORANGE:i<step?GREEN:'#a0aec0'}}>{i<step?'✓ ':''}{s}</div>
          </div>
        ))}
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 20px'}}>
        <div style={{width:'100%',maxWidth:440}}>

          {/* Step 0 — Details */}
          {step===0&&(
            <Card style={{padding:28}}>
              <div style={{...T.super,marginBottom:6}}>Step 1 of 3</div>
              <div style={{...T.h2,fontSize:28,marginBottom:8}}>Your Details</div>
              <div style={{...T.body,marginBottom:24,color:'#4a5568',fontSize:16}}>Takes 30 seconds. Saved to this device only.</div>
              <label style={{...T.label,display:'block',marginBottom:9}}>Your Name <span style={{color:ORANGE}}>*</span></label>
              <input type="text" value={name} onChange={e=>{setName(e.target.value);setErr('')}} placeholder="e.g. Sarah Jones" style={inp}/>
              <label style={{...T.label,display:'block',marginTop:20,marginBottom:9}}>Email Address <span style={{color:ORANGE}}>*</span></label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr('')}} placeholder="e.g. sarah@email.com" onKeyDown={e=>e.key==='Enter'&&handleStep0()} style={inp}/>
              {err&&<div style={{color:RED,fontSize:15,marginTop:10}}>{err}</div>}
              <button onClick={handleStep0} style={{width:'100%',marginTop:24,background:ORANGE,border:'none',borderRadius:12,padding:'16px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:19,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer'}}>Next →</button>
            </Card>
          )}

          {/* Step 1 — Goal */}
          {step===1&&(
            <div>
              <div style={{...T.super,marginBottom:6,paddingLeft:4}}>Step 2 of 3</div>
              <div style={{...T.h2,fontSize:28,marginBottom:6,paddingLeft:4}}>Your Primary Goal</div>
              <div style={{...T.small,marginBottom:18,paddingLeft:4}}>This helps your coach tailor your programme. You can update it any time.</div>
              {PROGRAMME_GOALS.map(g=>(
                <button key={g.id} onClick={()=>{setGoal(g.id);setErr('')}} style={{display:'flex',alignItems:'center',gap:14,width:'100%',background:goal===g.id?`${ORANGE}12`:WHITE,border:`2px solid ${goal===g.id?ORANGE:'rgba(28,43,58,0.12)'}`,borderRadius:13,padding:'16px 18px',marginBottom:9,cursor:'pointer',textAlign:'left',transition:'all .12s'}}>
                  <span style={{fontSize:28,flexShrink:0}}>{g.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,color:goal===g.id?ORANGE:NAVY,textTransform:'uppercase',letterSpacing:'0.04em'}}>{g.label}</div>
                    <div style={{...T.tiny,fontSize:13,marginTop:2}}>{g.desc}</div>
                  </div>
                  {goal===g.id&&<div style={{width:22,height:22,borderRadius:'50%',background:ORANGE,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{color:WHITE,fontSize:12,fontWeight:900}}>✓</span></div>}
                </button>
              ))}
              {err&&<div style={{color:RED,fontSize:15,marginTop:4,paddingLeft:4}}>{err}</div>}
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button onClick={()=>setStep(0)} style={{flex:1,background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:12,padding:'14px',color:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,textTransform:'uppercase',cursor:'pointer'}}>← Back</button>
                <button onClick={handleStep1} style={{flex:2,background:goal?ORANGE:'rgba(28,43,58,0.15)',border:'none',borderRadius:12,padding:'14px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,textTransform:'uppercase',cursor:goal?'pointer':'not-allowed'}}>Next →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Confirm */}
          {step===2&&(
            <Card style={{padding:28}}>
              <div style={{...T.super,marginBottom:6}}>Step 3 of 3</div>
              <div style={{...T.h2,fontSize:28,marginBottom:20}}>Ready to Go</div>
              <div style={{background:CREAM,borderRadius:12,padding:18,marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:'1px solid rgba(28,43,58,0.08)'}}>
                  <span style={{...T.small,fontWeight:600}}>Name</span>
                  <span style={{...T.small,color:NAVY,fontWeight:600}}>{name}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:'1px solid rgba(28,43,58,0.08)'}}>
                  <span style={{...T.small,fontWeight:600}}>Email</span>
                  <span style={{...T.small,color:NAVY,fontWeight:600}}>{email}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{...T.small,fontWeight:600}}>Goal</span>
                  <span style={{...T.small,color:NAVY,fontWeight:600}}>{goalObj?.icon} {goalObj?.label}</span>
                </div>
              </div>
              <div style={{...T.tiny,marginBottom:22,lineHeight:1.7,textAlign:'center'}}>Your information is kept private and used only by your Evolve:Wellbeing coach.</div>
              <button onClick={handleComplete} style={{width:'100%',background:ORANGE,border:'none',borderRadius:12,padding:'17px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer'}}>Start Tracking</button>
              <button onClick={()=>setStep(1)} style={{width:'100%',marginTop:10,background:'transparent',border:'none',color:'#a0aec0',fontFamily:"'Barlow',sans-serif",fontSize:15,cursor:'pointer',padding:'6px'}}>Go Back</button>
            </Card>
          )}

        </div>
      </div>
      <PrideBand h={8}/>
    </div>
  )
}

// ── RETRO LOG MODAL ──────────────────────────────────────
// Allows logging a past day (within 7 days). Sends to coach
// with isRetro:true flag. Does NOT affect streak counters.
function RetroLogModal({ date, visibleHabits, client, appsScriptUrl, onClose, onSaved }) {
  const d         = new Date(date)
  const dateLabel = d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})
  const existingLog = LS.get(`log_${date}`)

  const [habitValues,  setHabitValues]  = useState(existingLog?.habits  || {})
  const [metricValues, setMetricValues] = useState(existingLog?.metrics  || {stressRPE:5,mood:6,energy:6,digestion:7})
  const [reflection,   setReflection]   = useState(existingLog?.reflection || '')
  const [sendStatus,   setSendStatus]   = useState('idle')

  const completedHabits = visibleHabits.filter(h=>habitValues[h.id]!==undefined&&habitValues[h.id]!==''&&habitValues[h.id]!==null)
  const inp = {width:'100%',background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:10,padding:'12px 14px',color:NAVY,fontFamily:"'Barlow',sans-serif",fontSize:16,outline:'none',boxSizing:'border-box'}

  const handleSend = async () => {
    setSendStatus('sending')
    const clientId = client?.clientId || client?.name?.trim().toLowerCase().replace(/\s+/g,'-') || 'unknown'
    const payload = {
      date,
      clientId,
      clientName:  client?.name  || '',
      clientEmail: client?.email || '',
      habits:      habitValues,
      metrics:     metricValues,
      cyclePhase:  '',
      reflection,
      habitsCompleted: completedHabits.length,
      habitsTotal:     visibleHabits.length,
      isRetro:  true,
      isEdit:   !!existingLog,
      logStreak:    0, // retro never affects streak
      targetStreak: 0,
    }
    // Save to localStorage regardless
    LS.set(`log_${date}`, { habits:habitValues, metrics:metricValues, cyclePhase:'', reflection, isRetro:true })

    if (!navigator.onLine) {
      queueLog(payload, appsScriptUrl)
      setSendStatus('queued')
      setTimeout(()=>onSaved(date), 1500)
      return
    }
    try {
      await fetch(appsScriptUrl, {method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      setSendStatus('success')
      setTimeout(()=>onSaved(date), 1500)
    } catch {
      queueLog(payload, appsScriptUrl)
      setSendStatus('queued')
      setTimeout(()=>onSaved(date), 1500)
    }
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9990,background:'rgba(28,43,58,0.7)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:WHITE,borderRadius:'18px 18px 0 0',width:'100%',maxWidth:600,maxHeight:'90vh',overflow:'auto',paddingBottom:32}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
          <div style={{width:40,height:4,borderRadius:2,background:'rgba(28,43,58,0.15)'}}/>
        </div>
        <div style={{padding:'8px 20px 0'}}>
          {/* Header */}
          <div style={{background:NAVY,borderRadius:12,padding:'14px 16px',marginBottom:18}}>
            <div style={{...T.super,color:ORANGE,marginBottom:2}}>Retrospective Log</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:WHITE,textTransform:'uppercase'}}>{dateLabel}</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:4}}>This log will be sent to your coach marked as retrospective</div>
          </div>

          {/* Habits */}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:10}}>Habits</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
            {visibleHabits.map(h=>{
              const val = habitValues[h.id]
              const filled = val!==undefined&&val!==''&&val!==null
              const col = habitColor(h,val)
              const bg  = habitBg(h,val)

              if (h.type==='checkbox') {
                const isYes=val===1, isNo=val===0, cbFilled=val===0||val===1
                const cbCol=cbFilled?(isYes?GREEN:AMBER):'rgba(28,43,58,0.12)'
                const cbBg=cbFilled?(isYes?GREEN_LIGHT:AMBER_LIGHT):WHITE
                return (
                  <div key={h.id} style={{background:cbBg,border:`2px solid ${cbCol}`,borderRadius:14,padding:14,transition:'all .15s'}}>
                    <div style={{fontSize:22,marginBottom:6}}>{h.icon}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:8}}>{h.label}</div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setHabitValues(p=>({...p,[h.id]:isYes?'':1}))} style={{flex:1,padding:'8px 2px',borderRadius:8,border:`2px solid ${isYes?GREEN:'rgba(28,43,58,0.15)'}`,background:isYes?GREEN:WHITE,color:isYes?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,textTransform:'uppercase',cursor:'pointer'}}>✓ Yes</button>
                      <button onClick={()=>setHabitValues(p=>({...p,[h.id]:isNo?'':0}))}  style={{flex:1,padding:'8px 2px',borderRadius:8,border:`2px solid ${isNo?AMBER:'rgba(28,43,58,0.15)'}`,background:isNo?AMBER_LIGHT:WHITE,color:isNo?AMBER:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,textTransform:'uppercase',cursor:'pointer'}}>✕ No</button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={h.id} style={{background:filled?bg:WHITE,border:`2px solid ${filled?col:'rgba(28,43,58,0.12)'}`,borderRadius:14,padding:14,transition:'all .15s'}}>
                  <div style={{fontSize:22,marginBottom:6}}>{h.icon}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:8}}>{h.label}</div>
                  <input type="number" min={h.min} max={h.max} step={h.step} value={val??''}
                    onChange={e=>{const v=e.target.value;setHabitValues(p=>({...p,[h.id]:v===''?'':Number(v)}))}}
                    placeholder={`Target: ${h.target}${h.unit}`}
                    style={{width:'100%',background:'rgba(255,255,255,0.6)',border:`1px solid ${col}55`,borderRadius:7,padding:'7px 10px',color:NAVY,fontFamily:"'Barlow',sans-serif",fontSize:14,fontWeight:600,outline:'none',boxSizing:'border-box'}}/>
                </div>
              )
            })}
          </div>

          {/* Wellness metrics */}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:10}}>Wellness</div>
          {METRICS.map(m=>(
            <div key={m.id} style={{background:WHITE,borderRadius:12,padding:'12px 14px',marginBottom:10,border:'1px solid rgba(28,43,58,0.1)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:18}}>{m.icon}</span>
                <div style={{fontWeight:700,fontSize:15,color:NAVY,flex:1}}>{m.label}</div>
                <div style={{minWidth:38,textAlign:'center',background:metricColor(m,metricValues[m.id]??5),color:WHITE,borderRadius:8,padding:'3px 7px',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20}}>{metricValues[m.id]??5}</div>
              </div>
              <NumberPicker metric={m} value={metricValues[m.id]} onChange={v=>setMetricValues(p=>({...p,[m.id]:v}))}/>
            </div>
          ))}

          {/* Reflection */}
          <div style={{marginBottom:18}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:8}}>Note (optional)</div>
            <textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={3} placeholder="Anything to add about this day?" style={{...inp,resize:'vertical',lineHeight:1.6}}/>
          </div>

          {/* Send button */}
          <button onClick={handleSend} disabled={sendStatus==='sending'||sendStatus==='success'} style={{width:'100%',background:sendStatus==='success'?GREEN:sendStatus==='queued'?AMBER:ORANGE,border:'none',borderRadius:12,padding:'16px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,letterSpacing:'0.06em',textTransform:'uppercase',cursor:sendStatus==='sending'?'wait':'pointer',transition:'background .25s',marginBottom:10}}>
            {sendStatus==='idle'   &&'Send Retrospective Log →'}
            {sendStatus==='sending'&&'Sending...'}
            {sendStatus==='success'&&'✓ Sent to Coach'}
            {sendStatus==='queued' &&'📡 Queued — Will Send When Online'}
          </button>
          <button onClick={onClose} style={{width:'100%',background:'transparent',border:'none',color:'#a0aec0',fontFamily:"'Barlow',sans-serif",fontSize:15,cursor:'pointer',padding:'8px'}}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── DAY DETAIL MODAL ─────────────────────────────────────────────
// Tapping a calendar day shows actual logged values for that day
function DayDetailModal({ date, visibleHabits, onClose }) {
  const log = LS.get(`log_${date}`)
  const d   = new Date(date)
  const label = d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9990,background:'rgba(28,43,58,0.7)',display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 0 0'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:WHITE,borderRadius:'18px 18px 0 0',width:'100%',maxWidth:600,maxHeight:'80vh',overflow:'auto',paddingBottom:32}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
          <div style={{width:40,height:4,borderRadius:2,background:'rgba(28,43,58,0.15)'}}/>
        </div>
        <div style={{padding:'8px 20px 16px'}}>
          <div style={{...T.super,marginBottom:4}}>{label}</div>
          {!log ? (
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{fontSize:32,marginBottom:12}}>📭</div>
              <div style={{...T.h3,fontSize:18,marginBottom:8}}>No log for this day</div>
              <div style={{...T.small}}>Nothing was recorded on this date.</div>
            </div>
          ) : (
            <>
              {/* Habits */}
              <div style={{...T.h3,fontSize:18,marginBottom:12}}>Habits</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:18}}>
                {visibleHabits.map(h=>{
                  const val = log.habits?.[h.id]
                  const filled = val!==undefined&&val!==''&&val!==null
                  const col = filled ? (Number(val)>=h.green?GREEN:Number(val)>=h.amber?AMBER:RED) : '#cbd5e0'
                  const bg  = filled ? (Number(val)>=h.green?GREEN_LIGHT:Number(val)>=h.amber?AMBER_LIGHT:RED_LIGHT) : CREAM
                  return (
                    <div key={h.id} style={{background:bg,border:`1.5px solid ${col}44`,borderRadius:10,padding:'12px 14px'}}>
                      <div style={{fontSize:20,marginBottom:4}}>{h.icon}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:2}}>{h.label}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:filled?col:'#cbd5e0'}}>
                        {filled?(h.type==='checkbox'?(val===1?'Yes':'No'):val):'—'}<span style={{fontSize:12,fontWeight:400,marginLeft:3}}>{filled&&h.type!=='checkbox'?h.unit:''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Metrics */}
              {log.metrics&&Object.values(log.metrics).some(v=>v) && (
                <>
                  <div style={{...T.h3,fontSize:18,marginBottom:12}}>Wellness</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
                    {METRICS.map(m=>{
                      const val = log.metrics?.[m.id]
                      const col = val ? metricColor(m,val) : '#cbd5e0'
                      return (
                        <div key={m.id} style={{background:CREAM,borderRadius:9,padding:'10px 8px',textAlign:'center'}}>
                          <div style={{fontSize:18,marginBottom:4}}>{m.icon}</div>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:col}}>{val??'—'}</div>
                          <div style={{...T.tiny,fontSize:11,marginTop:2}}>{m.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              {/* Reflection */}
              {log.reflection&&(
                <div style={{background:CREAM,borderLeft:`4px solid ${ORANGE}`,borderRadius:8,padding:'12px 14px'}}>
                  <div style={{...T.super,fontSize:12,marginBottom:6}}>Note</div>
                  <div style={{fontSize:15,color:'#4a5568',lineHeight:1.7,fontStyle:'italic'}}>{log.reflection}</div>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{padding:'0 20px'}}>
          <button onClick={onClose} style={{width:'100%',background:NAVY,border:'none',borderRadius:12,padding:'14px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer'}}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── DATA EXPORT ───────────────────────────────────────────
function exportToCSV(client, visibleHabits) {
  const rows = []
  const headers = [
    'Date',
    ...visibleHabits.map(h=>`${h.label} (${h.unit})`),
    'Stress','Mood','Energy','Digestion',
    'Habits Completed','Habits Total','Completion %',
    'Cycle Phase','Reflection',
  ]
  rows.push(headers.join(','))

  // Gather last 90 days of local data
  for (let i=89; i>=0; i--) {
    const d   = new Date(); d.setDate(d.getDate()-i)
    const key = d.toISOString().split('T')[0]
    const log = LS.get(`log_${key}`)
    if (!log) continue

    const h = log.habits  || {}
    const m = log.metrics || {}
    const completed = visibleHabits.filter(habit=>h[habit.id]!==undefined&&h[habit.id]!=='').length
    const total     = visibleHabits.length
    const pct       = total ? Math.round(completed/total*100) : 0

    const row = [
      key,
      ...visibleHabits.map(habit=>h[habit.id]??''),
      m.stressRPE??'', m.mood??'', m.energy??'', m.digestion??'',
      completed, total, pct,
      log.cyclePhase||'',
      `"${(log.reflection||'').replace(/"/g,'""')}"`,
    ]
    rows.push(row.join(','))
  }

  const csv  = rows.join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `evolve-wellbeing-${client.name.replace(/\s+/g,'-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function NotifPrompt({ onDone }) {
  const request = async () => {
    try {
      // Use OneSignal to request permission and subscribe
      if (window.OneSignal) {
        await window.OneSignal.Notifications.requestPermission()
        // Tag the user with their client name so we can target them
        // Tags are set in App after setup complete
      }
    } catch(err) {
      console.warn('OneSignal permission request failed:', err)
    }
    onDone()
  }
  return(
    <div style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(28,43,58,0.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:WHITE,borderRadius:18,padding:34,maxWidth:380,width:'100%',border:`2px solid ${ORANGE}`}}>
        <div style={{fontSize:44,marginBottom:18,textAlign:'center'}}>🔔</div>
        <div style={{...T.h2,fontSize:30,textAlign:'center',marginBottom:14}}>Daily Reminders</div>
        <div style={{...T.body,textAlign:'center',marginBottom:30,color:'#4a5568'}}>
          Get a nudge at 8pm every evening to log your habits, and a reminder every Sunday for your weekly check-in.
        </div>
        <button onClick={request} style={{width:'100%',background:ORANGE,border:'none',borderRadius:12,padding:'16px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:19,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',marginBottom:12}}>
          Enable Reminders
        </button>
        <button onClick={onDone} style={{width:'100%',background:'transparent',border:'none',color:'#a0aec0',fontFamily:"'Barlow',sans-serif",fontSize:16,cursor:'pointer',padding:'8px'}}>
          Not now
        </button>
      </div>
    </div>
  )
}

function InstallBanner({ onDismiss }) {
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)
  return(
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:9999,background:NAVY,borderTop:`3px solid ${ORANGE}`,padding:'16px 20px 22px'}}>
      <div style={{maxWidth:480,margin:'0 auto'}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,textTransform:'uppercase',color:WHITE,marginBottom:9}}>Add to Home Screen</div>
        <div style={{fontSize:16,color:'rgba(255,255,255,0.7)',lineHeight:1.6,marginBottom:14}}>{isIOS?'Tap Share then "Add to Home Screen" to install Evolve:Wellbeing as an app.':'Install Evolve:Wellbeing on your home screen for the best experience.'}</div>
        <div style={{display:'flex',gap:8}}>
          {!isIOS&&<button id="pwa-install-btn" style={{flex:2,background:ORANGE,border:'none',borderRadius:10,padding:'13px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,textTransform:'uppercase',cursor:'pointer'}}>Install</button>}
          <button onClick={onDismiss} style={{flex:1,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:10,padding:'13px',color:'rgba(255,255,255,0.6)',fontFamily:"'Barlow',sans-serif",fontSize:15,cursor:'pointer'}}>Not Now</button>
        </div>
      </div>
    </div>
  )
}

function CoachToast({ onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t)},[onDone])
  return <div style={{position:'fixed',top:84,left:'50%',transform:'translateX(-50%)',zIndex:9997,background:NAVY,border:`2px solid ${ORANGE}`,borderRadius:12,padding:'13px 26px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(28,43,58,0.3)'}}>⚙ Coach Mode Unlocked</div>
}

// ── FIX 2: ONESIGNAL TOGGLE — always resolves to actionable button ──
function OneSignalToggle() {
  const [subscribed, setSubscribed] = useState(null) // null = loading
  const [working,    setWorking]    = useState(false)

  useEffect(() => {
    let cancelled = false

    const readState = async (OneSignal) => {
      try {
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn
        if (!cancelled) setSubscribed(!!isSubscribed)
      } catch {
        if (!cancelled) setSubscribed(false)
      }
    }

    // OneSignalDeferred guarantees the callback only fires once the SDK
    // has fully initialized — avoids the race where window.OneSignal
    // exists as a stub but PushSubscription isn't ready yet, which
    // previously caused the toggle to show "off" on every reload even
    // though the underlying subscription was still active.
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(readState)

    // Safety net: if OneSignal genuinely never loads (blocked, offline,
    // not configured), don't leave the UI stuck on "Checking..." forever.
    const fallback = setTimeout(() => {
      if (!cancelled) setSubscribed(s => s === null ? false : s)
    }, 8000)

    return () => { cancelled = true; clearTimeout(fallback) }
  }, [])

  const enable = async () => {
    setWorking(true)
    try {
      if (window.OneSignal) {
        await window.OneSignal.Notifications.requestPermission()
        await window.OneSignal.User.PushSubscription.optIn()
        setSubscribed(true)
      } else {
        alert('Notifications are not yet configured. Contact your coach.')
      }
    } catch(err) { console.warn('OneSignal opt-in failed:', err) }
    setWorking(false)
  }

  const disable = async () => {
    setWorking(true)
    try {
      if (window.OneSignal) { await window.OneSignal.User.PushSubscription.optOut(); setSubscribed(false) }
    } catch(err) { console.warn('OneSignal opt-out failed:', err) }
    setWorking(false)
  }

  if (subscribed === null) return (
    <div style={{height:44,background:'rgba(28,43,58,0.06)',borderRadius:10,display:'flex',alignItems:'center',paddingLeft:14}}>
      <div style={{...T.tiny,fontSize:14}}>Checking...</div>
    </div>
  )
  if (subscribed) return (
    <div>
      <div style={{background:GREEN_LIGHT,border:`1px solid ${GREEN}`,borderRadius:10,padding:'12px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:18}}>✓</span>
        <div style={{fontWeight:600,fontSize:16,color:GREEN}}>Reminders are enabled</div>
      </div>
      <button onClick={disable} disabled={working} style={{background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:10,padding:'12px 20px',color:'#718096',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer'}}>
        {working ? 'Updating...' : 'Turn Off Reminders'}
      </button>
    </div>
  )
  return (
    <div>
      <div style={{background:AMBER_LIGHT,border:`1px solid ${AMBER}`,borderRadius:10,padding:'12px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:18}}>🔕</span>
        <div style={{fontWeight:600,fontSize:16,color:AMBER}}>Reminders are off</div>
      </div>
      <button onClick={enable} disabled={working} style={{width:'100%',background:working?'rgba(28,43,58,0.15)':ORANGE,border:'none',borderRadius:10,padding:'13px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:17,textTransform:'uppercase',letterSpacing:'0.05em',cursor:working?'not-allowed':'pointer'}}>
        {working ? 'Enabling...' : 'Enable Reminders'}
      </button>
    </div>
  )
}

function SettingsScreen({ client, clientTargets, targetSource, visibleHabits, exportDone, setExportDone, onSignOut, onDeleteRequest, onOpenLearn }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [openSection, setOpenSection]     = useState(null)

  const toggleSection = (id) => setOpenSection(prev => prev === id ? null : id)

  const AccordionCard = ({ id, title, subtitle, icon, children, danger }) => {
    const isOpen = openSection === id
    return (
      <Card style={{marginBottom:10,border:`1.5px solid ${danger&&isOpen?RED:'rgba(28,43,58,0.1)'}`,overflow:'hidden',padding:0}}>
        <button
          onClick={()=>toggleSection(id)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'16px 18px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
          {icon&&<span style={{fontSize:22,flexShrink:0}}>{icon}</span>}
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,color:danger?RED:NAVY,textTransform:'uppercase',letterSpacing:'0.04em'}}>{title}</div>
            {subtitle&&<div style={{fontSize:13,color:'#a0aec0',marginTop:2}}>{subtitle}</div>}
          </div>
          <span style={{fontSize:18,color:'#cbd5e0',transform:isOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform .2s',flexShrink:0}}>›</span>
        </button>
        {isOpen&&(
          <div style={{padding:'0 18px 18px'}}>
            <div style={{height:1,background:'rgba(28,43,58,0.08)',marginBottom:16}}/>
            {children}
          </div>
        )}
      </Card>
    )
  }

  const handleDelete = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    const subject = encodeURIComponent('Account Deletion Request - ' + client.name)
    const body    = encodeURIComponent('Hi,%0A%0AI would like to request deletion of my Evolve:Wellbeing account and all associated data.%0A%0AName: ' + client.name + '%0AEmail: ' + client.email + '%0AJoined: ' + (client.joinedAt ? new Date(client.joinedAt).toLocaleDateString('en-GB') : 'Unknown') + '%0A%0APlease confirm once my data has been removed.%0A%0AThank you')
    window.open('mailto:evolve.human01@gmail.com?subject=' + subject + '&body=' + body)
    onDeleteRequest()
  }

  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <div style={{...T.super,marginBottom:4}}>Account</div>
      <div style={{...T.h2,fontSize:30,marginBottom:22}}>Settings</div>

      <AccordionCard id="profile" title="Your Profile" icon="👤" subtitle={client.name}>
        <div style={{fontSize:19,fontWeight:700,color:NAVY,marginBottom:4}}>{client.name}</div>
        <div style={{fontSize:16,color:'#718096',marginBottom:4}}>{client.email}</div>
        <div style={{...T.tiny,marginBottom:18,fontSize:13}}>Member since {client.joinedAt?new Date(client.joinedAt).toLocaleDateString('en-GB',''):'Unknown'}</div>
        {client.goal&&(()=>{const g=PROGRAMME_GOALS.find(x=>x.id===client.goal);return g?(<div style={{background:CREAM,borderRadius:9,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:20}}>{g.icon}</span><div><div style={{fontWeight:700,fontSize:15,color:NAVY}}>{g.label}</div><div style={{...T.tiny,fontSize:12}}>Your primary goal</div></div></div>):null})()}
        <button onClick={onSignOut} style={{background:CREAM,border:'1.5px solid rgba(28,43,58,0.2)',borderRadius:10,padding:'11px 22px',color:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer'}}>
          Sign Out of This Device
        </button>
        <div style={{...T.tiny,marginTop:10,lineHeight:1.6,fontSize:13}}>Signing out clears your data from this device only. Your logs remain with your coach.</div>
      </AccordionCard>

      <AccordionCard id="targets" title="Your Targets" icon="🎯" subtitle={targetSource==='coach'?'Coach-set targets active':'Default targets active'}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:targetSource==='coach'?GREEN:AMBER,flexShrink:0}}/>
          <div style={{fontWeight:600,fontSize:16,color:NAVY}}>{targetSource==='coach' ? 'Coach-set targets active' : 'Default targets active'}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            {label:'Sleep',       value:clientTargets.sleep+'h',                       icon:'🌙'},
            {label:'Steps',       value:Number(clientTargets.steps).toLocaleString(),  icon:'👟'},
            {label:'Hydration',   value:clientTargets.hydration+'L',                   icon:'💧'},
            {label:'Meals',       value:clientTargets.meals+' meals',                  icon:'🥗'},
            {label:'Mindfulness', value:clientTargets.mindfulness+'min',               icon:'🧠'},
            {label:'Mobility',    value:clientTargets.mobility+'min',                  icon:'🧘'},
          ].map(t=>(
            <div key={t.label} style={{background:CREAM,borderRadius:9,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16}}>{t.icon}</span>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:NAVY}}>{t.value}</div>
                <div style={{...T.tiny,fontSize:12}}>{t.label}</div>
              </div>
            </div>
          ))}
        </div>
        {targetSource==='defaults'&&<div style={{...T.tiny,marginTop:12,lineHeight:1.6,fontSize:13}}>Your coach has not set individual targets yet. Evidence-based defaults are in use.</div>}
        {clientTargets.notes&&<div style={{marginTop:12,background:`${ORANGE}10`,borderLeft:`3px solid ${ORANGE}`,borderRadius:8,padding:'10px 12px',fontSize:14,color:'#4a5568',lineHeight:1.6}}>{clientTargets.notes}</div>}
      </AccordionCard>

      <AccordionCard id="notifications" title="Notifications" icon="🔔" subtitle="Daily reminder at 8pm">
        <div style={{fontWeight:700,fontSize:17,color:NAVY,marginBottom:6}}>Daily Reminder — 8pm</div>
        <div style={{...T.small,marginBottom:18,lineHeight:1.6}}>You receive a push notification at 8pm every evening and a check-in reminder every Sunday at 6pm.</div>
        <OneSignalToggle />
      </AccordionCard>

      <Card style={{marginBottom:10,padding:18,cursor:'pointer'}} onClick={onOpenLearn}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:22}}>📘</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em'}}>Learn</div>
            <div style={{fontSize:13,color:'#a0aec0',marginTop:2}}>How-to guide and the science behind your targets</div>
          </div>
          <span style={{fontSize:18,color:'#cbd5e0'}}>›</span>
        </div>
      </Card>

      <AccordionCard id="export" title="Your Data" icon="📊" subtitle="Export your logs as CSV">
        <div style={{fontWeight:700,fontSize:17,color:NAVY,marginBottom:6}}>Export Your Logs</div>
        <div style={{...T.small,marginBottom:16,lineHeight:1.6}}>Download a CSV file of your last 90 days of habit data. Opens in Excel, Google Sheets, or any spreadsheet app.</div>
        <button onClick={()=>{exportToCSV(client,visibleHabits);setExportDone(true);setTimeout(()=>setExportDone(false),3000)}}
          style={{background:exportDone?GREEN:NAVY,border:'none',borderRadius:10,padding:'12px 22px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer',transition:'background .2s'}}>
          {exportDone?'✓ Downloaded':'Download CSV'}
        </button>
      </AccordionCard>

      <AccordionCard id="delete" title="Delete Account" icon="⚠️" subtitle="Send a data deletion request" danger={true}>
        <div style={{...T.small,marginBottom:16,lineHeight:1.6}}>
          This sends a data deletion request to your coach at <strong>evolve.human01@gmail.com</strong>. Your coach will manually remove your data and confirm via email. This cannot be undone.
        </div>
        {deleteConfirm&&<div style={{background:RED_LIGHT,border:`1px solid ${RED}`,borderRadius:10,padding:'12px 14px',marginBottom:14,fontSize:15,color:RED,fontWeight:600}}>Are you sure? This will open your email app to send a deletion request to your coach.</div>}
        <button onClick={handleDelete} style={{background:deleteConfirm?RED:CREAM,border:`1.5px solid ${deleteConfirm?RED:'rgba(28,43,58,0.2)'}`,borderRadius:10,padding:'11px 22px',color:deleteConfirm?WHITE:'#718096',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer'}}>
          {deleteConfirm?'Yes, Send Deletion Request':'Request Account Deletion'}
        </button>
      </AccordionCard>

      <div style={{textAlign:'center',paddingBottom:8,marginTop:8}}>
        <div style={{...T.tiny,fontSize:12}}>Evolve:Wellbeing {APP_VERSION}</div>
      </div>
    </div>
  )
}


// ── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [client,          setClient]          = useState(null)
  const [showQuote,       setShowQuote]       = useState(false)
  const [showStreakBroken,setShowStreakBroken] = useState(false)
  const [brokenStreak,    setBrokenStreak]    = useState(0)
  const [showConfetti,    setShowConfetti]    = useState(false)
  const [view,            setView]            = useState('log')
  const [learnPage,       setLearnPage]       = useState(null) // null | 'hub' | 'guide' | topicId
  const [coachUnlocked,   setCoachUnlocked]   = useState(false)
  const [showCoachToast,  setShowCoachToast]  = useState(false)
  const [activeHabits,    setActiveHabits]    = useState(['sleep','steps','hydration','meals','mindfulness'])
  const [showCycle,       setShowCycle]       = useState(false)
  const [habitValues,     setHabitValues]     = useState({})
  const [clearedHabits,   setClearedHabits]   = useState({}) // habits the user explicitly cleared — skip prefill on next tap
  const [metricValues,    setMetricValues]    = useState({stressRPE:5,mood:6,energy:6,digestion:7})
  const [cyclePhase,      setCyclePhase]      = useState('')
  const [cycleDay1,       setCycleDay1]       = useState(null) // ISO date string of last Day 1
  const [reflection,      setReflection]      = useState('')
  const [showReflection,  setShowReflection]  = useState(false)
  const [sendStatus,      setSendStatus]      = useState('idle')
  const [hasSentToday,    setHasSentToday]    = useState(false)
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
  const [syncedCount,     setSyncedCount]     = useState(0)
  const [autoFilled,      setAutoFilled]      = useState({})
  const [clientTargets,   setClientTargets]   = useState(DEFAULT_TARGETS)
  const [targetSource,    setTargetSource]    = useState("defaults")
  const [selectedDay,     setSelectedDay]     = useState(null)  // for DayDetailModal
  const [retroLogDay,     setRetroLogDay]     = useState(null)  // for RetroLogModal
  const [editMode,        setEditMode]        = useState(false) // edit after send
  const [exportDone,      setExportDone]      = useState(false)

  const tapCount = useRef(0), tapTimer = useRef(null)
  const todayKey  = todayISO()
  const promptIdx = new Date().getDay()

  const visibleHabits   = buildHabitsWithTargets(clientTargets).filter(h=>h.id==='workout'||h.id==='breathwork'||activeHabits.includes(h.id))
  const completedHabits = visibleHabits.filter(h=>habitValues[h.id]!==undefined&&habitValues[h.id]!==''&&habitValues[h.id]!==null)
  const allGreen        = visibleHabits.length>0 && visibleHabits.every(h=>h.type==='checkbox'?habitValues[h.id]===1:h.invert?Number(habitValues[h.id]||0)<=h.green:Number(habitValues[h.id]||0)>=h.green)

  // ── Boot ───────────────────────────────────────────────
  useEffect(()=>{
    const saved=LS.get('evolve_client')
    if (saved) {
      setClient(saved)
      // Streak broken takes priority over quote
      if (wasMissed()) {
        const ls=LS.get('streak_log',{count:0,lastDate:null,best:0})
        setBrokenStreak(ls.count)
        // Reset the live streak to 0 immediately — best is preserved.
        LS.set('streak_log', {count:0, lastDate:ls.lastDate, best:ls.best})
        const ts=LS.get('streak_target',{count:0,lastDate:null,best:0})
        if (Math.floor((Date.now()-new Date(ts.lastDate||0).getTime())/86400000)>=2) {
          LS.set('streak_target', {count:0, lastDate:ts.lastDate, best:ts.best})
        }
        setTimeout(()=>setShowStreakBroken(true),400)
      } else {
        setTimeout(()=>setShowQuote(true),200)
      }
    }
    const {ls,ts}=getStreaks(); setLogStreak(ls); setTargetStreak(ts)

    const onOn=async()=>{const sent=await flushQueue();if(sent>0){setSyncedCount(sent);setTimeout(()=>setSyncedCount(0),4000)}}
    const onOff=()=>{}
    window.addEventListener('online',onOn); window.addEventListener('offline',onOff)

    // SW signals us to flush the queue (Background Sync fallback)
    const onSwMsg=(event)=>{
      if(event.data?.type==='FLUSH_QUEUE'){
        flushQueue().then(sent=>{if(sent>0){setSyncedCount(sent);setTimeout(()=>setSyncedCount(0),4000)}})
      }
    }
    navigator.serviceWorker?.addEventListener('message',onSwMsg)

    const handler=e=>{e.preventDefault();setDeferredPrompt(e);setShowInstall(true)}
    window.addEventListener('beforeinstallprompt',handler)
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)
    if(isIOS&&!window.navigator.standalone&&!LS.get('install_dismissed'))setShowInstall(true)

    return()=>{
      window.removeEventListener('online',onOn)
      window.removeEventListener('offline',onOff)
      window.removeEventListener('beforeinstallprompt',handler)
      navigator.serviceWorker?.removeEventListener('message',onSwMsg)
    }
  },[])



  // ── Client setup ───────────────────────────────────────
  useEffect(()=>{
    if(!client)return
    setWeeklyDue(isWeeklyDue()); setMonthlyDue(isMonthlyDue(client))
    const last7=[]
    for(let i=6;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().split('T')[0];const log=LS.get(`log_${key}`)
      if(log)last7.push({date:key,sleep:Number(log.habits?.sleep||0)||null,steps:Number(log.habits?.steps||0)||null,hydration:Number(log.habits?.hydration||0)||null,stress:Number(log.metrics?.stressRPE||0)||null,mood:Number(log.metrics?.mood||0)||null,energy:Number(log.metrics?.energy||0)||null,completion:visibleHabits.length?Math.round(visibleHabits.filter(h=>log.habits?.[h.id]!==undefined&&log.habits?.[h.id]!=='').length/visibleHabits.length*100):0})
    }
    setWeekData(last7)
    // Restore hasSentToday from LS across page refresh
    if (LS.get(`sent_${new Date().toISOString().split('T')[0]}`)) setHasSentToday(true)
  },[client])

  // ── Fetch coach-set targets ────────────────────────────
  // No cache — fetch fresh on every load so coach changes take effect immediately.
  useEffect(()=>{
    if (!client || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') return
    const clientId = client.clientId || client.name.trim().toLowerCase().replace(/\s+/g, '-')
    fetch(`${APPS_SCRIPT_URL}?action=getTargets&clientId=${encodeURIComponent(clientId)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.targets) {
          setClientTargets(json.targets)
          setTargetSource(json.source || 'defaults')
        }
      })
      .catch(() => {}) // Silent fail — defaults already in state
  }, [client])

  // ── Keep check-in due state fresh ─────────────────────
  // Rechecks every 5 minutes so Sunday 6pm triggers without needing app restart
  useEffect(()=>{
    if(!client)return
    const interval = setInterval(()=>{
      setWeeklyDue(isWeeklyDue())
      setMonthlyDue(isMonthlyDue(client))
    }, 300000) // 5 minutes
    return ()=>clearInterval(interval)
  },[client])
  useEffect(()=>{
    const s=LS.get(`log_${todayKey}`);
    if(s){setHabitValues(s.habits||{});setMetricValues(s.metrics||{stressRPE:5,mood:6,energy:6,digestion:7});setCyclePhase(s.cyclePhase||'');setReflection(s.reflection||'')}
    const d1=LS.get('evolve_cycle_day1');if(d1)setCycleDay1(d1)
  },[todayKey])
  useEffect(()=>{if(!client)return;LS.set(`log_${todayKey}`,{habits:habitValues,metrics:metricValues,cyclePhase,reflection})},[habitValues,metricValues,cyclePhase,reflection,client,todayKey])

  // ── Config ─────────────────────────────────────────────
  useEffect(()=>{const cfg=LS.get('evolve_config');if(cfg){if(cfg.activeHabits)setActiveHabits(cfg.activeHabits);if(cfg.showCycle!==undefined)setShowCycle(cfg.showCycle)}},[])
  useEffect(()=>{LS.set('evolve_config',{activeHabits,showCycle})},[activeHabits,showCycle])
  useEffect(()=>{if(cycleDay1)LS.set('evolve_cycle_day1',cycleDay1)},[cycleDay1])

  // ── Install btn ────────────────────────────────────────
  useEffect(()=>{const btn=document.getElementById('pwa-install-btn');if(!btn||!deferredPrompt)return;const h=async()=>{deferredPrompt.prompt();const{outcome}=await deferredPrompt.userChoice;if(outcome==='accepted'){setShowInstall(false);setDeferredPrompt(null)}};btn.addEventListener('click',h);return()=>btn.removeEventListener('click',h)},[deferredPrompt,showInstall])

  const handleSetupComplete=useCallback(info=>{
    LS.set('evolve_client',info); setClient(info)
    // Tag the user in OneSignal so we can target by name if needed
    setTimeout(() => {
      try {
        if (window.OneSignal) {
          window.OneSignal.User.addTags({
            client_name:  info.name,
            client_id:    info.name.trim().toLowerCase().replace(/\s+/g,'-'),
            client_email: info.email,
          })
        }
      } catch {}
      setShowQuote(true)
      setTimeout(()=>setShowNotifPrompt(true),600)
    }, 300)
  },[])
  const handleWordmarkTap=()=>{tapCount.current+=1;clearTimeout(tapTimer.current);if(tapCount.current>=5){tapCount.current=0;setCoachUnlocked(true);setShowCoachToast(true);setView('config')}else{tapTimer.current=setTimeout(()=>{tapCount.current=0},2000)}}

  // ── FIX 3: fetchData — graphDays in dep array ensures refetch on tab change AND day switch ──
  const fetchData=useCallback(async()=>{
    if(!client||APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE')return
    setLoadingGraphs(true)
    const clientId = client.name.trim().toLowerCase().replace(/\s+/g,'-')
    try{
      const res=await fetch(`${APPS_SCRIPT_URL}?clientId=${encodeURIComponent(clientId)}&days=${graphDays}`)
      const json=await res.json()
      if(json.success&&json.data) setHistoricData(json.data)
      else setHistoricData([])
    }catch{ setHistoricData([]) }
    setLoadingGraphs(false)
  },[client,graphDays])
  // FIX 3: fire on view change AND when graphDays changes while on progress tab
  useEffect(()=>{if(view==='progress')fetchData()},[view,graphDays,fetchData])

  const handleSend=async()=>{
    if(sendStatus==='sending')return
    setSendStatus('sending')
    const {ls,ts}=updateStreaks(habitValues,visibleHabits)
    setLogStreak(ls); setTargetStreak(ts)
    const clientId=client?.clientId || client?.name?.trim().toLowerCase().replace(/\s+/g,'-') || 'unknown'
    const payload={
      date:todayKey,
      clientId,
      clientName:client?.name||'',
      clientEmail:client?.email||'',
      habits:habitValues,
      metrics:metricValues,
      cyclePhase:showCycle?(()=>{const p=getCyclePhase(cycleDay1);return p&&!p.expired?p.label:cyclePhase})():'',
      reflectionPrompt:DAILY_PROMPTS[promptIdx%DAILY_PROMPTS.length],
      reflection,
      habitsCompleted:completedHabits.length,
      habitsTotal:visibleHabits.length,
      logStreak:ls.count,
      targetStreak:ts.count,
      isEdit: hasSentToday,
    }
    if(!navigator.onLine){
      queueLog(payload,APPS_SCRIPT_URL)
      setSendStatus('queued')
      return
    }
    try{
      // mode:no-cors returns an opaque response — we cannot confirm Apps Script
      // received and wrote the data. We treat network-level success (no throw)
      // as "sent" and flag locally. If you later enable CORS on the Apps Script
      // endpoint this should be updated to check response.ok.
      await fetch(APPS_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      setSendStatus('success')
      setHasSentToday(true)
      LS.set(`sent_${todayKey}`,true)
      if(allGreen){setShowConfetti(true);setTimeout(()=>setShowConfetti(false),3500)}
      setTimeout(()=>setSendStatus('idle'),4000)
    }catch{
      queueLog(payload,APPS_SCRIPT_URL)
      setSendStatus('queued')
    }
  }

  // Fix 6: check-in with offline queuing and error feedback
  const handleCheckIn=async(data)=>{
    if(CHECKIN_SCRIPT_URL==='YOUR_CHECKIN_APPS_SCRIPT_URL_HERE')return
    if(!navigator.onLine){
      // Queue check-in for retry when back online
      queueLog(data, CHECKIN_SCRIPT_URL)
      return
    }
    try{
      await fetch(CHECKIN_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
    }catch{
      // If fetch fails, queue it
      queueLog(data, CHECKIN_SCRIPT_URL)
    }
  }

  // ── Chart data ─────────────────────────────────────────
  // Fix 3: .slice() before .sort() to avoid mutating state directly
  const chartData=[...historicData].sort((a,b)=>new Date(a['Date'])-new Date(b['Date'])).map(row=>({date:new Date(row['Date']).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),sleep:parseFloat(row['Sleep (hrs)'])||null,steps:parseInt(row['Steps'])||null,hydration:parseFloat(row['Hydration (L)'])||null,stress:parseFloat(row['Stress RPE (1-10)'])||null,mood:parseFloat(row['Mood (1-10)'])||null,energy:parseFloat(row['Energy (1-10)'])||null,digestion:parseFloat(row['Digestion (1-10)'])||null,mobility:parseFloat(row['Mobility (min)'])||null,completion:parseFloat(row['Completion %'])||null}))
  const calcAvg=key=>{const v=chartData.map(d=>d[key]).filter(v=>v!==null&&!isNaN(v));return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):null}

  const inp={width:'100%',background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:10,padding:'14px 16px',color:NAVY,fontFamily:"'Barlow',sans-serif",fontSize:17,outline:'none',boxSizing:'border-box'}

  const navTabs=[
    {v:'log',icon:'📋',label:'Log'},
    {v:'progress',icon:'📊',label:'Progress'},
    {v:'settings',icon:'⚙',label:'Settings'},
    ...(coachUnlocked?[{v:'config',icon:'🔧',label:'Setup'}]:[]),
  ]

  if(!client)return<SetupScreen onComplete={handleSetupComplete}/>

  return(
    <div style={{minHeight:'100vh',background:CREAM,color:NAVY,fontFamily:"'Barlow',sans-serif",display:'flex',flexDirection:'column'}}>
      {showConfetti    && <ConfettiCanvas/>}
      {showQuote       && <QuoteSplash onDismiss={()=>setShowQuote(false)}/>}
      {showStreakBroken && <StreakBrokenScreen streak={brokenStreak} onDismiss={()=>{ setShowStreakBroken(false); setShowQuote(true) }}/>}
      {showNotifPrompt && <NotifPrompt onDone={()=>setShowNotifPrompt(false)}/>}
      {showInstall     && <InstallBanner onDismiss={()=>{setShowInstall(false);LS.set('install_dismissed',true)}}/>}
      {showCoachToast  && <CoachToast onDone={()=>setShowCoachToast(false)}/>}
      {selectedDay     && <DayDetailModal date={selectedDay} visibleHabits={visibleHabits} onClose={()=>setSelectedDay(null)}/>}
      {retroLogDay    && <RetroLogModal date={retroLogDay} visibleHabits={visibleHabits} client={client} appsScriptUrl={APPS_SCRIPT_URL} onClose={()=>setRetroLogDay(null)} onSaved={(day)=>{setRetroLogDay(null)}}/>}

      {/* ── STICKY HEADER BLOCK ── */}
      <div style={{position:'sticky',top:0,zIndex:100,flexShrink:0}}>
        <PrideBand h={7}/>
        <OfflineBanner queued={getQueueLength()} synced={syncedCount}/>
        <div style={{background:NAVY,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div onClick={handleWordmarkTap} style={{cursor:'default',userSelect:'none'}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,letterSpacing:'0.07em',color:WHITE}}>EVOLVE<span style={{color:ORANGE}}>:</span>WELLBEING</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:2}}>{client.name}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {logStreak.count>0&&<div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(242,100,25,0.2)',borderRadius:20,padding:'5px 11px'}}><span style={{fontSize:15}}>🔥</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,color:ORANGE}}>{logStreak.count}</span></div>}
            {targetStreak.count>0&&<div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(46,125,50,0.15)',borderRadius:20,padding:'5px 11px'}}><span style={{fontSize:15}}>⭐</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,color:GREEN}}>{targetStreak.count}</span></div>}
          </div>
        </div>
      </div>

      {/* ── LOG ── */}
      {!learnPage && view==='log'&&(
        <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'20px 14px 110px'}}>
          {/* Date + progress bar — no fraction, just the bar */}
          <div style={{marginBottom:20}}>
            <div style={{...T.super,marginBottom:8}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{flex:1,height:8,background:'rgba(28,43,58,0.1)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${visibleHabits.length?Math.round(completedHabits.length/visibleHabits.length*100):0}%`,background:allGreen?GREEN:ORANGE,borderRadius:4,transition:'width .3s'}}/>
              </div>
              <div style={{...T.small,fontSize:14,fontWeight:600,color:allGreen?GREEN:NAVY,minWidth:'auto',whiteSpace:'nowrap'}}>
                {completedHabits.length} of {visibleHabits.length} habits logged today
              </div>
            </div>
          </div>

          <StreakCard ls={logStreak} ts={targetStreak}/>



          {/* Check-ins */}
          {weeklyDue&&<CheckInCard type="weekly" questions={WEEKLY_QUESTIONS} onSubmit={handleCheckIn} client={client}/>}
          {monthlyDue&&!weeklyDue&&<CheckInCard type="monthly" questions={MONTHLY_QUESTIONS} onSubmit={handleCheckIn} client={client}/>}

          {/* Habits */}
          <SL>Today's Habits</SL>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
            {visibleHabits.map(h=>{
              const val=habitValues[h.id], filled=val!==undefined&&val!==''&&val!==null
              const editing = filled || clearedHabits[h.id] // show input box even when value is blank, post-clear
              const col=habitColor(h,val), bg=habitBg(h,val)
              const prev=LS.get(`log_${yesterday()}`)?.habits?.[h.id]
              const isAuto=autoFilled[h.id]!==undefined

              const handleClear=()=>{
                setHabitValues(v=>({...v,[h.id]:''}))
                setClearedHabits(c=>({...c,[h.id]:true}))
              }

              const handleTap=()=>{
                if (editing) return // input box already showing — nothing to do
                const prefill = autoFilled[h.id] ?? prev ?? h.target
                setHabitValues(v=>({...v,[h.id]:Number(prefill)}))
              }

              // ── Checkbox habit (workout) ──
              if (h.type === 'checkbox') {
                const isYes = val === 1
                const isNo  = val === 0
                const cbFilled = val === 0 || val === 1
                const cbCol = cbFilled ? (isYes ? GREEN : AMBER) : 'rgba(28,43,58,0.12)'
                const cbBg  = cbFilled ? (isYes ? GREEN_LIGHT : AMBER_LIGHT) : WHITE
                return (
                  <div key={h.id} style={{background:cbBg,border:`2px solid ${cbCol}`,borderRadius:14,padding:16,transition:'all .15s',boxShadow:'0 1px 4px rgba(28,43,58,0.06)'}}>
                    <div style={{fontSize:26,marginBottom:8}}>{h.icon}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:4}}>{h.label}</div>
                    <div style={{fontSize:13,color:'#718096',marginBottom:10}}>{h.desc}</div>
                    <div style={{display:'flex',gap:8}}>
                      <button
                        onClick={()=>setHabitValues(p=>({...p,[h.id]:isYes?'':1}))}
                        style={{flex:1,padding:'10px 4px',borderRadius:9,border:`2px solid ${isYes?GREEN:'rgba(28,43,58,0.15)'}`,background:isYes?GREEN:WHITE,color:isYes?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,textTransform:'uppercase',letterSpacing:'0.04em',cursor:'pointer',transition:'all .15s'}}>
                        ✓ Yes
                      </button>
                      <button
                        onClick={()=>setHabitValues(p=>({...p,[h.id]:isNo?'':0}))}
                        style={{flex:1,padding:'10px 4px',borderRadius:9,border:`2px solid ${isNo?AMBER:'rgba(28,43,58,0.15)'}`,background:isNo?AMBER_LIGHT:WHITE,color:isNo?AMBER:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,textTransform:'uppercase',letterSpacing:'0.04em',cursor:'pointer',transition:'all .15s'}}>
                        ✕ No
                      </button>
                    </div>
                    {cbFilled&&(
                      <button onClick={()=>setHabitValues(p=>({...p,[h.id]:''}))}
                        style={{width:'100%',marginTop:7,background:'transparent',border:'1px solid rgba(28,43,58,0.12)',borderRadius:6,padding:'4px',color:'#a0aec0',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer'}}>
                        ✕ Clear
                      </button>
                    )}
                  </div>
                )
              }

              return(
                <div key={h.id} style={{background:filled?bg:WHITE,border:`2px solid ${filled?col:'rgba(28,43,58,0.12)'}`,borderRadius:14,padding:16,position:'relative',transition:'all .15s',boxShadow:'0 1px 4px rgba(28,43,58,0.06)'}}>
                  {isAuto&&<div style={{position:'absolute',top:8,right:8,background:GREEN,color:WHITE,fontSize:10,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",borderRadius:5,padding:'2px 6px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Auto</div>}
                  <div style={{fontSize:26,marginBottom:8}}>{h.icon}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:6}}>{h.label}</div>
                  {editing?(
                    <div>
                      <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:6}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:30,color:filled?col:'#cbd5e0',lineHeight:1}}>{filled?val:'—'}</div>
                        <div style={{fontSize:14,color:filled?col:'#cbd5e0',fontWeight:500}}>{h.unit}</div>
                      </div>
                      {/* FIX 5: direct input always visible, autofocus when freshly cleared */}
                      <input type="number" min={h.min} max={h.max} step={h.step} value={val??''} autoFocus={!filled}
                        onChange={e=>{
                          const v=e.target.value
                          setHabitValues(p=>({...p,[h.id]:v===''?'':Number(v)}))
                          if (v!=='') setClearedHabits(c=>{const n={...c};delete n[h.id];return n})
                        }}
                        onClick={e=>e.stopPropagation()}
                        style={{width:'100%',background:'rgba(255,255,255,0.6)',border:`1px solid ${col}55`,borderRadius:7,padding:'7px 10px',color:NAVY,fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:600,outline:'none',boxSizing:'border-box'}}/>
                      {/* FIX 5: clear button */}
                      <button onClick={e=>{e.stopPropagation();handleClear()}}
                        style={{width:'100%',marginTop:5,background:'transparent',border:'1px solid rgba(28,43,58,0.12)',borderRadius:6,padding:'4px',color:'#a0aec0',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer'}}>
                        ✕ Clear
                      </button>
                    </div>
                  ):(
                    <div onClick={handleTap} style={{cursor:'pointer'}}>
                      <div style={{...T.tiny,fontSize:13,marginBottom:8}}>{prev!==undefined?`Yesterday: ${prev} ${h.unit}`:`Target: ${h.target} ${h.unit}`}</div>
                      <div style={{background:NAVY,color:WHITE,borderRadius:8,padding:'8px 10px',textAlign:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                        {isAuto?'↩ Auto-filled':prev!==undefined?'↩ Use yesterday':'Tap to fill'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Wellness metrics — number pickers */}
          <SL>Wellness Metrics</SL>
          {METRICS.map(m=>(
            <Card key={m.id}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <span style={{fontSize:22}}>{m.icon}</span>
                <div style={{fontWeight:700,fontSize:18,color:NAVY}}>{m.label}</div>
                <div style={{marginLeft:'auto',minWidth:44,textAlign:'center',background:metricColor(m,metricValues[m.id]??5),color:WHITE,borderRadius:9,padding:'4px 8px',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24}}>{metricValues[m.id]??5}</div>
              </div>
              <NumberPicker metric={m} value={metricValues[m.id]} onChange={v=>setMetricValues(p=>({...p,[m.id]:v}))}/>
            </Card>
          ))}

          {/* Cycle tracking card */}
          {showCycle&&(()=>{
            const phase = getCyclePhase(cycleDay1)
            const isDay1Today = cycleDay1 === todayKey
            const handleDay1 = () => {
              if (isDay1Today) {
                // untap — revert to previous day1 or null
                const prev = LS.get('evolve_cycle_day1_prev')
                setCycleDay1(prev || null)
              } else {
                LS.set('evolve_cycle_day1_prev', cycleDay1)
                setCycleDay1(todayKey)
              }
            }
            return (
              <div style={{background:WHITE,border:`2px solid rgba(28,43,58,0.12)`,borderRadius:14,padding:16,marginBottom:8,boxShadow:'0 1px 4px rgba(28,43,58,0.06)'}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:12}}>🌙 Cycle Tracking</div>

                {/* Phase display */}
                {phase && !phase.expired && (
                  <div style={{background:CREAM,borderRadius:10,padding:'12px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:28}}>{phase.icon}</span>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:20,color:NAVY}}>{phase.label}</div>
                      <div style={{fontSize:13,color:'#718096',marginTop:2}}>{phase.desc} · Day {phase.dayNum} of cycle</div>
                    </div>
                  </div>
                )}
                {(!phase || phase.expired) && (
                  <div style={{background:CREAM,borderRadius:10,padding:'12px 14px',marginBottom:12}}>
                    <div style={{fontSize:14,color:'#718096',lineHeight:1.5}}>{cycleDay1 ? 'It has been more than 35 days since your last cycle start. Tap Day 1 when your next cycle begins.' : 'Tap Day 1 below when your period starts to track your cycle phase.'}</div>
                  </div>
                )}

                {/* Day 1 checkbox — always present */}
                <button
                  onClick={handleDay1}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:12,background:isDay1Today?`${ORANGE}15`:CREAM,border:`2px solid ${isDay1Today?ORANGE:'rgba(28,43,58,0.15)'}`,borderRadius:10,padding:'12px 14px',cursor:'pointer',textAlign:'left'}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${isDay1Today?ORANGE:'rgba(28,43,58,0.3)'}`,background:isDay1Today?ORANGE:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {isDay1Today&&<span style={{color:WHITE,fontSize:14,fontWeight:700}}>✓</span>}
                  </div>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,color:NAVY,textTransform:'uppercase',letterSpacing:'0.04em'}}>Day 1 — Period started today</div>
                    <div style={{fontSize:12,color:'#a0aec0',marginTop:2}}>Resets your cycle phase tracking</div>
                  </div>
                </button>
              </div>
            )
          })()}

          {/* Reflection — collapsible */}
          <button onClick={()=>setShowReflection(v=>!v)} style={{width:'100%',background:WHITE,border:'1.5px solid rgba(28,43,58,0.12)',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',marginTop:8,marginBottom:showReflection?0:8}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,color:NAVY,textTransform:'uppercase',letterSpacing:'0.05em'}}>💬 Add a Note Today</div>
            <div style={{fontSize:18,color:'#a0aec0'}}>{showReflection?'▲':'▼'}</div>
          </button>
          {showReflection&&(
            <div style={{background:WHITE,border:'1.5px solid rgba(28,43,58,0.12)',borderRadius:12,padding:16,marginBottom:12,borderTop:'none',borderTopLeftRadius:0,borderTopRightRadius:0}}>
              <div style={{background:CREAM,borderLeft:`4px solid ${ORANGE}`,borderRadius:8,padding:14,marginBottom:12,fontSize:15,color:'#4a5568',lineHeight:1.7,fontStyle:'italic'}}>{DAILY_PROMPTS[promptIdx%DAILY_PROMPTS.length]}</div>
              <textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={4} placeholder="Your thoughts..." style={{...inp,resize:'vertical',lineHeight:1.7}}/>
            </div>
          )}

          {/* FIX 6: Send — always-visible edit notice once sent, isEdit flag on resend */}
          <Card style={{padding:24}}>
            <div style={{...T.super,marginBottom:6}}>Send Today's Log</div>
            <div style={{...T.small,marginBottom:18}}>Sends your log to your coach and saves it to your progress tracker.</div>
            {hasSentToday && sendStatus==='idle' && (
              <div style={{marginBottom:14,background:`${ORANGE}10`,borderRadius:9,padding:'10px 12px',display:'flex',alignItems:'center',gap:8,border:`1px solid ${ORANGE}22`}}>
                <span style={{fontSize:16}}>✏️</span>
                <div style={{...T.tiny,fontSize:13,flex:1}}>You've already sent today. Edit your values above and send again — it will replace your previous entry.</div>
              </div>
            )}
            <button onClick={handleSend} disabled={sendStatus==='sending'} style={{width:'100%',background:sendStatus==='success'?GREEN:sendStatus==='queued'?AMBER:sendStatus==='error'?RED:ORANGE,border:'none',borderRadius:12,padding:'18px',color:WHITE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,letterSpacing:'0.06em',textTransform:'uppercase',cursor:sendStatus==='sending'?'wait':'pointer',transition:'background .25s'}}>
              {sendStatus==='idle'   &&(hasSentToday?'Update Log →':'Send to Coach →')}
              {sendStatus==='sending'&&'Sending...'}
              {sendStatus==='success'&&(allGreen?'🎉 All Green — Sent!':'✓ Sent to Coach')}
              {sendStatus==='queued' &&'📡 Queued — Will Send When Online'}
              {sendStatus==='error'  &&'⚠ Something went wrong'}
            </button>
          </Card>
        </div>
      )}

      {/* ── PROGRESS ── */}
      {!learnPage && view==='progress'&&(
        <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'20px 14px 110px'}}>

          {/* Weekly summary at top of Progress */}
          <WeeklyReportCard data={weekData} clientTargets={clientTargets}/>

          {/* Calendar — tappable */}
          <HabitCalendar visibleHabits={visibleHabits} onDayTap={(day,status)=>{
            const daysAgo = Math.floor((Date.now()-new Date(day).getTime())/86400000)
            if (daysAgo === 0) return // today handled on log screen
            if (daysAgo <= 7) { setRetroLogDay(day); return } // within 7 days — always retro log
            setSelectedDay(day) // older — read-only detail
          }}/>

          {/* Time range */}
          <div style={{display:'flex',gap:8,marginBottom:8,marginTop:8}}>
            {[7,14,30].map(d=>(
              <button key={d} onClick={()=>setGraphDays(d)} style={{flex:1,background:graphDays===d?ORANGE:WHITE,border:`1.5px solid ${graphDays===d?ORANGE:'rgba(28,43,58,0.18)'}`,borderRadius:10,padding:'11px',color:graphDays===d?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer'}}>{d} Days</button>
            ))}
          </div>
          <div style={{...T.tiny,fontSize:13,marginBottom:16,textAlign:'center'}}>Rolling {graphDays}-day window — updates daily as new logs come in</div>

          {loadingGraphs&&<div style={{textAlign:'center',padding:40,color:'#718096',fontSize:17}}>Loading your progress data...</div>}

          {!loadingGraphs&&chartData.length===0&&(
            <Card style={{textAlign:'center',padding:40}}>
              <div style={{fontSize:36,marginBottom:14}}>📈</div>
              <div style={{...T.h3,marginBottom:10,fontSize:22}}>No synced data yet</div>
              <div style={{...T.small}}>Send your first daily log to start building your progress charts. Your calendar above shows local data from day one.</div>
            </Card>
          )}

          {!loadingGraphs&&chartData.length>0&&(
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9,marginBottom:18}}>
                {[
                  {label:'Avg Sleep',  val:calcAvg('sleep')?`${calcAvg('sleep')}h`:'—',  ok:Number(calcAvg('sleep'))>=clientTargets.sleep,                target:`${clientTargets.sleep}h`},
                  {label:'Avg Stress', val:calcAvg('stress')??'—',                        ok:Number(calcAvg('stress'))<=clientTargets.stress,              target:`≤${clientTargets.stress}`},
                  {label:'Avg Mood',   val:calcAvg('mood')??'—',                          ok:Number(calcAvg('mood'))>=clientTargets.mood,                  target:`≥${clientTargets.mood}`},
                  {label:'Avg Energy', val:calcAvg('energy')??'—',                        ok:Number(calcAvg('energy'))>=clientTargets.energy,              target:`≥${clientTargets.energy}`},
                  {label:'Completion', val:calcAvg('completion')?`${calcAvg('completion')}%`:'—', ok:Number(calcAvg('completion'))>=80,                    target:'≥80%'},
                  {label:'Total Logs', val:chartData.length,                              ok:true,                                                         target:`${graphDays}d`},
                ].map(c=>(
                  <div key={c.label} style={{background:WHITE,border:'1px solid rgba(28,43,58,0.1)',borderRadius:11,padding:'14px 10px',textAlign:'center',boxShadow:'0 1px 4px rgba(28,43,58,0.06)'}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:c.ok?GREEN:AMBER}}>{c.val}</div>
                    <div style={{fontSize:13,color:'#718096',marginTop:3}}>{c.label}</div>
                    <div style={{fontSize:12,color:'#cbd5e0',marginTop:2}}>target: {c.target}</div>
                  </div>
                ))}
              </div>

              <ChartCard title="Sleep Duration" subtitle={`Hours per night · target: ${clientTargets.sleep}h`}>
                <ResponsiveContainer width="100%" height={190}><ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis domain={[0,12]} tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><ReferenceLine y={clientTargets.sleep} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1}/><Area type="monotone" dataKey="sleep" stroke={ORANGE} fill={`${ORANGE}22`} strokeWidth={2.5} dot={{fill:ORANGE,r:3}} name="Sleep (hrs)" connectNulls/></ComposedChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Daily Steps" subtitle={`Steps per day · target: ${Number(clientTargets.steps).toLocaleString()}`}>
                <ResponsiveContainer width="100%" height={190}><BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><ReferenceLine y={clientTargets.steps} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1}/><Bar dataKey="steps" fill={ORANGE} radius={[5,5,0,0]} name="Steps"/></BarChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Hydration" subtitle={`Litres per day · target: ${clientTargets.hydration}L`}>
                <ResponsiveContainer width="100%" height={170}><ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis domain={[0,5]} tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><ReferenceLine y={clientTargets.hydration} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1}/><Area type="monotone" dataKey="hydration" stroke="#1565C0" fill="rgba(21,101,192,0.12)" strokeWidth={2.5} dot={{fill:'#1565C0',r:3}} name="Hydration (L)" connectNulls/></ComposedChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Stress · Mood · Energy" subtitle="Daily scores /10">
                <ResponsiveContainer width="100%" height={210}><LineChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis domain={[0,10]} tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:14,color:'#718096'}}/><ReferenceLine y={5} stroke="rgba(28,43,58,0.1)" strokeDasharray="3 3"/><Line type="monotone" dataKey="stress" stroke={RED} strokeWidth={2.5} dot={{r:2}} name="Stress" connectNulls/><Line type="monotone" dataKey="mood" stroke={GREEN} strokeWidth={2.5} dot={{r:2}} name="Mood" connectNulls/><Line type="monotone" dataKey="energy" stroke={ORANGE} strokeWidth={2.5} dot={{r:2}} name="Energy" connectNulls/></LineChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Habit Completion" subtitle="% of habits completed · green = 80% target">
                <ResponsiveContainer width="100%" height={170}><BarChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis domain={[0,100]} tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><ReferenceLine y={80} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1}/><Bar dataKey="completion" name="Completion %" fill={ORANGE} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Digestion" subtitle="Daily score /10 · green = 7 target">
                <ResponsiveContainer width="100%" height={170}><ComposedChart data={chartData} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis domain={[0,10]} tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><ReferenceLine y={7} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1}/><Area type="monotone" dataKey="digestion" stroke="#7B1FA2" fill="rgba(123,31,162,0.1)" strokeWidth={2.5} dot={{fill:'#7B1FA2',r:3}} name="Digestion" connectNulls/></ComposedChart></ResponsiveContainer>
              </ChartCard>
              {visibleHabits.some(h=>h.id==='mobility')&&(
                <ChartCard title="Mobility" subtitle={`Minutes per day · target: ${clientTargets.mobility}min`}>
                  <ResponsiveContainer width="100%" height={170}><BarChart data={chartData.map(d=>({...d,mobility:d['mobility']||null}))} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(28,43,58,0.08)"/><XAxis dataKey="date" tick={{fill:'#718096',fontSize:12}}/><YAxis tick={{fill:'#718096',fontSize:12}}/><Tooltip content={<CustomTooltip/>}/><ReferenceLine y={clientTargets.mobility} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1}/><Bar dataKey="mobility" name="Mobility (min)" fill="#00796B" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>
                </ChartCard>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LEARN ── */}
      {learnPage==='hub' && (
        <LearnHub
          onOpenGuide={()=>setLearnPage('guide')}
          onOpenTopic={(id)=>setLearnPage(id)}
          onBack={()=>setLearnPage(null)}
        />
      )}
      {learnPage==='guide' && (
        <HowToGuidePage onBack={()=>setLearnPage('hub')} />
      )}
      {learnPage && learnPage!=='hub' && learnPage!=='guide' && (
        <ScienceTopicPage topicId={learnPage} clientTargets={clientTargets} onBack={()=>setLearnPage('hub')} />
      )}

      {/* ── SETTINGS ── */}
      {!learnPage && view==='settings'&&(
        <SettingsScreen
          client={client}
          clientTargets={clientTargets}
          targetSource={targetSource}
          visibleHabits={visibleHabits}
          exportDone={exportDone}
          setExportDone={setExportDone}
          onOpenLearn={()=>setLearnPage('hub')}
          onSignOut={()=>{LS.del('evolve_client');setClient(null);setCoachUnlocked(false)}}
          onDeleteRequest={()=>{}}
        />
      )}

      {/* ── COACH CONFIG ── */}
      {!learnPage && view==='config'&&coachUnlocked&&(
        <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'20px 14px 110px'}}>
          <div style={{...T.super,marginBottom:4}}>Coach Mode</div>
          <div style={{...T.h2,fontSize:30,marginBottom:22}}>Client Setup</div>
          <Card style={{padding:22,marginBottom:14}}>
            <div style={{...T.super,marginBottom:10}}>Current Client</div>
            <div style={{fontSize:19,fontWeight:700,color:NAVY,marginBottom:4}}>{client.name}</div>
            <div style={{fontSize:16,color:'#718096',marginBottom:3}}>{client.email}</div>
            <div style={{...T.tiny,marginBottom:16,fontSize:13}}>Joined: {client.joinedAt?new Date(client.joinedAt).toLocaleDateString('en-GB'):'Unknown'} · Monthly check-in day: {client.startDay||1}</div>
            <button onClick={()=>{LS.del('evolve_client');setClient(null);setCoachUnlocked(false);setView('log')}} style={{background:CREAM,border:'1px solid rgba(28,43,58,0.18)',borderRadius:8,padding:'10px 20px',color:'#718096',fontFamily:"'Barlow',sans-serif",fontSize:15,cursor:'pointer'}}>Clear Client (Sign Out)</button>
          </Card>
          <div style={{background:WHITE,border:`1.5px solid ${ORANGE}`,borderRadius:14,padding:26,marginBottom:14,boxShadow:'0 1px 4px rgba(28,43,58,0.07)'}}>
            <div style={{...T.super,marginBottom:4}}>Active Habits</div>
            <div style={{...T.h3,fontSize:22,marginBottom:6}}>Select Up to 5</div>
            <div style={{...T.small,marginBottom:20}}>Choose which habits appear in the client's daily log.</div>
            {ALL_HABITS.filter(h=>h.id!=='workout'&&h.id!=='breathwork').map(h=>{const on=activeHabits.includes(h.id);return(
              <button key={h.id} onClick={()=>{if(on)setActiveHabits(p=>p.filter(x=>x!==h.id));else if(activeHabits.length<6)setActiveHabits(p=>[...p,h.id])}} style={{display:'flex',alignItems:'center',gap:12,width:'100%',background:on?`${ORANGE}10`:CREAM,border:`1.5px solid ${on?ORANGE:'rgba(28,43,58,0.12)'}`,borderRadius:10,padding:'14px 16px',marginBottom:8,color:on?NAVY:'#718096',fontFamily:"'Barlow',sans-serif",fontSize:16,cursor:on||activeHabits.length<6?'pointer':'not-allowed',textAlign:'left'}}>
                <span style={{fontSize:22}}>{h.icon}</span>
                <div style={{flex:1}}><div style={{fontWeight:600,fontSize:16,color:on?NAVY:'#718096'}}>{h.label}</div><div style={{fontSize:13,color:'#a0aec0',marginTop:2}}>{h.desc}</div></div>
                {on&&<span style={{background:ORANGE,color:WHITE,borderRadius:10,padding:'3px 10px',fontSize:13,fontWeight:700}}>Active</span>}
              </button>
            )})}
            <div style={{...T.tiny,marginTop:6,fontSize:13}}>{activeHabits.length}/6 selected</div>
            {/* Workout — always on, shown as fixed toggle (non-removable) */}
            <div style={{display:'flex',alignItems:'center',gap:12,width:'100%',background:`${ORANGE}10`,border:`1.5px solid ${ORANGE}`,borderRadius:10,padding:'14px 16px',marginTop:8,boxSizing:'border-box'}}>
              <span style={{fontSize:22}}>💪</span>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:16,color:NAVY}}>Workout</div><div style={{fontSize:13,color:'#a0aec0',marginTop:2}}>Always tracked — did you work out today?</div></div>
              <span style={{background:NAVY,color:WHITE,borderRadius:10,padding:'3px 10px',fontSize:13,fontWeight:700}}>Always On</span>
            </div>
            <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid rgba(28,43,58,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:600,fontSize:17,color:NAVY}}>Cycle Tracking</div><div style={{...T.tiny,marginTop:3,fontSize:13}}>Enable for peri/menopausal clients</div></div>
              <button onClick={()=>setShowCycle(v=>!v)} style={{background:showCycle?ORANGE:CREAM,border:`1.5px solid ${showCycle?ORANGE:'rgba(28,43,58,0.18)'}`,borderRadius:20,padding:'10px 22px',color:showCycle?WHITE:NAVY,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,textTransform:'uppercase',cursor:'pointer'}}>{showCycle?'On':'Off'}</button>
            </div>
          </div>
          <Card style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6,color:APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?RED:GREEN}}>{APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'⚠ Not connected to Google Sheets':'✓ Connected to Google Sheets'}</div>
            <div style={{...T.small}}>{APPS_SCRIPT_URL==='YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'?'Paste your Apps Script URL into APPS_SCRIPT_URL in App.jsx and redeploy.':"Logs saving to coach's Google Sheet automatically."}</div>
          </Card>
          <button onClick={()=>{setCoachUnlocked(false);setView('log')}} style={{width:'100%',marginTop:8,background:CREAM,border:'1.5px solid rgba(28,43,58,0.18)',borderRadius:12,padding:'15px',color:'#718096',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:17,textTransform:'uppercase',letterSpacing:'0.06em',cursor:'pointer'}}>← Exit Coach Mode</button>
        </div>
      )}

      {/* Bottom nav */}
      {!learnPage && (
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:WHITE,borderTop:'1px solid rgba(28,43,58,0.12)',boxShadow:'0 -2px 10px rgba(28,43,58,0.08)',zIndex:50}}>
        <div style={{display:'flex',maxWidth:600,margin:'0 auto'}}>
          {navTabs.map(({v,icon,label})=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,background:'transparent',border:'none',padding:'13px 8px 11px',color:view===v?ORANGE:'#a0aec0',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'color .15s',position:'relative'}}>
              {v==='log'&&(weeklyDue||monthlyDue)&&<div style={{position:'absolute',top:8,right:'22%',width:10,height:10,borderRadius:'50%',background:ORANGE,border:`2px solid ${WHITE}`}}/>}
              <span style={{fontSize:22}}>{icon}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,letterSpacing:'0.06em',textTransform:'uppercase'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
