// ── LEARN SCREEN ──────────────────────────────────────────
// Renders the Learn hub (how-to guide + science topic list),
// the how-to guide itself, individual science topic pages,
// and infographic how-to guides for Sleep, Steps, and Hydration.

import { HOW_TO_GUIDE, SCIENCE_TOPICS } from './LearnContent.jsx'

const ORANGE = '#F26419'
const NAVY   = '#1C2B3A'
const CREAM  = '#F0EEF5'
const WHITE  = '#FFFFFF'
const AMBER  = '#e65100'

const T = {
  super: { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.12em', textTransform:'uppercase', color:ORANGE },
  h2:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:40, lineHeight:1.05, textTransform:'uppercase', color:NAVY },
  h3:    { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:26, textTransform:'uppercase', letterSpacing:'0.04em', color:NAVY },
  groupLabel: { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:'0.08em', textTransform:'uppercase' },
  body:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:18, lineHeight:1.7, color:'#2d3748' },
  small: { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:15, color:'#718096', lineHeight:1.5 },
  tiny:  { fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:13, color:'#a0aec0' },
}

const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:WHITE,borderRadius:14,padding:18,marginBottom:12,border:'1px solid rgba(28,43,58,0.1)',boxShadow:'0 1px 4px rgba(28,43,58,0.07)',...style}}>{children}</div>
)

const BackButton = ({onClick,label='← Back'}) => (
  <button onClick={onClick} style={{background:'transparent',border:'none',color:ORANGE,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,letterSpacing:'0.05em',textTransform:'uppercase',cursor:'pointer',padding:'8px 0',marginBottom:8}}>
    {label}
  </button>
)

// ── SLEEP HYGIENE INFOGRAPHIC ─────────────────────────────

const SLEEP_STEPS = {
  day: [
    { icon:'⏰', title:'Wake at the same time, every day', nugget:'Sleep timing and regularity is one of the most consistently studied habits for protecting your body clock.', ref:1 },
    { icon:'☀️', title:'Get outside in the morning', nugget:'Morning light exposure helps anchor your circadian rhythm to a 24-hour cycle.', ref:2 },
    { icon:'🏃', title:'Move your body during the day', nugget:'Regular exercise is linked to better sleep quality — most people don\'t need to worry about timing.', ref:1 },
    { icon:'☕', title:'Cut caffeine after early afternoon', nugget:'Caffeine taken even 6 hours before bed has been shown to cut total sleep time by over an hour.', ref:3 },
  ],
  night: [
    { icon:'📱', title:'Build a wind-down routine, screens off', nugget:'Room light before bed delayed melatonin release in almost all participants in one study.', ref:4 },
    { icon:'🍷', title:'Skip late meals and alcohol', nugget:'Alcohol may help you fall asleep faster, but it disrupts sleep quality later in the night.', ref:5 },
    { icon:'❄️', title:'Keep your room cool', nugget:'Research suggests around 16–19°C (with normal bedding) supports better sleep for most people.', ref:6 },
    { icon:'🛏️', title:'Can\'t sleep? Get up', nugget:'Lying awake in bed can train your brain to associate bed with wakefulness, not sleep.', ref:7 },
  ],
}

const SLEEP_REFERENCES = [
  { text:'Irish, L.A., Kline, C.E., Gunn, H.E., Buysse, D.J., & Hall, M.H. (2015). The role of sleep hygiene in promoting public health: A review of empirical evidence. Sleep Medicine Reviews, 22, 23-36.' },
  { text:'Brown, T.M., Brainard, G.C., Cajochen, C., et al. (2022). Recommendations for daytime, evening, and nighttime indoor light exposure to best support physiology, sleep, and wakefulness in healthy adults. PLoS Biology, 20(3), e3001571.' },
  { text:'Drake, C., Roehrs, T., Shambroom, J., & Roth, T. (2013). Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed. Journal of Clinical Sleep Medicine, 9(11), 1195-1200.' },
  { text:'Gooley, J.J., Chamberlain, K., Smith, K.A., et al. (2011). Exposure to room light before bedtime delays the LH surge and decreases circulating melatonin. Journal of Clinical Endocrinology & Metabolism, 96(3), E463-E472.' },
  { text:'Ebrahim, I.O., Shapiro, C.M., Williams, A.J., & Fenwick, P.B. (2013). Alcohol and sleep I: Effects on normal sleep. Alcoholism: Clinical and Experimental Research, 37(4), 539-549.' },
  { text:'Onen, S.H., Onen, F., Bailley, D., & Parquet, P. (1994). Prevention and treatment of sleep disorders through regulation of sleeping habits. Presse Médicale, 23(10), 485-489.' },
  { text:'Stepanski, E.J., & Wyatt, J.K. (2003). Use of sleep hygiene in the treatment of insomnia. Sleep Medicine Reviews, 7(3), 215-225.' },
]

const SleepStepCard = ({step, accent, bg}) => (
  <div style={{
    background:bg,
    borderRadius:14,
    padding:'14px 16px',
    marginBottom:10,
    border:`1px solid ${accent}26`,
    display:'flex',
    gap:14,
    alignItems:'flex-start',
  }}>
    <div style={{
      fontSize:22,
      width:40,
      height:40,
      minWidth:40,
      borderRadius:10,
      background:WHITE,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
    }}>{step.icon}</div>
    <div style={{flex:1}}>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:16,color:NAVY,marginBottom:3}}>
        {step.title}
      </div>
      <div style={{...T.small,fontSize:13.5,lineHeight:1.5}}>
        {step.nugget}
        <sup style={{color:accent,fontWeight:700,marginLeft:3}}>[{step.ref}]</sup>
      </div>
    </div>
  </div>
)

const TimelineStrip = () => (
  <div style={{marginBottom:22}}>
    <div style={{
      height:10,
      borderRadius:6,
      background:`linear-gradient(90deg, ${CREAM} 0%, ${ORANGE} 35%, ${ORANGE} 65%, ${NAVY} 100%)`,
      marginBottom:6,
    }} />
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <span style={{...T.tiny,fontSize:12,color:ORANGE,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Day</span>
      <span style={{...T.tiny,fontSize:12,color:NAVY,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Night</span>
    </div>
  </div>
)

export function SleepHygieneGuidePage({ onBack }) {
  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Learn" />
      <div style={{...T.super,marginBottom:4}}>How To</div>
      <div style={{...T.h2,fontSize:30,marginBottom:6}}>Better Sleep, Step by Step</div>
      <div style={{...T.body,fontSize:15,marginBottom:18,color:'#4a5568'}}>
        Eight evidence-backed habits, organised around your body clock — what to do during the day, and what to do as bedtime approaches.
      </div>

      <TimelineStrip />

      <div style={{...T.groupLabel,color:ORANGE,marginBottom:10}}>☀ During the Day</div>
      {SLEEP_STEPS.day.map((step,i) => (
        <SleepStepCard key={i} step={step} accent={ORANGE} bg={`${ORANGE}0D`} />
      ))}

      <div style={{...T.groupLabel,color:NAVY,marginTop:18,marginBottom:10}}>☾ As Bedtime Approaches</div>
      {SLEEP_STEPS.night.map((step,i) => (
        <SleepStepCard key={i} step={step} accent={NAVY} bg={`${NAVY}0D`} />
      ))}

      <Card style={{padding:18,marginTop:18}}>
        <div style={{...T.h3,fontSize:18,marginBottom:10}}>References</div>
        <ol style={{margin:0,paddingLeft:20}}>
          {SLEEP_REFERENCES.map((ref,i) => (
            <li key={i} style={{...T.small,fontSize:13,marginBottom:8}}>{ref.text}</li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

// ── HUB: list of how-to guide + science topics ───────────
export function LearnHub({ onOpenGuide, onOpenSleepHygiene, onOpenStepsGuide, onOpenHydrationGuide, onOpenTopic, onBack }) {
  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Settings" />
      <div style={{...T.super,marginBottom:4}}>Resources</div>
      <div style={{...T.h2,fontSize:30,marginBottom:18}}>Learn</div>

      <Card style={{padding:18,cursor:'pointer'}} onClick={onOpenGuide}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:28}}>📘</span>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:NAVY}}>How to Use Evolve:Wellbeing</div>
            <div style={{...T.small,fontSize:14}}>A quick guide to logging, check-ins, and progress</div>
          </div>
        </div>
      </Card>

      <div style={{...T.super,marginTop:20,marginBottom:10,fontSize:13}}>Habit Guides</div>

      <Card style={{padding:18,cursor:'pointer'}} onClick={onOpenSleepHygiene}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:28}}>😴</span>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:NAVY}}>Better Sleep, Step by Step</div>
            <div style={{...T.small,fontSize:14}}>Eight evidence-backed habits for better sleep</div>
          </div>
        </div>
      </Card>

      <Card style={{padding:18,cursor:'pointer'}} onClick={onOpenStepsGuide}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:28}}>👟</span>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:NAVY}}>Build Your Steps, Step by Step</div>
            <div style={{...T.small,fontSize:14}}>Make movement the default, not the exception</div>
          </div>
        </div>
      </Card>

      <Card style={{padding:18,cursor:'pointer'}} onClick={onOpenHydrationGuide}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:28}}>💧</span>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:NAVY}}>Stay Hydrated, All Day</div>
            <div style={{...T.small,fontSize:14}}>Spread your intake so you never have to catch up</div>
          </div>
        </div>
      </Card>

      <div style={{...T.super,marginTop:24,marginBottom:10,fontSize:13}}>The Science Behind Your Targets</div>
      {SCIENCE_TOPICS.map(topic => (
        <Card key={topic.id} style={{padding:16,cursor:'pointer'}} onClick={()=>onOpenTopic(topic.id)}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:24}}>{topic.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:16,color:NAVY}}>{topic.title}</div>
              <div style={{...T.small,fontSize:13,marginTop:2}}>{topic.summary}</div>
            </div>
            {topic.status==='placeholder' && (
              <div style={{...T.tiny,fontSize:11,background:CREAM,borderRadius:6,padding:'3px 8px',whiteSpace:'nowrap'}}>Coming soon</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── HOW-TO GUIDE PAGE ─────────────────────────────────────
export function HowToGuidePage({ onBack }) {
  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Learn" />
      <div style={{...T.super,marginBottom:4}}>Guide</div>
      <div style={{...T.h2,fontSize:30,marginBottom:14}}>{HOW_TO_GUIDE.title}</div>
      <div style={{...T.body,marginBottom:20}}>{HOW_TO_GUIDE.intro}</div>

      {HOW_TO_GUIDE.sections.map((s,i) => (
        <Card key={i} style={{padding:18}}>
          <div style={{...T.h3,fontSize:18,marginBottom:8}}>{s.heading}</div>
          <div style={{...T.body,fontSize:16}}>{s.body}</div>
        </Card>
      ))}
    </div>
  )
}

// ── SCIENCE TOPIC DETAIL PAGE ─────────────────────────────
export function ScienceTopicPage({ topicId, clientTargets, onBack }) {
  const topic = SCIENCE_TOPICS.find(t => t.id === topicId)
  if (!topic) return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Learn" />
      <div style={{...T.body}}>Topic not found.</div>
    </div>
  )

  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Learn" />
      <div style={{...T.super,marginBottom:4}}>The Science Behind</div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
        <span style={{fontSize:36}}>{topic.icon}</span>
        <div style={{...T.h2,fontSize:30}}>{topic.title}</div>
      </div>
      <div style={{...T.small,marginBottom:18}}>Your current target: <strong style={{color:NAVY}}>{topic.target(clientTargets)}</strong></div>

      {topic.status==='placeholder' && (
        <Card style={{padding:14,background:`${AMBER}10`,border:`1px solid ${AMBER}33`}}>
          <div style={{...T.small,fontSize:14,color:'#4a5568'}}>This page is still being researched and written — content below is a placeholder.</div>
        </Card>
      )}

      {topic.sections.map((s,i) => (
        <Card key={i} style={{padding:18}}>
          <div style={{...T.h3,fontSize:18,marginBottom:8}}>{s.heading}</div>
          <div style={{...T.body,fontSize:16}}>{s.body}</div>
        </Card>
      ))}

      {topic.references.length > 0 && (
        <Card style={{padding:18}}>
          <div style={{...T.h3,fontSize:18,marginBottom:10}}>References</div>
          <ol style={{margin:0,paddingLeft:20}}>
            {topic.references.map((ref,i) => (
              <li key={i} style={{...T.small,fontSize:14,marginBottom:8}}>
                {ref.url
                  ? <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{color:ORANGE}}>{ref.text}</a>
                  : ref.text}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}

// ── STEPS GUIDE ───────────────────────────────────────────

const STEPS_STRUCTURAL = [
  { icon:'🚗', title:'Park further away by default', nugget:'Structural changes remove the decision entirely — you accumulate steps without thinking about it.' },
  { icon:'🚶', title:'Walk to local shops instead of driving', nugget:'Replacing short car journeys with walking is one of the most reliable ways to add steps consistently.' },
  { icon:'📞', title:'Take calls on foot', nugget:'Walking during phone calls is one of the easiest ways to add 1,000–2,000 steps without carving out extra time.' },
  { icon:'🪜', title:'Take the stairs, always', nugget:'Default to stairs rather than deciding each time — one environmental rule beats daily willpower.' },
]

const STEPS_DAILY = [
  { icon:'📊', title:'Know your baseline before chasing a target', nugget:'Check your 7-day average first. Adding 1,000–2,000 steps at a time is more sustainable than jumping straight to 8,000.' },
  { icon:'🌅', title:'Front-load your steps', nugget:'Step counts drop sharply after 6pm for most people. A morning or lunchtime walk locks in progress early.' },
  { icon:'📱', title:'Track it, even roughly', nugget:'Self-monitoring is one of the most consistently evidenced behaviour change techniques. Your phone\'s built-in health app is enough.' },
  { icon:'🤝', title:'Walk with someone when you can', nugget:'Social walking increases both frequency and enjoyment — and builds accountability without the formality of a gym.' },
  { icon:'📅', title:'Don\'t write off low-step days', nugget:'Hitting 8,000 steps even 1–2 days per week is associated with meaningfully lower mortality risk. Frequency across the week matters more than daily perfection.' },
]

const STEPS_REFS = [
  { text:'Paluch, A.E., Bajpai, S., Bassett, D.R., et al. (2021). Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. The Lancet Public Health, 7(3), e219-e228.' },
  { text:'Banach, M., Lewek, J., Surma, S., et al. (2023). The association between daily step count and all-cause and cardiovascular mortality: a meta-analysis. European Journal of Preventive Cardiology, 30(18), 1975-1985.' },
  { text:'Inoue, M., Iso, H., Yamamoto, S., et al. (2008). Daily total physical activity level and premature death in men and women: results from a large-scale population-based cohort study in Japan (JPHC Study). Annals of Epidemiology, 18(7), 522-530.' },
  { text:'Dempsey, P.C., Rowlands, A.V., Strain, T., et al. (2022). Do the associations of daily steps with mortality and incident cardiovascular disease differ by sedentary time levels? A device-based cohort study. British Journal of Sports Medicine, 57(10), 621-629.' },
  { text:'Ahmadi, M.N., Clare, P.J., Katzmarzyk, P.T., et al. (2023). Vigorous physical activity, incident heart disease, and cancer: how little is enough? European Heart Journal, 44(23), 2124-2134.' },
]

const StepsTipCard = ({item, accent, bg}) => (
  <div style={{
    background:bg,
    borderRadius:14,
    padding:'14px 16px',
    marginBottom:10,
    border:`1px solid ${accent}26`,
    display:'flex',
    gap:14,
    alignItems:'flex-start',
  }}>
    <div style={{
      fontSize:22,
      width:40,
      height:40,
      minWidth:40,
      borderRadius:10,
      background:WHITE,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
    }}>{item.icon}</div>
    <div style={{flex:1}}>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:16,color:NAVY,marginBottom:3}}>{item.title}</div>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:400,fontSize:13.5,color:'#718096',lineHeight:1.5}}>{item.nugget}</div>
    </div>
  </div>
)

export function StepsGuidePage({ onBack }) {
  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Learn" />
      <div style={{...T.super,marginBottom:4}}>How To</div>
      <div style={{...T.h2,fontSize:30,marginBottom:6}}>Build Your Steps, Step by Step</div>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:400,fontSize:15,marginBottom:18,color:'#4a5568',lineHeight:1.6}}>
        The most effective approach to hitting 8,000 steps isn't a dedicated walk — it's making movement the default. Two types of change: set it up once, then do it daily.
      </div>

      {/* Divider bar */}
      <div style={{height:6,borderRadius:4,background:`linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE} 50%, ${NAVY} 100%)`,marginBottom:6}} />
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:ORANGE,textTransform:'uppercase',letterSpacing:'0.06em'}}>Set it up once</span>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:NAVY,textTransform:'uppercase',letterSpacing:'0.06em'}}>Do it daily</span>
      </div>

      <div style={{...T.groupLabel,color:ORANGE,marginBottom:10}}>🔧 Structural Changes</div>
      <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:'#718096',marginBottom:12,lineHeight:1.5}}>Set these up once. They work in the background without you having to think about them.</div>
      {STEPS_STRUCTURAL.map((item,i) => (
        <StepsTipCard key={i} item={item} accent={ORANGE} bg={`${ORANGE}0D`} />
      ))}

      <div style={{...T.groupLabel,color:NAVY,marginTop:20,marginBottom:10}}>📋 Daily Habits</div>
      <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:'#718096',marginBottom:12,lineHeight:1.5}}>These are the active choices that compound over time.</div>
      {STEPS_DAILY.map((item,i) => (
        <StepsTipCard key={i} item={item} accent={NAVY} bg={`${NAVY}0D`} />
      ))}

      <Card style={{padding:18,marginTop:18}}>
        <div style={{...T.h3,fontSize:18,marginBottom:10}}>References</div>
        <ol style={{margin:0,paddingLeft:20}}>
          {STEPS_REFS.map((ref,i) => (
            <li key={i} style={{fontFamily:"'Barlow',sans-serif",fontWeight:400,fontSize:13,color:'#718096',marginBottom:8,lineHeight:1.5}}>{ref.text}</li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

// ── HYDRATION GUIDE ───────────────────────────────────────

const HYDRATION_MORNING = [
  { icon:'💧', title:'Start with water before anything else', nugget:'Before coffee, before breakfast. The cue (waking up) already exists — attach drinking to it.' },
  { icon:'🫙', title:'Fill your bottle before you sit down', nugget:'Keeping water visible is one of the simplest environment changes you can make. Access drives consumption.' },
]

const HYDRATION_DAY = [
  { icon:'🍽️', title:'Drink a glass before each meal', nugget:'Habit stacking — attaching a new behaviour to an existing one — is one of the most effective tools for building consistency.' },
  { icon:'🍵', title:'Count all fluids, not just water', nugget:'Tea, coffee, milk, and water-rich foods all contribute. EFSA\'s target is total fluid intake across all sources, not plain water alone.' },
  { icon:'🏃', title:'Drink before exercise, not during', nugget:'Even mild dehydration before physical activity impairs performance and increases perceived effort. Don\'t wait until you\'re thirsty.' },
  { icon:'🌡️', title:'Increase intake in heat or illness', nugget:'Hot weather, fever, vomiting, and diarrhoea all increase fluid loss significantly. Your baseline target isn\'t enough on these days.' },
]

const HYDRATION_EVENING = [
  { icon:'🍷', title:'Match every alcoholic drink with water', nugget:'Alcohol is a diuretic — it increases fluid loss. One glass of water per alcoholic drink is a practical minimum.' },
  { icon:'🟡', title:'Check your urine colour before bed', nugget:'Pale yellow means you\'re on track. Dark yellow or amber means you finished the day behind — adjust tomorrow morning.' },
]

const HYDRATION_REFS = [
  { text:'EFSA Panel on Dietetic Products, Nutrition, and Allergies (NDA). (2010). Scientific Opinion on Dietary Reference Values for water. EFSA Journal, 8(3), 1459.' },
  { text:'Muñoz-Garach, A., García-Fontana, B., & Muñoz-Torres, M. (2023). Water intake, hydration status and 2-year changes in cognitive performance: a prospective cohort study. BMC Medicine, 21(1), 101.' },
  { text:'Masento, N.A., Golightly, M., Field, D.T., Butler, L.T., & van Reekum, C.M. (2014). Effects of hydration status on cognitive performance and mood. British Journal of Nutrition, 111(10), 1841-1852.' },
  { text:'Cheuvront, S.N., & Kenefick, R.W. (2014). Dehydration: physiology, assessment, and performance effects. Comprehensive Physiology, 4(1), 257-285.' },
]

const HydrationCard = ({item, accent, bg}) => (
  <div style={{
    background:bg,
    borderRadius:14,
    padding:'14px 16px',
    marginBottom:10,
    border:`1px solid ${accent}26`,
    display:'flex',
    gap:14,
    alignItems:'flex-start',
  }}>
    <div style={{
      fontSize:22,
      width:40,
      height:40,
      minWidth:40,
      borderRadius:10,
      background:WHITE,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
    }}>{item.icon}</div>
    <div style={{flex:1}}>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:16,color:NAVY,marginBottom:3}}>{item.title}</div>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:400,fontSize:13.5,color:'#718096',lineHeight:1.5}}>{item.nugget}</div>
    </div>
  </div>
)

const HydrationTimeline = () => (
  <div style={{marginBottom:22}}>
    <div style={{
      height:10,
      borderRadius:6,
      background:`linear-gradient(90deg, ${CREAM} 0%, ${ORANGE} 30%, ${ORANGE} 65%, ${NAVY} 85%, ${NAVY} 100%)`,
      marginBottom:6,
    }} />
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:ORANGE,textTransform:'uppercase',letterSpacing:'0.06em'}}>Morning</span>
      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:ORANGE,textTransform:'uppercase',letterSpacing:'0.06em'}}>During the Day</span>
      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:NAVY,textTransform:'uppercase',letterSpacing:'0.06em'}}>Evening</span>
    </div>
  </div>
)

export function HydrationGuidePage({ onBack }) {
  return (
    <div style={{flex:1,maxWidth:600,width:'100%',margin:'0 auto',padding:'22px 16px 110px'}}>
      <BackButton onClick={onBack} label="← Learn" />
      <div style={{...T.super,marginBottom:4}}>How To</div>
      <div style={{...T.h2,fontSize:30,marginBottom:6}}>Stay Hydrated, All Day</div>
      <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:400,fontSize:15,marginBottom:18,color:'#4a5568',lineHeight:1.6}}>
        Thirst is a lagging signal — by the time you feel it, you're already mildly dehydrated. These habits spread your intake across the day so you never have to catch up.
      </div>

      <HydrationTimeline />

      <div style={{...T.groupLabel,color:ORANGE,marginBottom:10}}>🌅 Morning</div>
      {HYDRATION_MORNING.map((item,i) => (
        <HydrationCard key={i} item={item} accent={ORANGE} bg={`${ORANGE}0D`} />
      ))}

      <div style={{...T.groupLabel,color:ORANGE,marginTop:20,marginBottom:10}}>☀️ During the Day</div>
      {HYDRATION_DAY.map((item,i) => (
        <HydrationCard key={i} item={item} accent={ORANGE} bg={`${ORANGE}0D`} />
      ))}

      <div style={{...T.groupLabel,color:NAVY,marginTop:20,marginBottom:10}}>🌙 Evening</div>
      {HYDRATION_EVENING.map((item,i) => (
        <HydrationCard key={i} item={item} accent={NAVY} bg={`${NAVY}0D`} />
      ))}

      <Card style={{padding:18,marginTop:18}}>
        <div style={{...T.h3,fontSize:18,marginBottom:10}}>References</div>
        <ol style={{margin:0,paddingLeft:20}}>
          {HYDRATION_REFS.map((ref,i) => (
            <li key={i} style={{fontFamily:"'Barlow',sans-serif",fontWeight:400,fontSize:13,color:'#718096',marginBottom:8,lineHeight:1.5}}>{ref.text}</li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
