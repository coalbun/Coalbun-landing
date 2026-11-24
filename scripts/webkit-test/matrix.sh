#!/bin/bash
# Kör run.py på alla storlekar (bredd,höjd,säker yta uppe,säker yta nere) och sammanfattar felen.
cd "$(dirname "$0")"
OUTDIR=${OUTDIR:-/tmp/synk-webkit}
SIZES=${SIZES:-"320,568,20,0 375,667,20,0 390,844,47,34 402,874,62,34 430,932,59,34 440,956,62,34"}
CFGS=${CFGS:-"duo six ten wide"}
for s in $SIZES; do for c in $CFGS; do echo "$s,$c"; done; done | xargs -P ${P:-4} -I{} bash -c 'IFS=, read W H T B C <<< "{}"; rm -rf '$OUTDIR'/$W-$C; TMO=300 timeout 330 xvfb-run -a -s "-screen 0 1280x1100x24" /usr/bin/python3.12 run.py $W $H $T $B $C '$OUTDIR'/$W-$C >/dev/null 2>&1; echo "klar $W-$C"'
python3 - "$OUTDIR" <<'PY'
import json, glob, sys, collections
agg = collections.defaultdict(list)
for f in sorted(glob.glob(sys.argv[1] + '/*/result.json')):
    for i in json.load(open(f))['issues']:
        if i.startswith('fragor:'): continue  # svaren i Vanliga frågor är hopfällda med flit
        agg[i].append(f.split('/')[-2])
print('\n'.join(f'{k}  [{",".join(v)}]' for k, v in agg.items()) or 'Inga fel hittades.')
PY
