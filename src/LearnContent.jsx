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
    summary: 'Why 8,000 steps — not 10,000 — is the evidence-backed target, and where the 10,000 figure actually came from.',
    sections: [
      {
        heading: 'Where 10,000 steps came from',
        body: "The 10,000 steps target isn't from science — it came from a 1960s Japanese pedometer marketing campaign. The device was called the Manpo-kei, which literally means '10,000 step meter.' The number was chosen because it was memorable and the Japanese character for 10,000 resembles a person walking — not because a study identified it as optimal. It has been embedded in fitness culture ever since.",
      },
      {
        heading: 'What the evidence actually says',
        body: "Across 15 international cohort studies tracking nearly 50,000 adults, mortality risk dropped progressively with increasing daily steps — but the benefit levelled off at around 6,000–8,000 steps in adults over 60, and 8,000–10,000 in under-60s. A separate meta-analysis of 17 studies covering over 226,000 people found that each additional 1,000 steps per day was associated with a 15% reduction in all-cause mortality risk, with meaningful protection beginning at around 3,000 steps. The relationship is clear: more is better, especially if you're currently doing very little.",
      },
      {
        heading: 'Why 8,000?',
        body: "It sits at the top of the well-evidenced range for adults under 60, without demanding the often-unachievable 10,000. One large US cohort study found that hitting 8,000 steps even just 1–2 days per week was associated with meaningfully lower all-cause and cardiovascular mortality over 10 years. Consistency across the week matters more than perfection every day — and every extra 1,000 steps genuinely counts.",
      },
    ],
    references: [
      { text: 'Paluch, A.E., Bajpai, S., Bassett, D.R., et al. (2021). Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. The Lancet Public Health, 7(3), e219-e228.' },
      { text: 'Banach, M., Lewek, J., Surma, S., et al. (2023). The association between daily step count and all-cause and cardiovascular mortality: a meta-analysis. European Journal of Preventive Cardiology, 30(18), 1975-1985.' },
      { text: 'Dempsey, P.C., Rowlands, A.V., Strain, T., et al. (2022). Do the associations of daily steps with mortality and incident cardiovascular disease differ by sedentary time levels? A device-based cohort study. British Journal of Sports Medicine, 57(10), 621-629.' },
      { text: 'Saint-Maurice, P.F., Troiano, R.P., Bassett, D.R., et al. (2020). Association of daily step patterns with mortality in US adults. JAMA Internal Medicine, 180(9), 1196-1204.' },
    ],
    status: 'reviewed',
  },
  {
    id: 'hydration',
    icon: '💧',
    title: 'Hydration',
    target: (t) => `${t.hydration}L per day`,
    summary: 'Why staying hydrated affects your brain, energy, and long-term health — and what your target actually means.',
    sections: [
      {
        heading: 'What hydration actually does',
        body: "Water is involved in almost every physiological process — temperature regulation, joint lubrication, nutrient transport, and waste removal. The brain is particularly sensitive: a body water loss of around 2% of body weight has been shown to impair attention, executive function, and motor coordination in healthy adults. A 2023 prospective study of nearly 2,000 adults found that poorer physiological hydration status was associated with greater cognitive decline over a two-year period.",
      },
      {
        heading: 'Why 2.5 litres?',
        body: "The 2.5L target is based on the European Food Safety Authority's (EFSA) 2010 adequate intake for adult men. EFSA's guidance for adult women is 2.0L/day — so if you're female, treat 2.5L as a ceiling to aim for on active or warm days rather than a fixed daily floor. Importantly, this figure covers total fluid intake from all sources: food contributes roughly 20% of your daily total, so tea, coffee, soup, and water-rich foods all count.",
      },
      {
        heading: 'The takeaway',
        body: "Thirst is a reasonable guide for most healthy adults — but it's a lagging signal, especially in older adults and during exercise. Don't wait until you're thirsty. Keep fluids accessible throughout the day and use urine colour as a practical check: pale yellow is the target. Dark yellow or amber means you're already behind.",
      },
    ],
    references: [
      { text: 'EFSA Panel on Dietetic Products, Nutrition, and Allergies (NDA). (2010). Scientific Opinion on Dietary Reference Values for water. EFSA Journal, 8(3), 1459.' },
      { text: 'Muñoz-Garach, A., García-Fontana, B., & Muñoz-Torres, M. (2023). Water intake, hydration status and 2-year changes in cognitive performance: a prospective cohort study. BMC Medicine, 21(1), 101.' },
      { text: 'Masento, N.A., Golightly, M., Field, D.T., Butler, L.T., & van Reekum, C.M. (2014). Effects of hydration status on cognitive performance and mood. British Journal of Nutrition, 111(10), 1841-1852.' },
      { text: 'Cheuvront, S.N., & Kenefick, R.W. (2014). Dehydration: physiology, assessment, and performance effects. Comprehensive Physiology, 4(1), 257-285.' },
    ],
    status: 'reviewed',
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
