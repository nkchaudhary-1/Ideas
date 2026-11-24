import { kp, type DayContent } from "./types";

// Week 4 · Leadership & strategic thinking. Minimal prompter support: fewer cues, more of your own examples.
// Illustrations are generic scenarios. Replace them with real stories as soon as you can.

const NOTE = "Use this once as a reference, then rely on the key phrases. Replace every illustration with a real story of your own.";

export const WEEK4: DayContent[] = [
  {
    day: 22,
    topic: "Tell me about a disagreement with a stakeholder",
    skill: "Conflict resolution",
    objective: "Tell a disagreement story where you stayed curious, used evidence and kept the relationship.",
    scriptNote: NOTE,
    script: `The situation was {{situation|The situation|Who the stakeholder was, what they wanted, and what you believed instead. Keep it fair to them.}}. [PAUSE 1]

Let me say first that the stakeholder wasn't wrong to care. [EMPHASISE] They were protecting *something real*: {{their_goal|Their goal|What they were trying to protect, such as revenue targets, a launch date, or a brand rule.}}. [BREATHE]

My concern was {{my_concern|Your concern|What you believed would go wrong for users or the product, and why.}}.

So I started by *listening*. I asked questions until I could explain their view back to them, in a way they'd agree with. [PAUSE 1] That changed the tone of the conversation. We stopped arguing about the solution and started talking about the goal we shared.

Then I brought *evidence*, not opinions. {{evidence|The evidence you brought|A usability finding, a data point, or a prototype test. Keep it specific.}}. [TONE] And I offered a way to find out together: a small test, so the decision didn't depend on who argued better.

[CONFIDENT] We ended up with {{resolution|The resolution|What you agreed, including any compromise you made. Real examples include a phased rollout, a test, or a hybrid design.}}. [PAUSE 1]

The outcome was {{outcome|The outcome|What happened, and what happened to the relationship afterwards.}}. [BREATHE]

What I learned is that disagreements get easier when I *find the goal behind the position*, and when I make it easy for the other person to change their mind without losing face. [PAUSE 1]

[LOOK UP] I'd rather build trust and be right slowly than win the argument and lose the partnership. [PAUSE 2]`,
    guided: [
      { heading: "Situation", points: ["Who", "What they wanted", "What you believed"] },
      { heading: "Their goal", points: ["What they were protecting", "Fair to them"] },
      { heading: "Your approach", points: ["Listen first", "Explain their view back", "Shared goal"] },
      { heading: "Evidence and test", points: ["Specific finding", "Small test", "Not who argues best"] },
      { heading: "Resolution", points: ["What you agreed", "Compromise", "Relationship after"] },
      { heading: "Lesson", points: ["Goal behind the position", "Let people change their mind"] },
    ],
    questions: ["Tell me about a disagreement with a stakeholder.", "A senior leader wants a feature you think is wrong. How do you respond?", "Describe a time you changed your mind after pushback."],
    keyPoints: [
      kp("sit", "The situation", "situation", "stakeholder", "wanted", "disagree"),
      kp("goal", "Their goal and concern", "goal", "protect", "concern", "worried", "their view"),
      kp("listen", "Listening first", "listen", "understand", "asked", "their side", "explained back"),
      kp("evid", "Evidence over opinion", "evidence", "data", "test", "research", "prototype"),
      kp("res", "How it was resolved", "resolved", "agreed", "compromise", "decided", "ended up"),
      kp("rel", "The relationship after", "relationship", "trust", "afterwards", "since then"),
      kp("learn", "What you learned", "learned", "lesson", "now i", "takeaway"),
    ],
    tip: "Describe the other person fairly. If you sound generous about them, you sound senior.",
    target: [120, 180],
  },
  {
    day: 23,
    topic: "How do you influence decisions without authority?",
    skill: "Influence",
    objective: "Explain how you earn influence through trust, evidence and making it easy to say yes.",
    scriptNote: NOTE,
    script: `Influence is mostly built *before* the big decision. [PAUSE 1] I think about it in four steps.

First, *build trust early*. [EMPHASISE] I try to be useful to people long before I need anything from them. I share work in progress. I ask for their view. I fix small problems. That builds the credit I'll need later. [BREATHE]

Second, *understand what they care about*. A PM cares about outcomes and timelines. A developer cares about complexity and quality. An executive cares about risk and results. [PAUSE 1] If I frame my idea in *their* language, they hear a solution instead of a request.

Third, *bring evidence and make it small*. Instead of asking for a big redesign, I propose a *small experiment*. For example, say I think our filters are confusing shoppers. I wouldn't ask for a rebuild. I'd ask for a two-week test of one change, with a clear metric. [TONE] It's much easier to say yes to a small test.

Fourth, *make it easy to agree, and share the credit*. I prepare a one-page summary of the problem, the evidence, the options and my recommendation. [PAUSE 1] When it works, I make sure the team and the stakeholders are the heroes of the story.

[CONFIDENT] And if the answer is no, I ask what would change their mind, and I come back with that. [BREATHE]

Here's what I've noticed. People rarely resist good ideas. They resist *surprise*, *risk* and *extra work*. [PAUSE 1] If I remove those three, the idea usually moves.

[LOOK UP] So my approach is: trust first, their language, small experiments, and shared credit. [PAUSE 2]`,
    guided: [
      { heading: "Build trust early", points: ["Be useful first", "Share work in progress", "Credit for later"] },
      { heading: "Understand them", points: ["PM: outcomes", "Developer: complexity", "Executive: risk and results", "Use their language"] },
      { heading: "Evidence and small", points: ["Small experiment", "Clear metric", "Example: filter test"] },
      { heading: "Make it easy", points: ["One-page summary", "Share the credit", "If no: what would change your mind"] },
      { heading: "Insight", points: ["People resist surprise, risk, extra work"] },
    ],
    questions: ["How do you influence decisions without authority?", "How would you get a team to adopt a design system they're resisting?", "Tell me about a time you changed a senior person's mind."],
    keyPoints: [
      kp("trust", "Build trust early", "trust", "relationship", "credibility", "early"),
      kp("their", "Understand what they care about", "care about", "their goals", "their language", "motivat"),
      kp("evid", "Use evidence", "evidence", "data", "research", "prove"),
      kp("small", "Small experiments", "small", "experiment", "pilot", "test", "low risk"),
      kp("easy", "Make it easy to agree", "easy", "one-page", "summary", "recommendation"),
      kp("credit", "Share the credit", "credit", "team", "hero"),
      kp("no", "Handle a no", "no", "what would change", "come back", "objection"),
    ],
    tip: "Use a numbered structure: four steps. Influence is a vague word. Steps make it concrete.",
    target: [120, 180],
  },
  {
    day: 24,
    topic: "How do you prioritise design problems?",
    skill: "Prioritisation",
    objective: "Show a clear way to rank problems, explain the trade-offs, and communicate what you're not doing.",
    scriptNote: NOTE,
    script: `I prioritise with a simple lens, and then I check it with the team. [PAUSE 1]

Let me use an example. Say we have a list: search results are poor, filters are confusing, the size guide is hard to find, and checkout has an error on one payment method. [BREATHE] We can't fix all of them this quarter.

First, I look at *user impact*. How many people hit this problem, and how badly does it hurt them? [EMPHASISE] A payment error that blocks purchase for a few people can matter *more* than a mild annoyance for many. So I look at both *frequency* and *severity*.

Second, I look at the *business impact*. Which of these connects most directly to a goal the company cares about this quarter, like conversion or returns? [PAUSE 1]

Third, I look at *effort and risk*. [TONE] If one fix takes two days and another takes two months, that changes the order. I check with developers early, so I'm not guessing.

Fourth, *confidence*. How sure are we that we understand the problem? Where I'm unsure, I add a quick research step before committing.

Then I put them in order and *say it out loud*. For example: "The payment error comes first, because it blocks purchases and it's a quick fix. Filters come second, because the impact is high and the evidence is strong. The size guide waits for research." [PAUSE 1]

[CONFIDENT] And I explain what we're *not* doing, and why. That's as important as the list, because it's how you build trust with stakeholders.

Finally, I revisit the order regularly. Priorities should move when the evidence moves. [LOOK UP]

[PAUSE 1] My rule: impact, effort, confidence, and honest communication. [PAUSE 2]`,
    guided: [
      { heading: "Lens", points: ["User impact: frequency and severity", "Business impact", "Effort and risk", "Confidence"] },
      { heading: "Example list", points: ["Search relevance", "Confusing filters", "Size guide", "Checkout payment error"] },
      { heading: "Order it", points: ["Say it out loud", "Reason for each position"] },
      { heading: "Communicate", points: ["What we're not doing", "Why", "Revisit regularly"] },
    ],
    questions: ["How do you prioritise design problems?", "You have five important problems and capacity for two. How do you decide?", "How do you say no to a stakeholder's request?"],
    keyPoints: [
      kp("user", "User impact", "user impact", "frequency", "severity", "how many", "how badly"),
      kp("biz", "Business impact", "business", "goal", "conversion", "revenue"),
      kp("effort", "Effort and risk", "effort", "risk", "cost", "complexity", "developers"),
      kp("conf", "Confidence", "confidence", "how sure", "evidence", "uncertain"),
      kp("order", "A clear ranking with reasons", "first", "second", "comes first", "order", "rank"),
      kp("not", "What you're not doing", "not doing", "say no", "wait", "later", "trade-off"),
      kp("rev", "Revisit the order", "revisit", "review", "regularly", "change"),
    ],
    tip: "Say the ranking out loud with a reason for each. A prioritisation answer is only real if it ends in an order.",
    target: [120, 180],
  },
  {
    day: 25,
    topic: "How do you balance business goals and user needs?",
    skill: "Product thinking",
    objective: "Show that you treat business goals and user needs as connected, and handle real tension with judgement.",
    scriptNote: NOTE,
    script: `I start from a simple belief. [EMPHASISE] *The business only wins sustainably when users win first.* [PAUSE 1] So I don't see them as opposites. I see a *chain*: a business goal needs a user behaviour, and a user behaviour needs a good experience.

Take an example. Say the goal is to increase repeat purchases on a fashion app. [BREATHE] That only happens if people trust the sizing, enjoy the delivery experience and want to come back. So the business goal and the user need point in the same direction, as long as I design for the behaviour in the middle.

But there are real tensions, and I don't hide them. [TONE] Imagine the business wants to add upsell offers at checkout. They can raise average order value, but they can also slow people down and reduce trust. [PAUSE 1]

When that happens, I do three things.

First, I make the *trade-off visible*. I put both numbers on the table: the revenue we hope to gain and the risk to completion rate. Second, I look for a *middle path*. Maybe the offer appears *after* the purchase, or only when it's genuinely relevant. Third, I agree on *guardrails* before we test. For example, "if checkout completion drops by more than a set amount, we roll it back."

[CONFIDENT] I also think about *time*. Short-term gains that damage trust are usually expensive later. I try to explain that in business terms: retention, returns and brand, not just "user happiness".

[BREATHE] Finally, I try to get design, product and business looking at *shared metrics*, so we're not negotiating between opposing scoreboards.

[LOOK UP] My approach: connect the goal to a behaviour, make trade-offs visible, set guardrails, and protect long-term trust. [PAUSE 2]`,
    guided: [
      { heading: "Belief", points: ["Users win first, business wins sustainably", "A chain, not opposites"] },
      { heading: "Example", points: ["Repeat purchases", "Trust in sizing", "Delivery experience"] },
      { heading: "Real tension", points: ["Checkout upsell", "Order value up, trust at risk"] },
      { heading: "How I handle it", points: ["Make trade-off visible", "Middle path", "Guardrails", "Rollback rule"] },
      { heading: "Zoom out", points: ["Long-term trust", "Retention, returns, brand", "Shared metrics"] },
    ],
    questions: ["How do you balance business goals and user needs?", "The business wants to add a pop-up that users dislike. What do you do?", "How do you argue for the user when revenue is the priority?"],
    keyPoints: [
      kp("belief", "Users and business aren't opposites", "not opposite", "both", "together", "connected", "chain"),
      kp("ex", "A concrete example", "for example", "say ", "take ", "imagine", "checkout"),
      kp("tension", "Acknowledge a real tension", "tension", "trade-off", "conflict", "risk"),
      kp("visible", "Make the trade-off visible", "visible", "put both", "numbers", "data"),
      kp("middle", "Find a middle path", "middle", "alternative", "compromise", "after the purchase"),
      kp("guard", "Guardrails", "guardrail", "roll back", "threshold", "limit"),
      kp("long", "Long-term thinking", "long-term", "long term", "trust", "retention", "brand"),
    ],
    tip: "Name the tension honestly. Pretending there's no conflict sounds naive. Showing how you resolve it sounds senior.",
    target: [120, 180],
  },
  {
    day: 26,
    topic: "How do you measure design success?",
    skill: "Metrics and outcomes",
    objective: "Explain a clear framework for measuring design with behavioural, attitudinal and system metrics.",
    scriptNote: NOTE,
    script: `I measure design success by asking one question first: *what was this design supposed to change?* [PAUSE 1] Without that, any number is a vanity metric.

I use three layers. [BREATHE]

The first is *goals*. What does the team want? For example, "make it easier to find the right product." [EMPHASISE] Then I turn the goal into *signals*: what would we see if it worked? People would search less, filter faster and reach a product page sooner. [PAUSE 1]

Then I choose *metrics* for those signals. For this example: time to first product view, filter usage and search exit rate. And I always pair a main metric with a *guardrail*, such as returns or page speed, so we don't improve one number by hurting another.

The second layer is *behaviour and attitude together*. [TONE] Analytics tell me *what* people do. Surveys, short interviews and recordings tell me *how they feel* and *why*. I want both, because a number can go up while the experience gets worse. [BREATHE]

The third layer is the *system*. If I'm working on a design system, success looks different: how many teams adopt it, how much faster they build, and how many inconsistencies we remove. [PAUSE 1]

[CONFIDENT] I also set a *baseline and a target* before launch, so we can say honestly whether we succeeded. If we didn't, that's still useful. It tells us what to learn next.

And I'm careful with attribution. Many things change at once, so I use experiments where I can. When I can't, I say "design contributed to this", and I explain why I believe that.

[LOOK UP] Goals, signals, metrics, guardrails, and both numbers and stories. [PAUSE 2] That's how I know whether a design did its job.`,
    guided: [
      { heading: "Start with the change", points: ["What was it meant to change", "Avoid vanity metrics"] },
      { heading: "Goals to signals to metrics", points: ["Goal", "Signals", "Example: time to first product view, filter usage, search exit rate"] },
      { heading: "Guardrails", points: ["Returns", "Page speed"] },
      { heading: "Numbers and stories", points: ["Analytics: what", "Surveys, interviews, recordings: why"] },
      { heading: "System metrics", points: ["Adoption", "Build speed", "Consistency"] },
      { heading: "Honesty", points: ["Baseline and target", "Experiments", "Design contributed to"] },
    ],
    questions: ["How do you measure design success?", "How would you measure the success of a design system?", "A redesign increased conversion but users complained. What do you do?"],
    keyPoints: [
      kp("change", "Start from what it should change", "supposed to change", "goal", "objective", "intent"),
      kp("signals", "Goals to signals to metrics", "signal", "metric", "kpi", "measure"),
      kp("guard", "Guardrail metrics", "guardrail", "returns", "page speed", "counter"),
      kp("both", "Behavioural and attitudinal data", "analytics", "survey", "interview", "recordings", "qualitative", "quantitative"),
      kp("system", "Design system metrics", "adoption", "design system", "consisten", "faster"),
      kp("base", "Baseline and target", "baseline", "target", "before launch"),
      kp("attr", "Careful attribution", "experiment", "a/b", "contributed", "attribution"),
    ],
    tip: "'Goals, signals, metrics' is an easy three-part spine. Say it early and your answer will stay organised.",
    target: [120, 180],
  },
  {
    day: 27,
    topic: "How do you mentor junior designers?",
    skill: "Leadership",
    objective: "Describe a practical mentoring approach with a real example of growing someone.",
    scriptNote: NOTE,
    script: `I think good mentoring has *three jobs*: give context, give feedback and give room to grow. [PAUSE 1]

First, *context*. [EMPHASISE] Junior designers often get a task without the story behind it. So I explain the *why*: who the users are, what the business needs and what a good outcome looks like. When people understand the goal, they make better decisions on their own. [BREATHE]

Second, *feedback*, and I try to make it specific, kind and useful. Instead of "this feels off", I say, "the hierarchy on this screen makes the price compete with the offer. What if we made one clearly primary?" [PAUSE 1] I give feedback early, when it's cheap to change, and I ask them to explain their thinking first, because that's where the real learning happens.

Third, *room to grow*. I give people ownership in steps. First a component, then a flow, then a whole problem. [TONE] And I let them struggle a little. If I always step in with the answer, they never build their own judgement.

I also use *pairing*. Sitting together on a problem, thinking out loud, teaches things that a document can't. [BREATHE]

And I run *regular one-to-ones*. Not only about work. About where they want to grow, and what would stretch them next. {{example|A mentoring moment|A real story of someone you helped grow, in two sentences. What they struggled with, what you did, and what changed.}}. [PAUSE 1]

[CONFIDENT] I also try to *model* what I want to see: sharing my own mistakes, asking for feedback, and crediting others.

[LOOK UP] My goal is that, over time, they need me less. [PAUSE 1] If someone I mentored goes on to lead, that's the best outcome I can imagine. [PAUSE 2]`,
    guided: [
      { heading: "Context", points: ["Explain the why", "Users, business, good outcome"] },
      { heading: "Feedback", points: ["Specific, kind, early", "Ask for their thinking first"] },
      { heading: "Room to grow", points: ["Ownership in steps", "Component, flow, problem", "Let them struggle a little"] },
      { heading: "Habits", points: ["Pairing", "One-to-ones", "Model mistakes and credit"] },
      { heading: "A real example", points: ["What they struggled with", "What you did", "What changed"] },
    ],
    questions: ["How do you mentor junior designers?", "Tell me about a time you helped someone grow.", "How do you give difficult feedback to a designer?"],
    keyPoints: [
      kp("ctx", "Give context", "context", "why", "explain", "goal"),
      kp("feed", "Specific feedback", "feedback", "specific", "critique", "review"),
      kp("room", "Room to grow", "ownership", "room", "stretch", "responsib", "struggle"),
      kp("pair", "Pairing and one-to-ones", "pairing", "one-to-one", "1:1", "sit together", "check-in"),
      kp("model", "Model the behaviour", "model", "my own mistakes", "credit", "example"),
      kp("ex", "A real example", "for example", "one designer", "someone i", "i helped"),
      kp("goal", "Help them need you less", "need me less", "independent", "lead", "grow"),
    ],
    tip: "Give one real mentoring story. Principles are good, but a person you helped is what people remember.",
    target: [120, 180],
  },
  {
    day: 28,
    topic: "How would you improve an existing digital product?",
    skill: "Product critique",
    objective: "Run a structured product critique: user and goal, what works, ranked problems, a few improvements with hypotheses.",
    scriptNote: "Pick a real app you know well and swap the details. The structure is what matters: user, goal, strengths, problems, improvements, risks.",
    script: `I'd pick a product I know, so let me use a *fashion shopping app*. [PAUSE 1] I'll go in five steps.

*One: the user and the goal.* [BREATHE] Say the user is a busy shopper who wants to find something she likes quickly. And the business goal is to turn browsing into purchases without increasing returns. [PAUSE 1]

*Two: what works.* [EMPHASISE] I always start here, because you don't want to break what already helps people. Maybe the photography is excellent, and the product pages feel trustworthy. I'd protect those.

*Three: the problems, in order.* I walk the journey as the user: discover, browse, decide, buy, receive. [TONE] Say I find three issues. The filters are hidden behind a small icon. The size guidance is generic. And the checkout asks for account creation too early. [PAUSE 1] I rank them by *impact and effort*. I'd say checkout and sizing matter most for the goal.

*Four: improvements, with hypotheses.* For checkout: "If we allow guest purchase, completion will rise, because we remove a step." For sizing: "If we show fit feedback from other buyers, size-related returns will fall, because people feel surer." [BREATHE] For each, I define the metric and a guardrail.

*Five: risks and next steps.* [CONFIDENT] Guest checkout might reduce account sign-ups, so I'd watch that. I'd test with a small group first, and talk to a few users before and after. [PAUSE 1]

What I like about this is that every recommendation has a *reason, a measure and a risk*. It isn't "I'd make it prettier". [BREATHE]

[LOOK UP] So: user and goal, protect what works, rank the problems, form hypotheses, then test. [PAUSE 2]`,
    guided: [
      { heading: "User and goal", points: ["Who", "What they want", "Business goal"] },
      { heading: "What works", points: ["Protect it", "Photography, trust"] },
      { heading: "Problems, ranked", points: ["Walk the journey", "Hidden filters", "Generic sizing", "Early account creation", "Impact and effort"] },
      { heading: "Improvements", points: ["Hypothesis for each", "Metric and guardrail"] },
      { heading: "Risks and next steps", points: ["Side effects", "Small test", "Talk to users"] },
    ],
    questions: ["How would you improve an existing digital product?", "Pick an app you use daily. What would you change first and why?", "Critique the search experience on a fashion shopping app."],
    keyPoints: [
      kp("user", "The user and goal", "user", "goal", "customer", "shopper"),
      kp("works", "What already works", "what works", "strength", "protect", "good about"),
      kp("prob", "The problems", "problem", "issue", "pain point", "friction"),
      kp("rank", "Rank by impact and effort", "impact", "effort", "priorit", "rank"),
      kp("hyp", "Hypotheses for improvements", "hypothesis", "if we", "because", "will"),
      kp("metric", "Metrics and guardrails", "metric", "measure", "guardrail", "success"),
      kp("risk", "Risks and next steps", "risk", "test", "next step", "watch"),
    ],
    tip: "Always say what works first. It shows judgement, and it stops you from sounding like a critic.",
    target: [150, 210],
  },
];
