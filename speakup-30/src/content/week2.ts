import { kp, type DayContent } from "./types";

// Week 2 · Product design fundamentals. Structured answers, storytelling, longer speaking.
// Examples are illustrative scenarios from fashion e-commerce. They are not claims about real projects or results.

const NOTE = "The examples here are illustrations, not facts about your work. Swap in a real project as soon as you have one.";

export const WEEK2: DayContent[] = [
  {
    day: 8,
    topic: "How do you approach a new design problem?",
    skill: "Problem-solving framework",
    objective: "Explain your process as a clear sequence, with one example that shows it working.",
    scriptNote: NOTE,
    script: `[SMILE] I use a simple loop, and I adapt it to the problem. [PAUSE 1] Let me walk you through it with an example.

Say the business asks us to improve conversion on a *fashion product listing page*. [BREATHE]

I start with the *business context*. What does the team want to change, by how much, and by when? [PAUSE 1] Then I turn to the *user problem*. Who is struggling on this page, and what are they trying to do? I look at the data first, then I talk to real shoppers.

[EMPHASISE] Next comes *research and validation*. I check if the problem I think I see is the one users actually have. [PAUSE 1] Maybe people aren't leaving because the page is slow. Maybe they can't tell if a dress will fit.

Once that's clear, I *define success*. A number we can watch, like add-to-bag rate, and a guardrail, like returns. [BREATHE]

Now I can *explore solutions*. I like to sketch three very different options before choosing one. Then I *prototype* the strongest idea, and I *test* it with five to eight people. [PAUSE 1]

[TONE] What I hear in testing usually changes the design. So I *iterate*, and only then do I ship. After launch, I *measure* against the goal we set at the start.

[CONFIDENT] It's a loop, not a straight line. [LOOK UP] I might go back to research halfway through. What matters is that every decision connects to a real problem and a clear goal. [PAUSE 2]`,
    guided: [
      { heading: "Frame it", points: ["Understand business context", "Identify user problem"] },
      { heading: "Learn", points: ["Research and validate"] },
      { heading: "Aim", points: ["Define success", "Metric + guardrail"] },
      { heading: "Build", points: ["Explore solutions", "Prototype", "Test", "Iterate"] },
      { heading: "Close the loop", points: ["Measure", "Back to research if needed"] },
    ],
    questions: ["How do you approach a new design problem?", "A PM brings you a vague problem on Monday. What do you do first?", "Walk me through your process on a problem you've never seen before."],
    keyPoints: [
      kp("biz", "Understand the business context", "business", "goal", "context", "objective"),
      kp("user", "Identify the user problem", "user", "customer", "shopper", "problem"),
      kp("research", "Research and validate", "research", "validate", "interview", "data", "talk to"),
      kp("success", "Define success", "success", "metric", "measure", "kpi"),
      kp("explore", "Explore solutions", "explore", "options", "sketch", "ideas"),
      kp("proto", "Prototype", "prototype", "wireframe", "mock"),
      kp("test", "Test", "test", "usability", "validate with"),
      kp("iter", "Iterate", "iterate", "improve", "refine", "revise"),
      kp("meas", "Measure after launch", "after launch", "monitor", "measure", "track"),
    ],
    tip: "Name the steps in order, then spend your time on the one that matters most for this problem.",
    target: [90, 150],
  },
  {
    day: 9,
    topic: "How do you conduct user research?",
    skill: "Research methodology",
    objective: "Show that you choose a method to fit the question, and that you can run it end to end.",
    scriptNote: NOTE,
    script: `[SMILE] I always start with the *question*, not the method. [PAUSE 1] The question decides how I do the research.

Let me use an example. Say a fashion app has a high return rate, and we want to understand why. [BREATHE]

First I look at what we already know. *Analytics* tell me *what* is happening, such as which categories get returned most. *Support tickets* and reviews give me early clues about *why*. [PAUSE 1] That keeps me from running research to learn what we could have found in an afternoon.

Then I choose the right method. [EMPHASISE] For *why* questions, I use *interviews* and *usability sessions*. For *how many* questions, I use *surveys* or *analytics*. I try not to mix them up. [PAUSE 1]

Next I plan it properly. I write a short research goal. I recruit people who really match our shoppers. And I prepare open questions, like "Tell me about the last time you returned something", instead of leading ones. [BREATHE]

During the session, I listen more than I talk. [TONE] When someone says something surprising, I follow it with "Tell me more about that."

Afterwards, I *synthesise*. I group what I heard into themes, and I note how many people said each one. [PAUSE 1] Then I share a short summary with the team, ideally with a clip of a real customer.

[CONFIDENT] For me, research isn't a phase. It's how the team gets confident enough to make a decision. [LOOK UP] And the best research is the kind that changes what we build next. [PAUSE 2]`,
    guided: [
      { heading: "Start with", points: ["The question, not the method", "What we already know"] },
      { heading: "Sources", points: ["Analytics: what", "Tickets and reviews: clues to why"] },
      { heading: "Methods", points: ["Interviews and usability: why", "Surveys and analytics: how many"] },
      { heading: "Run it", points: ["Research goal", "Right participants", "Open questions", "Listen"] },
      { heading: "Share", points: ["Themes", "How many said it", "Short summary", "Real clip"] },
    ],
    questions: ["How do you conduct user research?", "Tell me how you would research why shoppers abandon their bag.", "How do you decide between interviews, surveys and analytics?"],
    keyPoints: [
      kp("q", "Start from the question", "question", "research goal", "what we want to learn"),
      kp("exist", "Use existing data first", "analytics", "data", "support", "tickets", "reviews"),
      kp("method", "Choose a method to fit", "interview", "survey", "usability", "method"),
      kp("recruit", "Recruit the right people", "recruit", "participants", "right people", "match"),
      kp("run", "Run it with open questions", "open question", "listen", "tell me about"),
      kp("synth", "Synthesise into themes", "synthes", "theme", "pattern", "group"),
      kp("share", "Share with the team", "share", "present", "summary", "clip", "playback"),
    ],
    tip: "Use 'what / why / how many' to explain method choice. It's a memorable way to show judgement.",
    target: [90, 150],
  },
  {
    day: 10,
    topic: "How do you convert user insights into design decisions?",
    skill: "Insight-to-action storytelling",
    objective: "Show the path from a research finding to a specific, defensible decision.",
    scriptNote: NOTE,
    script: `[SMILE] An insight only matters if it changes a decision. [PAUSE 1] So I try to connect them in a clear chain.

Here's an example. Say that in interviews, several shoppers tell us, "I never trust the size chart." [BREATHE]

That's an *observation*. To turn it into an *insight*, I ask what's underneath. People aren't saying "the chart is ugly". [EMPHASISE] They're saying, *"I'm afraid of buying the wrong size."* That's the real problem. [PAUSE 1]

From there, I write an *opportunity* in plain words: "How might we help shoppers feel sure about fit before they buy?" [BREATHE]

Then I explore *several ideas*. We could show fit feedback from other buyers. We could add a short size quiz. Or we could show the model's height next to the size she's wearing. [PAUSE 1] For each one, I ask three things. How much does it help? How hard is it to build? And how sure are we?

[CONFIDENT] Then I make a *decision*, and I write down why. For example: "We'll start with fit feedback from buyers, because it helps the most and uses data we already have."

I also tie it to a number. [TONE] If our guess is right, returns for size reasons should go down. That gives the team a way to tell whether the decision worked.

[LOOK UP] So the chain is: observation, insight, opportunity, options, decision, and a metric. [PAUSE 1] When I can walk someone through that, a design stops being an opinion and becomes a reasoned choice. [PAUSE 2]`,
    guided: [
      { heading: "Observation", points: ["What people said", "Example: 'I never trust the size chart'"] },
      { heading: "Insight", points: ["What's underneath", "Fear of the wrong size"] },
      { heading: "Opportunity", points: ["How might we", "Help people feel sure about fit"] },
      { heading: "Options", points: ["Several ideas", "Impact, effort, confidence"] },
      { heading: "Decision", points: ["Pick one", "Write down why", "Link to a metric"] },
    ],
    questions: ["How do you convert user insights into design decisions?", "Give me an example of research changing your design.", "How do you make sure research findings don't get ignored?"],
    keyPoints: [
      kp("obs", "Start with what users said", "observation", "users said", "told us", "interview"),
      kp("insight", "Find the insight underneath", "insight", "underneath", "real problem", "need"),
      kp("opp", "Frame an opportunity", "opportunity", "how might we", "problem statement"),
      kp("opts", "Explore options", "options", "ideas", "explore", "alternatives"),
      kp("dec", "Decide with a reason", "decide", "decision", "because", "chose"),
      kp("metric", "Tie it to a metric", "metric", "measure", "number", "success"),
    ],
    tip: "Say the chain out loud: 'observation, insight, opportunity, options, decision'. It's your spine for this answer.",
    target: [90, 150],
  },
  {
    day: 11,
    topic: "How do you approach information architecture?",
    skill: "Structural thinking",
    objective: "Explain how you organise content around how people think, then test it.",
    scriptNote: NOTE,
    script: `[SMILE] For me, information architecture is about *helping people find things without thinking about it*. [PAUSE 1]

Let me use a fashion catalogue as an example. [BREATHE]

I start with an *audit*. What do we have, how is it organised today, and where do people get lost? I look at search terms and navigation data, because they show me the words people really use. [PAUSE 1]

Then I focus on *how users think*, not how the business is organised. [EMPHASISE] A shopper might think in *occasions*, like "wedding guest", while our catalogue is organised by *category*, like "dresses". Neither is wrong, but I want the structure to meet people where they are.

To find that out, I use *card sorting*. I give people items and ask them to group them in a way that makes sense to them. [BREATHE] The groups and the labels they choose tell me a lot.

Next I design the *hierarchy*. Fewer top-level choices, clear labels, and no more than three levels deep wherever I can. [PAUSE 1] I decide what belongs in navigation, what belongs in *search*, and what belongs in *filters*, since people use each one differently.

[CONFIDENT] Finally, I *test the structure* before we design screens. A tree test tells me whether people can find an item using only the labels. [TONE] If they can't, it's cheaper to fix now than after launch.

[LOOK UP] Good architecture is invisible. When it works, people don't notice it. They just find what they came for. [PAUSE 2]`,
    guided: [
      { heading: "Audit", points: ["What we have", "Search terms", "Where people get lost"] },
      { heading: "Mental models", points: ["Users' words", "Occasion vs category", "Card sorting"] },
      { heading: "Structure", points: ["Hierarchy", "Few top-level choices", "Clear labels", "Three levels"] },
      { heading: "Where things live", points: ["Navigation", "Search", "Filters"] },
      { heading: "Validate", points: ["Tree test", "Fix before screens"] },
    ],
    questions: ["How do you approach information architecture?", "How would you restructure the navigation of a large fashion catalogue?", "When would you choose search over navigation?"],
    keyPoints: [
      kp("audit", "Audit what exists", "audit", "inventory", "what we have", "search terms"),
      kp("mental", "Users' mental models", "mental model", "how users think", "their words", "language"),
      kp("sort", "Card sorting", "card sort", "group", "sorting"),
      kp("hier", "Hierarchy and labels", "hierarchy", "labels", "levels", "structure"),
      kp("nav", "Navigation, search and filters", "navigation", "search", "filter"),
      kp("test", "Test the structure", "tree test", "test", "validate"),
    ],
    tip: "Contrast two views ('occasion' vs 'category'). A concrete contrast makes abstract ideas easy to follow.",
    target: [90, 150],
  },
  {
    day: 12,
    topic: "How do you balance usability and aesthetics?",
    skill: "Design judgement",
    objective: "Show that you treat the two as partners, with a clear way to decide when they conflict.",
    scriptNote: NOTE,
    script: `[SMILE] I don't see them as opposites. [PAUSE 1] I think *good aesthetics help usability*, and good usability makes aesthetics feel earned.

Here's why. People judge whether a product is trustworthy in a few seconds, and they judge it by how it looks. [EMPHASISE] A clean, consistent interface makes people feel *safe to continue*. That's aesthetics doing a usability job. [BREATHE]

But when they conflict, I have a simple order. *Clarity first, then craft.*

Let me give you an example. Say a design team loves a product page where the price is a delicate light-grey. It looks elegant in the mockup. [PAUSE 1] But on a phone, outdoors, many people can't read it. In that case, I'd make the price stronger and put the elegance somewhere else, like the typography, the spacing, and the photography.

[CONFIDENT] So I'm not removing beauty. I'm placing it where it doesn't get in the way.

To decide, I rely on a few things. *Accessibility standards*, like contrast, give me facts instead of opinions. [BREATHE] *Usability tests* show me what people really do. And a *design system* keeps the visual quality consistent, so I'm not reinventing taste on every screen.

[TONE] I also try to explain visual choices in terms of *purpose*. Not "I like it", but "this draws the eye to the primary action."

[LOOK UP] My view is that taste is a system, not a mood. [PAUSE 1] When the system is good, usability and aesthetics support each other. [PAUSE 2]`,
    guided: [
      { heading: "Position", points: ["Not opposites", "Aesthetics support trust", "Usability makes beauty earned"] },
      { heading: "Rule when they clash", points: ["Clarity first, then craft"] },
      { heading: "Example", points: ["Light-grey price", "Hard to read on a phone", "Move elegance elsewhere"] },
      { heading: "How I decide", points: ["Accessibility standards", "Usability tests", "Design system"] },
      { heading: "Close", points: ["Taste is a system", "Explain by purpose"] },
    ],
    questions: ["How do you balance usability and aesthetics?", "A stakeholder wants a more beautiful design that you think is harder to use. What do you do?", "How do you defend a visual decision?"],
    keyPoints: [
      kp("partners", "They support each other", "support", "partner", "not opposite", "trust", "together"),
      kp("order", "Clarity first, then craft", "clarity first", "usability first", "priority", "first"),
      kp("ex", "A concrete example", "for example", "example", "say ", "price", "contrast"),
      kp("access", "Accessibility and standards", "accessib", "contrast", "wcag", "standard"),
      kp("test", "Evidence from testing", "test", "research", "data"),
      kp("system", "Design system and consistency", "design system", "consisten", "system"),
    ],
    tip: "State your rule early ('clarity first, then craft'). Rules sound like judgement. Lists sound like hedging.",
    target: [90, 150],
  },
  {
    day: 13,
    topic: "How do you validate a design solution?",
    skill: "Testing and iteration",
    objective: "Explain validation before and after launch, and how you know when you're done.",
    scriptNote: NOTE,
    script: `[SMILE] I validate in *layers*, because each one answers a different question. [PAUSE 1]

Before anything gets built, I want to know: *can people use it, and do they understand it?* [BREATHE]

So I put a prototype in front of five to eight people. I give them a realistic task, like "find a black dress under three thousand rupees and add it to your bag". Then I stay quiet and watch. [EMPHASISE] Where they hesitate is more useful than anything they tell me. [PAUSE 1]

If something is unclear, we fix it and test again. Often the second round is where the real improvement happens.

After that, the question changes. *Does it work at scale, with real traffic?* [TONE] For that I like an *A/B test* where it makes sense, or a staged rollout where it doesn't. [PAUSE 1]

Before launch, I agree on the *success metric* with the team. Say it's add-to-bag rate. I also add a *guardrail*, like returns or page speed, so we don't improve one number by hurting another. [BREATHE]

After launch, I combine numbers and stories. *Analytics* show me what changed. *Session recordings* and a few follow-up conversations tell me why.

[CONFIDENT] And I'm clear about when I'm done. Not when the design looks finished, but when we've met the goal we set, or learned why we didn't. [PAUSE 1]

[LOOK UP] For me, validation isn't a final check. It's a habit of staying curious until the evidence agrees with the design. [PAUSE 2]`,
    guided: [
      { heading: "Before build", points: ["Prototype test", "Five to eight people", "Realistic task", "Watch hesitation"] },
      { heading: "Iterate", points: ["Fix, then retest"] },
      { heading: "At scale", points: ["A/B test", "Staged rollout"] },
      { heading: "Success", points: ["Agree metric first", "Guardrail metric"] },
      { heading: "After launch", points: ["Analytics: what", "Recordings and talks: why", "Done = goal met or learned why"] },
    ],
    questions: ["How do you validate a design solution?", "How do you decide a design is ready to ship?", "What do you do when test results disagree with your instinct?"],
    keyPoints: [
      kp("proto", "Test a prototype early", "prototype", "usability test", "before build", "before launch"),
      kp("task", "Realistic tasks and observation", "task", "observe", "watch", "hesitat"),
      kp("iter", "Iterate and retest", "iterate", "fix", "retest", "again"),
      kp("ab", "A/B test or rollout", "a/b", "experiment", "rollout", "staged"),
      kp("metric", "Agree the metric and guardrail", "metric", "guardrail", "success"),
      kp("after", "Measure after launch", "after launch", "analytics", "recordings", "monitor"),
    ],
    tip: "Say 'layers' and then name them. It signals that you've thought about validation as a system.",
    target: [90, 150],
  },
  {
    day: 14,
    topic: "Weekly review — explain your design process from discovery to delivery",
    skill: "Structured communication",
    objective: "Deliver a complete discovery-to-delivery story that sounds natural, not memorised.",
    scriptNote: "Read this once, then switch to guided mode and tell it in your own words. This is the full process in one answer.",
    script: `[SMILE] I'll take you through how I work, from the first conversation to the day after launch. [PAUSE 1]

*Discovery* comes first. [BREATHE] I meet the product manager, the developers and any stakeholders to understand the goal and the constraints. I look at the data, and I talk to users, so that we're solving a real problem and not an assumed one. [PAUSE 1]

Then we *define*. I write the problem in a sentence the whole team agrees with, and we choose a *success metric*. [EMPHASISE] If we can't say how we'd know it worked, we're not ready to design. [PAUSE 1]

Next is *exploration*. I sketch several directions, talk through them with the team, and pick the one or two worth taking further. [TONE] I like to involve a developer here, because a quick conversation can save weeks.

After that I *prototype and test*. I build something real enough for people to use, and I watch where they struggle. [BREATHE] We fix it, and we test again.

Then comes *delivery*, which people often underestimate. [CONFIDENT] I prepare clear specs, I use components from the design system, and I stay close to the developers during the build. I review the work in the real product, not only in the design file. [PAUSE 1]

Finally, we *launch and learn*. We watch the numbers and the feedback against the goal we set at the start. [SLOW] What we learn goes straight into the next round. [CONTINUE]

[LOOK UP] So it's discovery, definition, exploration, testing, delivery, and learning. [PAUSE 1] The same loop, scaled to the size of the problem. [PAUSE 2]`,
    guided: [
      { heading: "Discover", points: ["PM, developers, stakeholders", "Data", "Users", "Goal and constraints"] },
      { heading: "Define", points: ["Problem in one sentence", "Success metric"] },
      { heading: "Explore", points: ["Several directions", "Involve a developer early"] },
      { heading: "Prototype and test", points: ["Real enough", "Watch struggles", "Fix and retest"] },
      { heading: "Deliver", points: ["Specs", "Design system components", "Review in the real product"] },
      { heading: "Launch and learn", points: ["Numbers and feedback", "Feed the next round"] },
    ],
    questions: ["Explain your design process from discovery to delivery.", "How does your process change for a small fix versus a large redesign?", "Where does your process most often go wrong, and how do you catch it?"],
    keyPoints: [
      kp("disc", "Discovery", "discovery", "understand", "stakeholder", "goal"),
      kp("def", "Define the problem and metric", "define", "problem statement", "success metric", "metric"),
      kp("expl", "Explore options", "explor", "sketch", "options", "directions"),
      kp("proto", "Prototype and test", "prototype", "test", "usability"),
      kp("deliv", "Delivery and handoff", "deliver", "handoff", "spec", "design system", "developer"),
      kp("learn", "Launch and learn", "launch", "measure", "learn", "feedback"),
      kp("scale", "Scale the process to the problem", "scale", "small", "large", "depends"),
    ],
    tip: "Use six signposts and give each one sentence. Your listener should always know where you are in the story.",
    target: [120, 180],
  },
];
