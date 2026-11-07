#!/usr/bin/env bash
# usage: ./make.sh <template> <side> <out_dir>
# Records the page, synthesises the soundtrack and encodes <out_dir>/<template>-<side>.mp4
set -euo pipefail
T="${1:-raat}"; SIDE="${2:-groom}"; OUT="${3:-./out}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
case "$T" in raat) SA=146.83;; subah) SA=164.81;; kesar) SA=130.81;; *) SA=146.83;; esac
LOG="$(node "$HERE/record.js" "$T" "$SIDE" "$OUT/work")"
echo "$LOG"
DIR="$(echo "$LOG" | sed -n 's/^DIR //p')"
PLAN="$(python3 -c "import json,sys; print(json.load(open('$DIR/meta.json'))['planStart'])")"
SPAN="$(python3 -c "import json,sys; print(json.load(open('$DIR/meta.json'))['span'] + 0.7)")"
python3 "$HERE/audio.py" "$OUT/$T-$SIDE.wav" "$SPAN" "$SA" "$PLAN"
python3 "$HERE/encode.py" "$DIR" "$OUT/$T-$SIDE.mp4" "$OUT/$T-$SIDE.wav"
