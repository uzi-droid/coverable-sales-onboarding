export const bootcampDays = [
  {
    id: "day1",
    title: "Day 1: Product and Sales Foundation",
    focus: "Explain Coverable simply, map law firm pain, and speak with control.",
    activities: [
      "10-second, 20-second, and attorney-friendly product explanation",
      "Pain-point mapping for immigration firms",
      "Sales control, confidence, questions, and next steps",
      "Product quiz and roleplay"
    ],
    script:
      "Coverable helps immigration firms prepare legal documents and case materials faster with AI, so attorneys and paralegals spend less time on repetitive work."
  },
  {
    id: "day2",
    title: "Day 2: Gatekeeper and Appointment Setting",
    focus: "Get through the front desk, create curiosity, and book demos.",
    activities: [
      "Gatekeeper psychology",
      "Transfer scripts and rebuttal drills",
      "Attorney cold-call opener",
      "Demo booking and confirmation email"
    ],
    script:
      "Hi, this is [Name] with Coverable. I am reaching out regarding legal document preparation and immigration case workflow for the firm. Who would be the best attorney to speak with about that?"
  },
  {
    id: "day3",
    title: "Day 3: Discovery, ROI, and Closing",
    focus: "Run a sales call, uncover pain, handle objections, and ask for next step.",
    activities: [
      "Full closing call framework",
      "Discovery and pain questions",
      "ROI framing with labor savings",
      "Trial closes, direct closes, pilot closes"
    ],
    script:
      "If your paralegal spends 8 hours preparing a case packet and Coverable saves even 3 hours across 20 cases per month, that is 60 staff hours saved monthly."
  },
  {
    id: "day4",
    title: "Day 4: Live Calling and Objection Gauntlet",
    focus: "Practice under pressure, review calls, and tighten weak spots.",
    activities: [
      "Live dialing blocks",
      "Gatekeeper and attorney scenarios",
      "Objection gauntlet",
      "Call review with manager notes"
    ],
    script:
      "Busy firms are usually where this makes the most sense. Would tomorrow morning or afternoon be better for a short walkthrough?"
  },
  {
    id: "day5",
    title: "Day 5: Certification and Clearance",
    focus: "Prove readiness for independent live prospecting.",
    activities: [
      "Live calling expectations",
      "Gatekeeper certification",
      "Appointment-setting certification",
      "Closing-call certification and improvement plan"
    ],
    script: "Do you want to move forward and test this with your team?"
  }
];

export const objectionBank = [
  {
    objection: "Send me information.",
    response:
      "I can, but most of the value depends on your workflow. A generic PDF will not show whether this saves your team time. Let's do a quick 10-15 minute walkthrough, then I will send details that match your firm."
  },
  {
    objection: "We already have software.",
    response:
      "Most firms already have case management software. Coverable is different because it focuses on reducing repetitive drafting, document preparation, briefs, motions, and case materials."
  },
  {
    objection: "I do not trust AI for legal work.",
    response:
      "That is fair. Coverable is not meant to replace attorney judgment. The attorney still reviews and controls the final work. The value is reducing repetitive preparation before final review."
  },
  {
    objection: "We have paralegals for that.",
    response:
      "Exactly. Coverable is designed to make those paralegals more productive, so they can get through repetitive prep faster and focus on higher-value work."
  }
];

export const initialState = {
  activeView: "team",
  activeDay: "day1",
  currentRepId: "maya",
  reps: [
    { id: "maya", name: "Maya Rivera", initials: "MR", startDate: "2026-05-18" },
    { id: "eli", name: "Eli Cohen", initials: "EC", startDate: "2026-05-13" },
    { id: "sofia", name: "Sofia Patel", initials: "SP", startDate: "2026-05-06" }
  ],
  progress: {
    maya: { day1: 100, day2: 72, day3: 35, day4: 0, day5: 0 },
    eli: { day1: 100, day2: 100, day3: 82, day4: 45, day5: 0 },
    sofia: { day1: 100, day2: 100, day3: 100, day4: 90, day5: 85 }
  },
  crm: [
    {
      id: "c1",
      repId: "sofia",
      firm: "Bright Path Immigration",
      contact: "Atty. Kim",
      contactRole: "Attorney",
      outcome: "Closed",
      channel: "Phone",
      objection: "Cost",
      saleAmount: 6000,
      contractTerm: "Annual",
      closeDate: "2026-05-20",
      notes: "Pilot approved after ROI discussion. Wants team setup next week.",
      nextFollowUp: "2026-05-27",
      createdAt: "2026-05-20"
    },
    {
      id: "c2",
      repId: "eli",
      firm: "North Star Law",
      contact: "Office Manager",
      contactRole: "Office Manager",
      outcome: "Demo Booked",
      channel: "Phone",
      objection: "Attorney is busy",
      saleAmount: 0,
      contractTerm: "",
      closeDate: "",
      notes: "Gatekeeper transferred after workflow question. Demo Friday.",
      nextFollowUp: "2026-05-23",
      createdAt: "2026-05-21"
    },
    {
      id: "c3",
      repId: "maya",
      firm: "Apex Immigration Group",
      contact: "Atty. Santos",
      contactRole: "Attorney",
      outcome: "Follow-up",
      channel: "LinkedIn",
      objection: "Follow up later",
      saleAmount: 0,
      contractTerm: "",
      closeDate: "",
      notes: "Interested in motion drafting. Asked for next month follow-up.",
      nextFollowUp: "2026-06-05",
      createdAt: "2026-05-21"
    }
  ]
};
