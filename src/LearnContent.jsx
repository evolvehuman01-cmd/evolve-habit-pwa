// ── LEARN CONTENT ─────────────────────────────────────────
// Content data for the in-app "Learn" section: the how-to guide
// and the science-backed info pages for each target.
//
// PHASE 1 (this file, current state): how-to guide is complete.
// Science topics are scaffolded with placeholder content and an
// empty `references` array — these get filled in Phase 2, a few
// topics at a time, with real citations.
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
    sections: [
      {
        heading: 'Why this target?',
        body: "The meal structure target is built around habit formation, not macros or dietary prescription. The goal is regular, predictable eating windows — not a specific food plan. Irregular eating patterns (skipping meals, grazing unpredictably throughout the day) are associated with poorer diet quality, disrupted appetite signalling, and higher BMI, independent of total calorie intake. Three structured meals creates a simple, repeatable framework most people can sustain without significant life disruption.\n\nIf your coach has adjusted this number, it reflects your consultation answers and current lifestyle. The target is a proxy for intentionality — eating with structure rather than reactively.",
      },
      {
        heading: 'What the evidence says',
        body: "Meal frequency and meal regularity have been studied separately, and regularity shows stronger associations with health outcomes than frequency alone. Research published in the Proceedings of the Nutrition Society found that irregular meal timing was associated with higher BMI, poorer metabolic health markers, and disrupted circadian rhythms — the internal clock that governs digestion, insulin response, and appetite hormones. When meals are unpredictable, these systems work against you. Consistent meal times help keep them calibrated.\n\nThere is also a practical behaviour change angle: structured meals make it easier to plan, prepare, and make intentional food choices. Reactive eating — picking up food when you're already too hungry — tends to produce lower quality choices and larger portions. Three meals sets a rhythm that reduces decision fatigue and supports better overall dietary quality, as shown in research examining meal patterns and micronutrient intake in Australian adults.",
      },
      {
        heading: 'The takeaway',
        body: "Start with time, not food. Pick three eating windows for tomorrow and write them down — breakfast, lunch, and dinner at roughly the same times you could realistically hit every day. Don't change what you eat yet; just eat at those times consistently for one week. If you currently skip a meal regularly, shift your first meal 30 minutes earlier every few days rather than jumping straight to three meals overnight. Log what actually happened, not what you planned.",
      },
    ],
    references: [
      {
        text: "Almoosawi S, et al. (2019). Chrono-nutrition: a review of current evidence from observational studies on global trends in time-of-day of energy intake and its association with obesity. Proceedings of the Nutrition Society, 78(2), 205–218.",
        url: "https://doi.org/10.1017/S0029665118000995",
      },
      {
        text: "Pot GK (2018). Sleep and dietary habits in the urban environment: the role of chrono-nutrition. Proceedings of the Nutrition Society, 77(3), 189–198.",
        url: "https://doi.org/10.1017/S0029665117003913",
      },
      {
        text: "Leech RM, et al. (2017). Meal frequency but not snack frequency is associated with micronutrient intakes and overall diet quality in Australian men and women. Journal of Nutrition, 147(10), 1882–1890.",
        url: "https://doi.org/10.3945/jn.117.249367",
      },
    ],
    status: 'reviewed',
  },
  {
    id: 'mindfulness',
    icon: '🧠',
    title: 'Mindfulness',
    target: (t) => `${t.mindfulness} minutes per day`,
    summary: 'Evidence for mindfulness and breathwork practices on stress and wellbeing.',
    sections: [
      {
        heading: 'Why this target?',
        body: "The mindfulness target is designed to make the practice a daily habit rather than an emergency tool. Most people reach for it when they're already overwhelmed — which is too late for it to work well. The evidence is clear that regular, low-dose practice produces measurable changes in stress reactivity and attention. Consistency matters more than duration: ten minutes every day outperforms an hour once a week.\n\nFor the Evolve targets, mindfulness includes breathwork, body scans, guided meditation, or any intentional present-moment practice. It doesn't require an app or a specific setting. What matters is that it's deliberate — not incidental calm during a walk you were doing anyway.",
      },
      {
        heading: 'What the evidence says',
        body: "Mindfulness-Based Stress Reduction (MBSR) is the most extensively studied protocol and consistently produces reductions in self-reported stress, anxiety, and cortisol in both clinical and non-clinical populations. The mechanism most reliably supported in neuroimaging research is reduced amygdala reactivity — practised mindfulness makes stress triggers land with less force and recover more quickly.\n\nCritically, you don't need a full MBSR programme to see effects. A randomised controlled trial examining brief app-based mindfulness practice found that just 10 minutes of guided mindfulness daily over 10 days significantly reduced fatigue, anxiety, and irritability compared to controls. A systematic review of self-help mindfulness interventions confirmed meaningful reductions in stress and anxiety across short-format programmes. The dose threshold for benefit is lower than most people assume — the barrier is habit formation, not time.",
      },
      {
        heading: 'The takeaway',
        body: "Pick one anchor point you already have in your day — first coffee, post-shower, or the five minutes before bed — and attach your practice to it. Set a timer for your target duration and start tomorrow. If the target feels too long, do five minutes and build up. A guided session on YouTube or a free app counts just as much as unguided practice. The format is irrelevant; the daily repetition is everything.",
      },
    ],
    references: [
      {
        text: "Kabat-Zinn J (2003). Mindfulness-based interventions in context: past, present, and future. Clinical Psychology: Science and Practice, 10(2), 144–156.",
        url: "https://doi.org/10.1093/clipsy.bpg016",
      },
      {
        text: "Cavanagh K, et al. (2018). Can mindfulness and acceptance be learnt by self-help? A systematic review and meta-analysis of mindfulness and acceptance-based self-help interventions. Clinical Psychology Review, 65, 1–13.",
        url: "https://doi.org/10.1016/j.cpr.2018.07.009",
      },
      {
        text: "Economides M, et al. (2018). Improvements in stress, affect, and irritability following brief use of a mindfulness-based smartphone app: a randomised controlled trial. Mindfulness, 9, 1584–1593.",
        url: "https://doi.org/10.1007/s12671-018-0905-4",
      },
    ],
    status: 'reviewed',
  },
  {
    id: 'mobility',
    icon: '🧘',
    title: 'Mobility',
    target: (t) => `${t.mobility} minutes per day`,
    summary: 'Why regular mobility work supports movement quality and injury prevention.',
    sections: [
      {
        heading: 'Why this target?',
        body: "Mobility is the most undervalued of the nine targets. It's not stretching for flexibility — it's maintaining the range of motion and joint capacity needed to move well without pain or compensation. The problem this target addresses is sedentary accumulation: even people who exercise regularly can spend 8–10 hours a day in static positions, which creates a sustained musculoskeletal cost that a gym session alone doesn't reverse.\n\nThe target is time-based because quality of attention matters more than the number of exercises completed. Ten minutes of deliberate, controlled movement with focus on end-range positions is worth more than a rushed 20-minute routine done passively. Your coach may identify specific focus areas based on your lifestyle and consultation answers.",
      },
      {
        heading: 'What the evidence says',
        body: "Prolonged sitting — even in people who meet physical activity guidelines — is independently associated with lower back pain, reduced hip flexor length, reduced thoracic mobility, and increased injury risk during exercise. A systematic review and meta-analysis published in the Annals of Internal Medicine found that sedentary behaviour was associated with adverse health and mortality outcomes regardless of physical activity level elsewhere in the day. Sitting and exercising are not a straight trade-off: the two behaviours carry separate risks.\n\nMobility work interrupts the postural loading pattern that prolonged sitting creates. Research on breaking up sedentary time also shows downstream metabolic benefits — short movement breaks have been shown to reduce postprandial glucose and insulin responses compared to uninterrupted sitting, suggesting that regular movement throughout the day has effects beyond the musculoskeletal system.",
      },
      {
        heading: 'The takeaway',
        body: "Start with three moves: a hip flexor stretch, a thoracic rotation, and a deep squat hold. Do them for five minutes straight after you get up tomorrow — before you look at your phone. Once that's a habit, add time or variety. If you work at a desk, set a timer every 90 minutes as a movement prompt alongside your structured session. The timer is not optional if you sit for most of the day.",
      },
    ],
    references: [
      {
        text: "Biswas A, et al. (2015). Sedentary time and its association with risk for disease incidence, mortality, and hospitalisation in adults: a systematic review and meta-analysis. Annals of Internal Medicine, 162(2), 123–132.",
        url: "https://doi.org/10.7326/M14-1651",
      },
      {
        text: "Steele J, et al. (2017). Exercise and chronic low back pain: what works? British Journal of Sports Medicine, 49(14), 1213.",
        url: "https://doi.org/10.1136/bjsports-2014-094521",
      },
      {
        text: "Dunstan DW, et al. (2012). Breaking up prolonged sitting reduces postprandial glucose and insulin responses. Diabetes Care, 35(5), 976–983.",
        url: "https://doi.org/10.2337/dc11-1931",
      },
    ],
    status: 'reviewed',
  },
  {
    id: 'stress',
    icon: '😣',
    title: 'Stress',
    target: (t) => `Target ≤${t.stress}/10`,
    summary: 'Understanding self-reported stress scores and their relationship to wellbeing.',
    sections: [
      {
        heading: 'Why this target?',
        body: "The stress target is a ceiling, not a goal — you're aiming to keep your daily score at or below the target number. Tracking it daily matters because stress is cumulative and people are surprisingly poor at recognising their own baseline creep. When you log it every day, patterns become visible: which days, contexts, or habit combinations correlate with higher scores. That information is useful for your coach and for you.\n\nSelf-reported stress measures are validated and clinically meaningful — they correlate with objective markers including cortisol, heart rate variability, and immune function. A number on a scale is not just a feeling; it reflects measurable physiological load.",
      },
      {
        heading: 'What the evidence says',
        body: "Chronic stress — sustained elevated scores over weeks — is associated with impaired sleep quality, appetite dysregulation, reduced physical activity motivation, and increased cardiovascular risk. Research published in Nature Reviews Cardiology found that psychological stress was independently predictive of cardiovascular disease development and progression, reinforcing that subjective stress has measurable downstream effects on physical health, not just mental wellbeing.\n\nDaily logging also has a regulatory effect in itself. Research on self-monitoring and expressive writing suggests that the act of naming and recording emotional states reduces their intensity over time. A randomised controlled trial of online positive affect journaling found significant improvements in mental distress and wellbeing in patients with elevated anxiety. The log is not just data collection — it is a mild daily self-regulation practice.",
      },
      {
        heading: 'The takeaway',
        body: "Log your score at the same time each day — end of day works for most people. Don't overthink it; your first instinct is accurate. If you score 7 or above, note in your check-in what was happening that day. If you see three or more consecutive high scores, flag it to your coach — that's exactly the kind of pattern the weekly check-in is designed to catch early.",
      },
    ],
    references: [
      {
        text: "Kivimäki M & Steptoe A (2018). Effects of stress on the development and progression of cardiovascular disease. Nature Reviews Cardiology, 15(4), 215–229.",
        url: "https://doi.org/10.1038/nrcardio.2017.189",
      },
      {
        text: "Pennebaker JW & Chung CK (2011). Expressive writing and its links to mental and physical health. In H.S. Friedman (Ed.), Oxford Handbook of Health Psychology. Oxford University Press.",
      },
      {
        text: "Smyth JM, et al. (2018). Online positive affect journaling in the improvement of mental distress and well-being in general medical patients with elevated anxiety symptoms. JMIR Mental Health, 5(4), e11290.",
        url: "https://doi.org/10.2196/11290",
      },
    ],
    status: 'reviewed',
  },
  {
    id: 'mood',
    icon: '🙂',
    title: 'Mood',
    target: (t) => `Target ≥${t.mood}/10`,
    summary: 'Why tracking mood matters and how it connects to other habits.',
    sections: [
      {
        heading: 'Why this target?',
        body: "Mood is a floor target — you're aiming to keep your daily score at or above the target number. Like stress, daily mood tracking builds pattern awareness that a weekly or monthly check-in can't provide. Single-item mood ratings taken daily are well-validated in research and sensitive enough to detect meaningful change over time. The target isn't about forcing positivity — it's about establishing a baseline so that dips become visible early, before they compound.\n\nMood and physical health habits have a bidirectional relationship. Poor sleep reliably reduces next-day mood scores; low daily steps correlate with lower mood in real-world tracking studies; and low hydration has measurable effects on emotional state. This means your mood score functions as a downstream signal for how well your other habits are stacking up — it integrates multiple inputs into a single number.",
      },
      {
        heading: 'What the evidence says',
        body: "Research on ecological momentary assessment (EMA) — collecting self-reports multiple times per day in real life — consistently finds that daily mood ratings are reliable, valid, and more predictive of clinical outcomes than retrospective weekly ratings. A review published in Psychological Medicine examining the dynamic nature of mood found that day-to-day fluctuations in self-reported mood were clinically meaningful and predictive of longer-term mental health outcomes. One number, logged honestly and consistently, gives your coach real signal.\n\nResearch also supports the value of mood tracking as an early intervention tool. Sustained low mood scores — even sub-clinical — are associated with reduced motivation, lower physical activity, and poorer sleep quality, creating a feedback loop that is easier to interrupt early than late. Catching a downward trend over a week is far more actionable than noticing it over a month.",
      },
      {
        heading: 'The takeaway',
        body: "If your mood score is consistently below target, check your sleep and steps logs before assuming something more complex is going on — those two habits have the strongest same-day and next-day mood effects and are the first levers to pull. Log honestly; a low score is useful data, not a problem. If scores stay low and your other habits look fine, bring it to your next check-in. That's what it's there for.",
      },
    ],
    references: [
      {
        text: "Wichers M (2014). The dynamic nature of depression: a new micro-level perspective of mental disorder that meets current challenges. Psychological Medicine, 44(7), 1349–1360.",
        url: "https://doi.org/10.1017/S0033291713001743",
      },
      {
        text: "Dejonckheere E, et al. (2019). Complex affect dynamics add limited information to the prediction of psychological well-being. Nature Human Behaviour, 3, 478–491.",
        url: "https://doi.org/10.1038/s41562-019-0555-0",
      },
      {
        text: "Beedie CJ, et al. (2005). Distinctions between emotion and mood. Cognition & Emotion, 19(6), 847–878.",
        url: "https://doi.org/10.1080/02699930541000057",
      },
    ],
    status: 'reviewed',
  },
  {
    id: 'energy',
    icon: '⚡',
    title: 'Energy',
    target: (t) => `Target ≥${t.energy}/10`,
    summary: 'What drives day-to-day energy levels and how to track meaningful change.',
    sections: [
      {
        heading: 'Why this target?',
        body: "Energy is a floor target — you're aiming to stay at or above the target score. Of the three subjective scales, energy is the one most tightly connected to trackable behaviours: sleep, movement, hydration, and meal regularity all have direct, well-evidenced effects on perceived energy. This makes it both a useful outcome measure and an early warning signal. A run of low energy scores usually means something in your habit stack has slipped — the app gives you the data to work out what.\n\nPerceived energy (also called vitality in research literature) is a distinct psychological construct from mood, though the two correlate. It can be low even when mood is stable, and vice versa — which is why both are tracked separately.",
      },
      {
        heading: 'What the evidence says',
        body: "Sleep has the most immediate and consistent effect on perceived energy: even one night of shortened sleep produces significant reductions in self-rated vitality the following day. Physical activity has a paradoxical but well-supported energising effect — a meta-analysis of 70 randomised controlled trials found that exercise interventions significantly increased feelings of energy and reduced fatigue, with effect sizes comparable to stimulant medication in non-clinical populations. Moving more creates more energy, not less.\n\nDehydration as low as 1–2% of body weight has been shown to reduce perceived energy and increase fatigue ratings in controlled studies, even before thirst is triggered. This is why hydration, sleep, steps, and energy scores in the app are worth looking at together — they are not independent. Your energy log is the summary signal; your other habits are the inputs.",
      },
      {
        heading: 'The takeaway',
        body: "Log energy at the same time each day — mid-afternoon is a reliable anchor because it captures both the morning carry-over and the afternoon dip. If your score drops for three or more consecutive days, check hydration and sleep first: both have immediate same-day effects and are the quickest things to adjust. Don't reach for caffeine as the fix — it masks the signal without addressing it.",
      },
    ],
    references: [
      {
        text: "Puetz TW, et al. (2006). A randomised controlled trial of the effect of aerobic exercise training on feelings of energy and fatigue in sedentary young adults with persistent fatigue. Psychotherapy and Psychosomatics, 75(3), 167–174.",
        url: "https://doi.org/10.1159/000091962",
      },
      {
        text: "Ganio MS, et al. (2011). Mild dehydration impairs cognitive performance and mood of men. British Journal of Nutrition, 106(10), 1535–1543.",
        url: "https://doi.org/10.1017/S0007114511002005",
      },
      {
        text: "Pilcher JJ & Huffcutt AI (1996). Effects of sleep deprivation on performance: a meta-analysis. Sleep, 19(4), 318–326.",
        url: "https://doi.org/10.1093/sleep/19.4.318",
      },
    ],
    status: 'reviewed',
  },
]
