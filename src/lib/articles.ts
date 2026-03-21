export type Article = {
  slug: string
  tier: 1 | 2 | 3
  tag: string
  tagColor: string
  title: string
  excerpt: string
  readTime: string
  source: string
  sourceUrl: string | null
  intro: string
  stats: { value: string; label: string }[]
  sections: { heading: string; content: string }[]
}

export const articles: Article[] = [
  // ── TIER 1: CREDIBILITY BACKBONE ──
  {
    slug: 'nfpa-hot-work-structure-fires',
    tier: 1,
    tag: 'NFPA',
    tagColor: 'bg-red-100 text-red-700',
    title: 'NFPA: 3,396 Hot Work Structure Fires Per Year',
    excerpt: 'The definitive national loss data. Thousands of structure fires every year tied to welding, cutting, and spark-producing work — making hot work one of the clearest preventable fire-loss categories.',
    readTime: '5 min read',
    source: 'National Fire Protection Association',
    sourceUrl: 'https://www.nfpa.org/education-and-research/research/nfpa-research/fire-statistical-reports/structure-fires-started-by-hot-work',
    intro: 'Hot work isn\'t a minor risk category. Between 2017 and 2021, NFPA tracked an average of 3,396 structure fires per year caused by welding, cutting, grinding, and other spark-producing operations. The resulting losses — 19 deaths, 120 injuries, and $292 million in property damage annually — make it one of the most measurable and preventable fire hazards in commercial construction.',
    stats: [
      { value: '3,396', label: 'Structure fires per year (2017-2021)' },
      { value: '$292M', label: 'Annual property damage' },
      { value: '54%', label: 'At commercial properties' },
      { value: '59%', label: 'Caused by heat sources too close to combustibles' },
    ],
    sections: [
      {
        heading: 'The Scale of the Problem',
        content: 'Between 2017 and 2021, NFPA recorded an average of 3,396 structure fires per year caused by hot work — resulting in 19 civilian deaths, 120 injuries, and $292 million in property damage annually. Welding torches are the most common equipment involved.',
      },
      {
        heading: 'Leading Causes',
        content: 'Two factors account for the majority of hot work fires: heat sources too close to combustibles and cutting or welding too close to combustible material. Together, these account for 59% of fires, 78% of deaths, and 40% of property damage. These are failures of fire watch, not failures of welding technique.',
      },
      {
        heading: 'Why This Matters for Documentation',
        content: 'Every one of these fires triggers an investigation. Investigators ask the same question: was a fire watch maintained? Paper logs that were filled out after the fact, or never filled out at all, are the most common gap they find. The documentation standard is shifting from "did someone sign a form" to "can you prove a watcher was physically present."',
      },
    ],
  },
  {
    slug: 'fm-global-hot-work-losses',
    tier: 1,
    tag: 'FM Global',
    tagColor: 'bg-purple-100 text-purple-700',
    title: 'FM Global: 41x Greater Losses Without a Hot Work Program',
    excerpt: 'FM Global\'s own loss data shows a 41-to-1 difference in fire losses between facilities with well-managed hot work programs and those without. Most fires are caused by outside contractors.',
    readTime: '5 min read',
    source: 'FM Global Data Sheet 10-3',
    sourceUrl: 'https://www.northwestern.edu/environmental-health-safety/docs/facility-docs/fm-global-10-3-hot-work-management.pdf',
    intro: 'When the world\'s largest commercial property insurer quantifies a risk, contractors should pay attention. FM Global Data Sheet 10-3 contains decades of loss-prevention data showing that the difference between a well-managed hot work program and a poorly managed one isn\'t marginal — it\'s a 41-to-1 ratio in fire losses. The majority of these fires trace back to the same source: outside contractors working without adequate oversight.',
    stats: [
      { value: '$123K', label: 'Avg loss with good program' },
      { value: '41x', label: 'Greater losses without one' },
      { value: '60 min', label: 'Window when most fires start' },
      { value: '#1', label: 'Cause: outside contractors' },
    ],
    sections: [
      {
        heading: 'The 41-to-1 Gap',
        content: 'Facilities with well-managed hot work programs average $123,000 in fire losses. Facilities with poorly managed programs see losses 41 times greater — averaging over $5 million. The difference isn\'t equipment or technique. It\'s program discipline: permits, fire watch, and post-work monitoring.',
      },
      {
        heading: 'The Contractor Problem',
        content: 'FM Global\'s data shows the overwhelming majority of hot work fires are caused by outside contractors. The risk more than doubles when contractors work without facility oversight. This is the highest-risk scenario in commercial hot work — and the one where documentation matters most.',
      },
      {
        heading: 'The 60-Minute Window',
        content: 'Most hot work fires occur during work or within 60 minutes of completion. That\'s the post-work monitoring period that NFPA 51B and OSHA require — and the period most likely to be cut short due to production pressure. Timed, verified check-ins during this window are the only way to prove the watch was actually maintained.',
      },
    ],
  },
  {
    slug: 'zurich-hot-work-fire-risks',
    tier: 1,
    tag: 'Zurich',
    tagColor: 'bg-blue-100 text-blue-700',
    title: 'Zurich Insurance Already Wants What DutyProof Built',
    excerpt: 'Zurich\'s risk engineering team recommends fire watchers take timestamped photos every 15 minutes as proof of compliance. A major global insurer describing a manual workaround for the exact problem we solve.',
    readTime: '5 min read',
    source: 'Zurich Resilience Solutions',
    sourceUrl: 'https://www.zurichresilience.com/knowledge-and-insights-hub/articles/hot-works-a-rising-concern-for-fire-risks',
    intro: 'Here\'s something most contractors don\'t know: one of the world\'s five largest insurers is already telling fire watchers to take timestamped photos every 15 minutes as proof of compliance. Zurich Resilience Solutions published this recommendation because they\'ve seen too many claims where the paper trail couldn\'t answer the most basic question — was anyone actually watching?',
    stats: [
      { value: '15%', label: 'Of all commercial fires from hot work' },
      { value: '15 min', label: 'Zurich\'s recommended check-in interval' },
      { value: '2x', label: 'Fire risk increase with outside contractors' },
      { value: '£18.5M', label: 'Largest school fire loss documented' },
    ],
    sections: [
      {
        heading: 'What Zurich Recommends',
        content: 'Zurich Resilience Solutions recommends fire watchers take timestamped photos every 15 minutes as proof of compliance. This is a major global insurer describing a manual workaround because they know paper logs aren\'t enough. The fact that carriers are asking for this level of verification tells you where the industry standard is heading.',
      },
      {
        heading: 'The Claims Data',
        content: 'Zurich\'s Major Loss Team documented school fire losses ranging from £5.75 million to £18.5 million. At least three involved permit failures — one had no permit at all, and two had permits managed by the contractor without facility oversight. 15% of all commercial and industrial fires are caused by hot work.',
      },
      {
        heading: 'The Contractor Risk',
        content: 'Fire risk more than doubles when outside contractors perform hot work without oversight. Zurich\'s data aligns with FM Global and AIG — the contractor-without-oversight scenario is the single most dangerous configuration for hot work fires.',
      },
    ],
  },
  {
    slug: 'aig-hot-work-risk',
    tier: 1,
    tag: 'AIG',
    tagColor: 'bg-amber-100 text-amber-700',
    title: 'AIG: $2.6 Million Average Loss Per Hot Work Incident',
    excerpt: 'AIG\'s risk engineering team puts the average gross loss at $2.6M per incident. Their guidance lays out the exact fire watch workflow — and the only tool they offer to execute it is a paper tag.',
    readTime: '6 min read',
    source: 'AIG Property Risk Engineering',
    sourceUrl: null,
    intro: '$2.6 million. That\'s not the worst case — that\'s the average gross loss from a single hot work fire, according to AIG\'s property risk engineering team. Their published guidance lays out the exact workflow they expect: 60-minute post-work watch, 3-hour monitoring period, completion signatures from three parties. The only tool they provide to execute it? A three-page paper permit tag.',
    stats: [
      { value: '$2.6M', label: 'Average gross loss per incident' },
      { value: '79%', label: 'Of construction fires from poor hot work mgmt' },
      { value: '2x+', label: 'Risk increase with outside contractors' },
      { value: '3', label: 'Signatures required per AIG workflow' },
    ],
    sections: [
      {
        heading: 'The Cost Per Incident',
        content: 'AIG\'s property risk engineering data puts the average gross loss from a single hot work incident at $2.6 million. This isn\'t the worst-case scenario — it\'s the average. Against that number, any investment in verified fire watch documentation pays for itself immediately.',
      },
      {
        heading: 'The Construction Industry Problem',
        content: 'AIG cites a UK Fire Protection Association study showing up to 79% of construction industry fires result from improperly managed hot work. Fire risk more than doubles when outside contractors are involved without facility oversight.',
      },
      {
        heading: 'AIG\'s Own Workflow',
        content: 'AIG lays out a complete fire watch workflow: 60-minute post-work watch, 3-hour area monitoring, single-shift permit limits, and completion signatures from the worker, fire watcher, and issuing manager. The gap between what insurers require and what paper can verify is exactly where most claims fall apart.',
      },
    ],
  },
  {
    slug: 'osha-hot-work-standard',
    tier: 1,
    tag: 'OSHA',
    tagColor: 'bg-orange-100 text-orange-700',
    title: 'OSHA 29 CFR 1910.252: The Legal Standard for Hot Work Fire Watch',
    excerpt: 'The federal regulation that governs fire watch for welding, cutting, and brazing. What it requires, what it doesn\'t say, and why paper compliance isn\'t enough.',
    readTime: '6 min read',
    source: 'U.S. Department of Labor / OSHA',
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.252',
    intro: 'Every contractor doing hot work in the United States operates under 29 CFR 1910.252. The standard is clear about what\'s required: fire-safe work areas, posted fire watchers when combustibles are present, and monitoring after work completion. What the standard doesn\'t specify is how to document any of it — and that ambiguity is where most violations originate.',
    stats: [
      { value: '35 ft', label: 'Combustible clearance threshold' },
      { value: '30 min', label: 'Minimum post-work fire watch' },
      { value: '$16,131', label: 'Max penalty per serious violation' },
      { value: '$161,323', label: 'Max penalty per willful violation' },
    ],
    sections: [
      {
        heading: 'What the Standard Requires',
        content: 'OSHA 29 CFR 1910.252 requires that work areas be made fire-safe with combustibles removed or protected. Fire watchers are required when combustibles are within 35 feet and cannot be moved. Fire watch must be maintained for at least 30 minutes after hot work is completed. Fire watchers must be trained in extinguisher use and alarm procedures.',
      },
      {
        heading: 'What Triggers a Citation',
        content: 'OSHA inspectors don\'t just check whether hot work is happening safely in the moment — they ask for records. The most common triggers: no fire watch assigned, fire watch ended early, no documentation exists, incomplete permits, or the watcher was also the welder. Penalties range from $16,131 per serious violation to $161,323 per willful violation.',
      },
      {
        heading: 'The Documentation Gap',
        content: 'The standard requires fire watch but doesn\'t specify how to document it. That ambiguity is where paper logs fail — they prove someone held a pen, not that a watcher was physically present. As penalties increase and inspectors get more sophisticated, the gap between "we filled out a form" and "we can prove compliance" keeps getting wider.',
      },
    ],
  },
  {
    slug: 'fm-global-hot-work-permits',
    tier: 1,
    tag: 'FM Global',
    tagColor: 'bg-purple-100 text-purple-700',
    title: 'FM Global: Why Hot Work Permits Are "Critical" — and Still Paper',
    excerpt: 'FM Global calls hot work permits critical to controlling and monitoring temporary hot work. They even built a permit app. But it\'s still a digital version of a paper form.',
    readTime: '4 min read',
    source: 'FM Global',
    sourceUrl: 'https://www.fm.com/resources/hot-work-resources',
    intro: 'FM Global has been tracking commercial property losses for over 200 years. Their position on hot work permits is unambiguous: they\'re critical. So critical that FM Global built their own Hot Work Permit App. But when you look at what the app actually does, it captures signatures and permit data — the same information a paper form captures. The question it still can\'t answer: was the fire watch actually maintained?',
    stats: [
      { value: '#1', label: 'Commercial property insurer globally' },
      { value: '200+', label: 'Years of loss prevention data' },
      { value: '0', label: 'GPS verification in their permit app' },
      { value: '100%', label: 'Paper-based enforcement model' },
    ],
    sections: [
      {
        heading: 'What FM Global Says',
        content: 'FM Global states that hot work permits are critical to planning, performing, controlling, and monitoring temporary hot work. Their loss-prevention guidance emphasizes isolating combustibles, confining ignition sources, maintaining fire protection systems, and supervising the area during and after work.',
      },
      {
        heading: 'The Gap in Their Own Solution',
        content: 'FM Global built a Hot Work Permit App — but it\'s a digital version of their paper form. It captures permit data and signatures but has no GPS verification, no timed check-ins, and no real-time monitoring. It answers "was a permit issued?" but not "was a fire watch actually maintained?"',
      },
      {
        heading: 'Permits vs. Verification',
        content: 'A permit authorizes work. Verification proves the safety requirements were followed. The industry has digitized the permit — but the enforcement layer that proves compliance during and after work is still stuck on paper. That\'s the gap that GPS-verified, time-stamped check-in systems are built to close.',
      },
    ],
  },
  // ── TIER 2: REGULATORY & OPERATIONAL DEPTH ──
  {
    slug: 'osha-fire-watch-duties',
    tier: 2,
    tag: 'OSHA',
    tagColor: 'bg-orange-100 text-orange-700',
    title: 'OSHA Fact Sheet: The Welder Cannot Be the Fire Watch',
    excerpt: 'OSHA is explicit — the person doing the hot work cannot also serve as the fire watch. Fire watch duties are continuous, including during breaks. The most common violation we see is exactly this.',
    readTime: '5 min read',
    source: 'OSHA Publications',
    sourceUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA4188.pdf',
    intro: 'Ask any superintendent what the most common fire watch violation is, and the answer is the same: the welder watching himself. OSHA\'s own fact sheet is explicit — the person performing hot work cannot also serve as the fire watch. The duties are continuous, including during breaks. No exceptions. Yet this single violation accounts for more citations than almost any other hot work deficiency.',
    stats: [
      { value: '≠', label: 'Welder cannot be fire watch' },
      { value: '24/7', label: 'Duties are continuous, including breaks' },
      { value: '60 min', label: 'NFPA 51B post-work minimum' },
      { value: '100%', label: 'Replacement required if watcher leaves' },
    ],
    sections: [
      {
        heading: 'Separation of Duties',
        content: 'The person performing hot work cannot be the fire watch. This is one of the most commonly violated requirements in the field. GPS-verified check-ins from a separate device prove a second individual was present at the work location — eliminating any question about whether the fire watch was independent.',
      },
      {
        heading: 'Continuous Duty',
        content: 'Fire watch duties are continuous, including during breaks. If the fire watcher needs to leave the area for any reason, a qualified replacement must be assigned before they step away. There is no exception for short breaks, bathroom trips, or shift changes.',
      },
      {
        heading: 'Post-Work Requirements',
        content: 'OSHA requires a minimum 30-minute post-work watch. NFPA 51B (2019 edition) now requires 60 minutes. Many facility owners and GCs require even longer. The longer the required window, the harder it becomes to verify with paper — and the more critical timed, automated check-ins become.',
      },
    ],
  },
  {
    slug: 'massachusetts-fire-watch-requirements',
    tier: 2,
    tag: 'State Law',
    tagColor: 'bg-green-100 text-green-700',
    title: 'Massachusetts Doubled Its Fire Watch Requirement to 1 Hour',
    excerpt: 'Massachusetts now requires a full hour of post-work fire watch — double the previous standard — plus three additional hours of area monitoring.',
    readTime: '5 min read',
    source: 'Code Red Consultants',
    sourceUrl: 'https://coderedconsultants.com/insights/updated-fire-watch-requirements/',
    intro: 'Massachusetts is the first state to formally double its post-work fire watch requirement from 30 minutes to a full hour, with three additional hours of area monitoring after that. The change came after NFPA data showed the average hot work fire ignites 48 minutes after work ends — 18 minutes beyond the old window. Other states are expected to follow. If you\'re working in Massachusetts, you\'re already held to this standard.',
    stats: [
      { value: '60 min', label: 'Minimum fire watch (up from 30)' },
      { value: '3 hrs', label: 'Additional area monitoring required' },
      { value: '2 hrs', label: 'Fire watch for torch-applied roofing' },
      { value: '2 hrs', label: 'Fire watch for mass timber buildings' },
    ],
    sections: [
      {
        heading: 'The Updated Standard',
        content: 'Massachusetts now references the NFPA 51B 2019 edition. The minimum fire watch period has been increased from 30 minutes to one full hour. An additional three hours of area monitoring is required after the fire watch period ends. For torch-applied roofing and large wood or mass timber buildings, the fire watch extends to two hours.',
      },
      {
        heading: 'Why It Changed',
        content: 'The update was driven by the recognition that 30 minutes wasn\'t enough. NFPA data shows the average time between hot work completion and fire ignition is 48 minutes — well beyond the old 30-minute window. Massachusetts is leading, but other states are expected to follow.',
      },
      {
        heading: 'What Longer Windows Mean for Paper Logs',
        content: 'A 30-minute watch is hard to verify on paper. A 60-minute watch with 3 hours of additional monitoring is nearly impossible. The longer the required window, the more likely it is that a handwritten log was filled out at the end of the shift rather than in real time. Time-stamped digital verification is the only reliable method for extended monitoring periods.',
      },
    ],
  },
  {
    slug: 'epa-hot-work-permit-retention',
    tier: 2,
    tag: 'EPA',
    tagColor: 'bg-teal-100 text-teal-700',
    title: 'EPA Now Requires 3-Year Hot Work Permit Retention',
    excerpt: 'New EPA rules require facilities to retain closed hot work permits for up to three years. Filing cabinets just became compliance liabilities.',
    readTime: '5 min read',
    source: 'Bluefield Process Safety',
    sourceUrl: 'https://bluefieldsafety.com/2024/10/hot-work-permits-has-the-epa-created-a-new-fire-hazard/',
    intro: 'As of 2024, the EPA requires facilities to retain closed hot work permits for up to three years under updated RMP amendments. That\'s a federal document-retention mandate on top of OSHA\'s existing hot work requirements — meaning a single incident can now trigger citations from two agencies. For contractors still managing permits with paper and filing cabinets, the retrieval problem just became a compliance problem.',
    stats: [
      { value: '3 yrs', label: 'Required permit retention period' },
      { value: '2x', label: 'Citation exposure (OSHA + EPA)' },
      { value: '2024', label: 'Year the rule took effect' },
      { value: '100%', label: 'Of permits must be retrievable on demand' },
    ],
    sections: [
      {
        heading: 'The New Retention Rule',
        content: 'The 2024 EPA RMP amendments require retention of closed hot work permits for up to three years. This means every permit, every fire watch log, and every completion record must be preserved and producible on demand. Paper-based systems make this a storage and retrieval nightmare.',
      },
      {
        heading: 'Double Citation Exposure',
        content: 'OSHA can now cite hot work violations under both 29 CFR 1910.252 (hot work) and 29 CFR 1910.119(k) (process safety management). That\'s double citation exposure for the same incident. The retention rule makes it easier for inspectors to go back years and find documentation failures.',
      },
      {
        heading: 'Why Retrieval Speed Matters',
        content: 'When an inspector asks for a permit from 18 months ago, the clock is ticking. Paper systems mean digging through filing cabinets at a job trailer that may no longer exist. Digital archives with search by date, site, or worker turn a multi-hour retrieval into a 30-second lookup — and that responsiveness signals program maturity to inspectors.',
      },
    ],
  },
  // ── TIER 3: PAIN AMPLIFIERS ──
  {
    slug: 'boston-hot-work-fire-2014',
    tier: 3,
    tag: 'Case Study',
    tagColor: 'bg-red-100 text-red-700',
    title: 'Two Firefighters Killed: The Boston Hot Work Fire That Changed a State',
    excerpt: 'In March 2014, unpermitted welding with no fire watch killed two Boston firefighters. Massachusetts responded with statewide hot work certification. The same failure patterns keep repeating.',
    readTime: '5 min read',
    source: 'NFPA Fact Sheet',
    sourceUrl: 'https://www.losalamosnm.us/files/sharedassets/public/v/1/departments/fire-department/documents/hotworkfactsheet.pdf',
    intro: 'On March 26, 2014, Firefighter Michael Kennedy and Lieutenant Edward Walsh responded to a fire at 298 Beacon Street in Boston. Both were killed in the line of duty. The cause: unpermitted welding with no fire watch in place. No permit had been issued. No watcher had been assigned. Between 2001 and 2018, five firefighters in Massachusetts alone were killed in hot work fires — all tied to the same root causes.',
    stats: [
      { value: '2', label: 'Firefighters killed' },
      { value: '0', label: 'Permits on file' },
      { value: '0', label: 'Fire watch assigned' },
      { value: '5', label: 'FF deaths from hot work fires (2001-2018)' },
    ],
    sections: [
      {
        heading: 'What Happened',
        content: 'On March 26, 2014, a fire broke out at 298 Beacon Street in Boston. The fire was caused by unpermitted welding — no hot work permit had been issued and no fire watch was in place. Firefighter Michael Kennedy and Lieutenant Edward Walsh were killed in the line of duty.',
      },
      {
        heading: 'What Changed',
        content: 'The tragedy led directly to Massachusetts mandating statewide hot work safety certification, effective July 1, 2018. Between 2001 and 2018, five firefighters were killed in hot work fires. The regulation was a response to a pattern of preventable deaths — all tied to the same root cause: no permit, no fire watch, no oversight.',
      },
      {
        heading: 'Why It Keeps Happening',
        content: 'Regulations change after tragedies. But regulations don\'t enforce themselves. Paper permits and manual fire watch logs are only as reliable as the person filling them out. The gap between what\'s required and what\'s verified is where these failures originate — and until that gap is closed, the same patterns will keep repeating.',
      },
    ],
  },
  {
    slug: 'hot-work-subrogation-claims',
    tier: 3,
    tag: 'Legal',
    tagColor: 'bg-slate-200 text-slate-700',
    title: 'After the Fire: How Insurers Come After Contractors',
    excerpt: 'After a hot work fire, the carrier\'s first move is subrogation — recovering their payout by going after the contractor who can\'t prove they followed protocol.',
    readTime: '6 min read',
    source: 'CLM Magazine',
    sourceUrl: null,
    intro: 'Most contractors think about insurance as protection. But after a hot work fire, the building owner\'s carrier pays the claim — and then their subrogation team starts looking for someone to recover from. The first question is always the same: can the contractor prove they followed protocol? Courts have noted that hot work fire cases rely almost entirely on circumstantial evidence because no one sees the fire start. The documentation trail is the only defense.',
    stats: [
      { value: '12,360', label: 'Hot work fires per year (U of Iowa)' },
      { value: '$309M', label: 'Annual property damage' },
      { value: '$400K+', label: 'School fire case study damages' },
      { value: '0', label: 'Witnesses — no one sees the fire start' },
    ],
    sections: [
      {
        heading: 'What Subrogation Means for Contractors',
        content: 'After a hot work fire, the building owner\'s insurance pays the claim. Then the carrier\'s subrogation team goes to work — pursuing the contractor whose work caused the fire. The first thing they ask for is the paper trail: permits, fire watch logs, completion records. If the documentation has gaps, the contractor becomes the defendant.',
      },
      {
        heading: 'The Evidence Problem',
        content: 'Courts note that hot work fire cases rely on circumstantial evidence because no one sees the fire start. The work finishes, the crew leaves, and hours later the fire is discovered. A University of Iowa study documented 12,360 hot work fires per year with $309 million in damage and 31 deaths. In one case study, welders left a school site between 3:30 and 4:00 PM. Fire broke out at 6:18 PM. Damages exceeded $400,000. The contractor was named as defendant.',
      },
      {
        heading: 'Documentation as Defense',
        content: 'The only defense a contractor has in a subrogation case is verifiable documentation. Paper logs that could have been written after the fact are circumstantial at best. Server-timestamped records with GPS coordinates showing a fire watch was physically present and checking in at regular intervals — that\'s the kind of evidence that survives cross-examination.',
      },
    ],
  },
  {
    slug: 'travelers-hot-work-construction',
    tier: 2,
    tag: 'Insurance',
    tagColor: 'bg-indigo-100 text-indigo-700',
    title: 'Travelers: Hot Work Permits From Day One Through Project Completion',
    excerpt: 'Travelers recommends hot work permit discipline from the first day of construction through completion — with each permit valid for a single shift.',
    readTime: '4 min read',
    source: 'Travelers Insurance',
    sourceUrl: null,
    intro: 'Travelers doesn\'t just recommend hot work permits — they recommend permit discipline from the first day of construction through project completion, with each permit valid for a single shift only. No multi-day permits. No open-ended approvals. That level of consistency across every shift, every work area, for the entire duration of a project is what separates contractors whose claims get paid from those who end up in litigation.',
    stats: [
      { value: 'Day 1', label: 'When permits should start' },
      { value: '1 shift', label: 'Maximum permit validity' },
      { value: '100%', label: 'Of shifts need documentation' },
      { value: '0', label: 'Tolerance for gaps' },
    ],
    sections: [
      {
        heading: 'Permit Discipline',
        content: 'Travelers Insurance recommends that hot work permits be required from the first day of construction through project completion. Permits should capture the specific activity, contact information, and fire watch data. Each permit should be valid for only one shift — no multi-day permits, no open-ended approvals.',
      },
      {
        heading: 'The Consistency Problem',
        content: 'Maintaining permit discipline for every shift across every work area for the duration of a project is operationally demanding with paper. Permits get lost, logs get skipped, and by week three the process has degraded to rubber-stamping. Digital enforcement keeps the standard consistent from day one to project close.',
      },
      {
        heading: 'What This Means for Contractors',
        content: 'When a carrier like Travelers recommends this level of documentation discipline, it\'s because they\'ve seen what happens when it breaks down. The carriers who write the policies are telling contractors exactly what they need to do to keep their coverage intact. The question for every contractor is whether their current system can sustain that standard across every shift.',
      },
    ],
  },
]

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

export function getArticlesByTier(tier: 1 | 2 | 3): Article[] {
  return articles.filter((a) => a.tier === tier)
}

export function getAdjacentArticles(slug: string): { prev: Article | null; next: Article | null } {
  const index = articles.findIndex((a) => a.slug === slug)
  return {
    prev: index > 0 ? articles[index - 1] : null,
    next: index < articles.length - 1 ? articles[index + 1] : null,
  }
}
