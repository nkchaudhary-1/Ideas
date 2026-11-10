#!/usr/bin/env bash
# Encodes rendered frames + the supplied song into the final MP4.
# usage: compose.sh <frames_dir> <song.mp3> <out.mp4> <song_start_s> <duration_s>
#   groom film:  compose.sh frames song.mp3 out.mp4 5.86 40   (its three big hits land at 10.9, 19.9 and 33.8 s)
#   bride film:  compose.sh frames song.mp3 out.mp4 0 46      (section entries 5.26, 14.86, 24.46, 38.86 s)
# Audio: same treatment for both films: 1.6 s fade in, 3 s fade out, loudness set to -14 LUFS / -1.5 dBTP with a two-pass linear
# loudnorm (a pure gain, so the fades and dynamics are untouched).
set -e
FR="$1"; SONG="$2"; OUT="$3"; SS="${4:-0}"; DUR="${5:-40}"
FADES="afade=t=in:st=0:d=1.6,afade=t=out:st=$(python3 -c "print($DUR-3)"):d=3"
TARGET="I=-14:TP=-1.5:LRA=11"
MEAS=$(ffmpeg -hide_banner -nostats -ss "$SS" -t "$DUR" -i "$SONG" -af "$FADES,loudnorm=$TARGET:print_format=json" -f null - 2>&1 | python3 -c "
import sys,json
t=sys.stdin.read(); j=json.loads(t[t.rindex('{'):t.rindex('}')+1])
print('measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s'%(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'],j['target_offset']))")
AUD="$(dirname "$OUT")/.audio_$$.m4a"
ffmpeg -y -loglevel error -ss "$SS" -t "$DUR" -i "$SONG" -af "$FADES,loudnorm=$TARGET:$MEAS:linear=true" -c:a aac -b:a 256k -ar 48000 -ac 2 "$AUD"
ffmpeg -y -loglevel error -framerate 30 -i "$FR/f%04d.jpg" -i "$AUD" \
  -vf scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int:in_range=full:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709 \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -level 4.2 -maxrate 28M -bufsize 56M -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart \
  -c:a copy -t "$DUR" "$OUT"
rm -f "$AUD"
