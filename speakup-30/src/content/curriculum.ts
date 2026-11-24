import { WEEK1 } from "./week1";
import { WEEK2 } from "./week2";
import { WEEK3 } from "./week3";
import { WEEK4 } from "./week4";
import { FINAL } from "./final";
import type { DayContent } from "./types";

export const CURRICULUM: DayContent[] = [...WEEK1, ...WEEK2, ...WEEK3, ...WEEK4, ...FINAL];
export const PROGRAMME_DAYS = CURRICULUM.length;

export function dayContent(day: number): DayContent {
  return CURRICULUM[Math.min(Math.max(day, 1), PROGRAMME_DAYS) - 1];
}

export { WEEKS, weekOf, levelFor } from "./weeks";
export { phasesForDay, plannedMinutes } from "./phases";
export { warmupFor } from "./warmups";
export type { DayContent, GuidedGroup, Segment } from "./types";
