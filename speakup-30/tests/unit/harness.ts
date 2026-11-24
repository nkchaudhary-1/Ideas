// A tiny assertion harness so the tests need no framework.
let passed = 0;
let failed = 0;
export function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n    ${(e as Error).message}`);
  }
}
export function eq<T>(actual: T, expected: T, msg = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg} expected ${b}, got ${a}`);
}
export function ok(cond: unknown, msg = "expected truthy") {
  if (!cond) throw new Error(msg);
}
export function done() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}
