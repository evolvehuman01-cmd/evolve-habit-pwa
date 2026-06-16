import { useState } from 'react'

// ── CONFIG ────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbHL4bMGU6dinpBM5wKXU1BnmvcTGfCbfBV6v06yXMEmY9ysB2jPUDFTWwu14dRrPR/exec'
const HOME_URL = 'https://www.evolvehuman.co.uk'

// ── BRAND ─────────────────────────────────────────────────
const C = {
  orange: '#F26419',
  navy:   '#1C2B3A',
  deep:   '#232F3E',
  white:  '#FFFFFF',
  green:  '#4caf50',
  red:    '#ef5350',
  amber:  '#ffb300',
}

const PRIDE = ['#E03131', '#F26419', '#F5C800', '#2E7D32', '#1565C0', '#6A1B9A']
function PrideBand({ height = 7 }) {
  return (
    <div style={{ display: 'flex', width: '100%', height }}>
      {PRIDE.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
    </div>
  )
}

const T = {
  super: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.orange },
  h1:    { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 52, lineHeight: 1.0, letterSpacing: '0.01em', textTransform: 'uppercase', color: C.white },
  h2:    { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 36, lineHeight: 1.05, letterSpacing: '0.01em', textTransform: 'uppercase', color: C.white },
  body:  { fontFamily: "'Barlow', sans-serif", fontWeight: 400, fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' },
  label: { fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  small: { fontFamily: "'Barlow', sans-serif", fontWeight: 400, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 },
}

// ── HABIT HIERARCHY ───────────────────────────────────────
const HABIT_HIERARCHY = [
  { id: 'sleep',       label: 'Sleep Routine'  },
  { id: 'steps',       label: 'Daily Steps'    },
  { id: 'hydration',   label: 'Hydration'      },
  { id: 'meals',       label: 'Meal Structure' },
  { id: 'mindfulness', label: 'Mindfulness'    },
  { id: 'mobility',    label: 'Mobility'       },
]

const CHALLENGE_MAP = {
  sleep:       'sleep',
  stress:      'mindfulness',
  energy:      'sleep',
  nutrition:   'meals',
  activity:    'steps',
  recovery:    'mobility',
  mindfulness: 'mindfulness',
  hydration:   'hydration',
}

// ── TARGET GENERATION ─────────────────────────────────────
function generateTargets(answers) {
  const targets = {}
  const isFemale   = answers.sex === 'female' || answers.sex === 'prefer_not'
  const isAthlete  = ['recreational', 'competitive', 'elite'].includes(answers.athleteLevel)
  const isPeri     = answers.populationGroup === 'peri_menopause'
  const isCompElite = ['competitive', 'elite'].includes(answers.athleteLevel)
  const challenges = answers.topChallenges || []

  // Build ordered suggested habit list
  const challengeHabits     = [...new Set(challenges.map(c => CHALLENGE_MAP[c]).filter(Boolean))]
  const remaining            = HABIT_HIERARCHY.filter(h => !challengeHabits.includes(h.id)).map(h => h.id)
  const suggested            = [...challengeHabits, ...remaining].slice(0, 5)
  targets.suggestedHabits    = suggested // array of habit ids in priority order

  // ── SLEEP
  targets.sleep = {
    value:  isCompElite ? 9 : 8,
    label:  'Sleep Duration',
    target: isCompElite ? '8–10 hours/night' : '7–9 hours/night',
    notes:  (isCompElite
      ? 'Competitive/elite athletes benefit from 8–10 hours to support recovery and performance (Vitale et al., 2019, Int J Sports Med).'
      : 'Adults aged 25–55 require 7–9 hours per night (Hirshkowitz et al., 2015, Sleep Health).') +
      (isPeri ? ' Hormonal fluctuations in peri/menopause commonly disrupt sleep — prioritise consistent schedule and cool sleep environment (Mong & Cusmano, 2016).' : ''),
  }

  // ── STEPS
  const sedentary = answers.currentActivityLevel === 'sedentary'
  targets.steps = {
    value:  sedentary ? 5000 : 9000,
    label:  'Daily Steps',
    target: sedentary ? 'Progressive: current baseline + 1,000 steps/week (initial target 5,000)' : '8,000–10,000 steps/day',
    notes:  sedentary
      ? 'Gradual increases of ~1,000 steps/week maximise adherence for sedentary individuals (Tudor-Locke & Bassett, 2004, Sports Med).'
      : '8,000–10,000 steps/day associated with significantly reduced all-cause mortality (Saint-Maurice et al., 2020, JAMA Intern Med).' +
        (isAthlete ? ' For athletes, daily steps supplement structured training rather than replace it.' : ''),
  }

  // ── HYDRATION
  let hydVal = isFemale ? 2.3 : 3
  if (isAthlete) hydVal += 0.5
  hydVal = Math.round(hydVal * 4) / 4
  targets.hydration = {
    value:  hydVal,
    label:  'Hydration',
    target: isFemale ? '2.0–2.7L/day' : '2.5–3.5L/day',
    notes:  `EFSA (2010) recommends ${isFemale ? '~2.0L/day for women' : '~2.5L/day for men'} from all sources.${isAthlete ? ' Add 500–750ml per hour of moderate training (Thomas et al., 2016).' : ''}`,
  }

  // ── MEALS
  const irregularEating = ['grab_and_go', 'irregular_times'].includes(answers.nutritionPattern)
  targets.meals = {
    value:  3,
    label:  'Meal Structure',
    target: '3 structured meals/day',
    notes:  '3 structured meals/day is a widely-used baseline for meal regularity coaching (Leech et al., 2015, Appetite).' +
      (irregularEating ? ' Given current irregular patterns, focus is on consistency of 3 meals before considering structure changes.' : ''),
  }

  // ── MINDFULNESS
  const highStress = Number(answers.stressLevel) >= 7
  targets.mindfulness = {
    value:  highStress ? 15 : 10,
    label:  'Mindfulness',
    target: `${highStress ? 15 : 10} min/day`,
    notes:  'Mindfulness practice shows measurable stress-reduction effects (Khoury et al., 2015, Clin Psychol Rev).' +
      (highStress ? ' Given elevated baseline stress, a higher starting target of 15 minutes/day is recommended.' : ''),
  }

  // ── MOBILITY
  targets.mobility = {
    value:  10,
    label:  'Mobility',
    target: '10–15 min daily; full ROM sessions 2–3x/week',
    notes:  'WHO (2020) recommends flexibility/muscle-strengthening ≥2 days/week. Daily short mobility sessions reduce injury risk (Behm et al., 2016).',
  }

  // ── STRESS (lower = better)
  targets.stress = {
    value:  Math.min(5, Number(answers.stressLevel) || 5),
    label:  'Stress RPE',
    target: 'Daily average ≤5/10; flag if ≥7 for 3+ consecutive days',
    notes:  'Sustained stress ≥7/10 over 3+ days associated with HPA axis dysregulation (McEwen, 2007, Physiol Rev).',
  }

  // ── MOOD
  targets.mood = {
    value:  6,
    label:  'Mood',
    target: 'Weekly average ≥6/10',
    notes:  'Weekly mood averages more clinically meaningful than single-day scores (Faurholt-Jepsen et al., 2016).',
  }

  // ── ENERGY
  targets.energy = {
    value:  6,
    label:  'Energy',
    target: 'Midday energy ≥6/10; afternoon dip ≤2 points below midday',
    notes:  'Steep afternoon energy crash (>3 points) may indicate sleep debt, glycaemic instability, or overtraining (Roenneberg et al., 2012).',
  }

  // ── DIGESTION
  targets.digestion = {
    value:  7,
    label:  'Digestion',
    target: 'Daily average ≥7/10',
    notes:  'Digestion score of 7/10 baseline represents "generally comfortable, occasional mild symptoms" — used as the green threshold for habit-tracking purposes.',
  }

  // ── CYCLE (display only)
  if (answers.trackCycle === 'yes' || isPeri) {
    targets.cycleTracking = {
      label:  'Menstrual Cycle',
      target: 'Log cycle day, flow, energy, mood and symptoms daily',
      notes:  'Enables identification of luteal-phase energy dips and perimenstrual mood changes (McNulty et al., 2020; Prior, 2020).',
    }
  }

  return targets
}

// Metric keys that map to habit ids (for ordered display)
const HABIT_TO_METRIC = {
  sleep:       'sleep',
  steps:       'steps',
  hydration:   'hydration',
  meals:       'meals',
  mindfulness: 'mindfulness',
  mobility:    'mobility',
}

// All trackable metric keys (excluding meta fields)
const ALL_METRIC_KEYS = ['sleep', 'steps', 'hydration', 'meals', 'mindfulness', 'mobility', 'stress', 'mood', 'energy', 'digestion', 'cycleTracking']

// ── FORM SECTIONS ─────────────────────────────────────────
const SECTIONS = [
  {
    id: 'personal',
    super: 'Evolve:Wellbeing · Consultation',
    title: 'About You',
    subtitle: 'Help us understand your background so we can build the right programme for you.',
    fields: [
      { id: 'firstName',  label: 'First Name',                              type: 'text',   required: true },
      { id: 'lastName',   label: 'Last Name',                               type: 'text',   required: true },
      { id: 'email',      label: 'Email Address',                           type: 'email',  required: true },
      { id: 'phone',      label: 'Phone Number',                            type: 'text',   required: true },
      { id: 'age',        label: 'Age',                                     type: 'number', min: 18, max: 75, required: true },
      { id: 'sex', label: 'Biological Sex (used for physiological targets only)', type: 'select', required: true,
        options: [
          { value: '',           label: 'Select...' },
          { value: 'male',       label: 'Male' },
          { value: 'female',     label: 'Female' },
          { value: 'prefer_not', label: 'Prefer not to say' },
        ],
      },
      {
        id: 'populationGroup',
        label: 'Do any of the following apply to you? (tap to select)',
        type: 'select',
        required: false,
        note: 'This helps us apply appropriate evidence-based targets to your programme.',
        options: [
          { value: 'none',         label: 'None of the below' },
          { value: 'peri_menopause', label: 'Perimenopause' },
          { value: 'menopause',    label: 'Post-menopause' },
        ],
      },
      { id: 'athleteLevel', label: 'How would you describe your training level?', type: 'select', required: true,
        options: [
          { value: 'none',         label: 'Non-athlete / general active adult' },
          { value: 'recreational', label: 'Recreational athlete (5–8 hrs training/week)' },
          { value: 'competitive',  label: 'Competitive athlete (8–12 hrs/week + competition)' },
          { value: 'elite',        label: 'Elite athlete (12+ hrs/week, performance-dependent)' },
        ],
      },
      { id: 'trackCycle', label: 'Would you like to include menstrual cycle tracking?', type: 'select', required: false,
        conditional: (a) => a.sex === 'female' || a.sex === 'prefer_not',
        options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }],
      },
    ],
  },
  {
    id: 'health',
    super: 'Evolve:Wellbeing · Consultation',
    title: 'Health & Medical',
    subtitle: 'This section is confidential and used only to ensure your programme is appropriate for you.',
    fields: [
      {
        id: 'medicalConditions',
        label: 'Do you have any current or recent medical conditions we should be aware of?',
        type: 'textarea_with_none',
        placeholder: 'e.g. hypertension, thyroid condition, anxiety disorder, injury history...',
        required: true,
      },
      {
        id: 'medications',
        label: 'Are you currently taking any medications that may affect energy, sleep, or exercise?',
        type: 'textarea_with_none',
        placeholder: 'e.g. HRT, beta-blockers, antidepressants, sleep medication...',
        required: true,
      },
      { id: 'gpClearance', label: 'Have you received GP/physician clearance for lifestyle coaching and exercise?', type: 'select', required: true,
        options: [
          { value: '',           label: 'Select...' },
          { value: 'yes',        label: 'Yes' },
          { value: 'no',         label: 'No — I understand I should consult my GP if unsure' },
          { value: 'not_needed', label: 'Not required for my situation' },
        ],
      },
    ],
  },
  {
    id: 'lifestyle',
    super: 'Evolve:Wellbeing · Consultation',
    title: 'Current Lifestyle',
    subtitle: 'An honest baseline helps us build the right programme. There are no wrong answers here.',
    fields: [
      { id: 'currentActivityLevel', label: 'How would you describe your current activity level?', type: 'select', required: true,
        options: [
          { value: '',                  label: 'Select...' },
          { value: 'sedentary',         label: 'Sedentary (desk job, minimal movement)' },
          { value: 'lightly_active',    label: 'Lightly active (some walking, occasional exercise)' },
          { value: 'moderately_active', label: 'Moderately active (exercise 2–3x/week)' },
          { value: 'very_active',       label: 'Very active (structured training 4–5x/week)' },
          { value: 'extremely_active',  label: 'Extremely active (daily training or physical job)' },
        ],
      },
      { id: 'avgSleepHours', label: 'On average, how many hours of sleep do you get per night?', type: 'select', required: true,
        options: [
          { value: '',      label: 'Select...' },
          { value: 'less5', label: 'Less than 5 hours' },
          { value: '5to6',  label: '5–6 hours' },
          { value: '6to7',  label: '6–7 hours' },
          { value: '7to8',  label: '7–8 hours' },
          { value: '8plus', label: '8+ hours' },
        ],
      },
      {
        id: 'sleepQuality',
        label: 'How would you rate your sleep quality? (1 = broken, restless; 10 = deep, restorative)',
        type: 'slider', min: 1, max: 10, lowLabel: 'Very poor', highLabel: 'Excellent', required: true,
      },
      {
        id: 'stressLevel',
        label: 'How would you rate your average daily stress level? (1 = calm; 10 = overwhelmed)',
        type: 'slider', min: 1, max: 10, lowLabel: 'Very low', highLabel: 'Extreme', required: true,
      },
      {
        id: 'energyLevel',
        label: 'How would you rate your energy levels at midday? (1 = exhausted by lunchtime; 10 = consistently strong)',
        type: 'slider', min: 1, max: 10, lowLabel: 'Exhausted', highLabel: 'Excellent', required: true,
      },
      {
        id: 'nutritionPattern',
        label: 'How would you describe your current eating pattern?',
        type: 'select_with_detail',
        required: true,
        detailTriggers: ['restricted', 'complex'],
        detailLabel: 'Tell us a little more — this helps us tailor your programme.',
        detailPlaceholder: 'e.g. following a specific protocol, history with food, dietary requirements...',
        options: [
          { value: '',                label: 'Select...' },
          { value: 'regular_balanced', label: 'Regular, balanced meals' },
          { value: 'irregular_times', label: 'Irregular timing but reasonable choices' },
          { value: 'grab_and_go',     label: 'Mostly grab-and-go / convenience food' },
          { value: 'restricted',      label: 'Restrictive or specific dietary protocol' },
          { value: 'complex',         label: 'I have a complex relationship with food' },
        ],
      },
      { id: 'hydrationHabits', label: 'How much water/fluid do you typically drink per day?', type: 'select', required: true,
        options: [
          { value: '',       label: 'Select...' },
          { value: 'less1L', label: 'Less than 1L' },
          { value: '1to2L',  label: '1–2L' },
          { value: '2to3L',  label: '2–3L' },
          { value: '3Lplus', label: '3L+' },
        ],
      },
    ],
  },
  {
    id: 'goals',
    super: 'Evolve:Wellbeing · Consultation',
    title: 'Goals & Challenges',
    subtitle: 'What brought you here, and what does success look like for you?',
    fields: [
      { id: 'primaryGoal', label: 'What is your primary goal for this programme?', type: 'textarea', placeholder: 'e.g. improve sleep quality, manage stress better, build consistent energy...', required: true },
      { id: 'topChallenges', label: 'Which areas feel hardest to maintain right now? Select all that apply.', type: 'multicheck', required: true,
        options: [
          { value: 'sleep',       label: 'Sleep quality or duration' },
          { value: 'stress',      label: 'Stress management' },
          { value: 'energy',      label: 'Consistent energy' },
          { value: 'nutrition',   label: 'Nutrition / meal regularity' },
          { value: 'activity',    label: 'Daily movement / steps' },
          { value: 'recovery',    label: 'Recovery & mobility' },
          { value: 'mindfulness', label: 'Mindfulness / mental space' },
          { value: 'hydration',   label: 'Hydration' },
        ],
      },
      { id: 'pastAttempts', label: "Have you tried to address these areas before? What worked or didn't work?", type: 'textarea', placeholder: "Be as honest as you like — this helps us avoid repeating approaches that haven't served you.", required: false },
      { id: 'motivationDriver', label: 'What is your biggest motivation for making changes now?', type: 'textarea', placeholder: 'e.g. a health event, upcoming challenge, wanting to feel better in daily life...', required: true },
      { id: 'timeAvailable', label: 'Realistically, how much time can you dedicate to wellbeing habits each day?', type: 'select', required: true,
        options: [
          { value: '',        label: 'Select...' },
          { value: 'less15',  label: 'Less than 15 minutes' },
          { value: '15to30',  label: '15–30 minutes' },
          { value: '30to60',  label: '30–60 minutes' },
          { value: '60plus',  label: '60+ minutes' },
        ],
      },
      { id: 'coachingPreference', label: 'How do you prefer to receive coaching support?', type: 'select', required: true,
        options: [
          { value: '',              label: 'Select...' },
          { value: 'email_only',    label: 'Email only' },
          { value: 'video_primary', label: 'Primarily video calls' },
          { value: 'mixed',         label: 'Mix of email and video calls' },
        ],
      },
      { id: 'additionalInfo', label: "Is there anything else you'd like your coach to know before your first session?", type: 'textarea', placeholder: 'No detail is too small...', required: false },
    ],
  },
]

// ── FIELD COMPONENTS ──────────────────────────────────────
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.08)',
  border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 10,
  padding: '14px 16px', color: C.white,
  fontFamily: "'Barlow', sans-serif", fontSize: 16,
  outline: 'none', marginTop: 10, boxSizing: 'border-box',
}

function Slider({ field, value, onChange }) {
  const val = value ?? Math.round((field.min + field.max) / 2)
  const pct = ((val - field.min) / (field.max - field.min)) * 100
  const color = pct >= 60 ? C.green : pct >= 40 ? C.amber : C.red
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ ...T.small, minWidth: 72 }}>{field.lowLabel}</span>
        <div style={{ flex: 1 }}>
          <input type="range" min={field.min} max={field.max} value={val}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
        </div>
        <span style={{ ...T.small, minWidth: 72, textAlign: 'right' }}>{field.highLabel}</span>
        <div style={{ minWidth: 48, textAlign: 'center', background: color, color: C.white, borderRadius: 10, padding: '6px 10px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26 }}>{val}</div>
      </div>
    </div>
  )
}

function MultiCheck({ field, value, onChange }) {
  const selected = value || []
  const toggle = v => selected.includes(v) ? onChange(selected.filter(x => x !== v)) : onChange([...selected, v])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
      {field.options.map(opt => {
        const active = selected.includes(opt.value)
        return (
          <button key={opt.value} type="button" onClick={() => toggle(opt.value)} style={{
            background: active ? C.orange : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${active ? C.orange : 'rgba(255,255,255,0.14)'}`,
            borderRadius: 10, padding: '12px 16px', color: C.white,
            fontFamily: "'Barlow', sans-serif", fontSize: 15,
            fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}>{opt.label}</button>
        )
      })}
    </div>
  )
}

// Textarea with "None" checkbox
function TextareaWithNone({ field, value, onChange }) {
  const isNone = value === '__none__'
  return (
    <div style={{ marginTop: 10 }}>
      <div
        onClick={() => onChange(isNone ? '' : '__none__')}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer', padding: '12px 14px', background: isNone ? 'rgba(242,100,25,0.08)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${isNone ? C.orange : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, transition: 'all 0.15s' }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isNone ? C.orange : 'rgba(255,255,255,0.3)'}`, background: isNone ? C.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
          {isNone && <span style={{ color: C.white, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ ...T.small, color: isNone ? C.orange : 'rgba(255,255,255,0.6)', fontWeight: isNone ? 600 : 400 }}>None</span>
      </div>
      {!isNone && (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          style={{ ...inputStyle, resize: 'vertical', marginTop: 0 }}
        />
      )}
    </div>
  )
}

// Select with conditional detail textarea
function SelectWithDetail({ field, value, detailValue, onChange, onDetailChange }) {
  const showDetail = field.detailTriggers && field.detailTriggers.includes(value)
  return (
    <div style={{ marginTop: 10 }}>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', marginTop: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23F26419' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40 }}
      >
        {field.options.map(o => <option key={o.value} value={o.value} style={{ background: C.navy }}>{o.label}</option>)}
      </select>
      {showDetail && (
        <div style={{ marginTop: 12 }}>
          <label style={{ ...T.small, color: 'rgba(255,255,255,0.6)' }}>{field.detailLabel}</label>
          <textarea
            value={detailValue || ''}
            onChange={e => onDetailChange(e.target.value)}
            rows={3}
            placeholder={field.detailPlaceholder}
            style={{ ...inputStyle, resize: 'vertical', marginTop: 8, fontSize: 15 }}
          />
        </div>
      )}
    </div>
  )
}

function Field({ field, value, detailValue, onChange, onDetailChange, answers }) {
  if (field.conditional && !field.conditional(answers)) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={{ ...T.label, display: 'block' }}>
        {field.label}
        {field.required && <span style={{ color: C.orange, marginLeft: 4 }}>*</span>}
      </label>
      {field.note && <div style={{ ...T.small, marginTop: 5 }}>{field.note}</div>}

      {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
        <input type={field.type} min={field.min} max={field.max} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={inputStyle} />
      )}
      {field.type === 'textarea' && (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} placeholder={field.placeholder} style={{ ...inputStyle, resize: 'vertical' }} />
      )}
      {field.type === 'textarea_with_none' && (
        <TextareaWithNone field={field} value={value} onChange={onChange} />
      )}
      {field.type === 'select' && (
        <div style={{ position: 'relative', marginTop: 10 }}>
          <select value={value || ''} onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle, marginTop: 0, appearance: 'none', cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23F26419' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40 }}>
            {field.options.map(o => <option key={o.value} value={o.value} style={{ background: C.navy }}>{o.label}</option>)}
          </select>
        </div>
      )}
      {field.type === 'select_with_detail' && (
        <SelectWithDetail field={field} value={value} detailValue={detailValue} onChange={onChange} onDetailChange={onDetailChange} />
      )}
      {field.type === 'slider' && <Slider field={field} value={value} onChange={onChange} />}
      {field.type === 'multicheck' && <MultiCheck field={field} value={value} onChange={onChange} />}
    </div>
  )
}

// ── TARGETS PANEL ─────────────────────────────────────────
function TargetsPanel({ targets }) {
  const suggested = targets.suggestedHabits || []

  // Primary: metrics matching suggested habits, in suggested order
  const primaryKeys = suggested
    .map(id => HABIT_TO_METRIC[id])
    .filter(k => k && targets[k])

  // Secondary: all remaining metrics not in primary
  const secondaryKeys = ALL_METRIC_KEYS.filter(k => targets[k] && !primaryKeys.includes(k))

  const MetricRow = ({ metricKey, rank }) => {
    const t = targets[metricKey]
    if (!t) return null
    const isTop3 = rank !== undefined && rank < 3
    return (
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16, marginBottom: 16,
        ...(isTop3 ? { paddingLeft: 14, borderLeft: `3px solid ${C.orange}` } : {}),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          {isTop3 && (
            <div style={{ background: C.orange, color: C.white, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{rank + 1}</div>
          )}
          <div style={{ ...T.super }}>{t.label}</div>
          {isTop3 && <div style={{ ...T.small, fontSize: 11, color: C.orange, marginLeft: 'auto' }}>Priority focus</div>}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: isTop3 ? C.white : C.orange, marginBottom: 8 }}>{t.target}</div>
        {t.notes && (
          <div style={{ ...T.small, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.38)', fontStyle: 'italic' }}>{t.notes}</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 28 }}>

      {/* Suggested habits — top 3 highlighted */}
      <div style={{ background: 'rgba(242,100,25,0.08)', border: `1.5px solid ${C.orange}`, borderRadius: 16, padding: 28, marginBottom: 16 }}>
        <div style={{ ...T.super, marginBottom: 10 }}>Your 5 Daily Habits</div>
        <div style={{ ...T.h2, fontSize: 28, marginBottom: 12 }}>Built Around Your Answers</div>
        <div style={{ ...T.body, fontSize: 15, marginBottom: 20 }}>
          Your top 3 are your priority focus. The remaining 2 support your overall programme.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {suggested.map((id, i) => {
            const habit = HABIT_HIERARCHY.find(h => h.id === id)
            if (!habit) return null
            const isTop = i < 3
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: isTop ? 'rgba(242,100,25,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isTop ? 'rgba(242,100,25,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '12px 16px',
              }}>
                <div style={{ background: isTop ? C.orange : 'rgba(255,255,255,0.15)', color: C.white, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.04em', color: isTop ? C.white : 'rgba(255,255,255,0.6)' }}>{habit.label}</span>
                {isTop && <span style={{ ...T.small, fontSize: 11, color: C.orange, marginLeft: 'auto', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Priority</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Primary targets — ordered to match suggested habits */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 16 }}>
        <div style={{ ...T.super, marginBottom: 10 }}>Your Starting Targets</div>
        <div style={{ ...T.h2, fontSize: 28, marginBottom: 12 }}>Where We're Aiming</div>
        <div style={{ ...T.body, fontSize: 15, marginBottom: 20 }}>
          Tailored to your profile and backed by peer-reviewed research. Your coach will confirm and fine-tune these before your programme begins.
        </div>
        {primaryKeys.map((key, i) => <MetricRow key={key} metricKey={key} rank={i} />)}
        <div style={{ ...T.small, marginTop: 4, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: `3px solid ${C.orange}` }}>
          All targets will be reviewed and confirmed with your coach. Nothing is set in stone until you've spoken.
        </div>
      </div>

      {/* Secondary / additional tracked metrics */}
      {secondaryKeys.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 }}>
          <div style={{ ...T.super, marginBottom: 10 }}>Additional Tracked Metrics</div>
          <div style={{ ...T.body, fontSize: 15, marginBottom: 20, color: 'rgba(255,255,255,0.55)' }}>
            These metrics are tracked alongside your main programme to give your coach a fuller picture of your wellbeing.
          </div>
          {secondaryKeys.map(key => <MetricRow key={key} metricKey={key} />)}
        </div>
      )}
    </div>
  )
}

// ── CONFIRMATION SCREEN ───────────────────────────────────
function ConfirmationScreen({ clientName }) {
  return (
    <div style={{ minHeight: '100vh', background: C.deep, display: 'flex', flexDirection: 'column' }}>
      <PrideBand height={8} />
      <div style={{ background: C.navy, padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: '0.08em' }}>
          EVOLVE<span style={{ color: C.orange }}>:</span>WELLBEING
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: C.orange, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 28 }}>✓</div>
        <div style={{ ...T.super, marginBottom: 10 }}>Evolve:Wellbeing · Consultation Complete</div>
        <div style={{ ...T.h1, fontSize: 44, marginBottom: 12, maxWidth: 480 }}>
          {clientName ? `You're all set, ${clientName.split(' ')[0]}.` : "You're all set."}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 24, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 28 }}>
          Your coach will be in touch within 24 hours.
        </div>
        <div style={{ ...T.body, maxWidth: 440, marginBottom: 48 }}>
          Your consultation has been received. Once your coach has reviewed and confirmed your targets, you'll be issued your log-in for the Evolve:Human Wellbeing Habit Tracker.
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '24px 32px', marginBottom: 28, maxWidth: 420, width: '100%' }}>
          <div style={{ ...T.super, marginBottom: 16 }}>What happens next</div>
          {[
            'Your coach reviews your targets and tailors your programme',
            "You're issued your Evolve:Human Wellbeing Habit Tracker log-in",
            'Your coach is in touch to book your first session',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, textAlign: 'left' }}>
              <span style={{ background: C.orange, color: C.white, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ ...T.body, fontSize: 16 }}>{step}</span>
            </div>
          ))}
        </div>
        <div style={{ ...T.small, maxWidth: 400, marginBottom: 36, fontSize: 12, textAlign: 'center' }}>
          Your information is kept private and secure. It is used only by your Evolve:Human coach to build your programme — nothing more.
        </div>
        <a href={HOME_URL} style={{ display: 'inline-block', background: C.orange, color: C.white, borderRadius: 12, padding: '16px 36px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
          Return to Evolve:Human →
        </a>
      </div>
      <PrideBand height={8} />
    </div>
  )
}

// ── EMAIL VALIDATION ──────────────────────────────────────
function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim())
}

// ── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [currentSection, setCurrentSection]   = useState(0)
  const [answers, setAnswers]                 = useState({})
  const [detailAnswers, setDetailAnswers]     = useState({}) // for select_with_detail extra fields
  const [targets, setTargets]                 = useState(null)
  const [submitStatus, setSubmitStatus]       = useState('idle')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [gdprConsent, setGdprConsent]         = useState(false)

  const section   = SECTIONS[currentSection]
  const setAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }))
  const setDetail = (id, val) => setDetailAnswers(prev => ({ ...prev, [id]: val }))

  const validateSection = () => {
    for (const f of section.fields) {
      if (f.conditional && !f.conditional(answers)) continue
      if (!f.required) continue
      const val = answers[f.id]
      if (f.type === 'textarea_with_none') {
        if (!val || (val !== '__none__' && val.trim() === '')) return false
      } else if (!val || (Array.isArray(val) && val.length === 0) || val === '') {
        return false
      }
      if (f.type === 'email' && !isValidEmail(val)) return false
    }
    return true
  }

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTargets(generateTargets({ ...answers, ...detailAnswers }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (APPS_SCRIPT_URL === 'YOUR_CONSULTATION_APPS_SCRIPT_URL_HERE') {
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
      return
    }
    setSubmitStatus('sending')
    const payload = {
      submittedAt:      new Date().toISOString(),
      clientName:       `${answers.firstName || ''} ${answers.lastName || ''}`.trim(),
      clientEmail:      answers.email || '',
      clientPhone:      answers.phone || '',
      answers:          { ...answers, ...detailAnswers },
      autoTargets:      targets,
      finalTargets:     targets,
      coachAmendments:  {},
      hasCoachAmendments: false,
    }
    try {
      await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setTimeout(() => { setSubmitStatus('done'); setShowConfirmation(true) }, 1500)
    } catch {
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    }
  }

  if (showConfirmation) return <ConfirmationScreen clientName={`${answers.firstName || ''} ${answers.lastName || ''}`.trim()} />

  return (
    <div style={{ minHeight: '100vh', background: C.deep, fontFamily: "'Barlow', sans-serif", color: C.white, display: 'flex', flexDirection: 'column' }}>
      <PrideBand height={8} />

      <div style={{ background: C.navy, padding: '20px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: '0.08em' }}>
              EVOLVE<span style={{ color: C.orange }}>:</span>WELLBEING
            </div>
            <div style={{ ...T.small, marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11 }}>
              {targets ? 'Your Targets' : 'Initial Consultation'}
            </div>
          </div>
          {!targets && <div style={{ ...T.small, fontSize: 12 }}>{currentSection + 1} of {SECTIONS.length}</div>}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '36px 20px 80px' }}>
        {!targets ? (
          <>
            <div style={{ marginBottom: 36 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ height: '100%', width: `${((currentSection + 1) / SECTIONS.length) * 100}%`, background: C.orange, borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {SECTIONS.map((s, i) => (
                  <div key={s.id} style={{ ...T.small, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: i === currentSection ? C.orange : i < currentSection ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)' }}>
                    {s.title}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ ...T.super, marginBottom: 10 }}>{section.super}</div>
              <div style={{ ...T.h1, marginBottom: 14 }}>{section.title}</div>
              <div style={{ ...T.body }}>{section.subtitle}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '28px 28px 4px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {section.fields.map(f => (
                <Field
                  key={f.id}
                  field={f}
                  value={answers[f.id]}
                  detailValue={detailAnswers[f.id]}
                  onChange={v => setAnswer(f.id, v)}
                  onDetailChange={v => setDetail(f.id + '_detail', v)}
                  answers={answers}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {currentSection > 0 ? (
                <button type="button" onClick={() => { setCurrentSection(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  ← Back
                </button>
              ) : <div style={{ flex: 1 }} />}
              <button type="button" onClick={handleNext}
                style={{ flex: 2, background: validateSection() ? C.orange : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: '16px', color: C.white, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: validateSection() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                {currentSection === SECTIONS.length - 1 ? 'Generate My Targets →' : 'Next →'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...T.super, marginBottom: 10 }}>Evolve:Wellbeing · Consultation Complete</div>
              <div style={{ ...T.h1, marginBottom: 14 }}>Here Are Your Targets</div>
              <div style={{ ...T.body }}>Based on your answers, we've built a starting point tailored to you. Your coach will review everything before your programme begins.</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 24, marginTop: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ ...T.super, marginBottom: 14 }}>Your Details</div>
              {[
                { label: 'Name',         value: `${answers.firstName || ''} ${answers.lastName || ''}`.trim() },
                { label: 'Email',        value: answers.email },
                { label: 'Primary Goal', value: answers.primaryGoal },
              ].filter(r => r.value).map(r => (
                <div key={r.label} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                  <span style={{ ...T.small, minWidth: 90, fontWeight: 600 }}>{r.label}</span>
                  <span style={{ ...T.body, fontSize: 15 }}>{r.value}</span>
                </div>
              ))}
            </div>

            <TargetsPanel targets={targets} />

            <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24 }}>
              <div style={{ ...T.body, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                This is your programme. Let's make it official.
              </div>
              <div style={{ ...T.small, marginBottom: 20 }}>
                Your coach will review everything you've shared and be in touch within 24 hours to confirm your targets and next steps.
              </div>

              <div
                onClick={() => setGdprConsent(v => !v)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22, cursor: 'pointer', padding: '16px', background: gdprConsent ? 'rgba(242,100,25,0.08)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${gdprConsent ? C.orange : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, transition: 'all 0.15s' }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${gdprConsent ? C.orange : 'rgba(255,255,255,0.3)'}`, background: gdprConsent ? C.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
                  {gdprConsent && <span style={{ color: C.white, fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ ...T.small, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
                  I consent to Evolve:Human collecting and processing my personal and health information for the purpose of delivering wellbeing coaching. I understand this information is held securely, used only by my coach, and will not be shared with third parties. Read our <a href="https://habit.evolvehuman.co.uk/privacy-policy" target="_blank" rel="noreferrer" style={{ color: C.orange }}>Privacy Policy</a>.
                </div>
              </div>

              <button type="button" onClick={handleSubmit}
                disabled={!gdprConsent || submitStatus === 'sending' || submitStatus === 'done'}
                style={{ width: '100%', background: !gdprConsent ? 'rgba(255,255,255,0.1)' : submitStatus === 'done' ? C.green : submitStatus === 'error' ? C.red : C.orange, border: 'none', borderRadius: 12, padding: '18px', color: C.white, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: (!gdprConsent || submitStatus === 'sending') ? 'not-allowed' : 'pointer', transition: 'background 0.25s', opacity: !gdprConsent ? 0.5 : 1 }}>
                {submitStatus === 'idle'  && 'Submit My Consultation →'}
                {submitStatus === 'sending' && 'Sending...'}
                {submitStatus === 'done'  && '✓ Done'}
                {submitStatus === 'error' && '⚠ Something went wrong — please try again'}
              </button>

              {!gdprConsent && (
                <div style={{ ...T.small, fontSize: 12, textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.35)' }}>
                  Please confirm your consent above before submitting.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <PrideBand height={8} />
    </div>
  )
}
