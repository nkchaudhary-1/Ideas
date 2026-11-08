#!/usr/bin/env bash
# renders every scene's frames, one scene at a time with 4 workers
OUT="$1"; cd "$(dirname "$0")"
for s in 1 2 3 4 5 6; do node render.js $s "$OUT" 4; done
echo ALL_SCENES_DONE
