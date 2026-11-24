/**
 * True in the single-file artifact build (npm run artifact). In that sandbox the page has no microphone and cannot reach
 * other hosts, so speech comes from the viewer's dictation tool and the Anthropic review is switched off.
 */
export const IN_ARTIFACT = import.meta.env.VITE_ARTIFACT === "1";
