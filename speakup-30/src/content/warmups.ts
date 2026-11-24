export interface Exercise {
  id: string;
  title: string;
  seconds: number;
  how: string;
}

const TWISTERS = [
  "Red leather, yellow leather.",
  "Unique New York, unique New York.",
  "She sells seashells by the seashore.",
  "Toy boat, toy boat, toy boat.",
  "Proper copper coffee pot.",
  "Six slick slim sycamore saplings.",
  "Fresh fried fish, fish fresh fried.",
  "Truly rural, truly rural.",
];
const LINES = [
  "Good design starts with a clear problem.",
  "Users do not read, they scan and decide.",
  "Small details build large trust.",
  "I want to understand before I design.",
  "Simple is harder than complicated.",
  "Let me walk you through my thinking.",
  "The best answer is the one people remember.",
];

/** A short rotating warm-up. Two minutes for Days 1 to 7, three minutes after that. */
export function warmupFor(day: number): Exercise[] {
  const twister = TWISTERS[(day - 1) % TWISTERS.length];
  const line = LINES[(day - 1) % LINES.length];
  const base: Exercise[] = [
    { id: "breathe", title: "Slow breathing", seconds: 30, how: "Breathe in through your nose for 4 counts, hold for 2, out through your mouth for 6. Let your shoulders drop." },
    { id: "hum", title: "Hum and glide", seconds: 30, how: "Hum one comfortable note, then slide gently up and down. Keep your jaw loose and feel the buzz in your lips." },
    { id: "twister", title: "Tongue twister", seconds: 30, how: `Say it five times: slow, then faster, then slow again. "${twister}"` },
    { id: "line", title: "Over-articulate a line", seconds: 30, how: `Say it aloud, exaggerating every consonant. "${line}"` },
  ];
  if (day <= 7) return base;
  return [
    ...base,
    { id: "energy", title: "Three energies", seconds: 60, how: 'Say "Hi, I\'m a product designer" three times: calm, warm, then direct. Pick the one that sounds most like you.' },
  ];
}
