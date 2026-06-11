// ── LEARN SCREEN ──────────────────────────────────────────
// Renders the Learn hub (how-to guide + science topic list),
// the how-to guide itself, and individual science topic pages.

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

// ── HUB: list of how-to guide + science topics ───────────
export function LearnHub({ onOpenGuide, onOpenTopic, onBack }) {
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
