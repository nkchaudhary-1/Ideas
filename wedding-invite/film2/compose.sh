#!/usr/bin/env bash
# Encodes rendered frames + the supplied song into the final MP4.
# usage: compose.sh <frames_dir> <song.mp3> <out.mp4>
# The song is cut from 5.86 s so its three big hits land at 10.9 s (S3 reveal), 19.9 s (hands touch) and 33.8 s (reception arrival).
set -e
FR="$1"; SONG="$2"; OUT="$3"
ffmpeg -y -loglevel error -framerate 30 -i "$FR/f%04d.jpg" -ss 5.86 -t 40 -i "$SONG" \
  -af "loudnorm=I=-15:TP=-1.5:LRA=11,afade=t=in:st=0:d=1.6,afade=t=out:st=37.0:d=3.0" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -level 4.2 -maxrate 28M -bufsize 56M -movflags +faststart \
  -c:a aac -b:a 256k -ar 48000 -t 40 "$OUT"
