import { kp, type DayContent } from "./types";

// Week 3 · Portfolio & cross-functional collaboration. The scripts are scaffolds: the real project, role and results
// are placeholders you fill with your own true details. Nothing here claims a real outcome.

const NOTE = "This is a scaffold for your real project. Fill every gap with something true. If you don't have a number, say what you saw and how you know.";

export const WEEK3: DayContent[] = [
  {
    day: 15,
    topic: "Walk me through your best product design project",
    skill: "Portfolio presentation",
    objective: "Present one project in under three minutes: headline, problem, your role, key moves, result, lesson.",
    scriptNote: NOTE,
    script: `[SMILE] I'll talk about {{project|Your project|Name it and the product in one short phrase.}}. [PAUSE 1] I picked it because it shows how I work.

The headline is this. [EMPHASISE] {{headline|One-line headline|What changed, for whom. For example: shoppers could finally find the right size without leaving the page.}}. [PAUSE 1]

Here's the context. {{context|Context and problem|Two sentences: who the users were, what was going wrong, and why it mattered to the business.}}. [BREATHE]

My role was {{role|Your role|What you owned, who you worked with, and the size of the team.}}. [PAUSE 1]

I'll share the three moves that mattered most. [TONE] First, {{move1|First key move|The research or insight that changed the direction.}}. Second, {{move2|Second key move|The decision or trade-off you made, and why.}}. Third, {{move3|Third key move|How you validated or shipped it, and who helped.}}. [BREATHE]

[CONFIDENT] The result was {{result|The result|A real number or observation with its source. If you are not sure, say "about" or describe what you saw.}}. [PAUSE 1]

If I did it again, I'd {{lesson|One real lesson|What you would change, said calmly. This shows maturity, not weakness.}}. [LOOK UP]

That's the project. [PAUSE 1] I'm happy to go deeper on the research, the design decisions or how we worked with engineering. [PAUSE 2]`,
    guided: [
      { heading: "Headline", points: ["What changed", "For whom"] },
      { heading: "Context", points: ["Users", "Problem", "Business reason"] },
      { heading: "Your role", points: ["What you owned", "Team size", "Who you worked with"] },
      { heading: "Three key moves", points: ["Insight", "Decision and trade-off", "Validation and shipping"] },
      { heading: "Result and lesson", points: ["Evidence", "What you'd change"] },
    ],
    questions: ["Walk me through your best product design project.", "Pick a project from your portfolio that you're proud of and present it in three minutes.", "Which project best shows how you work, and why?"],
    keyPoints: [
      kp("head", "A clear headline", "headline", "the project", "in short", "changed"),
      kp("ctx", "Context and problem", "problem", "context", "users", "business"),
      kp("role", "Your role and ownership", "my role", "i owned", "i led", "team of", "i was responsible"),
      kp("moves", "Key moves or decisions", "decision", "first", "second", "third", "insight", "trade-off"),
      kp("result", "The result", "result", "outcome", "impact", "increase", "decrease", "improved"),
      kp("lesson", "A lesson or reflection", "lesson", "learned", "next time", "differently"),
    ],
    tip: "Put the headline first. Interviewers decide quickly whether to lean in. Give them a reason in the first ten seconds.",
    target: [120, 180],
  },
  {
    day: 16,
    topic: "Explain a challenging design problem you solved",
    skill: "Problem-solving storytelling",
    objective: "Tell a problem story with a clear tension, constraints, options, a decision and a result.",
    scriptNote: NOTE,
    script: `[SMILE] The challenge I want to share was {{problem|The problem|One sentence. For example: filters on a long listing page were confusing people and hiding the products.}}. [PAUSE 1]

It was hard for three reasons. First, {{why1|First reason it was hard|A real constraint, such as conflicting stakeholder goals.}}. Second, {{why2|Second reason|A technical, data or time constraint.}}. And third, {{why3|Third reason|What made it risky if you got it wrong.}}. [BREATHE]

[EMPHASISE] The key was to *understand the real problem* before choosing a solution. {{discover|How you found it|The research, data or conversations that showed what was really going on.}}. [PAUSE 1]

That led to a few options. One was {{opt1|Option one|A simple, low-risk approach.}}. Another was {{opt2|Option two|A bolder approach and its main risk.}}. [TONE] We weighed them against impact, effort and risk.

I recommended {{choice|The option you picked|Say which option and the one reason that decided it.}}. [PAUSE 1] Not everyone agreed at first, so I {{align|How you aligned people|For example: shared the evidence, ran a quick test, or asked each person what they were worried about.}}. [BREATHE]

[CONFIDENT] The outcome was {{outcome|The outcome|A real result or what you observed. Be precise about what you know.}}. [PAUSE 1]

[LOOK UP] What I took from it is that hard problems get easier when you separate *what's true* from *what's assumed*. [PAUSE 2]`,
    guided: [
      { heading: "The problem", points: ["One sentence", "Why it mattered"] },
      { heading: "Why it was hard", points: ["Stakeholders", "Constraints", "Risk"] },
      { heading: "Finding the real problem", points: ["Research", "Data", "Conversations"] },
      { heading: "Options", points: ["Low-risk option", "Bolder option", "Impact, effort, risk"] },
      { heading: "Decision and alignment", points: ["What you chose", "Why", "How you brought people with you"] },
      { heading: "Outcome", points: ["Result", "Lesson: true vs assumed"] },
    ],
    questions: ["Explain a challenging design problem you solved.", "Tell me about a time you had to design with real constraints.", "What's the hardest design problem you've worked on and why?"],
    keyPoints: [
      kp("prob", "The problem", "problem", "challenge", "issue"),
      kp("hard", "Why it was hard", "hard", "difficult", "constraint", "risk", "because"),
      kp("disc", "How you found the real cause", "research", "data", "found", "discovered", "understand"),
      kp("opts", "Options you considered", "option", "alternative", "approach", "considered", "weigh"),
      kp("choice", "What you chose and why", "chose", "recommended", "decided", "because"),
      kp("align", "How you aligned people", "align", "agree", "convince", "stakeholder", "evidence"),
      kp("out", "Outcome", "outcome", "result", "impact", "shipped", "launched"),
    ],
    tip: "Say the tension out loud: 'it was hard because…'. Stories need a problem the listener can feel.",
    target: [120, 180],
  },
  {
    day: 17,
    topic: "What was your contribution and ownership in the project?",
    skill: "Accountability and ownership",
    objective: "Separate what you owned, influenced and shared, without hiding or over-claiming.",
    scriptNote: NOTE,
    script: `[SMILE] I like to be clear about this, because design work is always a team effort. [PAUSE 1]

On {{project|Your project|Name it again so the answer stands alone.}}, I'd split my contribution into three parts. [BREATHE]

First, what I *owned*. [EMPHASISE] I was responsible for {{owned|What you owned|The decisions where you had the final say, such as the interaction design, the flow, or the design system components.}}. When something in that area went wrong, it was on me to fix it. [PAUSE 1]

Second, what I *influenced*. {{influenced|What you influenced|Areas where you shaped the outcome without owning it, such as scope, priorities, or the technical approach.}}. [TONE] Here I didn't decide alone. I brought evidence and options, and the team chose together.

Third, what I *supported*. {{supported|What others led|Something a teammate led where you helped, such as research analysis, front-end build, or content.}}. [PAUSE 1] I'm happy to say that part belonged to them.

[CONFIDENT] If you ask me what I'm most proud of, it's {{proud|Your proudest contribution|One specific thing that you did that changed the outcome.}}. [BREATHE]

And I'll be honest about something I got wrong. {{mistake|One thing you'd own|A small, real mistake and what you did about it.}}. [PAUSE 1]

[LOOK UP] I find that saying clearly what's mine and what's ours makes people trust the rest of the story. [PAUSE 2]`,
    guided: [
      { heading: "Framing", points: ["Design is a team effort", "Three parts"] },
      { heading: "Owned", points: ["Final say", "Accountable for fixes"] },
      { heading: "Influenced", points: ["Evidence and options", "Team decided together"] },
      { heading: "Supported", points: ["Credit to others"] },
      { heading: "Proud of / Own it", points: ["One specific contribution", "One honest mistake"] },
    ],
    questions: ["What was your contribution and ownership in the project?", "How do you talk about team work without hiding your own contribution?", "Which decisions were yours, and which weren't?"],
    keyPoints: [
      kp("own", "What you owned", "i owned", "i was responsible", "i led", "my decision", "final say"),
      kp("infl", "What you influenced", "influence", "shaped", "recommended", "advised"),
      kp("sup", "What others led", "team", "they led", "teammate", "colleague", "we"),
      kp("proud", "A specific contribution", "proud", "specific", "changed", "made a difference"),
      kp("mist", "An honest mistake", "mistake", "wrong", "learned", "missed"),
    ],
    tip: "Use 'I' for your decisions and 'we' for shared ones. Listeners notice, and it builds trust.",
    target: [90, 150],
  },
  {
    day: 18,
    topic: "Tell me about a design decision that failed",
    skill: "Failure, reflection and learning",
    objective: "Tell a failure story with ownership, what you learned and what changed in how you work.",
    scriptNote: NOTE,
    script: `[SMILE] I'll share one that taught me a lot. [PAUSE 1]

The situation was {{situation|The situation|Where and when, in one or two sentences.}}. The decision I made was {{decision|The decision|Be specific about what you chose and what you expected to happen.}}. [BREATHE]

I was confident because {{why|Why you were confident|The reasoning at the time. It should be sensible, so the story feels fair.}}. [PAUSE 1]

[TONE] But it didn't work. The signal was {{signal|How you knew|The data, feedback or behaviour that showed it wasn't working.}}. [PAUSE 1]

[EMPHASISE] I want to be clear: *that was my decision*, and I owned it. [CONFIDENT] I didn't blame the data, the timeline or anyone else. Instead I {{response|What you did next|How you reacted: communicated early, reverted, ran a quick test, or changed course.}}. [BREATHE]

When I looked back, the real mistake was {{root|The real mistake|The assumption you didn't test, or the person you didn't ask.}}. [PAUSE 1] It wasn't a bad idea. It was an *untested assumption*.

So I changed how I work. {{change|What changed|A habit or rule you adopted, such as testing earlier, a pre-mortem, or involving support teams.}}. [PAUSE 1]

[LOOK UP] I don't enjoy getting things wrong. But I've learned that a quick, honest failure early is worth much more than a slow success on the wrong problem. [PAUSE 2]`,
    guided: [
      { heading: "Situation", points: ["Where", "Decision", "What you expected"] },
      { heading: "Why you believed it", points: ["Reasonable logic at the time"] },
      { heading: "The signal", points: ["Data or feedback", "It didn't work"] },
      { heading: "Ownership", points: ["It was my decision", "What you did next"] },
      { heading: "Learning", points: ["Untested assumption", "What changed in your habits"] },
    ],
    questions: ["Tell me about a design decision that failed.", "What's the biggest mistake you've made in a project?", "Tell me about a time your design didn't work as expected."],
    keyPoints: [
      kp("sit", "The situation and decision", "situation", "decision", "decided", "we chose"),
      kp("why", "Why you believed it would work", "because", "i believed", "expected", "assumed", "confident"),
      kp("sig", "How you knew it failed", "data", "feedback", "signal", "didn't work", "dropped", "complaints"),
      kp("own", "Ownership", "my decision", "i owned", "my mistake", "i was wrong", "responsible"),
      kp("resp", "What you did next", "i then", "i reverted", "we changed", "i communicated", "fixed"),
      kp("learn", "What you learned and changed", "learned", "now i", "since then", "changed how i", "habit"),
    ],
    tip: "Take ownership in one clear sentence. Calm honesty is more impressive than a perfect story.",
    target: [90, 150],
  },
  {
    day: 19,
    topic: "How did your design impact users or the business?",
    skill: "Impact communication",
    objective: "Connect your work to outcomes, using honest evidence and careful claims.",
    scriptNote: NOTE,
    script: `[SMILE] I try to talk about impact on two levels: *users* and *the business*. [PAUSE 1]

On {{project|Your project|The project you're talking about.}}, the user problem was {{user_problem|The user problem|What people struggled with, in a sentence.}}. [BREATHE]

For users, the change I'd point to is {{user_impact|Impact on users|A behaviour or feedback change, such as fewer support questions, faster task completion, or better ratings.}}. [PAUSE 1] I know this because {{user_evidence|How you know|The source: usability tests, analytics, surveys, or recordings.}}.

For the business, the result was {{biz_impact|Impact on the business|A real metric, such as conversion, retention, returns, or support cost. Only use a number you can defend.}}. [EMPHASISE] I'd say we *contributed to* that result, because other teams were also shipping at the same time.

[PAUSE 1] I find it useful to be careful about attribution. [TONE] When something improved, I ask what else changed. If I can't tell, I say so. I'd rather be believable than impressive.

[BREATHE] Sometimes a project doesn't have a clean number. In that case I talk about what I *observed*, and the *leading signals*, such as task success in testing or fewer drop-offs at one step.

[CONFIDENT] What matters to me is that every design decision links back to a goal that someone cares about. [PAUSE 1] That's what lets the business see design as a way to solve problems, not as a cost.

[LOOK UP] So when I look at impact, I ask three questions. What changed for users? What changed for the business? And how do we *know*? [PAUSE 2]`,
    guided: [
      { heading: "Two levels", points: ["Users", "Business"] },
      { heading: "Users", points: ["Behaviour change", "Evidence: tests, analytics, recordings"] },
      { heading: "Business", points: ["Real metric", "Contributed to", "Attribution care"] },
      { heading: "No clean number", points: ["What you observed", "Leading signals"] },
      { heading: "Three questions", points: ["What changed for users", "What changed for the business", "How do we know"] },
    ],
    questions: ["How did your design impact users or the business?", "How do you show the value of design when you can't measure it directly?", "Tell me about a metric you moved and how you know it was your work."],
    keyPoints: [
      kp("users", "Impact on users", "users", "customers", "people", "shoppers"),
      kp("biz", "Impact on the business", "business", "conversion", "revenue", "retention", "returns", "cost"),
      kp("ev", "Evidence", "data", "analytics", "survey", "testing", "recordings", "evidence"),
      kp("attr", "Careful attribution", "contributed", "other teams", "attribution", "can't be sure", "also"),
      kp("lead", "Leading signals when there's no number", "observed", "leading", "signal", "qualitative", "feedback"),
      kp("goal", "Linking design to goals", "goal", "linked", "objective", "okr"),
    ],
    tip: "Say 'contributed to' instead of 'caused'. It sounds more senior, and it's usually more accurate.",
    target: [90, 150],
  },
  {
    day: 20,
    topic: "How do you collaborate with PMs and developers?",
    skill: "Cross-functional communication",
    objective: "Describe concrete habits that make collaboration smooth, including how you handle disagreement.",
    scriptNote: NOTE,
    script: `[SMILE] For me, it comes down to a few habits. [PAUSE 1] I'll start with product managers and then developers.

With a *product manager*, the most important thing is a *shared view of the problem*. [BREATHE] Before we talk solutions, we agree on who the user is, what's going wrong and what success looks like. [PAUSE 1] After that, I'm not asking for permission to design. We're working on the same question.

I also try to bring *options with trade-offs*, not a single answer. [EMPHASISE] "Here are three ways to do this. This one is fastest, this one is best for users, and this is a middle path." That way the PM can make a good call quickly.

With *developers*, I get involved *early*. [TONE] Before I polish anything, I show a rough idea and ask, "What's hard about this?" A ten-minute conversation can save two weeks of rework. [PAUSE 1]

During the build, I stay close. I write clear specs, I use the same components they use, and I review the work in the real product. [BREATHE] When something can't be built as designed, I'd rather solve it together than defend my mock-up.

[CONFIDENT] And when we disagree, I try to move from *positions* to *goals*. "What are you trying to protect? Here's what I'm trying to protect." Most disagreements get easier after that.

[PAUSE 1] We also keep a few simple rituals. A weekly check-in, a shared board and a quick demo before anything ships.

[LOOK UP] I think of PMs and developers as partners, not as people I hand work to. [PAUSE 2]`,
    guided: [
      { heading: "With PMs", points: ["Shared problem view", "Who, what, success", "Options with trade-offs"] },
      { heading: "With developers", points: ["Involve early", "Rough idea first", "Ask what is hard", "Review in the real product"] },
      { heading: "Disagreement", points: ["Positions vs goals", "What are you protecting"] },
      { heading: "Rituals", points: ["Weekly check-in", "Shared board", "Demo before shipping"] },
    ],
    questions: ["How do you collaborate with PMs and developers?", "A developer says your design is too expensive to build. What do you do?", "How do you handle a PM who wants to skip research?"],
    keyPoints: [
      kp("shared", "A shared view of the problem", "shared", "same page", "agree on", "problem"),
      kp("options", "Options with trade-offs", "options", "trade-off", "tradeoff", "alternatives"),
      kp("early", "Involve developers early", "early", "feasibility", "what's hard", "what is hard", "rough"),
      kp("build", "Stay close during the build", "specs", "components", "review", "qa", "build"),
      kp("disagree", "Handle disagreement", "disagree", "positions", "goals", "protect", "compromise"),
      kp("rituals", "Regular rituals", "weekly", "check-in", "demo", "board", "ritual"),
    ],
    tip: "Give the actual sentence you'd say ('What's hard about this?'). Quoted lines make collaboration feel real.",
    target: [90, 150],
  },
  {
    day: 21,
    topic: "Weekly review — present a project and handle follow-up questions",
    skill: "Portfolio storytelling and interaction",
    objective: "Present a project in two minutes, then answer three likely follow-ups clearly and calmly.",
    scriptNote: "Read it once to feel the shape, then switch to bullets and speak without it. The follow-up answers are model replies: say yours.",
    script: `[SMILE] Here's {{project|Your project|Name it, with the product and your role in one phrase.}}, in two minutes. [PAUSE 1]

The problem was {{problem|The problem|One sentence: who struggled, with what.}}. [EMPHASISE] We wanted to {{goal|The goal|A goal with a metric you can defend.}}. [BREATHE]

I started by {{research|Your research|What you learned, from whom.}}. That showed us {{insight|The insight|The finding that changed the plan.}}. [PAUSE 1] So we focused on {{focus|The focus|What you decided to do first and why.}}.

The result was {{result|The result|A real outcome and where you saw it.}}. [PAUSE 2]

[TONE] Now, three questions I'd expect. [PAUSE 1]

*Why did you take this approach?* [BREATHE] Because {{why|Your reason|Tie it to evidence, not taste.}}. [PAUSE 1] The evidence pointed one way, and it was the quickest way to learn if we were right.

*What alternatives did you consider?* [BREATHE] We also looked at {{alt|An alternative|A real option you rejected.}}. [PAUSE 1] We chose not to because {{alt_reason|Why you rejected it|Cost, risk or weak evidence.}}.

*What would you do differently?* [BREATHE] [CONFIDENT] I'd {{differently|What you'd change|Something specific, such as testing earlier or involving support sooner.}}. [PAUSE 1] I'd keep the rest.

[LOOK UP] Short answer first, reason second, then stop. [PAUSE 2] That's how I handle follow-ups.`,
    guided: [
      { heading: "Project in two minutes", points: ["Problem", "Goal and metric", "Research", "Insight", "Focus", "Result"] },
      { heading: "Follow-up: why this approach", points: ["Evidence", "Fastest way to learn"] },
      { heading: "Follow-up: alternatives", points: ["The other option", "Why not"] },
      { heading: "Follow-up: differently", points: ["One specific change", "Keep the rest"] },
    ],
    questions: ["Present a project and handle follow-up questions.", "Walk me through your project, then tell me why you chose that approach and what else you considered.", "What would you do differently if you ran that project again?"],
    keyPoints: [
      kp("prob", "The problem and goal", "problem", "goal", "wanted to"),
      kp("res", "Research and insight", "research", "insight", "learned", "found"),
      kp("focus", "What you focused on", "focus", "decided", "prioriti"),
      kp("result", "The result", "result", "outcome", "impact"),
      kp("why", "Why this approach", "because", "evidence", "reason"),
      kp("alt", "Alternatives considered", "alternative", "option", "instead", "considered"),
      kp("diff", "What you would do differently", "differently", "next time", "i'd change", "would change"),
    ],
    tip: "For follow-ups: answer in one sentence, add one reason, then stop. Silence after a good answer is strength.",
    target: [120, 180],
  },
];
