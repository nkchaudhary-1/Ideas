#!/usr/bin/env bash
# Encodes rendered frames + the supplied song into the final MP4.
# usage: compose.sh <frames_dir> <song.mp3> <out.mp4>
# The song (Phullaan Naal Sajjeya) plays from its start for 46 s; its section entries (5.26, 14.86, 24.46, 38.86 s) are the film's anchor points.
set -e
FR="$1"; SONG="$2"; OUT="$3"
ffmpeg -y -loglevel error -framerate 30 -i "$FR/f%04d.jpg" -ss 0 -t 46 -i "$SONG" \
  -vf scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int -af "loudnorm=I=-15:TP=-1.5:LRA=11,afade=t=in:st=0:d=1.2,afade=t=out:st=43.0:d=3.0" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -level 4.2 -maxrate 28M -bufsize 56M -movflags +faststart \
  -c:a aac -b:a 256k -ar 48000 -t 46 "$OUT"
