# Layout

Every high-level layer of a song (see `song-sync.md` in the workspace `docs/` folder) starts by choosing a **layout**. A layout splits all the pixels of the installation into **1, 2, 3 or 4 groups** (1 group treats all the pixels the same). Each pixel belongs to exactly one group or is **excluded**. The layer then treats each group differently, for example a different color per group, or groups taking turns on the beat.

A group can be as coarse as whole d1 rings (odd rings vs. even rings) or as fine as parts of every d1 ring (the outer half of each ring vs. the inner half).

## Parameters

A layout has a few parameters to play with.

### Number of groups

How many groups the layout makes: **1, 2, 3 or 4**.

- **1 group**: the whole scene does the same thing. Use **same** at d2 and **same** at d1, so every pixel is in A.
- **2 groups**: every option below. Each option can be balanced or uneven (see "Balance").
- **3 or 4 groups**: either a d2 layout that makes them directly (only balanced ones: alternate where `k × G` divides 12 and, with 3 groups, square + split pairs or square + axis pairs), or a **combined** layout (below). d1 and d0 layouts on their own support 2 groups only.

#### Combined: a d2 split, then a d1 split

d2 and d1 layouts can be combined to reach 3 or 4 groups:

1. Pick a **2-group d2 layout**. It splits the d1 rings into two sets, X and Y (X is the d2 layout's group A, the larger one when uneven).
2. **3 groups**: split the rings in X with a **2-group d1 layout** into A and B. The rings in Y stay whole and become C.
3. **4 groups**: split X into A and B with one d1 layout, and Y into C and D with another (or the same) d1 layout.

Combining also gives **2-group** layouts:

- **checker**: X is split by a d1 layout, and Y gets the same split inverted (its A pixels become B and the other way round). Still balanced.
- **accent in X**: only X is split, and Y stays A. A = 1/2 + 1/4 = 3/4, so it is a least-balanced layout, with B as an accent inside X.

Per d1 ring this resolves simply: a ring in X gets X's d1 layout (its segment and position function), and a ring in Y gets Y's d1 layout, or no split for 3 groups.

Shares multiply. A balanced d2 layout with balanced d1 layouts gives 1/4, 1/4 and 1/2 for 3 groups, and 1/4 each for 4 groups.

The parts are chosen by the **balance** and **clustering** values, not one by one. Every pair of a 2-group d2 layout and a 2-group d1 layout (balanced or uneven) is built; its group shares give its balance level, and the pairs at the requested level are ranked against the clustering value (see "Clustering"). For 4 groups X and Y are split by the same d1 layout.

### d2 layout

The **d2 layout** decides which group each whole d1 ring belongs to. The options are **same**, **alternate**, **square** and **triangle**.

#### same: all d1 rings alike

The d2 layout does no grouping: all 12 d1 rings are treated the same and get identical effects. The groups are made **inside each d1 ring** instead, on its pixels through segments and position functions (described later), so the pattern is repeated on every ring.

#### alternate

The groups alternate around the d2 ring in blocks of 1, 2 or 3 rings:

| d2 layout | Rings 1-12, with 2 groups (A, B) |
|---|---|
| **alternate 1 ring** | A B A B A B A B A B A B |
| **alternate 2 rings** | A A B B A A B B A A B B |
| **alternate 3 rings** | A A A B B B A A A B B B |

With more groups, the blocks cycle through all of them. For example, alternate 1 ring with 3 groups is `A B C A B C …`. In general, ring `r` is in group `floor((r - 1) / k) mod G` for blocks of `k` rings and `G` groups.

A combination is supported only when `k × G` divides 12, so the pattern closes evenly around the circle. **Alternate 2 rings with 4 groups** (8) and **alternate 3 rings with 3 groups** (9) would leave a seam between ring 12 and ring 1, so they are **not supported**.

**Uneven alternate.** With 2 groups, alternate also comes in uneven versions for the lower balance levels (see "Balance"). The blocks repeat in a period of `P` blocks, and B gets only the last block of each period, so A takes more space: `P = 3` gives A = 2/3 (mid), `P = 4` gives A = 3/4 (least). Ring `r` is in B when `floor((r - 1) / k) mod P = P - 1`. The same seam rule applies: `k × P` must divide 12.

| d2 layout | A's share | Rings 1-12 |
|---|---|---|
| **alternate 1 ring, A A B** | 2/3 | A A B A A B A A B A A B |
| **alternate 2 rings, A A B** | 2/3 | A A A A B B A A A A B B |
| alternate 3 rings, A A B | 2/3 | not supported (3 × 3 = 9) |
| **alternate 1 ring, A A A B** | 3/4 | A A A B A A A B A A A B |
| alternate 2 rings, A A A B | 3/4 | not supported (2 × 4 = 8) |
| **alternate 3 rings, A A A B** | 3/4 | A A A A A A A A A B B B |

#### square: rings 1, 4, 7, 10 together

Rings 1, 4, 7 and 10 sit 90° apart (1:30, 4:30, 7:30, 10:30), so as one group they form a symmetric square. In **square + rest** the square is group B, because when groups are uneven A always takes more space (see "Balance"); in the 3-group options it is group A. The other 8 rings are the four pairs between the square's corners: 2-3 (right), 5-6 (bottom), 8-9 (left) and 11-12 (top).

| d2 layout | Groups | Rings 1-12 | Other groups |
|---|---|---|---|
| **square + rest** | 2 | B A A B A A B A A B A A | A = all 8 rings between, B = the square |
| **square + split pairs** | 3 | A B C A B C A B C A B C | B = first ring of each pair (2, 5, 8, 11), C = second (3, 6, 9, 12). Same as alternate 1 ring with 3 groups; every group is a square. |
| **square + axis pairs** | 3 | A B B A C C A B B A C C | B = left and right pairs (2-3, 8-9), C = top and bottom pairs (5-6, 11-12). Mirror symmetric across both axes. |

The square with **4 groups is not supported**: the 8 remaining rings don't split evenly into 3 groups.

#### triangle: rings 1, 5, 9 together

Rings 1, 5 and 9 sit 120° apart (1:30, 5:30, 9:30), so as one group they form a symmetric triangle. It is group B, the small accent group, and it is the least balanced d2 layout (see "Balance").

| d2 layout | Groups | Rings 1-12 | Other groups |
|---|---|---|---|
| **triangle + rest** | 2 | B A A A B A A A B A A A | A = the other 9 rings, in three runs of 3. B = the triangle. |

### d1 layout

The **d1 layout** does the same thing one level down. It looks at **one d1 ring** and splits its 12 small rings (d0 0-11) into groups, using the same kinds of options as the d2 layout. Only **2 groups** (A, B) are supported.

Small rings are numbered on the d1 ring's own clock, whose 12 o'clock faces the d2 center, and d0 `i` sits at local `i:30` (see CLAUDE.md "d0 rings inside a d1 ring").

| d1 layout | d0 0-11 | Groups |
|---|---|---|
| **same** | A A A A A A A A A A A A | No split: the whole d1 ring is one group. |
| **alternate 1** | A B A B A B A B A B A B | Every other small ring. |
| **alternate 2** | A A B B A A B B A A B B | Pairs of small rings. |
| **alternate 3** | A A A B B B A A A B B B | Alternating quarters of the ring. |
| **square + rest** | B A A B A A B A A B A A | B = d0 0, 3, 6, 9 (local 0:30, 3:30, 6:30, 9:30), 90° apart like d1 rings 1, 4, 7, 10 on d2. A = the other 8. |
| **triangle + rest** | B A A A B A A A B A A A | B = d0 0, 4, 8, 120° apart like d1 rings 1, 5, 9 on d2. A = the other 9. |

In general, for alternate, small ring `i` is in group `floor(i / k) mod 2`. All of these close evenly around the ring.

Instead of grouping whole small rings, a d1 layout can also **split the pixels of every small ring**, the same way on all 12 of them. Pixels are numbered on the small ring's own clock, whose 12 o'clock faces the d1 center, and pixel `p` sits at local `p:30`.

| d1 layout | Pixels 0-11 of every small ring | Groups |
|---|---|---|
| **half d0: inner / outer** | A A A B B B B B B A A A | A = the half facing the d1 center (pixels 9-11, 0-2), B = the half facing out (pixels 3-8). |
| **d0 batch 1** | A B A B A B A B A B A B | Every other pixel. |
| **d0 batch 2** | A A B B A A B B A A B B | Pairs of pixels. |
| **d0 batch 3** | A A A B B B A A A B B B | Alternating quarters of the small ring. |
| **d0 batch 4** | A A A A B B B B A A A A | Thirds: 12 pixels are 3 batches, so it does not close evenly. Pixels 8-11 and 0-3 join into one run of 8 A pixels, and B gets 4. |
| **d0 batch 6** | A A A A A A B B B B B B | Halves: A = pixels 0-5 (clockwise side), B = pixels 6-11. The split line points at the d1 center. |
| **d0 1 of 3** | B A A B A A B A A B A A | B = pixels 0, 3, 6, 9 (a square inside each small ring). A = the rest. |
| **d0 1 of 4** | B A A A B A A A B A A A | B = pixels 0, 4, 8 (a triangle inside each small ring). A = the rest. |
| **random** | scattered | Pixels are split at random across the whole d1 ring, with no shape. Different on every small ring, but the same on all 12 d1 rings (it comes from one segment). |

For batches of `b` pixels, pixel `p` is in group `floor(p / b) mod 2`, starting from pixel 0 (just clockwise of local 12).

#### How a d1 layout is applied

A d1 layout is applied by giving the effect a **float function of `relPos`**. The function returns **0 for group A** and **1 for group B**, and the effect uses that value per pixel. For example, with `position_brightness` and `mult_factor_decrease`, group A goes dark and group B keeps its brightness. To act on the other group, swap the 0 and the 1.

Use segment **`ind`**. In it, every pixel of small ring `i` has `relPos = i / 12`, so the function gives the whole small ring one value. Segment `all` (`relPos = index / 143`) almost works, but its last pixel has `relPos = 1`, which wraps back to the start of a `repeat` and lands in the wrong group.

The functions are built from two float functions:

- **`repeat(n, f)`** runs `f` `n` times across `relPos` 0-1 (`f` gets `relPos × n mod 1`).
- **`half(f1, f2)`** uses `f1` for the first half of its input (< 0.5) and `f2` for the second half.

| d1 layout | Float function (on segment `ind`) | Why |
|---|---|---|
| **same** | none: `const_value` 1 | One group, nothing to split. |
| **alternate 1** | `repeat(6, half(0, 1))` | 6 periods of 2 small rings: the first of each pair is A, the second is B. |
| **alternate 2** | `repeat(3, half(0, 1))` | 3 periods of 4 small rings: the first two are A, the next two are B. |
| **alternate 3** | `repeat(2, half(0, 1))` | 2 periods of 6 small rings: the first three are A, the next three are B. |
| **square + rest** | `repeat(4, half(half(1, 0), 0))` | 4 periods of 3 small rings, which land at 0, ⅓ and ⅔ of the period: 0 → B, ⅓ and ⅔ → A. |
| **triangle + rest** | `repeat(3, half(half(1, 0), 0))` | 3 periods of 4 small rings, at 0, ¼, ½ and ¾ of the period: only 0 → B. |

The **d0** layouts split pixels inside each small ring, so they can't use `ind`. They use segment **`centric`** instead, where pixel `p` of every small ring has `relPos = p / 12`, so the same function runs on all 12 small rings.

| d1 layout | Float function (on segment `centric`) | Why |
|---|---|---|
| **half d0: inner / outer** | `half(half(0, 1), half(1, 0))` | Quarters of the small ring: pixels 0-2 → 0, 3-5 → 1, 6-8 → 1, 9-11 → 0. |
| **d0 batch 1** | `repeat(6, half(0, 1))` | 6 periods of 2 pixels. |
| **d0 batch 2** | `repeat(3, half(0, 1))` | 3 periods of 4 pixels. |
| **d0 batch 3** | `repeat(2, half(0, 1))` | 2 periods of 6 pixels. |
| **d0 batch 4** | `repeat(1.5, half(0, 1))` | 1.5 periods of 8 pixels: pixels 0-3 → 0, 4-7 → 1, 8-11 → 0. |
| **d0 batch 6** | `half(0, 1)` | One period: pixels 0-5 → 0, 6-11 → 1. |
| **d0 1 of 3** | `repeat(4, half(half(1, 0), 0))` | 4 periods of 3 pixels: the first of each → 1 (B). |
| **d0 1 of 4** | `repeat(3, half(half(1, 0), 0))` | 3 periods of 4 pixels: the first of each → 1 (B). |

#### Other segments: arc, updown, ind

The same functions give different shapes on other segments, because each segment orders the pixels differently:

| d1 layout | Segment | Float function | Each small ring | Notes |
|---|---|---|---|---|
| **d1 half: sides** | `ind` | `half(0, 1)` | whole small rings: d0 0-5 → A, 6-11 → B | Halves of the d1 ring. The split line points at the d2 center. |
| **d1 half: inner / outer** | `ind` | `half(half(0, 1), half(1, 0))` | d0 9-11, 0-2 → A (facing the d2 center), 3-8 → B (facing out) | Halves of the d1 ring, cut across. |
| **arc half** | `arc` | `half(0, 1)` | `A A A A B B B B B A A A` | `arc` is mirrored around pixels 0 and 6 (`relPos = min(p, 12 - p) / 7`). A = 7 pixels around pixel 0, B = 5 around pixel 6 (A = 58%). |
| **arc stripes** | `arc` | `repeat(2, half(0, 1))` | `A A B B A A B A A B B A` | Stripes mirrored around pixels 0 and 6 (A = 58%). |
| **same direction half** | `updown` | `half(0, 1)` | 6 / 6, rotated per small ring | `updown` gives pixels that point the same way in space the same value (`relPos = ((i + p) mod 12) / 12`), so every small ring is cut along the same line, as if lit from one side. |
| **same direction quarters** | `updown` | `repeat(2, half(0, 1))` | 6 / 6 in alternating quarters | Quarters by direction, the same on every small ring. |

All of these were checked against the current `segments.json`.

**random** uses segment **`rand`**, which gives every pixel a random `relPos` from 0.00 to 0.99 (in steps of 0.01). A threshold function puts the pixels below the threshold in A and the rest in B, so moving the threshold sets the balance:

| random, A's share | Float function (on segment `rand`) | Threshold | A pixels of 144 | A per small ring |
|---|---|---|---|---|
| balanced (1/2) | `half(0, 1)` | 0.5 | 75 (52%) | 5-7 |
| mid (2/3) | `half(0, half(half(0, 1), 1))` | 0.625 | 93 (65%) | 7-9 |
| least (3/4) | `half(0, half(0, 1))` | 0.75 | 109 (76%) | 8-10 |

The counts come from the current `segments.json`. `half` can only cut at dyadic points (1/2, 1/4, 1/8, …), so mid uses 0.625 as the closest cut to 2/3.

In general, batch `b` is `repeat(12 / (2b), half(0, 1))`.

`0` and `1` stand for `const_value` functions. In proto, `repeat(6, half(0, 1))` is:

```json
{ "repeat": { "numberOfTimes": 6, "funcToRepeat":
  { "half": { "f1": { "const_value": { "value": 0 } },
              "f2": { "const_value": { "value": 1 } } } } } }
```

### Balance

**Balance** is how fairly the pixels are shared between the groups. The layout receives it as a number from **0 to 1**: 1 is fully balanced (every group gets the same share), 0 is the least balanced. The number does not cover every possible split. It picks one of three options. When the groups are uneven, **group A always takes more space**, and the smaller group, B, is an accent against it:

| balance | Share of A | d2 layout (d1 rings) | d1 layout (small rings, segment `ind`) | d0 pixels (segment `centric`) | random pixels (segment `rand`) |
|---|---|---|---|---|---|
| **most**: 2/3 - 1 | 1/2 | alternate (balanced) | alternate | d0 batch | `half(0, 1)` |
| **mid**: 1/3 - 2/3 | 2/3 | alternate A A B (1 or 2 rings), or square + rest: B = rings 1, 4, 7, 10 | square + rest: B = d0 0, 3, 6, 9 = `repeat(4, half(half(1, 0), 0))` | 1 of 3 pixels: `repeat(4, half(half(1, 0), 0))` | `half(0, half(half(0, 1), 1))` |
| **least**: 0 - 1/3 | 3/4 | alternate A A A B (1 or 3 rings), or triangle + rest: B = rings 1, 5, 9 | triangle + rest: B = d0 0, 4, 8 = `repeat(3, half(half(1, 0), 0))` | 1 of 4 pixels: `repeat(3, half(half(1, 0), 0))` | `half(0, half(0, 1))` |

- **Any number of groups**: balance is measured as **smallest group share / largest group share** (1 = all equal). It falls into the same three levels: **most** at 0.75 or more, **mid** from 0.4, **least** below 0.4. For 2 groups this is exactly the table above (A = 1/2 → 1, A = 2/3 → 0.5, A = 3/4 → 0.33).
- For 3 and 4 groups, the level comes from the shares of a combined layout, so uneven d2 and d1 parts are reused. For example:

  | Groups | d2 part | d1 part (splitting X) | Shares | Level |
  |---|---|---|---|---|
  | 3 | alternate A A B (X = 2/3) | balanced half | 1/3, 1/3, 1/3 | most |
  | 3 | alternate (X = 1/2) | balanced half | 1/4, 1/4, 1/2 | mid |
  | 3 | alternate (X = 1/2) | square + rest (2/3) | 1/3, 1/6, 1/2 | least |
  | 4 | alternate (X = 1/2) | balanced half (X and Y) | 1/4 each | most |
  | 4 | alternate A A B (X = 2/3) | balanced half (X and Y) | 1/3, 1/3, 1/6, 1/6 | mid |
  | 4 | alternate (X = 1/2) | triangle + rest (3/4, X and Y) | 3/8, 1/8, 3/8, 1/8 | least |

  The d2 layouts that make 3 or 4 groups directly (alternate, square + split / axis pairs) are always balanced.
- The uneven options mostly keep the layout symmetric: the accent group B is spread evenly around the ring (a square at 1/3, a triangle at 1/4) instead of bunched in one place. The one exception is d2 **alternate 3 rings, A A A B**, which puts all of B in one run (rings 10-12).
- The block size of d2 alternate (`k`) applies at every balance level (see "Uneven alternate"). The d0 batch size only applies to the balanced option.

**How balance is applied:**

- **d2 layout:** balance only changes which d1 rings are in A and which are in B. Each ring then gets its group's effects; no position function is involved.
- **d1 layout and d0 pixels:** balance changes the position function the effect gets on segment `ind`, `centric` or `rand` (the functions in the table above). The segment stays the same.

**d0 batch 4** is also uneven: A gets 8 of 12 pixels (2/3), the same share as mid.

#### How an uneven split is built

In a balanced function, `half(0, 1)` gives A the first half of every `repeat` period. To give A a different share of the period, nest `half`:

| A's share of each period | Function inside `repeat` |
|---|---|
| 1/2 | `half(0, 1)` |
| 1/4 | `half(half(0, 1), 1)` |
| 3/4 | `half(0, half(0, 1))` |

For example, on segment `centric`:

- `repeat(3, half(half(0, 1), 1))` gives every small ring `A B B B A B B B A B B B` (A gets 1 of 4 pixels). Uneven layouts use the swapped form, `repeat(3, half(half(1, 0), 0))`, so A gets the larger share: `B A A A …`.
- `repeat(3, half(0, half(0, 1)))` gives `A A A B A A A B A A A B` (3 of 4).

The share must also land on whole small rings or pixels. When a period holds 3 of them (at 0, 1/3, 2/3 of the period), `half(half(1, 0), 0)` gives B 1 of the 3 and A the other 2, which is how square + rest gets A = 2/3.

### Clustering

**Clustering** is how much each group's members bunch together into visible blocks. The layout receives it as a number from **0 to 1**: 0 is scattered (the groups mix finely, like a texture), 1 is clustered (each group forms big blocks). It replaces picking a block or batch size by hand.

Clustering depends on **scale**. A split across whole d1 rings is the most visible. A split between small rings inside a d1 ring is visible up close. A split between pixels inside a small ring is so fine that it reads as texture, even with long runs. So every layout gets a **clustering score**, and the scores of the three levels sit in separate ranges:

| Level | Score range | Layouts (score) |
|---|---|---|
| **d0 pixels** | 0 - 0.25 | random (0), d0 batch 1 / 1 of 3 / 1 of 4 (0.05), batch 2 and arc stripes (0.1), batch 3 and same direction quarters (0.15), batch 4 (0.2), batch 6, half d0: inner / outer, arc half and same direction half (0.25) |
| **d1 small rings** | 0.3 - 0.55 | alternate 1, square + rest, triangle + rest (0.3), alternate 2 (0.4), alternate 3 (0.5), d1 half: sides and inner / outer (0.55) |
| **d2 rings** | 0.6 - 1 | alternate 1 ring (and its uneven versions), square + rest, triangle + rest, square + split pairs (0.6), alternate 2 rings and square + axis pairs (0.8), alternate 3 rings (1) |

- A single layout matches when its score is within **0.15** of the clustering value. So low values pick pixel-level splits, middle values pick small-ring splits, and high values pick splits across whole d1 rings.
- **same** (1 group) has nothing to cluster and fits every value.
- Clustering and balance are chosen independently, but not every pair exists (for example, least balanced with a value around 0.8: the least balanced options score 0, 0.05, 0.3, 0.6 and 1).

**Combined layouts** (3 or 4 groups) have both a d2 part and a d1 part, so they are ranked rather than filtered. For a clustering value `c`:

- Each level has its own target that moves with `c`: the d2 target goes from 0.6 to 1 (`0.6 + 0.4c`) and the d1 target from 0 to 0.5 (`0.5c`).
- The d2 match weighs more as `c` grows: `w2 = 0.25 + 0.5c`, `w1 = 1 - w2`. A high value cares most about big blocks across rings, and a low value cares most about fine texture inside rings.
- Cost = `w2 × |target2 - score2| + w1 × |target1 - score1|`. The pairs with the lowest cost are used.

| c | Best combined pairs |
|---|---|
| 0 | alternate 1 ring + random, alternate 1 ring + batch 1 |
| 0.25 | alternate 1 ring + batch 2 or batch 3 |
| 0.5 | alternate 2 rings + inner / outer or batch 6 |
| 0.75 | alternate 2 rings + alternate 2, alternate 3 rings + alternate 2 |
| 1 | alternate 3 rings + alternate 3 |

## Resolving a layout per d1 ring

The renderer does not know about groups. It only receives, per d1 ring, a list of effects, each running on one segment. So the layout is resolved **per d1 ring** (by its index 1-12) into:

- **Whether the ring gets the effect at all.** If all of a ring's pixels are excluded, nothing is sent to it for this layer.
- **Which segment(s) to use.** A segment picks the pixels and gives each one a `relPos` (see CLAUDE.md "Addressing pixels: segments"). When a group lines up exactly with an existing segment (one small ring: `0`-`11`; every third pixel: `b1`), the segment alone selects it.
- **Which position function applies the group.** Often no segment matches the group, so the segment alone can't select it. Then the layout gives a **float function of `relPos`**, and the effect applies it with a position effect: `position_brightness` to turn pixels on or off, `position_hue` to shift their color, or `position_saturation`. The function's value says how much each pixel belongs to the group.

## Example: outer half on, inner half off

No segment covers exactly the outer half of a d1 ring, but in segment `ind` each small ring `i` has `relPos = i / 12`, and the outer half is small rings 3-8. So each ring gets a `position_brightness` effect on segment `ind` with `mult_factor_decrease` = a function that is 1 for `relPos` in [0.25, 0.75) and 0 elsewhere. Small rings 3-8 keep their brightness, and the rest go dark.
