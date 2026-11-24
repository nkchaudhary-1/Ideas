import { kp, type DayContent } from "./types";

// Week 1 · Foundation & self-expression. Short answers, simple sentences, detailed cues.
// Scripts are models to adapt, not stories to memorise. Anything personal is a {{placeholder}}.

const NOTE = "This is a model answer. Fill the gaps with your own details and change any line that isn't true for you.";

export const WEEK1: DayContent[] = [
  {
    day: 1,
    topic: "Tell me about yourself",
    skill: "Professional introduction",
    objective: "Give a clear, warm 90-second introduction without rushing.",
    scriptNote: NOTE,
    script: `[SMILE] Hi, I'm {{name|Your name|Say your first name the way you want people to say it.}}. [PAUSE 1]

I'm a product designer with about *eight years* of experience, mostly in e-commerce and consumer apps. [BREATHE]

I started out designing screens. Over time, my work moved towards *the problems behind the screens*. Why people can't find what they want. Why they hesitate at checkout. And how a team can fix that together. [PAUSE 1]

Lately I've worked on {{focus|Your recent focus|Name two or three areas, such as search, product listing pages, checkout or a design system.}}. I enjoy that kind of work because a small change reaches a lot of people.

[EMPHASISE] What I bring to a team is *clear thinking and calm collaboration*. I'm comfortable with research, I care about the details, and I work with product managers and developers from the very first conversation. [PAUSE 1]

[CONFIDENT] I've also worked on design systems, so I know how to keep a product consistent while the team keeps moving.

[LOOK UP] Right now I want a role where I can lead design on important problems and help other designers grow. [PAUSE 2] That's why this role caught my attention.`,
    guided: [
      { heading: "Who you are", points: ["Name", "Role", "Years of experience", "Type of products"] },
      { heading: "What you do best", points: ["Problems behind the screens", "Research", "Collaboration", "Design systems"] },
      { heading: "Why this role", points: ["Lead design", "Grow other designers", "Important problems"] },
    ],
    questions: ["Tell me about yourself.", "Give me your two-minute professional introduction.", "How would you describe yourself to someone who has never seen your work?"],
    keyPoints: [
      kp("role", "Your role and experience", "designer", "years", "experience", "product design"),
      kp("domain", "The kind of products", "e-commerce", "ecommerce", "app", "mobile", "consumer", "fashion", "products"),
      kp("strength", "What you bring", "i bring", "strength", "good at", "care about", "comfortable"),
      kp("work", "Recent work or focus", "recent", "lately", "currently", "working on", "worked on"),
      kp("collab", "How you work with others", "product manager", "developer", "engineer", "team", "collaborat"),
      kp("next", "What you want next", "looking for", "want a role", "next", "lead", "this role"),
    ],
    tip: "Say the first sentence slowly. A calm opening sets the pace for everything after it.",
    target: [60, 120],
  },
  {
    day: 2,
    topic: "Walk me through your 8-year design journey",
    skill: "Career storytelling",
    objective: "Tell your career as three clear chapters with a turning point.",
    scriptNote: NOTE,
    script: `[SMILE] I'll take you through it in three chapters. [PAUSE 1]

The first chapter was about *craft*. I joined {{first_company|Your first company|Name it and the kind of product, in a few words.}} as {{first_role|Your first role|Your job title back then.}}. I learned the basics properly: layouts, flows, and how to work with developers who build what you draw. [BREATHE]

The second chapter was about *ownership*. I moved to {{second_company|Your next company|Name it and say what you owned there.}}, and I stopped taking requests and started owning problems. [PAUSE 1] I began running my own research, talking to users, and asking what we should build, not only how it should look.

[TONE] The turning point was {{turning|The moment that changed you|One real moment, such as leading a redesign, owning a launch, or fixing a failed release.}}. [PAUSE 1] That's when I understood that good design is a decision, not a decoration.

The third chapter is about *leadership*. [CONFIDENT] Today I set direction on larger problems, I mentor other designers, and I help the team agree on what matters before we open a design tool. [PAUSE 1]

[LOOK UP] Looking back, the thread is the same. I keep moving *closer to the problem*, and I bring people along with me. [PAUSE 2]`,
    guided: [
      { heading: "Chapter one", points: ["Craft", "First company", "First role", "Learning the basics"] },
      { heading: "Chapter two", points: ["Ownership", "Next company", "Research", "Owning problems"] },
      { heading: "Turning point", points: ["One real moment", "What changed", "Design as a decision"] },
      { heading: "Chapter three", points: ["Leadership", "Direction", "Mentoring", "The thread: closer to the problem"] },
    ],
    questions: ["Walk me through your 8-year design journey.", "How has your work changed since you started?", "What was the biggest turning point in your career?"],
    keyPoints: [
      kp("start", "Where you started", "started", "first", "began", "joined"),
      kp("learn", "What you learned early", "learned", "craft", "basics", "foundation"),
      kp("grow", "How your scope grew", "ownership", "owned", "moved", "grew", "bigger"),
      kp("turn", "A turning point", "turning point", "changed", "moment", "realised", "realized"),
      kp("now", "Where you are now", "today", "now", "currently", "lead", "mentor"),
      kp("thread", "The thread running through it", "thread", "common", "always", "looking back", "closer to the problem"),
    ],
    tip: "Use a signpost: 'three chapters'. Listeners relax when they know how long the story is.",
    target: [90, 150],
  },
  {
    day: 3,
    topic: "Why did you choose product design?",
    skill: "Motivation and career narrative",
    objective: "Explain your motivation honestly in a way that connects to the role.",
    scriptNote: NOTE,
    script: `[SMILE] The honest answer is that I like *making things clear for people*. [PAUSE 1]

{{start|How you first got into design|One honest sentence about what pulled you in, such as a school project, a first job, or a product that frustrated you.}}. [BREATHE] What kept me in design was the moment you watch someone use something you made, and it simply works for them.

I could have stayed in pure visual design. But I kept asking *why*. Why did this person leave the page? Why did that button get ignored? [PAUSE 1] Product design gave me a way to follow those questions all the way to a decision.

[EMPHASISE] What I love about it is that it sits *between people, business and technology*. One day I'm talking to a shopper. The next day I'm with a developer working out what's possible. [PAUSE 1] That mix keeps me curious.

And honestly, e-commerce is a great place to learn it. The goals are measurable, the users are real, and a small improvement on a product page can help thousands of people find the right thing faster.

[CONFIDENT] After eight years, I'm still choosing it. [PAUSE 1] I want to keep solving problems that matter to users and to the business at the same time.

[LOOK UP] That's why product design, and why I'm still excited about it. [PAUSE 2]`,
    guided: [
      { heading: "The spark", points: ["How you started", "One honest moment"] },
      { heading: "What kept you", points: ["Watching someone use it", "Asking why", "Following questions to decisions"] },
      { heading: "Why it fits you", points: ["Between people, business, technology", "Curious", "Measurable goals"] },
      { heading: "Why still now", points: ["Eight years in", "Problems that matter", "Excited for this role"] },
    ],
    questions: ["Why did you choose product design?", "What keeps you motivated after eight years?", "What do you enjoy most about your work?"],
    keyPoints: [
      kp("spark", "How you got started", "started", "began", "first", "pulled", "got into"),
      kp("why", "What you enjoy about it", "love", "enjoy", "like", "curious", "excited"),
      kp("people", "Helping people", "people", "users", "shopper", "customer"),
      kp("between", "Where people, business and tech meet", "business", "technology", "developer", "between"),
      kp("now", "Why you still choose it", "still", "after eight", "today", "now"),
    ],
    tip: "Be specific about one moment. A real detail is more convincing than three general reasons.",
    target: [60, 120],
  },
  {
    day: 4,
    topic: "What are your strengths as a Product Designer?",
    skill: "Self-awareness and professional articulation",
    objective: "Name three strengths with proof, and one honest growth area.",
    scriptNote: NOTE,
    script: `[SMILE] I'd point to three strengths. [PAUSE 1]

The first is *structured thinking*. When a problem is messy, I break it into smaller questions and put them in order. [BREATHE] For example, if checkout drop-off is high, I don't start with screens. I start by finding *where* people leave and *why*.

The second is *collaboration*. I work with product managers and developers from day one, not at handoff. [PAUSE 1] That means fewer surprises, and a design that the team actually wants to build.

The third is *craft at scale*. I care about the details, and I also care about systems. [EMPHASISE] I like building components and patterns that make the next ten screens *faster and more consistent*.

[PAUSE 1] There's one thing I'm working on. {{growth|A real growth area|Pick something true and specific, and say what you are doing about it. For example: speaking up earlier in executive reviews.}}. [SLOW] I'm practising it deliberately, and it's already getting easier. [CONTINUE]

[CONFIDENT] So, in short: structured thinking, close collaboration, and craft that scales. [LOOK UP] Those are the things I'd bring to your team from the first week. [PAUSE 2]`,
    guided: [
      { heading: "Strength one", points: ["Structured thinking", "Break down messy problems", "Example: checkout drop-off"] },
      { heading: "Strength two", points: ["Collaboration", "PMs and developers from day one", "Fewer surprises"] },
      { heading: "Strength three", points: ["Craft at scale", "Design systems", "Faster, more consistent"] },
      { heading: "Growth area", points: ["One true area", "What you do about it"] },
    ],
    questions: ["What are your strengths as a Product Designer?", "What do colleagues say you do best?", "What is your biggest weakness, and what are you doing about it?"],
    keyPoints: [
      kp("s1", "A first strength", "strength", "first", "structured", "thinking"),
      kp("s2", "A second strength", "second", "collaborat", "work with"),
      kp("s3", "A third strength", "third", "craft", "system", "scale"),
      kp("proof", "An example as proof", "for example", "for instance", "when", "checkout", "last"),
      kp("growth", "An honest growth area", "working on", "improve", "weakness", "growth", "learning"),
      kp("sum", "A closing summary", "in short", "so ", "to sum", "overall"),
    ],
    tip: "Say 'three strengths' first. Numbering your points makes you sound organised before you say anything else.",
    target: [60, 120],
  },
  {
    day: 5,
    topic: "What is your design philosophy?",
    skill: "Expressing personal design beliefs",
    objective: "Share three beliefs that guide your work, each with a short example.",
    scriptNote: NOTE,
    script: `[SMILE] My philosophy fits in three beliefs. [PAUSE 1]

First: *start with the problem, not the screen*. A beautiful solution to the wrong problem is still wrong. [BREATHE] So before I design, I want to know who is struggling, with what, and how we'll know it's better.

Second: *clarity beats cleverness*. [EMPHASISE] If a shopper has to think about how to use a filter, we've already lost some of them. I'd rather ship something simple and obvious than something impressive that needs a tour. [PAUSE 1]

Third: *design is a team sport*. The best ideas I've seen came from conversations with developers, analysts and customer support, not from a designer alone. [CONFIDENT] My job is to make the problem visible to everyone, and then help the team choose well.

[PAUSE 1] There's a fourth thing I'd add. *Ship, learn, and improve.* [TONE] A design is a hypothesis until real people use it. I like to release in small steps and watch what happens.

[LOOK UP] That's how I work: problem first, clarity over cleverness, and design with the team. [PAUSE 2]`,
    guided: [
      { heading: "Belief one", points: ["Problem before screen", "Who, what, how we'll know"] },
      { heading: "Belief two", points: ["Clarity over cleverness", "Filter example", "Simple and obvious"] },
      { heading: "Belief three", points: ["Design is a team sport", "Developers, analysts, support"] },
      { heading: "Close", points: ["Ship, learn, improve", "Design is a hypothesis"] },
    ],
    questions: ["What is your design philosophy?", "What principles guide your decisions when there is no data?", "What does good design mean to you?"],
    keyPoints: [
      kp("b1", "Start with the problem", "problem", "who is struggling", "start with"),
      kp("b2", "Clarity over cleverness", "clarity", "simple", "clear", "obvious"),
      kp("b3", "Design with the team", "team", "together", "collaborat", "developers"),
      kp("b4", "Ship and learn", "ship", "learn", "iterate", "hypothesis", "improve"),
      kp("ex", "An example", "for example", "for instance", "filter", "shopper"),
    ],
    tip: "Pick one belief you can prove with a story. If you're asked 'why?', you'll have it ready.",
    target: [60, 120],
  },
  {
    day: 6,
    topic: "How do you approach your typical workday?",
    skill: "Explaining workflows and responsibilities",
    objective: "Describe a normal day so the listener understands how you work and what you own.",
    scriptNote: NOTE,
    script: `[SMILE] No two days are the same, but there's a rhythm. [PAUSE 1]

I start the day by *checking priorities*. What's launching, what's blocked, and what needs a decision today? [BREATHE] I'd rather spend ten minutes on that than discover a blocker at four in the afternoon.

Then I protect a block of *deep work*. This is when I explore flows, sketch options, or build a prototype. [PAUSE 1] I keep it free of meetings, because good design thinking needs long, uninterrupted time.

The middle of the day is *collaboration*. I meet the product manager to check scope. I sit with a developer to see what's possible. [EMPHASISE] And a few times a week we run a *design review*, where I share work early and ask for honest feedback.

[PAUSE 1] Some days are about *users*. I might run a usability session, watch a recording, or read support tickets to find what people struggle with. [TONE] I treat that as part of the job, not an extra.

Towards the end of the day I *write things down*: decisions, open questions, and next steps, so nobody has to guess what happened. [LOOK UP]

[CONFIDENT] It's a mix of focus, collaboration and learning from users. [PAUSE 2] That's what a good day looks like for me.`,
    guided: [
      { heading: "Morning", points: ["Check priorities", "Blockers", "Decisions needed"] },
      { heading: "Deep work", points: ["Flows", "Options", "Prototype", "Protected time"] },
      { heading: "Collaboration", points: ["PM on scope", "Developers on feasibility", "Design reviews"] },
      { heading: "Users", points: ["Usability sessions", "Recordings", "Support tickets"] },
      { heading: "End of day", points: ["Write decisions", "Open questions", "Next steps"] },
    ],
    questions: ["How do you approach your typical workday?", "How do you organise your week when several projects compete for your time?", "What does a week of design work look like for you?"],
    keyPoints: [
      kp("prio", "Starting with priorities", "priorit", "blocker", "launching", "check"),
      kp("deep", "Focused design time", "deep work", "focus", "uninterrupted", "prototype", "sketch"),
      kp("collab", "Working with PMs and developers", "product manager", "developer", "pm", "engineer"),
      kp("review", "Reviews and feedback", "review", "feedback", "critique"),
      kp("users", "Time with users or data", "user", "usability", "research", "support tickets", "recordings"),
      kp("docs", "Writing things down", "write", "document", "notes", "next steps"),
    ],
    tip: "Use time words: 'first', 'then', 'by the afternoon'. They make a list sound like a story.",
    target: [60, 120],
  },
  {
    day: 7,
    topic: "Weekly review — talk about your career and professional identity without reading",
    skill: "Fluency and confidence",
    objective: "Read the summary once, then say your professional identity in your own words with no script.",
    scriptNote: "Read this once as a warm-up. Then switch to guided mode and speak without it. Make every line your own.",
    script: `[SMILE] Here's who I am as a designer. [PAUSE 1]

I'm a product designer with eight years of experience, and I'm best when the problem is *messy and important*. [BREATHE] I like to understand people first, then business, then make the simplest thing that works.

My career has moved from *craft*, to *ownership*, to *leadership*. [PAUSE 1] I started by making screens well. I moved on to owning whole problems. Now I help teams decide *what* to solve, and I help other designers do their best work.

[EMPHASISE] I believe in *clarity over cleverness*, and in designing together with product managers and developers, not handing work over a wall. [PAUSE 1]

[CONFIDENT] What I'm known for is calm, structured thinking, and for turning a vague problem into a clear plan. [TONE] And what I'm still growing is {{growing|What you're still growing|One honest answer, such as presenting to senior leaders or setting design strategy.}}.

[LOOK UP] I'm looking for a place where I can lead design on problems that matter, with a team that wants to get better together. [PAUSE 2]`,
    guided: [
      { heading: "Who you are", points: ["Eight years", "Messy, important problems", "People, business, simple solution"] },
      { heading: "Your path", points: ["Craft", "Ownership", "Leadership"] },
      { heading: "Your beliefs", points: ["Clarity over cleverness", "Design with PMs and developers"] },
      { heading: "Known for", points: ["Calm, structured thinking", "Vague to clear plan", "Growing: one honest area"] },
      { heading: "What next", points: ["Lead design", "Problems that matter", "Team that grows together"] },
    ],
    questions: ["Talk about your career and professional identity.", "If I called your last manager, what would they say about you?", "How do you describe your professional identity in one minute?"],
    keyPoints: [
      kp("who", "Who you are as a designer", "designer", "eight years", "i am", "i'm"),
      kp("path", "How your career has moved", "craft", "ownership", "leadership", "moved", "grew"),
      kp("beliefs", "What you believe", "believe", "clarity", "principle", "philosophy"),
      kp("known", "What you are known for", "known for", "strength", "structured", "calm"),
      kp("grow", "What you are still growing", "growing", "learning", "improving", "working on"),
      kp("next", "What you want next", "looking for", "next", "lead", "want"),
    ],
    tip: "The goal today is flow, not perfect words. If you lose your place, pause, breathe, and carry on.",
    target: [90, 150],
  },
];
