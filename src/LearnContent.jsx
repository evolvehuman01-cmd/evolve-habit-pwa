// ── LEARN CONTENT ─────────────────────────────────────────
// Content data for the in-app "Learn" section: the how-to guide
// and the science-backed info pages for each target.
//
// Each science topic follows this shape:
// {
//   id: string            — matches habit/target id (sleep, steps, ...)
//   icon: string
//   title: string
//   target: (targets) => string   — human-readable current target
//   summary: string       — 1-2 sentence overview
//   sections: [{ heading, body }]  — body is plain text, rendered as paragraphs
//   references: [{ text, url? }]  — full citation; url optional
//   status: 'placeholder' | 'reviewed'
// }

export const HOW_TO_GUIDE = {
  title: 'How to Use Evolve:Wellbeing',
  intro: "A quick guide to getting the most out of the app — daily logging, check-ins, and tracking your progress.",
  sections: [
    {
      heading: '1. Daily Logging',
      body: "Each day, open the Log tab and fill in your habits — sleep, steps, hydration, meals, mindfulness, and mobility — along with your stress, mood, and energy ratings. Tap any habit card to fill it with yesterday's value, an auto-filled value (if Google Fit is connected), or your target as a starting point. You can always edit the number directly or tap Clear to start from blank. Once everything is filled in, submit your log for the day.",
    },
    {
      heading: '2. Targets',
      body: "Your targets are shown on each habit card and in Settings. They're either set individually by your coach or use sensible evidence-based defaults if your coach hasn't customised them yet. Targets update automatically — if your coach changes them, you'll see the new numbers next time you open the app.",
    },
    {
      heading: '3. Streaks',
      body: "The app tracks two streaks: Days Logged (you completed a log) and On Target (you hit your habit targets for the day). Both reset if you miss a full day, but your best streak is always saved. Streaks are a motivational tool, not a judgement — a reset is just a fresh start.",
    },
    {
      heading: '4. Check-Ins',
      body: "Every Sunday, you'll be prompted for a short Weekly Check-In — a quick reflection on your week, your wins, and what you're focusing on next. Once a month, you'll get a more detailed Monthly Check-In covering your overall progress and any habit changes you'd like to discuss. Both go straight to your coach, and you'll see a summary of your own answers afterwards.",
    },
    {
      heading: '5. Progress',
      body: "The Progress tab shows your habit completion calendar and rolling charts (7, 14, or 30 days) for sleep, steps, hydration, stress, mood, energy, and more. These are rolling windows — they always show your most recent period and update daily as new logs come in, so you can spot trends over time.",
    },
    {
      heading: '6. Reminders',
      body: "Turn on Daily Reminders in Settings to get a nudge at 8pm each evening to log your habits, plus a reminder for your weekly check-in. You can turn these on or off any time.",
    },
    {
      heading: '7. The Science',
      body: "Curious why your targets are set the way they are? Each target has its own Learn page explaining the evidence behind it, with references you can look into further. Find these under Settings → Learn.",
    },
  ],
}

// Placeholder body used for topics not yet researched in Phase 2.
const PLACEHOLDER_BODY = "This page is being written and will be filled in with evidence-based guidance and references shortly. Check back soon."

const placeholderSections = [
  { heading: 'Why this target?', body: PLACEHOLDER_BODY },
  { heading: 'What the evidence says', body: PLACEHOLDER_BODY },
]

export const SCIENCE_TOPICS = [
  {
    id: 'sleep',
    icon: '🌙',
    title: 'Sleep',
    target: (t) => `${t.sleep}h per night`,
    summary: 'Why 7–7.5 hours is the evidence-backed sweet spot, and what happens to your body without it.',
    sections: [
      {
        heading: 'What sleep actually does',
        body: "During sleep, your brain consolidates memories from the day and clears out metabolic waste that builds up while you're awake. Sleep also plays a key role in regulating blood sugar: even short-term sleep restriction in healthy adults has been shown to reduce insulin sensitivity and impair glucose tolerance — the kind of change that, if sustained, raises long-term diabetes risk. Some research also links short sleep to changes in hunger-regulating hormones and weight gain, though evidence on the exact mechanism is mixed.",
      },
      {
        heading: 'Why 7.5 hours?',
        body: "Large studies tracking millions of people over time consistently find a U-shaped pattern: both too little and too much sleep are linked to higher rates of cardiovascular disease and earlier death, with the lowest risk around 7–7.5 hours. Risk rises faster on the long side — sleeping 9–10 hours regularly is linked to a bigger increase in risk than sleeping 5–6 hours. If you regularly need 9+ hours, it's worth a check-in with your doctor — it can sometimes signal an underlying issue rather than cause one.",
      },
      {
        heading: 'The takeaway',
        body: "Consistency matters as much as the exact number. Aim for 7–7.5 hours, and keep your sleep and wake times steady — even on weekends. Tonight's a good night to start: pick a wake time you can hit every day this week, and work backwards from there.",
      },
    ],
    references: [
      { text: 'Itani, O., Jike, M., Watanabe, N., & Kaneita, Y. (2017). Short sleep duration and health outcomes: a systematic review, meta-analysis, and meta-regression. Sleep Medicine, 32, 246-256.' },
      { text: 'Jike, M., Itani, O., Watanabe, N., Buysse, D.J., & Kaneita, Y. (2018). Long sleep duration and health outcomes: A systematic review, meta-analysis and meta-regression. Sleep Medicine Reviews, 39, 25-36.' },
      { text: 'Cappuccio, F.P., D\'Elia, L., Strazzullo, P., & Miller, M.A. (2010). Sleep duration and all-cause mortality: a systematic review and meta-analysis of prospective studies. Sleep, 33(5), 585-592.' },
      { text: 'Spiegel, K., Leproult, R., & Van Cauter, E. (1999). Impact of sleep debt on metabolic and endocrine function. The Lancet, 354(9188), 1435-1439.' },
    ],
    status: 'reviewed',
  },
  {
    id: 'steps',
    icon: '👟',
    title: 'Daily Steps',
    target: (t) => `${Number(t.steps).toLocaleString()} steps per day`,
    summary: 'What the research says about step counts and health outcomes.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'hydration',
    icon: '💧',
    title: 'Hydration',
    target: (t) => `${t.hydration}L per day`,
    summary: 'Daily fluid intake guidelines and why hydration matters.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'meals',
    icon: '🥗',
    title: 'Meal Structure',
    target: (t) => `${t.meals} structured meals per day`,
    summary: 'The role of regular meal timing and structure in habit formation and metabolic health.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'mindfulness',
    icon: '🧠',
    title: 'Mindfulness',
    target: (t) => `${t.mindfulness} minutes per day`,
    summary: 'Evidence for mindfulness and breathwork practices on stress and wellbeing.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'mobility',
    icon: '🧘',
    title: 'Mobility',
    target: (t) => `${t.mobility} minutes per day`,
    summary: 'Why regular mobility work supports movement quality and injury prevention.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'stress',
    icon: '😣',
    title: 'Stress',
    target: (t) => `Target ≤${t.stress}/10`,
    summary: 'Understanding self-reported stress scores and their relationship to wellbeing.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'mood',
    icon: '🙂',
    title: 'Mood',
    target: (t) => `Target ≥${t.mood}/10`,
    summary: 'Why tracking mood matters and how it connects to other habits.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
  {
    id: 'energy',
    icon: '⚡',
    title: 'Energy',
    target: (t) => `Target ≥${t.energy}/10`,
    summary: 'What drives day-to-day energy levels and how to track meaningful change.',
    sections: placeholderSections,
    references: [],
    status: 'placeholder',
  },
]
