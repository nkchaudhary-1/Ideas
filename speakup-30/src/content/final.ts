import { kp, type DayContent } from "./types";

// Days 29 and 30 · No full scripts during the main challenge. Day 29 has keywords and a reference answer that opens
// only after you have spoken. Day 30 is a full interview in ten parts.

export const FINAL: DayContent[] = [
  {
    day: 29,
    topic: "What would you do in your first 90 days as a Senior Product Designer?",
    skill: "Strategic communication, planning, prioritisation, leadership and stakeholder alignment",
    objective: "Present a clear 30-60-90 plan from memory, with stakeholder alignment and priorities, without reading.",
    guided: [
      { heading: "First 30 days: listen and learn", points: ["Meet PM, engineering, design, support", "Audit the product and research", "Learn the data and goals", "One small visible win"] },
      { heading: "Days 31 to 60: align and deliver", points: ["Agree two or three priorities with PM", "Ship improvements", "Fix gaps in the design system", "Set rituals: reviews, critiques"] },
      { heading: "Days 61 to 90: lead and shape", points: ["Design direction for the next two quarters", "Measure and share impact", "Mentor and hire", "Review: what worked, what next"] },
      { heading: "Stakeholder alignment", points: ["Who matters", "Their goals", "Regular check-ins", "No surprises"] },
      { heading: "Prioritisation", points: ["Impact, effort, confidence", "Say what you will not do"] },
    ],
    questions: [
      "What would you do in your first 90 days as a Senior Product Designer?",
      "Who would you want to talk to in your first week, and why?",
      "How would you decide what to fix first?",
      "How would you build trust with a team that has worked together for years?",
    ],
    keyPoints: [
      kp("listen", "Listen and learn first", "listen", "learn", "understand", "first 30", "first month"),
      kp("people", "Meet the right people", "meet", "talk to", "one-to-one", "stakeholder", "product manager", "engineer"),
      kp("audit", "Audit the product, research and data", "audit", "research", "data", "analytics", "review what exists"),
      kp("win", "A small early win", "quick win", "early win", "small win", "visible"),
      kp("prio", "Agree priorities", "priorit", "two or three", "focus", "roadmap"),
      kp("deliver", "Deliver and set rituals", "ship", "deliver", "ritual", "critique", "design review", "design system"),
      kp("lead", "Lead and shape direction", "direction", "strategy", "vision", "mentor", "hire", "lead"),
      kp("measure", "Measure and share impact", "measure", "impact", "metric", "share", "review"),
      kp("align", "Stakeholder alignment", "align", "stakeholder", "check-in", "no surprises", "trust"),
    ],
    tip: "Give the plan three headings and say them first: listen, deliver, lead. Then fill each in with two or three items.",
    target: [180, 300],
    segments: [
      {
        id: "plan",
        title: "Your 90-day plan",
        question: "What would you do in your first 90 days as a Senior Product Designer?",
        seconds: 300,
        keyPoints: [
          kp("listen", "Listen and learn first", "listen", "learn", "understand", "first 30", "first month"),
          kp("people", "Meet the right people", "meet", "talk to", "stakeholder", "product manager", "engineer"),
          kp("audit", "Audit product, research and data", "audit", "research", "data", "analytics"),
          kp("win", "A small early win", "quick win", "early win", "small win", "visible"),
          kp("prio", "Agree priorities", "priorit", "focus", "roadmap"),
          kp("lead", "Lead and shape direction", "direction", "strategy", "vision", "mentor", "lead"),
          kp("measure", "Measure impact", "measure", "impact", "metric"),
        ],
      },
      {
        id: "people",
        title: "Who you'd talk to first",
        question: "Who would you want to talk to in your first week, and why?",
        seconds: 180,
        keyPoints: [
          kp("pm", "Product manager", "product manager", "pm"),
          kp("eng", "Engineering lead", "engineer", "developer", "tech lead"),
          kp("design", "Designers on the team", "designer", "design team", "design lead"),
          kp("users", "Support and users", "support", "customer", "user", "research"),
          kp("leader", "Senior leadership", "leadership", "head of", "director", "vp", "executive"),
          kp("why", "Why each conversation matters", "because", "so that", "to understand", "to learn"),
        ],
      },
      {
        id: "first",
        title: "What to fix first",
        question: "How would you decide what to fix first?",
        seconds: 180,
        keyPoints: [
          kp("impact", "User and business impact", "impact", "user", "business"),
          kp("effort", "Effort and risk", "effort", "risk", "cost"),
          kp("evidence", "Evidence and confidence", "evidence", "data", "confidence", "research"),
          kp("align", "Agree it with the team", "align", "agree", "pm", "stakeholder"),
          kp("not", "What you will not do", "not doing", "say no", "later", "wait"),
        ],
      },
      {
        id: "trust",
        title: "Building trust with the team",
        question: "How would you build trust with a team that has worked together for years?",
        seconds: 180,
        keyPoints: [
          kp("listen", "Listen before changing anything", "listen", "ask", "understand", "learn"),
          kp("respect", "Respect what already works", "respect", "what works", "history", "existing"),
          kp("small", "Deliver something useful early", "quick win", "small", "early", "help"),
          kp("transp", "Be open and consistent", "transparent", "open", "consistent", "no surprises", "share"),
          kp("credit", "Share credit", "credit", "team"),
        ],
      },
    ],
    reference: `This is one strong shape for the answer. Compare it with yours after you have spoken. It is a model, not a script to memorise.

In the first thirty days my job is to listen and learn. I'd meet the product manager, the engineering lead, the other designers and the support team, and I'd ask the same three questions of each: what's working, what's painful and what do you wish design did differently? I'd review the product, the research we already have and the data, so that I understand the problems before I propose anything. And I'd look for one small, visible win, such as fixing something people have complained about for a while. That builds trust early.

From day thirty-one to sixty, I'd align and deliver. I'd agree two or three priorities with the product manager, using impact, effort and confidence, and I'd be clear about what we are not doing. I'd ship real improvements, close the biggest gaps in the design system, and set up simple rituals, like weekly design critiques and a design review before anything reaches engineering.

From day sixty-one to ninety, I'd lead and shape. By then I'd have enough context to propose a design direction for the next two quarters, with metrics we can track. I'd share the impact of what we shipped, mentor the team, and ask for honest feedback on how I'm working.

Throughout, I'd keep stakeholders aligned with short, regular check-ins, so nobody is surprised. So: listen first, deliver second, lead third.`,
  },
  {
    day: 30,
    topic: "Full Senior Product Designer interview simulation",
    skill: "Complete mock interview from introduction to unexpected questions",
    objective: "Perform a complete interview, from introduction to unexpected questions, with no script.",
    guided: [
      { heading: "How it works", points: ["Ten parts", "Real questions", "Follow-ups from your answers", "No script"] },
    ],
    questions: ["Full Senior Product Designer interview simulation."],
    keyPoints: [],
    tip: "Answer the question asked, in one clear sentence, then explain. Breathe between parts.",
    target: [90, 150],
    segments: [
      {
        id: "intro",
        title: "Introduction",
        question: "Thanks for coming in. To start, tell me about yourself.",
        seconds: 90,
        keyPoints: [
          kp("role", "Role and experience", "designer", "years", "experience"),
          kp("domain", "Domain", "e-commerce", "ecommerce", "app", "products", "fashion"),
          kp("strength", "What you bring", "i bring", "strength", "good at", "care about"),
          kp("next", "What you want next", "looking for", "this role", "next", "lead"),
        ],
      },
      {
        id: "career",
        title: "Career journey",
        question: "Walk me through your career so far, and tell me why you made each move.",
        seconds: 120,
        keyPoints: [
          kp("start", "Where you started", "started", "first", "began", "joined"),
          kp("moves", "Why you moved", "moved", "because", "wanted", "next step"),
          kp("grow", "How your scope grew", "ownership", "owned", "lead", "grew"),
          kp("now", "Where you are now", "now", "today", "currently"),
        ],
      },
      {
        id: "process",
        title: "Design process",
        question: "Walk me through how you take a design problem from start to launch.",
        seconds: 120,
        keyPoints: [
          kp("problem", "Understand the problem", "problem", "business", "user", "goal"),
          kp("research", "Research", "research", "data", "interview"),
          kp("explore", "Explore and prototype", "explore", "prototype", "options", "sketch"),
          kp("test", "Test and iterate", "test", "iterate", "validate"),
          kp("measure", "Measure", "measure", "metric", "launch", "learn"),
        ],
      },
      {
        id: "portfolio",
        title: "Portfolio walkthrough",
        question: "Pick one project from your portfolio and walk me through it.",
        seconds: 180,
        keyPoints: [
          kp("ctx", "Context and problem", "problem", "context", "users"),
          kp("role", "Your role", "my role", "i owned", "i led", "i was responsible"),
          kp("moves", "Key decisions", "decision", "first", "second", "insight", "trade-off"),
          kp("result", "The result", "result", "outcome", "impact"),
          kp("lesson", "A lesson", "lesson", "learned", "differently", "next time"),
        ],
      },
      {
        id: "product",
        title: "Product thinking",
        question: "The returns rate on our fashion app is higher than we'd like. How would you approach it?",
        seconds: 120,
        keyPoints: [
          kp("why", "Find out why people return", "why", "reasons", "data", "research", "understand"),
          kp("size", "Size, fit and expectations", "size", "fit", "expectation", "photo"),
          kp("ideas", "A few ideas with hypotheses", "if we", "idea", "hypothesis", "could"),
          kp("metric", "Metrics and guardrails", "metric", "measure", "conversion", "guardrail"),
          kp("test", "How you'd test it", "test", "experiment", "pilot", "a/b"),
        ],
      },
      {
        id: "collab",
        title: "Collaboration",
        question: "A developer says your design can't ship this sprint. What do you do?",
        seconds: 120,
        keyPoints: [
          kp("understand", "Understand the constraint", "understand", "what's hard", "ask", "listen"),
          kp("options", "Offer options and trade-offs", "option", "trade-off", "phase", "simplify", "mvp"),
          kp("goal", "Protect the user goal", "goal", "user", "protect", "priority"),
          kp("pm", "Involve the PM", "pm", "product manager", "decide together"),
        ],
      },
      {
        id: "conflict",
        title: "Conflict",
        question: "Tell me about a time you strongly disagreed with a stakeholder. How did it end?",
        seconds: 120,
        keyPoints: [
          kp("sit", "The situation", "situation", "stakeholder", "disagree"),
          kp("listen", "Listening and their goal", "listen", "their goal", "understand", "concern"),
          kp("evid", "Evidence", "evidence", "data", "test", "research"),
          kp("res", "Resolution", "resolved", "agreed", "compromise", "decided"),
          kp("rel", "The relationship", "relationship", "trust", "since"),
        ],
      },
      {
        id: "leadership",
        title: "Leadership",
        question: "How would you raise the quality bar for design on a team?",
        seconds: 90,
        keyPoints: [
          kp("crit", "Critique and reviews", "critique", "review", "feedback"),
          kp("system", "Standards and a design system", "design system", "standard", "guideline", "consisten"),
          kp("mentor", "Mentoring", "mentor", "coach", "grow"),
          kp("model", "Lead by example", "example", "model", "show"),
          kp("measure", "Make quality visible", "measure", "metric", "visible", "outcome"),
        ],
      },
      {
        id: "strategy",
        title: "Strategic decision-making",
        question: "You can fund only one of three projects: a search redesign, a checkout fix, or a new size guide. How do you decide?",
        seconds: 120,
        keyPoints: [
          kp("goal", "Start from the business goal", "goal", "objective", "strategy", "company"),
          kp("impact", "Impact and evidence", "impact", "evidence", "data", "frequency"),
          kp("effort", "Effort and risk", "effort", "risk", "cost"),
          kp("recommend", "A clear recommendation", "i'd choose", "i would choose", "i'd start", "i recommend", "first"),
          kp("not", "What you wouldn't do and why", "not do", "wait", "later", "trade-off"),
        ],
      },
      {
        id: "unexpected",
        title: "Unexpected questions",
        question: "A few quick ones. What do you do when you have no data? What would your last manager say you need to work on? What's a design decision you've seen recently that you disagree with?",
        seconds: 120,
        keyPoints: [
          kp("nodata", "What you do without data", "no data", "without data", "qualitative", "talk to", "hypothesis", "small test"),
          kp("feedback", "Honest development area", "work on", "improve", "feedback", "growing", "learning"),
          kp("opinion", "A reasoned opinion", "because", "i disagree", "i would", "instead"),
        ],
      },
    ],
  },
];
