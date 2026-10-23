// Generated from Timeline Manager.
import { sendSequence } from "../services/sequence";
import { startSong, trigger } from "../services/trigger";
import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats } from "../time/time";
import { phase } from "../phase/phase";
import { constColor, noColor } from "../effects/coloring";
import { addEffect } from "../effects/effect";
import {
  blink,
  brightness,
  fade,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "../effects/brightness";
import { elements, segment } from "../objects/elements";
import {
  all,
  center,
  even,
  left,
  odd,
  right,
  segment_all,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_rand,
  segment_updown,
} from "../objects/ring-elements";
import {
  snake,
  snakeFillGrow,
  snakeHeadMove,
  snakeHeadSin,
  snakeInOut,
  snakeSlowFast,
  snakeTailShrinkGrow,
  snakeHeadSteps,
  staticSnake,
} from "../effects/motion";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "../effects/hue";

const shemesh = async () => {
  const anim = new Animation("shemesh", 135, 321.47, 0, [3096,3544,3992,4440,4888,5336,5784,6232,6680,7128,7576,8024,8472,8920,9368,9816,10264,10712,11160,11608,12056,12504,12952,13400,13848,14296,14744,15192,15640,16088,16536,16984,17432,17880,18328,18776,19224,19672,20120,20568,21016,21464,21912,22360,22808,23256,23704,24152,24600,25048,25496,25944,26392,26840,27288,27736,28184,28632,29080,29528,29976,30424,30872,31320,31768,32216,32664,33112,33560,34008,34456,34904,35352,35800,36248,36696,37144,37592,38040,38488,38936,39384,39832,40280,40728,41176,41624,42072,42520,42968,43416,43864,44312,44760,45208,45656,46104,46552,47000,47448,47896,48344,48792,49240,49688,50136,50584,51032,51480,51928,52376,52824,53272,53720,54168,54616,55064,55512,55960,56408,56856,57304,57752,58200,58648,59096,59544,59992,60440,60888,61336,61784,62232,62680,63128,63576,64024,64472,64920,65368,65816,66264,66712,67160,67608,68056,68493,68941,69389,69827,70275,70723,71160,71608,72056,72493,72941,73389,73827,74275,74723,75171,75608,76056,76493,76941,77389,77827,78275,78723,79160,79608,80045,80493,80941,81389,81827,82296,82723,83171,83619,84067,84504,84952,85400,85848,86285,86733,87171,87619,88056,88493,88941,89389,89827,90275,90712,91160,91608,92056,92493,92941,93389,93837,94275,94723,95171,95608,96056,96504,96941,97389,97827,98275,98723,99171,99608,100056,100493,100941,101389,101837,102275,102723,103160,103608,104056,104504,104941,105389,105827,106275,106723,107171,107608,108056,108493,108941,109389,109837,110275,110723,111160,111608,112045,112504,112941,113389,113827,114275,114712,115171,115608,116056,116493,116941,117389,117837,118285,118733,119171,119619,120056,120504,120952,121389,121837,122285,122723,123171,123608,124056,124504,124952,125389,125837,126275,126723,127160,127608,128056,128504,128941,129389,129837,130285,130723,131171,131619,132056,132504,132952,133389,133837,134275,134723,135171,135619,136056,136504,136952,137389,137827,138275,138723,139171,139608,140056,140504,140941,141389,141837,142275,142723,143171,143619,144056,144504,144941,145389,145837,146275,146723,147171,147608,148067,148515,148963,149389,149837,150275,150723,151171,151608,152056,152504,152941,153389,153827,154275,154723,155171,155608,156056,156504,156941,157389,157837,158275,158723,159160,159608,160056,160504,160941,161389,161827,162275,162723,163171,163608,164056,164504,164952,165389,165837,166275,166723,167160,167608,168045,168493,168941,169389,169827,170275,170712,171160,171608,172056,172493,172941,173389,173827,174275,174723,175160,175608,176045,176493,176941,177389,177827,178275,178723,179160,179608,180056,180493,180941,181389,181837,182296,182744,183160,183608,184056,184504,184952,185389,185837,186275,186723,187171,187608,188056,188504,188941,189389,189837,190275,190723,191160,191608,192056,192504,192941,193389,193837,194285,194723,195171,195608,196056,196493,196952,197389,197837,198275,198723,199171,199608,200056,200504,200952,201400,201837,202285,202723,203171,203608,204056,204504,204941,205389,205837,206275,206723,207171,207608,208056,208504,208941,209389,209837,210285,210723,211160,211608,212067,212525,212963,213389,213837,214275,214723,215160,215608,216056,216493,216941,217389,217827,218275,218723,219171,219608,220056,220493,220941,221379,221837,222275,222723,223160,223608,224056,224504,224941,225389,225827,226275,226712,227171,227608,228056,228493,228941,229379,229837,230275,230723,231160,231608,232056,232504,232941,233389,233827,234275,234723,235171,235608,236056,236493,236941,237389,237827,238275,238723,239160,239608,240056,240515,240952,241400,241837,242285,242723,243171,243608,244056,244504,244952,245389,245837,246285,246723,247171,247608,248056,248504,248941,249389,249837,250275,250723,251171,251619,252067,252504,252952,253400,253837,254285,254733,255171,255619,256067,256504,256952,257389,257837,258285,258723,259171,259619,260056,260493,260952,261389,261837,262275,262723,263171,263619,264056,264504,264952,265400,265837,266285,266733,267171,267619,268067,268504,268952,269389,269837,270285,270723,271171,271619,272067,272504,272941,273389,273837,274275,274723,275171,275619,276056,276493,276941,277389,277837,278285,278723,279171,279619,280056,280504,280952,281389,281827,282285,282723,283181,283619,284067,284504,284952,285400,285837,286285,286723,287171,287608,288056,288504,288941,289389,289837,290285,290723,291171,291619,292067,292504,292952,293400,293837,294285,294723,295171,295619,296067,296504,296952,297389,297827,298285,298723,299171,299619,300056,300504,300952,301389,301837,302285,302733,303171,303619,304067,304504,304952,305400,305837,306285,306723,307171,307619,308056,308504,308952,309400,309837,310285,310733,311171,311619,312067,312504,312952,313389,313837,314285,314723]);
  anim.sync(() => {
    // Intro, the first 16 bars (beats 0-64): all rings start black, white for the stars below to light up.
    elements(all, () => beats(0, 64, () => constColor({ hue: 0, sat: 0, val: 0 })));

    // Sunrise, beats 6-60: the light climbs the big ring from the bottom pair of rings to the top pair, one pair
    // every SUNRISE_STEP beats. Each ring fills up from its outer edge inward along segment rad over SUNRISE_FILL
    // beats (4 bars): a dark snake covers the unlit inner part and shrinks toward the center, with a soft edge (the
    // last 1/8 of the snake ramps up to full). Its hue slides from purple through pink to reddish orange over
    // SUNRISE_HUE beats and then stays there; the lower rings start earlier and are always further along, so the
    // warm colors climb up from the bottom. The reddish orange sky then stays on every ring until SKY_END, as the
    // background of the sun overlays below.
    const SUNRISE_START = 6, SKY_END = 140, SUNRISE_STEP = 6, SUNRISE_FILL = 16, SUNRISE_HUE = 16;
    // The dark snake starts a bit past the outer edge so the ring starts fully dark, edge included.
    const DARK_HEAD_START = 1.15;
    const DAWN_PURPLE = 0.75, SUN_RED_ORANGE = 1.03; // 1.03 is hue 0.03, reached going up the hue scale
    const RINGS_BOTTOM_UP = [[5, 6], [4, 7], [3, 8], [2, 9], [1, 10], [11, 12]];
    RINGS_BOTTOM_UP.forEach((pair, level) => {
      const start = SUNRISE_START + level * SUNRISE_STEP;
      elements(pair, () => beats(start, SKY_END, () => {
        constColor({ hue: DAWN_PURPLE, sat: 1, val: 1 });
        const hueShift = SUN_RED_ORANGE - DAWN_PURPLE;
        beats(start, start + SUNRISE_HUE, () => addEffect({ timed_hue: { offset_factor: { linear: { start: 0, end: hueShift } } } }));
        beats(start + SUNRISE_HUE, SKY_END, () => addEffect({ timed_hue: { offset_factor: { const_value: { value: hueShift } } } }));
        beats(start, start + SUNRISE_FILL, () => segment("rad", () => addEffect({
          snake_brightness: {
            head: { linear: { start: DARK_HEAD_START, end: 0 } },
            // The tail stays just below relPos 0, so the snake always covers everything inside its head.
            tail_length: { linear: { start: DARK_HEAD_START + 0.01, end: 0.01 } },
            cyclic: false,
            // 0 (dark) along the snake, ramping up to 1 over its last 1/8, at the head.
            mult_factor_decrease: { half: { f1: { const_value: { value: 0 } }, f2: { half: { f1: { const_value: { value: 0 } },
              f2: { half: { f1: { const_value: { value: 0 } }, f2: { linear: { start: 0, end: 1 } } } } } } } },
          },
        })));
      }));
    });

    // From beat 60 the sky dims to SKY_DIM over 2 beats and stays dim until SKY_END, so the sun overlays below
    // stand out: they raise the brightness back toward full along with the yellow.
    const SKY_DIM = 0.4;
    elements(all, () => {
      beats(60, 62, () => fade({ start: 1, end: SKY_DIM }));
      beats(62, SKY_END, () => fade({ start: SKY_DIM, end: SKY_DIM }));
    });
    // So the dim sky does not feel static: a slow snake on rand, half the pixels long, passes once every 8 beats
    // and smoothly lifts the pixels it covers toward full brightness and back. It comes before the overlays below,
    // so the suns go on top of it and the night's fades dim it with the sky.
    elements(all, () => beats(60, SKY_END, () => segment(segment_rand, () => cycle(8, () => addEffect({
      snake_brightness: {
        head: { linear: { start: 0, end: 1 } },
        tail_length: { const_value: { value: 0.5 } },
        cyclic: true,
        mult_factor_increase: { sin: { min: 0, max: 1, phase: -0.25, repeats: 1 } },
      },
    })))));

    // The sun moving in the sky, beats 60-76: every SUN_STEP beats the next of rings 9, 10 lights up as the sun,
    // climbing from the left toward the top. Within its 8 beats: every third pixel (segment b1) turns
    // bright yellow over 2 beats, then the rest (b2) over 1 beat, then the whole ring fades back to the dim
    // reddish orange sky over the last 5 beats.
    const SUN_START = 60, SUN_STEP = 8, SUN_YELLOW = 1.15; // 1.15 is hue 0.15, above the sky's 1.03
    const toSun = SUN_YELLOW - SUN_RED_ORANGE;
    const timedHue = (offset_factor: object) => addEffect({ timed_hue: { offset_factor } });
    /** Sun light over the dim sky, from `from` to `to` (0 = sky, 1 = full bright sun yellow) over the time window. */
    const sunLight = (from: number, to: number) => {
      timedHue({ linear: { start: from * toSun, end: to * toSun } });
      addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: from, end: to } } } });
    };
    [9, 10].forEach((ring, k) => elements([ring], () => {
      const t = SUN_START + k * SUN_STEP;
      segment(segment_b1, () => {
        beats(t, t + 2, () => sunLight(0, 1));
        beats(t + 2, t + 3, () => sunLight(1, 1));
      });
      segment(segment_b2, () => beats(t + 2, t + 3, () => sunLight(0, 1)));
      beats(t + 3, t + 8, () => sunLight(1, 0));
    }));
    // Ring 11 starts like the suns before it: every third pixel turns yellow over beats 76-78.
    elements([11], () => segment(segment_b1, () => beats(76, 78, () => sunLight(0, 1))));

    // Beats 78-84, where the sun reaches ring 11, it goes psychedelic: a full rainbow around the ring spinning
    // through all hues every beat, a bright snake racing around the ring (segment all) every beat, and a hue
    // snake running around every small ring at once (segment centric) twice a beat.
    elements([11], () => beats(78, 84, () => {
      constColor({ hue: 0, sat: 1, val: 0.5 });
      addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } });
      cycle(1, () => timedHue({ linear: { start: 0, end: 1 } }));
      cycle(1, () => addEffect({
        snake_brightness: {
          head: { linear: { start: 0, end: 1 } },
          tail_length: { const_value: { value: 0.3 } },
          cyclic: true,
          mult_factor_increase: { linear: { start: 0, end: 1 } },
        },
      }));
      segment(segment_centric, () => cycle(0.5, () => addEffect({
        snake_hue: {
          head: { linear: { start: 0, end: 1 } },
          tail_length: { const_value: { value: 0.5 } },
          cyclic: true,
          offset_factor: { linear: { start: 0, end: 0.5 } },
        },
      })));
    }));

    // Beats 84-96, the whole big ring turns sun yellow from the bottom up, one group of 4 rings per beat: the bottom
    // rings fade in to yellow on beat 84, the middle ones on 85 and the top ones on 86, each holding yellow once
    // there. Then all of them fade back to the sky's reddish orange together, from beat 87 to 96.
    const YELLOW_BOTTOM_UP = [[4, 5, 6, 7], [2, 3, 8, 9], [10, 11, 12, 1]];
    YELLOW_BOTTOM_UP.forEach((group, k) => elements(group, () => {
      beats(84 + k, 85 + k, () => sunLight(0, 1));
      if (85 + k < 87) beats(85 + k, 87, () => sunLight(1, 1));
    }));
    elements(all, () => beats(87, 96, () => sunLight(1, 0)));
    // On top, a ray of darkness on every ring: a snake on rad running from the inner side to the outer side every
    // DARK_RAY_PERIOD beats, darkest in its middle and soft at both ends. The rings are phased in groups of 3: ring
    // r starts (r - 1) mod 3 beats after beat 84, so the rays ripple around the big ring. Each ring runs only whole
    // passes (head from the inner edge until the tail has left the outer edge) that fit before beat 96, so a ray is
    // never cut off in the middle when its ring stops.
    const DARK_RAY_PERIOD = 3, DARK_RAY_TAIL = 0.3, DARK_RAYS_START = 84, DARK_RAYS_END = 96;
    all.forEach(ring => {
      const start = DARK_RAYS_START + ((ring - 1) % 3);
      const passes = Math.floor((DARK_RAYS_END - start) / DARK_RAY_PERIOD);
      elements([ring], () => beats(start, start + passes * DARK_RAY_PERIOD, () => segment("rad", () => cycle(DARK_RAY_PERIOD, () =>
        addEffect({
          snake_brightness: {
            head: { linear: { start: 0, end: 1 + DARK_RAY_TAIL } },
            tail_length: { const_value: { value: DARK_RAY_TAIL } },
            cyclic: false,
            mult_factor_decrease: { sin: { min: 0, max: 1, phase: 0.25, repeats: 1 } },
          },
        })))));
    });

    // The sun moves on to ring 12 (beats 97-107) and ring 1 (107-116), like on rings 9 and 10: every third pixel
    // turns yellow over 2 beats, then the rest over 1 beat, then the whole ring fades back to the dim sky over the
    // rest of its window.
    const sunOn = (ring: number, start: number, end: number) => elements([ring], () => {
      segment(segment_b1, () => {
        beats(start, start + 2, () => sunLight(0, 1));
        beats(start + 2, start + 3, () => sunLight(1, 1));
      });
      segment(segment_b2, () => beats(start + 2, start + 3, () => sunLight(0, 1)));
      beats(start + 3, end, () => sunLight(1, 0));
    });
    sunOn(12, 97, 107);
    sunOn(1, 107, 116);

    // Night, beats 116-140, faded in from the dim sky over the first 2 beats: rings 1-6 turn white at brightness
    // MOON_VAL (the moon), rings 7 and 8 go dark, and rings 9-12 go dark under white stars.
    const NIGHT_START = 116, NIGHT_FADE = 2, NIGHT_END = 140, MOON_VAL = 0.25;
    const night = (sky: number, fadeBeats = NIGHT_FADE) => {
      // Saturation to 0 (white) and brightness to `sky` times the dim sky's, over `fadeBeats` beats.
      beats(NIGHT_START, NIGHT_START + fadeBeats, () => {
        addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } });
        fade({ start: 1, end: sky });
      });
      beats(NIGHT_START + fadeBeats, NIGHT_END, () => {
        addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0 } } } });
        fade({ start: sky, end: sky });
      });
    };
    const MOON_RINGS = [1, 2, 3, 4, 5, 6];
    elements(MOON_RINGS, () => night(MOON_VAL / SKY_DIM));
    // Rings 7-12 fade to dark gently, keeping their sky color (turning white first would look like a flash): the
    // brightness eases from full to 0 on a half cosine over DARK_FADE beats, then stays dark.
    const DARK_FADE = 6;
    elements([7, 8, 9, 10, 11, 12], () => {
      beats(NIGHT_START, NIGHT_START + DARK_FADE, () => addEffect({
        timed_brightness: { mult_factor_decrease: { sin: { min: 0, max: 1, phase: 0.25, repeats: 0.5 } } },
      }));
      beats(NIGHT_START + DARK_FADE, NIGHT_END, () => fade({ start: 0, end: 0 }));
    });
    // White stars on rings 9-12 like at the start of the song, on from the start of the night, on top of the fade:
    // the star snake on rand turns the pixels it covers white (snake_saturation to 0) and lights them
    // (snake_brightness), so only the stars are white while the rest of the ring fades in its sky color. They move
    // at the intro's speed: half way around rand in 64 beats.
    const NIGHT_STAR_PEAK: [number, number][] = [[9, 0.25], [10, 0.5], [11, 1], [12, 1]];
    NIGHT_STAR_PEAK.forEach(([ring, peak], k) => elements([ring], () => beats(NIGHT_START, NIGHT_END, () =>
      segment(segment_rand, () => {
        const star = {
          head: { linear: { start: k / 4, end: k / 4 + (0.5 * (NIGHT_END - NIGHT_START)) / 64 } },
          tail_length: { const_value: { value: 0.08 } },
          cyclic: true,
        };
        addEffect({ snake_saturation: { ...star, mult_factor_decrease: { const_value: { value: 0 } } } });
        addEffect({ snake_brightness: { ...star, mult_factor_increase: { sin: { min: 0, max: peak, phase: -0.25, repeats: 1 } } } });
      }))));

    // Beats 122-140, the night fades out slowly from the top down, all white (saturation 0): the top pair of rings
    // starts first and each lower pair FADE_OUT_STEP beats later, each fading over FADE_OUT_BEATS beats, so the
    // bottom pair is dark by beat 140.
    const FADE_OUT_START = 122, FADE_OUT_STEP = 2, FADE_OUT_BEATS = 8;
    const RINGS_TOP_DOWN = [[11, 12], [10, 1], [9, 2], [8, 3], [7, 4], [6, 5]];
    // The moon rings do not dim as a whole: they unfill on rand, pixel by pixel in random order, from fully lit to
    // black. A dark snake grows back from the end of rand (head fixed past 1, tail length 0 -> 1) and blacks out
    // everything it covers. The star rings and ring 8 just fade.
    RINGS_TOP_DOWN.forEach((pair, k) => pair.forEach(ring => elements([ring], () => {
      const start = FADE_OUT_START + k * FADE_OUT_STEP, end = start + FADE_OUT_BEATS;
      if (MOON_RINGS.includes(ring)) {
        beats(start, end, () => segment(segment_rand, () => addEffect({
          snake_brightness: {
            head: { const_value: { value: 1.01 } },
            tail_length: { linear: { start: 0, end: 1.02 } },
            cyclic: false,
            mult_factor_decrease: { const_value: { value: 0 } },
          },
        })));
      } else {
        beats(start, end, () => fade({ start: 1, end: 0 }));
      }
      if (end < NIGHT_END) beats(end, NIGHT_END, () => fade({ start: 0, end: 0 }));
    })));

    // Beats 140-192, past the sun theme: a colorful scene around blue. Every ring is one solid color, a little
    // different from its neighbours in hue (12 shades from cyan to purple), saturation (0.8-1) and brightness.
    const BLUE_START = 140, BLUE_END = 192;
    const RING_BLUES: Record<number, { hue: number; sat: number; val: number }> = {
      1: { hue: 0.6, sat: 1, val: 0.6 },
      2: { hue: 0.45, sat: 0.85, val: 0.45 },
      3: { hue: 0.78, sat: 0.95, val: 0.55 },
      4: { hue: 0.53, sat: 0.8, val: 0.65 },
      5: { hue: 0.71, sat: 1, val: 0.4 },
      6: { hue: 0.42, sat: 0.9, val: 0.6 },
      7: { hue: 0.67, sat: 0.85, val: 0.5 },
      8: { hue: 0.49, sat: 1, val: 0.45 },
      9: { hue: 0.82, sat: 0.8, val: 0.6 },
      10: { hue: 0.56, sat: 0.95, val: 0.4 },
      11: { hue: 0.74, sat: 0.9, val: 0.65 },
      12: { hue: 0.64, sat: 1, val: 0.5 },
    };
    all.forEach(ring => elements([ring], () => beats(BLUE_START, BLUE_END, () => constColor(RING_BLUES[ring]))));
    // It starts dark for 1 beat and then fades in over 3 beats, until beat 144.
    elements(all, () => {
      beats(BLUE_START, BLUE_START + 1, () => fade({ start: 0, end: 0 }));
      beats(BLUE_START + 1, BLUE_START + 4, () => fade({ start: 0, end: 1 }));
    });
    // Beats 144-192: only a window on segment rad is lit, between a start and an end that move over time. Every 8
    // beats the ends switch to a different way of moving; each way starts from 0-0.5 (the inner half of the ring)
    // and repeats every WINDOW_CYCLE beats. The rings are phased in groups of 2, 4 or 6 (changing every 8 beats):
    // in a group of N, ring r runs (r - 1) mod N / N of a cycle behind. Each ring runs only whole cycles of a block
    // and holds the starting 0-0.5 window in any gap before its next block (or the end at beat 192), so nothing is
    // cut in the middle of a move. The renderer has no effect that keeps just a range, so two dark snakes on rad (mult_factor_decrease 0) black out
    // everything below the start and everything above the end.
    type Fn = { const_value: { value: number } } | { linear: { start: number; end: number } }
      | { sin: { min: number; max: number; phase: number; repeats: number } };
    const K = (value: number): Fn => ({ const_value: { value } });
    const L = (start: number, end: number): Fn => ({ linear: { start, end } });
    const WINDOW_CYCLE = 1;
    // Swings between min and max `repeats` times per cycle, starting at min (SWING_DOWN: starting at max). A swing
    // ends where it started, so cycles follow each other without jumping.
    const SWING = (min: number, max: number, repeats = 2): Fn => ({ sin: { min, max, phase: -0.25, repeats } });
    const SWING_DOWN = (min: number, max: number, repeats = 2): Fn => ({ sin: { min, max, phase: 0.25, repeats } });
    /** c + f, or c - f with `negate`, as a function of the same shape. */
    const shift = (f: Fn, c: number, negate = false): Fn => {
      const m = negate ? -1 : 1;
      if ("const_value" in f) return K(c + m * f.const_value.value);
      if ("linear" in f) return L(c + m * f.linear.start, c + m * f.linear.end);
      const { min, max, phase, repeats } = f.sin;
      return negate ? { sin: { min: c - max, max: c - min, phase: phase + 0.5, repeats } } : { sin: { min: c + min, max: c + max, phase, repeats } };
    };
    const darkSnake = (head: Fn, tail_length: Fn) =>
      addEffect({ snake_brightness: { head, tail_length, cyclic: false, mult_factor_decrease: K(0) } });
    /** Keep only the pixels of rad between `start` and `end` lit. */
    const radWindow = (start: Fn, end: Fn) => segment("rad", () => {
      darkSnake(start, shift(start, 0.01)); // from just below 0 up to the start
      darkSnake(K(1.01), shift(end, 1.01, true)); // from the end up to just past 1
    });
    const RAD_WINDOWS: [Fn, Fn][] = [
      [SWING(0, 0.5, 1), SWING(0.5, 1, 1)], // slides outward and back
      [K(0), SWING(0.5, 1, 1)], // grows outward and back
      [SWING(0, 0.25, 1), SWING_DOWN(0.25, 0.5, 1)], // both ends close in to the middle and open again
      [SWING(0, 0.5, 1), K(0.5)], // the start catches up with the end and goes back
      [K(0), SWING(0.5, 1)], // breathes outward twice a cycle
      [SWING(0, 0.5), SWING(0.5, 1)], // sways out and back twice a cycle
    ];
    const WINDOW_PHASE_GROUPS = [2, 4, 6, 2, 4, 6];
    const holdStart = (from: number, to: number) => { if (to > from) beats(from, to, () => radWindow(K(0), K(0.5))); };
    all.forEach(ring => elements([ring], () => {
      // When each block starts on this ring, delayed by its phase in that block's group.
      const starts = WINDOW_PHASE_GROUPS.map((n, k) => 144 + k * 8 + (((ring - 1) % n) / n) * WINDOW_CYCLE);
      holdStart(144, starts[0]);
      RAD_WINDOWS.forEach(([start, end], k) => {
        const next = k + 1 < starts.length ? starts[k + 1] : 192;
        const runEnd = starts[k] + Math.floor((next - starts[k]) / WINDOW_CYCLE) * WINDOW_CYCLE;
        beats(starts[k], runEnd, () => cycle(WINDOW_CYCLE, () => radWindow(start, end)));
        holdStart(runEnd, next);
      });
    }));
    // The beat in the hue: every 8 beats a timed hue shift whose value steps once per beat, with a different
    // pattern each time. Shifts stay within about +-0.15, so the colors stay around blue.
    const stepsFn = (num_steps: number, first_step_value: number, diff_per_step: number) =>
      ({ steps: { num_steps, first_step_value, diff_per_step } });
    const repeatFn = (numberOfTimes: number, funcToRepeat: object) => ({ repeat: { numberOfTimes, funcToRepeat } });
    const ALTERNATE = repeatFn(4, stepsFn(2, 0, 0.12)); // shifted on every other beat
    const ALTERNATE_OPPOSITE = repeatFn(4, stepsFn(2, 0.12, -0.12)); // the same, a beat apart
    const BEAT_HUES: ((ring: number) => object)[] = [
      () => stepsFn(8, -0.1, 0.03), // staircase up
      () => ALTERNATE, // alternate
      () => stepsFn(8, 0.1, -0.03), // staircase down
      () => ({ half: { f1: stepsFn(4, -0.08, 0.05), f2: stepsFn(4, 0.07, -0.05) } }), // up 4 beats, down 4
      ring => (ring % 2 ? ALTERNATE : ALTERNATE_OPPOSITE), // odd and even rings take turns
      () => repeatFn(2, stepsFn(4, -0.06, 0.05)), // two short staircases
    ];
    BEAT_HUES.forEach((hueOf, k) => all.forEach(ring => elements([ring], () =>
      beats(144 + k * 8, 152 + k * 8, () => addEffect({ timed_hue: { offset_factor: hueOf(ring) } })))));

    // Stars on the 6 top rings, over the sky: a snake on rand covering 8% of the pixels crawls half way around
    // over the whole intro, so each pixel slowly fades in and out again. Brightest at the top and dimmer to the
    // sides: rings 11, 12 peak at 1, rings 10, 1 at 0.5 and rings 9, 2 at 0.25. Each ring starts at its own point,
    // so the rings show different stars. They fade in over the first bar.
    const STAR_PEAK: [number, number][] = [[9, 0.25], [10, 0.5], [11, 1], [12, 1], [1, 0.5], [2, 0.25]];
    beats(0, 64, () => {
      STAR_PEAK.forEach(([ring, peak], k) => elements([ring], () => {
        segment(segment_rand, () => addEffect({
          snake_brightness: {
            head: { linear: { start: k / 6, end: 0.5 + k / 6 } },
            tail_length: { const_value: { value: 0.08 } },
            cyclic: true,
            mult_factor_increase: { sin: { min: 0, max: peak, phase: -0.25, repeats: 1 } },
          },
        }));
      }));
      elements(STAR_PEAK.map(([ring]) => ring), () => beats(0, 4, () => fade({ start: 0, end: 1 })));
    });
    // BEAT_CHECK=1: a white flash on every beat on top, to check the sync with the audio. One 1-beat cycle over
    // the whole song: brightness falls linearly from full on the beat to dark just before the next one.
    if (process.env.BEAT_CHECK) {
      const numBeats = anim.beatTimestampsMs!.length - 1;
      elements(all, () => beats(0, numBeats, () => cycle(1, () => {
        constColor({ hue: 0, sat: 0, val: 0.3 });
        fade({ start: 1, end: 0 });
      })));
    }
  });

  console.log("sending sequence");
  await sendSequence("shemesh", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("shemesh", 0);
  }
};

(async () => {
  await shemesh();
})();
