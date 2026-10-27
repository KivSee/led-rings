"""Build the Pi effect gallery: cards of effect-combination sections from sequences pulled off the Pi.

usage: python -I build_gallery.py <pi_dir> <local_shemesh.json> <shemesh_beats.txt> <template.html> <out.html>
"""
import json, os, re, sys, collections, datetime

PI, LOCAL_SHEMESH, BEATS, TEMPLATE, OUT = sys.argv[1:6]
SEQ = os.path.join(PI, 'seq')

CATEGORY = ['party', 'chill', 'mystery', 'psychedelic', 'background']
SMALL = ['el_jaguar', 'jamaican_bam_bam', 'peter_the_wolf', 'alor', 'test']
TRIGGERS = ['shemesh'] + CATEGORY + SMALL
STRUCTURAL_MS = 1500   # shorter effects are beat accents, not part of a section's identity
MIN_SECTION_MS = 1200

# --- normalize: the category triggers mix camelCase keys in; the renderer reads snake_case ----------------
KEEP_CAMEL = {'funcToRepeat', 'numberOfTimes'}   # the renderer reads these two as camelCase

def snake_key(k):
    if k in KEEP_CAMEL: return k
    if k in ('func_to_repeat', 'number_of_times'): return re.sub(r'_(\w)', lambda m: m.group(1).upper(), k)
    return re.sub(r'(?<=[a-z0-9])([A-Z])', lambda m: '_' + m.group(1).lower(), k)

def norm(o):
    if isinstance(o, dict):
        return {snake_key(k): norm(v) for k, v in o.items()}
    if isinstance(o, list):
        return [norm(x) for x in o]
    if isinstance(o, float):
        return float('%.5g' % o)
    return o

def etype(e):
    return next(k for k in e if k != 'effect_config')

# --- human-readable effect descriptions -----------------------------------------------------------------
def g(x):
    return ('%.3f' % x).rstrip('0').rstrip('.') if isinstance(x, float) else str(x)

def ff(f):
    if not isinstance(f, dict) or not f:
        return '?'
    k = next(iter(f)); v = f[k]
    if k == 'const_value': return g(v.get('value', 0))
    if k == 'linear': return f"{g(v.get('start', 0))}→{g(v.get('end', 0))}"
    if k == 'sin':
        s = f"sin[{g(v.get('min', 0))}..{g(v.get('max', 0))}]"
        if v.get('repeats', 1) != 1: s += f"×{g(v['repeats'])}"
        if v.get('phase'): s += f" φ{g(v['phase'])}"
        return s
    if k == 'steps': return f"steps {g(v.get('num_steps'))}×{g(v.get('diff_per_step'))} from {g(v.get('first_step_value', 0))}"
    if k == 'half': return f"half({ff(v.get('f1'))} | {ff(v.get('f2'))})"
    if k == 'comb2': return f"{g(v.get('amount1', 0))}·{ff(v.get('f1'))} + {g(v.get('amount2', 0))}·{ff(v.get('f2'))}"
    if k == 'repeat': return f"repeat {g(v.get('numberOfTimes'))}×({ff(v.get('funcToRepeat'))})"
    if k == 'fixed_window':
        s = f"window[{g(v.get('start', 0))}..{g(v.get('end', 0))}]({ff(v.get('func'))})"
        if v.get('outside_value'): s += f" else {g(v['outside_value'])}"
        if v.get('cyclic'): s += ' cyc'
        return s
    return k

def mult(b):
    if 'mult_factor_increase' in b: return '↑ ' + ff(b['mult_factor_increase'])
    if 'mult_factor_decrease' in b: return '× ' + ff(b['mult_factor_decrease'])
    if 'mult_factor' in b: return '× ' + ff(b['mult_factor'])
    return ''

def params(e):
    t = etype(e); b = e[t]
    if t == 'const_color':
        c = b.get('color', {}); return f"hsv({g(c.get('hue', 0))}, {g(c.get('sat', 0))}, {g(c.get('val', 0))})", c
    if t == 'rainbow': return f"hue {ff(b.get('hue_start'))} … {ff(b.get('hue_end'))}", None
    parts = []
    if 'head' in b:
        parts.append(f"head {ff(b['head'])}")
        parts.append(f"tail {ff(b.get('tail_length'))}")
        if b.get('cyclic'): parts.append('cyclic')
    if 'offset_factor' in b: parts.append('hue + ' + ff(b['offset_factor']))
    m = mult(b)
    if m: parts.append(m)
    return ' · '.join(parts), None

def cfg_text(c):
    s = ''
    if c.get('repeat_num'):
        s = f"×{g(c['repeat_num'])}"
        rs, re_ = c.get('repeat_start', 0), c.get('repeat_end', 0)
        if not (rs == 0 and re_ == 1): s += f" [{g(rs)}–{g(re_)}]"
    return s

# --- cards ----------------------------------------------------------------------------------------------
def effs_of(seq):
    out = []
    for th, v in seq.items():
        for i, e in enumerate(v['effects']):
            c = e['effect_config']
            out.append((c.get('start_time', 0), c.get('end_time', 0), th, e))
    return out

def sig_of(active):
    return tuple(sorted({f"{etype(e)}@{e['effect_config'].get('segments') or 'all'}" for e in active}))

def structural_sections(effs, lo, hi):
    """Windows in [lo, hi) where the set of long effects stays the same."""
    long_ = [x for x in effs if x[1] - x[0] >= STRUCTURAL_MS and x[0] < hi and x[1] > lo]
    bounds = sorted({lo, hi} | {min(max(x, lo), hi) for a, b, _, _ in long_ for x in (a, b)})
    secs = []
    for a, b in zip(bounds, bounds[1:]):
        sig = sig_of([e for s0, e0, _, e in long_ if s0 <= a and e0 >= b])
        if secs and secs[-1]['sig'] == sig: secs[-1]['end'] = b
        else: secs.append({'start': a, 'end': b, 'sig': sig})
    # fold slivers into the previous section, drop empty windows
    out = []
    for s in secs:
        if not s['sig']: continue
        if out and (s['end'] - s['start'] < MIN_SECTION_MS) and s['start'] == out[-1]['end']:
            out[-1]['end'] = s['end']; continue
        out.append(s)
    return [s for s in out if s['end'] - s['start'] >= MIN_SECTION_MS]

def stack(seq, ring, lo, hi):
    """Ring's effects overlapping [lo, hi), consecutive look-alikes collapsed into one row."""
    rows = []
    for e in seq[ring]['effects']:
        c = e['effect_config']
        if not (c.get('start_time', 0) < hi and c.get('end_time', 0) > lo): continue
        t = etype(e); p, color = params(e)
        key = (t, c.get('segments') or 'all', p, cfg_text(c))
        dur = c['end_time'] - c['start_time']
        if rows and rows[-1]['key'] == key:
            rows[-1]['n'] += 1; continue
        rows.append({'key': key, 'type': t, 'seg': key[1], 'p': p, 'cfg': key[3], 'n': 1,
                     'accent': dur < STRUCTURAL_MS, 'color': color})
    for r in rows: del r['key']
    return rows

def rebased(seq, ring, lo, hi):
    out = []
    for e in seq[ring]['effects']:
        c = e['effect_config']
        if not (c.get('start_time', 0) < hi and c.get('end_time', 0) > lo): continue
        e = json.loads(json.dumps(e))
        e['effect_config']['start_time'] = max(c['start_time'], lo) - lo
        e['effect_config']['end_time'] = min(c['end_time'], hi) - lo
        out.append(e)
    return out

seqs = {t: norm(json.load(open(os.path.join(SEQ, t + '.json')))) for t in TRIGGERS}
segments = json.load(open(os.path.join(PI, 'things', 'ring1.json')))
guids = {}

# shemesh: what the Pi has that the committed song file does not
local = norm(json.load(open(LOCAL_SHEMESH)))
k = lambda e: json.dumps(e, sort_keys=True)
pi_only = []
for ring, v in seqs['shemesh'].items():
    have = collections.Counter(map(k, local['sequence'][ring]['effects']))
    for e in v['effects']:
        if have[k(e)] > 0: have[k(e)] -= 1
        else: pi_only.append((e['effect_config']['start_time'], e['effect_config']['end_time']))
beats = [int(x) for x in open(BEATS).read().strip().split(',')]

cards = []
def add(trig, group, lo, hi, sig, note=''):
    seq = seqs[trig]
    n_eff = sum(1 for th in seq for e in seq[th]['effects']
                if e['effect_config']['start_time'] < hi and e['effect_config']['end_time'] > lo)
    types = sorted({etype(e) for th in seq for e in seq[th]['effects']
                    if e['effect_config']['start_time'] < hi and e['effect_config']['end_time'] > lo})
    segs = sorted({e['effect_config'].get('segments') or 'all' for th in seq for e in seq[th]['effects']
                   if e['effect_config']['start_time'] < hi and e['effect_config']['end_time'] > lo})
    newer = trig == 'shemesh' and any(a < hi and b > lo for a, b in pi_only)
    window = [e for th in seq for e in seq[th]['effects'] if e['effect_config']['start_time'] < hi and e['effect_config']['end_time'] > lo]
    dark = all(etype(e) != 'rainbow' and not any('mult_factor_increase' in e[etype(e)] for _ in [0]) and
               (etype(e) != 'const_color' or e['const_color']['color'].get('val', 0) == 0) for e in window)
    cards.append({'id': f"{trig}-{lo}", 'trigger': trig, 'group': group, 'start': lo, 'end': hi,
                  'sig': list(sig), 'types': types, 'segs': segs, 'effects': n_eff, 'newer': newer, 'dark': dark,
                  'note': note, 'stack': stack(seq, 'ring1', lo, hi),
                  'json': rebased(seq, 'ring1', lo, hi)})

for sec in local['sections']:
    lo = beats[sec['start_beat']]
    hi = beats[sec['end_beat']] if sec['end_beat'] < len(beats) else seqs['shemesh']['ring1']['duration_ms']
    effs = effs_of(seqs['shemesh'])
    for s in structural_sections(effs, lo, hi):
        add('shemesh', sec['name'], s['start'], s['end'], s['sig'])

for trig in CATEGORY:
    windows = sorted({(e['effect_config']['start_time'], e['effect_config']['end_time'])
                      for e in seqs[trig]['ring1']['effects']
                      if e['effect_config']['end_time'] - e['effect_config']['start_time'] >= 10000})
    for i, (lo, hi) in enumerate(windows):
        add(trig, f"block {i + 1}", lo, hi, sig_of([e for _, _, _, e in effs_of(seqs[trig]) if e['effect_config']['start_time'] < hi and e['effect_config']['end_time'] > lo]))

for trig in SMALL:
    for i, s in enumerate(structural_sections(effs_of(seqs[trig]), 0, seqs[trig]['ring1']['duration_ms'])):
        add(trig, f"part {i + 1}", s['start'], s['end'], s['sig'])

# number cards inside their group
grp = collections.Counter((c['trigger'], c['group']) for c in cards)
seen = collections.Counter()
for c in cards:
    seen[(c['trigger'], c['group'])] += 1
    n = grp[(c['trigger'], c['group'])]
    c['part'] = f"{seen[(c['trigger'], c['group'])]}/{n}" if n > 1 else ''

# shared combinations: same signature in more than one card
sig_count = collections.Counter(tuple(c['sig']) for c in cards)
for c in cards: c['shared'] = sig_count[tuple(c['sig'])]

usage = {t: dict(collections.Counter(etype(e) for th in seqs[t] for e in seqs[t][th]['effects'])) for t in TRIGGERS}
meta = {
    'fetched': datetime.date.today().isoformat(),
    'source': 'led-sequence-service on the Raspberry Pi (10.0.1.200:8082), segments from the object service (:8081)',
    'durations': {t: seqs[t]['ring1']['duration_ms'] for t in TRIGGERS},
    'piOnlyCount': len(pi_only) // 12,
}
data = {'meta': meta, 'usage': usage, 'cards': cards, 'segments': segments,
        'seqs': {t: {r: {'duration_ms': v['duration_ms'], 'effects': v['effects']} for r, v in seqs[t].items()} for t in TRIGGERS}}
blob = json.dumps(data, separators=(',', ':'))
html = open(TEMPLATE, encoding='utf-8').read().replace('/*__DATA__*/null', blob.replace('</', '<\\/'))
open(OUT, 'w', encoding='utf-8').write(html)
print(f"{len(cards)} cards, {len(blob) / 1e6:.2f} MB data, {len(set(map(tuple, (c['sig'] for c in cards))))} distinct combos")
for t in TRIGGERS: print(' ', t, sum(1 for c in cards if c['trigger'] == t))
