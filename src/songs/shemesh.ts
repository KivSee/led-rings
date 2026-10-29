// Generated from Timeline Manager.
import { sendSequence } from "../services/sequence";
import { startSong, trigger } from "../services/trigger";
import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats, section } from "../time/time";
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
  even,
  odd,
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
import { galleryMix, galleryOverlay, galleryRange, type MixPick, type OverlayPick } from "./shemesh-gallery-options";

const shemesh = async () => {
  const anim = new Animation("shemesh", 135, 318.47, 0, [96,544,992,1440,1888,2336,2784,3232,3680,4128,4576,5024,5472,5920,6368,6816,7264,7712,8160,8608,9056,9504,9952,10400,10848,11296,11744,12192,12640,13088,13536,13984,14432,14880,15328,15776,16224,16672,17120,17568,18016,18464,18912,19360,19808,20256,20704,21152,21600,22048,22496,22944,23392,23840,24288,24736,25184,25632,26080,26528,26976,27424,27872,28320,28768,29216,29664,30112,30560,31008,31456,31904,32352,32800,33248,33696,34144,34592,35040,35488,35936,36384,36832,37280,37728,38176,38624,39072,39520,39968,40416,40864,41312,41760,42208,42656,43104,43552,44000,44448,44896,45344,45792,46240,46688,47136,47584,48032,48480,48928,49376,49824,50272,50720,51168,51616,52064,52512,52960,53408,53856,54304,54752,55200,55648,56096,56544,56992,57440,57888,58336,58784,59232,59680,60128,60576,61024,61472,61920,62368,62816,63264,63712,64160,64608,65056,65493,65941,66389,66827,67275,67723,68160,68608,69056,69493,69941,70389,70827,71275,71723,72171,72608,73056,73493,73941,74389,74827,75275,75723,76160,76608,77045,77493,77941,78389,78827,79296,79723,80171,80619,81067,81504,81952,82400,82848,83285,83733,84171,84619,85056,85493,85941,86389,86827,87275,87712,88160,88608,89056,89493,89941,90389,90837,91275,91723,92171,92608,93056,93504,93941,94389,94827,95275,95723,96171,96608,97056,97493,97941,98389,98837,99275,99723,100160,100608,101056,101504,101941,102389,102827,103275,103723,104171,104608,105056,105493,105941,106389,106837,107275,107723,108160,108608,109045,109504,109941,110389,110827,111275,111712,112171,112608,113056,113493,113941,114389,114837,115285,115733,116171,116619,117056,117504,117952,118389,118837,119285,119723,120171,120608,121056,121504,121952,122389,122837,123275,123723,124160,124608,125056,125504,125941,126389,126837,127285,127723,128171,128619,129056,129504,129952,130389,130837,131275,131723,132171,132619,133056,133504,133952,134389,134827,135275,135723,136171,136608,137056,137504,137941,138389,138837,139275,139723,140171,140619,141056,141504,141941,142389,142837,143275,143723,144171,144608,145067,145515,145963,146389,146837,147275,147723,148171,148608,149056,149504,149941,150389,150827,151275,151723,152171,152608,153056,153504,153941,154389,154837,155275,155723,156160,156608,157056,157504,157941,158389,158827,159275,159723,160171,160608,161056,161504,161952,162389,162837,163275,163723,164160,164608,165045,165493,165941,166389,166827,167275,167712,168160,168608,169056,169493,169941,170389,170827,171275,171723,172160,172608,173045,173493,173941,174389,174827,175275,175723,176160,176608,177056,177493,177941,178389,178837,179296,179744,180160,180608,181056,181504,181952,182389,182837,183275,183723,184171,184608,185056,185504,185941,186389,186837,187275,187723,188160,188608,189056,189504,189941,190389,190837,191285,191723,192171,192608,193056,193493,193952,194389,194837,195275,195723,196171,196608,197056,197504,197952,198400,198837,199285,199723,200171,200608,201056,201504,201941,202389,202837,203275,203723,204171,204608,205056,205504,205941,206389,206837,207285,207723,208160,208608,209067,209525,209963,210389,210837,211275,211723,212160,212608,213056,213493,213941,214389,214827,215275,215723,216171,216608,217056,217493,217941,218379,218837,219275,219723,220160,220608,221056,221504,221941,222389,222827,223275,223712,224171,224608,225056,225493,225941,226379,226837,227275,227723,228160,228608,229056,229504,229941,230389,230827,231275,231723,232171,232608,233056,233493,233941,234389,234827,235275,235723,236160,236608,237056,237515,237952,238400,238837,239285,239723,240171,240608,241056,241504,241952,242389,242837,243285,243723,244171,244608,245056,245504,245941,246389,246837,247275,247723,248171,248619,249067,249504,249952,250400,250837,251285,251733,252171,252619,253067,253504,253952,254389,254837,255285,255723,256171,256619,257056,257493,257952,258389,258837,259275,259723,260171,260619,261056,261504,261952,262400,262837,263285,263733,264171,264619,265067,265504,265952,266389,266837,267285,267723,268171,268619,269067,269504,269941,270389,270837,271275,271723,272171,272619,273056,273493,273941,274389,274837,275285,275723,276171,276619,277056,277504,277952,278389,278827,279285,279723,280181,280619,281067,281504,281952,282400,282837,283285,283723,284171,284608,285056,285504,285941,286389,286837,287285,287723,288171,288619,289067,289504,289952,290400,290837,291285,291723,292171,292619,293067,293504,293952,294389,294827,295285,295723,296171,296619,297056,297504,297952,298389,298837,299285,299733,300171,300619,301067,301504,301952,302400,302837,303285,303723,304171,304619,305056,305504,305952,306400,306837,307285,307733,308171,308619,309067,309504,309952,310389,310837,311285,311723]);
  // Play once (the rings stay dark after it), the length of the audio, so the start does not come round again.
  anim.playOnce();
  anim.sync(() => {
    const DAWN_PURPLE = 0.75, SUN_RED_ORANGE = 1.03; // 1.03 is hue 0.03, reached going up the hue scale
    const SUN_SHINE_END = 64;
    const SKY_HUE_SHIFT = SUN_RED_ORANGE - DAWN_PURPLE;
    const SKY_DIM = 0.4, SKY_END = 140;

    // Sun shine, beats 0-64 (the first 16 bars). The rings start dark (every frame starts black: hue 0, sat 0,
    // val 0), so the stars light up white.
    section("sun shine", { start: 0, end: SUN_SHINE_END }, () => {
      // Sunrise: the sky on the whole big ring is dark blue at the top and reddish purple at the bottom, and lights up
      // very slowly from black, brighter at the bottom. As it brightens the warm colors climb up: the bottom turns
      // red, orange and yellow, and the top goes from blue through purple to reddish orange. Each keyframe gives the
      // hue and brightness at the top (rings 11, 12) and at the bottom (rings 5, 6); a ring in between gets them by its
      // height, and between keyframes they move linearly. Hues only go up the scale (1.14 is hue 0.14, yellow), so
      // the colors only ever get warmer. Over beats 60-64 the sky dims to SKY_DIM and evens out to the sun up sky.
      const SUNRISE: { beat: number; hue: [number, number]; val: [number, number] }[] = [
        { beat: 0, hue: [0.64, 0.9], val: [0, 0] },
        { beat: 8, hue: [0.65, 0.93], val: [0.03, 0.12] },
        { beat: 24, hue: [0.7, 1.0], val: [0.1, 0.35] },
        { beat: 40, hue: [0.8, 1.07], val: [0.25, 0.65] },
        { beat: 52, hue: [0.92, 1.12], val: [0.55, 0.9] },
        { beat: 60, hue: [1.0, 1.14], val: [0.85, 1] },
        { beat: 62, hue: [1.02, 1.06], val: [SKY_DIM, SKY_DIM] },
        { beat: SUN_SHINE_END, hue: [SUN_RED_ORANGE, SUN_RED_ORANGE], val: [SKY_DIM, SKY_DIM] },
      ];
      // Inside each ring the colors run on along rad, so the gradient is smooth across the ring too: a ring covers
      // about RING_SPAN of the big ring's height, and rad points up or down as much as the ring sits at the top or
      // the bottom (sideways on rings 2, 3, 8, 9, so they get little of it).
      const RING_SPAN = 0.2;
      const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
      all.forEach(ring => {
        // How far the ring's outer side points up (1 at the top of the big ring), and its depth from 0 (top) to 1.
        const up = Math.cos(((ring + 0.5) * Math.PI) / 6);
        const depth = (1 - up / Math.cos(Math.PI / 12)) / 2;
        const at = (k: typeof SUNRISE[number]) =>
          ({ hue: lerp(k.hue[0], k.hue[1], depth), val: lerp(k.val[0], k.val[1], depth), span: k.hue[1] - k.hue[0] });
        elements([ring], () => SUNRISE.slice(1).forEach((to, j) => {
          const a = at(SUNRISE[j]), b = at(to);
          // Bluer on the higher side of the ring, warmer on the lower side.
          const tilt = ((a.span + b.span) / 2) * RING_SPAN * up;
          beats(SUNRISE[j].beat, to.beat, () => {
            constColor({ hue: a.hue % 1, sat: 1, val: 1 });
            addEffect({ timed_hue: { offset_factor: { linear: { start: 0, end: b.hue - a.hue } } } });
            segment("rad", () => addEffect({ position_hue: { offset_factor: { linear: { start: tilt / 2, end: -tilt / 2 } } } }));
            fade({ start: a.val, end: b.val });
          });
        }));
      });

      // Stars on the 6 top rings, over the sky: a snake on rand covering 8% of the pixels crawls round at half a lap
      // per section, so each pixel slowly fades in and out again. White: a matching saturation snake takes the sky's
      // color out of the pixels it lights. Brightest at the top and dimmer to the sides: rings 11, 12 peak at 1, rings
      // 10, 1 at 0.5 and rings 9, 2 at 0.25. Each ring starts at its own point, so the rings show different stars. They
      // fade in over the first bar and out over STAR_FADE_START to STAR_FADE_END, around the middle of the section, in
      // STAR_FADE_STEPS steps (a snake's strength cannot change over time, so each step is its own snake, weaker).
      const STAR_PEAK: [number, number][] = [[9, 0.25], [10, 0.5], [11, 1], [12, 1], [1, 0.5], [2, 0.25]];
      const STAR_FADE_START = 28, STAR_FADE_END = 36, STAR_FADE_STEPS = 16;
      const stars = (k: number, peak: number, from: number, to: number, strength: number) => {
        const head = { linear: { start: k / 6 + (0.5 * from) / SUN_SHINE_END, end: k / 6 + (0.5 * to) / SUN_SHINE_END } };
        const tail_length = { const_value: { value: 0.08 } };
        beats(from, to, () => segment(segment_rand, () => {
          addEffect({ snake_brightness: { head, tail_length, cyclic: true,
            mult_factor_increase: { sin: { min: 0, max: peak * strength, phase: -0.25, repeats: 1 } } } });
          addEffect({ snake_saturation: { head, tail_length, cyclic: true,
            mult_factor_decrease: { sin: { min: 1 - strength, max: 1, phase: 0.25, repeats: 1 } } } });
        }));
      };
      STAR_PEAK.forEach(([ring, peak], k) => elements([ring], () => {
        stars(k, peak, 0, STAR_FADE_START, 1);
        const step = (STAR_FADE_END - STAR_FADE_START) / STAR_FADE_STEPS;
        for (let i = 0; i < STAR_FADE_STEPS; i++)
          stars(k, peak, STAR_FADE_START + i * step, STAR_FADE_START + (i + 1) * step, 1 - (i + 0.5) / STAR_FADE_STEPS);
      }));
      elements(STAR_PEAK.map(([ring]) => ring), () => beats(0, 4, () => fade({ start: 0, end: 1 })));
      // The 6 bottom rings stay dark through bar 2, then come in over bars 3-6 (beats BOTTOM_FROM - BOTTOM_IN) pixel by
      // pixel, in a scattered order: along rand the sky shows only from an edge moving steadily from 1 down to 0, so
      // the lit part grows from 1 - 1 to 0 - 1, rand's shuffled order lighting the pixels one at a time all over the
      // ring. Below the edge is blacked out by a dark snake from 0 up to just below it.
      const BOTTOM_FROM = 8, BOTTOM_IN = 24;
      elements([3, 4, 5, 6, 7, 8], () => beats(0, BOTTOM_FROM, () => fade({ start: 0, end: 0 })));
      elements([3, 4, 5, 6, 7, 8], () => beats(BOTTOM_FROM, BOTTOM_IN, () => segment(segment_rand, () => {
        addEffect({ snake_brightness: {
          head: { linear: { start: 0.999, end: -0.001 } }, tail_length: { linear: { start: 1.009, end: 0.009 } }, cyclic: false,
          mult_factor_decrease: { const_value: { value: 0 } },
        } });
      })));
    });

    // Sun up, beats 64-116: the sun moves across the sky, from ring 9 over the top to ring 1. It fades in from beat
    // 60, where the sky dims and the first sun starts, and fades out into the night over beats 116-122. The sky
    // and its dimming stay on until SKY_END under the night, which fades them out.
    section("sun up", { start: SUN_SHINE_END, end: 116, fadeIn: 4, fadeOut: 6 }, () => {
      // After sun shine, the reddish orange sky stays on every ring until SKY_END, dimmed to SKY_DIM.
      elements(all, () => beats(SUN_SHINE_END, SKY_END, () => {
        constColor({ hue: DAWN_PURPLE, sat: 1, val: 1 });
        addEffect({ timed_hue: { offset_factor: { const_value: { value: SKY_HUE_SHIFT } } } });
      }));

      elements(all, () => beats(SUN_SHINE_END, SKY_END, () => fade({ start: SKY_DIM, end: SKY_DIM })));
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
      // through all hues every RAINBOW_SPIN beats, a bright snake racing around the ring (segment all) at the same
      // pace, and a hue snake running along arc in every small ring at once twice as fast.
      const RAINBOW_SPIN = 3;
      elements([11], () => beats(78, 84, () => {
        constColor({ hue: 0, sat: 1, val: 0.5 });
        addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } });
        cycle(RAINBOW_SPIN, () => timedHue({ linear: { start: 0, end: 1 } }));
        cycle(RAINBOW_SPIN, () => addEffect({
          snake_brightness: {
            head: { linear: { start: 0, end: 1 } },
            tail_length: { const_value: { value: 0.3 } },
            cyclic: true,
            mult_factor_increase: { linear: { start: 0, end: 1 } },
          },
        }));
        segment(segment_arc, () => cycle(RAINBOW_SPIN / 2, () => addEffect({
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
    });

    // Night, beats 122-140, fading in over beats 116-122 while the sun up fades out: the moon rings turn white and
    // the other rings go dark.
    section("night", { start: 122, end: 140, fadeIn: 6 }, () => {
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
    });

    // Moving windows: keep only the pixels of a segment between a start and an end that move over time. The
    // renderer has no effect that keeps just a range, so two dark snakes (mult_factor_decrease 0) black out
    // everything below the start and everything above the end. Used by both party sections.
    type Fn = { const_value: { value: number } } | { linear: { start: number; end: number } }
      | { sin: { min: number; max: number; phase: number; repeats: number } };
    const K = (value: number): Fn => ({ const_value: { value } });
    const L = (start: number, end: number): Fn => ({ linear: { start, end } });
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
    /** Keep only the pixels of `seg` between `start` and `end` lit. */
    const segWindow = (seg: string, start: Fn, end: Fn) => segment(seg, () => {
      darkSnake(start, shift(start, 0.01)); // from just below 0 up to the start
      darkSnake(K(1.01), shift(end, 1.01, true)); // from the end up to just past 1
    });
    /** m * f, as a function of the same shape. */
    const scale = (f: Fn, m: number): Fn => {
      if ("const_value" in f) return K(m * f.const_value.value);
      if ("linear" in f) return L(m * f.linear.start, m * f.linear.end);
      const { min, max, phase, repeats } = f.sin;
      return { sin: { min: m * min, max: m * max, phase, repeats } };
    };
    const stepsFn = (num_steps: number, first_step_value: number, diff_per_step: number) =>
      ({ steps: { num_steps, first_step_value, diff_per_step } });
    const repeatFn = (numberOfTimes: number, funcToRepeat: object) => ({ repeat: { numberOfTimes, funcToRepeat } });

    // The party's blues: every ring one solid color, a little different from its neighbours in hue (12 shades from
    // cyan to purple), saturation (0.8-1) and brightness. Used by the first and the last party.
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

    // Party, beats 140-192.
    section("party", { start: 140, end: 192 }, () => {
      // Beats 140-192, past the sun theme: a colorful scene around blue. Every ring is one solid color, a little
      // different from its neighbours in hue (12 shades from cyan to purple), saturation (0.8-1) and brightness.
      const BLUE_START = 140, BLUE_END = 192;
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
      // cut in the middle of a move.
      const WINDOW_CYCLE = 1;
      const radWindow = (start: Fn, end: Fn) => segWindow("rad", start, end);
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
    });

    // Beat patterns, used by both verses: a quarter or a half of a segment's pixels raised from the base half
    // brightness to full, the lit part changing on the beat.
    // One of `parts` equal parts of the segment (by relPos) lights up at a time, stepping to the next part every
    // stepBeats and round again: with 4 parts and 1 beat, a quarter of the pixels at a time, all 4 every 4
    // beats. Two effects, each taking half a round: a snake exactly one part long, raising its pixels from the
    // base half brightness to full, whose head steps on a part at a time. The head stops just short of the next
    // part and the tail reaches just below the start of its own (rand's relPos have 2 decimals, centric's are
    // twelfths), so exactly one part is lit at any time, also when a wrapped head lands near 0 with rounding.
    // The snake is cyclic, so a head past 1 wraps back to the first part. Each call picks its own rings:
    // elements() calls do not nest (the outer rings win).
    /** Part q of `parts` lit with a snake whose head steps one part on (cyclic) for each of `steps` equal steps. */
    const partSteps = (parts: number, q: number, steps: number) => addEffect({
      snake_brightness: {
        head: { steps: { num_steps: steps, first_step_value: (q + 1) / parts - 0.001, diff_per_step: 1 / parts } },
        tail_length: { const_value: { value: 1 / parts - 0.0005 } },
        cyclic: true,
        mult_factor_increase: { const_value: { value: 1 } },
      },
    });
    /** A beat pattern over beats start - end on the given d1 rings. */
    type BeatPattern = (start: number, end: number, rings: number[]) => void;
    /** Steps through the parts the whole time (an even number of parts). */
    const stepParts = (seg: string, parts: number, stepBeats = 1): BeatPattern => (start, end, rings) =>
      beats(start, end, () => rings.forEach(ring => elements([ring], () => segment(seg, () => {
        const half = parts / 2;
        [0, 1].forEach(k => cycleBeats(parts * stepBeats, k * half * stepBeats, (k + 1) * half * stepBeats, () =>
          partSteps(parts, k * half, half)));
      }))));
    // Two halves of a segment lit in turn, one cycle of `cycle` beats: the first half over the first half of the
    // cycle and the second over the rest. A half is the relPos window from a split to the next one (the second
    // runs past 1 and wraps around to 0); each window raises its half to full and leaves the other half alone,
    // stopping just short of where the other one starts.
    const halves = (seg: string, splits: [number, number], cycle = 2): BeatPattern => (start, end, rings) =>
      rings.forEach(ring => elements([ring], () => segment(seg, () => beats(start, end, () => [0, 1].forEach(k => {
        const from = splits[k], to = k ? splits[0] + 1 : splits[1];
        cycleBeats(cycle, (k * cycle) / 2, ((k + 1) * cycle) / 2, () => addEffect({
          position_brightness: {
            mult_factor_increase: {
              fixed_window: { start: from, end: to - 0.001, cyclic: true, outside_value: 0, func: { const_value: { value: 1 } } },
            },
          },
        }));
      })))));
    // Runs beat patterns one after another from `start`, each over its number of `blockBeats` blocks. Every
    // pattern changes once per beat on each ring, the odd d1 rings on the beat and the even ones on the off-beat
    // (their copy runs half a beat later, cut at `end`), so the two sets take turns and something changes every
    // half beat. The even rings start half a beat in.
    const ODD_RINGS = all.filter(ring => ring % 2), EVEN_RINGS = all.filter(ring => ring % 2 === 0);
    const runBeatPatterns = (start: number, end: number, blockBeats: number, patterns: { blocks: number; pattern: BeatPattern }[]) => {
      let blockStart = start;
      patterns.forEach(({ blocks, pattern }) => {
        const blockEnd = blockStart + blocks * blockBeats;
        pattern(blockStart, blockEnd, ODD_RINGS);
        pattern(blockStart + 0.5, Math.min(blockEnd + 0.5, end), EVEN_RINGS);
        blockStart = blockEnd;
      });
    };
    // The cymbals on every off-beat (half way between beats): a short whitening, the saturation multiplied by
    // `sat` on the hit and easing back to full over `hitBeats`. The two groups take turns, one off-beat each, on
    // every ring: segment b1 (pixels 0, 3, 6, 9 of every small ring) after the even beats, b2 (the other pixels)
    // after the odd ones.
    const cymbals = (start: number, end: number, sat: number, hitBeats: number) =>
      [segment_b1, segment_b2].forEach((seg, k) => elements(all, () => segment(seg, () => beats(start, end, () =>
        cycleBeats(2, k + 0.5, k + 0.5 + hitBeats, () =>
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: sat, end: 1 } } } }))))));

    // Verse 1, bars 49-65 (beats 192-260), fading in over the second half of bar 48 (beats 190-192): she sings and
    // the energy ramps up, but it is still before the main part and the energy peak, so it should hold something
    // back.
    // The base coloring: 4 hues stepping from yellow to orange, alternating ring by ring around the big ring (ring 1
    // the first hue, ring 2 the second, …, ring 5 the first again), so neighbouring rings always differ and the
    // pattern repeats 3 times around. Each ring is one solid color, paler toward the center of the big ring, on from
    // the start of the section's fade-in.
    const VERSE1_START = 192, VERSE1_END = 260, VERSE1_FADE_IN = 2;
    const VERSE1_YELLOW = 0.15, VERSE1_ORANGE = 0.07, VERSE1_HUES = 4;
    // Half brightness, leaving room for beat effects to light pixels up to full.
    const VERSE1_BASE_VAL = 0.5;
    const verse1Hue = (ring: number) => VERSE1_YELLOW + (((ring - 1) % VERSE1_HUES) / (VERSE1_HUES - 1)) * (VERSE1_ORANGE - VERSE1_YELLOW);
    // Paler toward the d2 center: along rad, saturation is multiplied by 0.5 at the inner edge (relPos 0), rising
    // linearly to 1 at relPos 0.8, and stays full from there to the outer edge.
    const verse1PaleCenter = () => segment("rad", () => addEffect({
      position_saturation: {
        mult_factor_decrease: { fixed_window: { start: 0, end: 0.8, outside_value: 1, func: { linear: { start: 0.5, end: 1 } } } },
      },
    }));
    section("verse 1", { start: VERSE1_START, end: VERSE1_END, fadeIn: VERSE1_FADE_IN }, () => {
      all.forEach(ring => elements([ring], () => constColor({ hue: verse1Hue(ring), sat: 1, val: VERSE1_BASE_VAL })));
      elements(all, verse1PaleCenter);

      // The beat: on each of the 4 beats of a bar a part of the rings is raised from the base half brightness to full,
      // a different pattern every bar, filling, emptying or moving round. A lit part is a window [start, end) on a
      // segment: for each beat its own position window (fixed_window, 1 inside it and 0 outside) raising the pixels
      // inside to full and leaving the rest at the base. A beat with nothing in the window gets no effect.
      const ALL = 1.01; // a window end past every relPos
      /** A window on `seg` over the bar starting at `bar`, its start and end on each of the 4 beats. */
      const beatWindow = (seg: string, bar: number, start: number[], end: number[]) => segment(seg, () =>
        start.forEach((from, j) => {
          if (end[j] <= from) return;
          beats(bar + j, bar + j + 1, () => addEffect({
            position_brightness: {
              mult_factor_increase: { fixed_window: { start: from, end: end[j] - 0.0005, outside_value: 0, func: K(1) } },
            },
          }));
        }));
      // Each bar its own pattern: groups of d1 rings, each with a segment and its window's start and end on each of
      // the bar's 4 beats (FULL: from the very start).
      type BeatGroup = { rings: number[]; seg: string; start: number[]; end: number[] };
      const FULL = [0, 0, 0, 0];
      const g = (rings: number[], seg: string, start: number[], end: number[]): BeatGroup => ({ rings, seg, start, end });
      /** Lit on the beats where `on` is true, whole. */
      const whenOn = (rings: number[], seg: string, on: boolean[]) => g(rings, seg, on.map(o => (o ? 0 : ALL)), on.map(() => ALL));
      const quartet = (k: number) => all.filter(r => (r - 1) % 4 === k); // rings 1, 5, 9 / 2, 6, 10 / …
      const quartets = (on: (k: number, j: number) => boolean) => [0, 1, 2, 3].map(k => whenOn(quartet(k), "all", [0, 1, 2, 3].map(j => on(k, j))));
      const VERSE1_BARS: BeatGroup[][] = [
        // 49: every ring filling along rad from the inner side, a quarter more each beat (to 0.25, 0.5, 0.75, 1).
        [g(all, "rad", FULL, [0.25, 0.5, 0.75, ALL])],
        // 50: the small rings of every d1 ring going out back towards the first one (ind, from the small ring at
        // 12:30): lit up to 0.72, 0.5, 0.25, then nothing.
        [g(all, segment_ind, FULL, [0.72, 0.5, 0.25, 0])],
        // 51: the four ring groups lighting up one more each beat.
        quartets((k, j) => j >= k),
        // 52: and going out again, the last one first.
        quartets((k, j) => j < 3 - k),
        // 53: every small ring filling by halves (centric: pixels 0-2, then also 6-8, then 0-8, then all).
        [g(all, segment_centric, FULL, [0.25, 0.25, 0.5, 0.5]), g(all, segment_centric, [0.5, 0.5, 0.5, 0.5], [0.5, 0.75, 0.75, ALL])],
        // 54: a quarter of every small ring stepping round it, a quarter further each beat.
        [g(all, segment_centric, [0, 0.25, 0.5, 0.75], [0.25, 0.5, 0.75, ALL])],
        // 55: arc blooming out from pixel 0 to the whole small ring.
        [g(all, segment_arc, FULL, [0.2, 0.4, 0.6, ALL])],
        // 56: arc closing in from the pixel 0 side.
        [g(all, segment_arc, [0.2, 0.4, 0.6, ALL], [ALL, ALL, ALL, ALL])],
        // 57: only the sun rings, whole, lighting up in four layers from the sea upwards, a pair more each beat (3 and
        // 8, 2 and 9, 1 and 10, then 11 and 12); the bottom four rings stay dark (below).
        [[3, 8], [2, 9], [1, 10], [11, 12]].map((rings, k) => whenOn(rings, "all", [0, 1, 2, 3].map(j => j >= k))),
        // 58: the sea (below, VERSE1_SEA_BAR), no beat windows.
        [],
        // 59: "היי משם" (below, VERSE1_HEY_BAR), no beat windows.
        [],
        // 60: the low brightness travelling round from rings 2 and 3 (below, VERSE1_PASS_BAR), no beat windows.
        [],
        // 61: "at the window" (below, VERSE1_WINDOW_BAR), no beat windows.
        [],
        // 62: "a tree" (below, VERSE1_TREE_BAR), no beat windows.
        [],
        // 63: "וילון", the curtain (below, VERSE1_CURTAIN_BAR), no beat windows.
        [],
        // 64: the scene lighting back up and turning back into the sun (below, VERSE1_SUN_BACK), no beat windows.
        // Bar 65 introduces the chorus (after the verse, before chorus 1).
        [],
      ];
      VERSE1_BARS.forEach((groups, k) => groups.forEach(grp => elements(grp.rings, () =>
        beatWindow(grp.seg, VERSE1_START + 4 * k, grp.start, grp.end))));

      // Bar 59, "היי משם": everything stays as at the end of bar 58 (the sea fully revealed, the sky at full
      // brightness, below), except the two rightmost rings (2 and 3, at 2:30 and 3:30): at the verse' base
      // brightness, with a part of rad raised to full, from the center outwards, that shrinks back toward the center
      // each beat (0-0.75, 0-0.5, 0-0.25, then nothing).
      const VERSE1_HEY_BAR = VERSE1_START + 4 * 10, HEY_RINGS = [2, 3], HEY_LIT = [0.75, 0.5, 0.25, 0];
      elements(HEY_RINGS, () => segment("rad", () => HEY_LIT.forEach((lit, j) => {
        if (lit > 0) beats(VERSE1_HEY_BAR + j, VERSE1_HEY_BAR + j + 1, () =>
          addEffect({ position_brightness: { mult_factor_increase: { fixed_window: { start: 0, end: lit - 0.001, outside_value: 0, func: K(1) } } } }));
      })));
      // Bar 58, at full brightness like the end of bar 57: the bottom four rings (4-7) turn into the sea, blue (hue
      // 0.66), most saturated at the bottom and paler toward the top, near the sun, and the other eight (the sky) are
      // raised to full too.
      const VERSE1_SEA_BAR = VERSE1_START + 4 * 9;
      // Each depth: its rings and its color.
      const SEA: [number[], { hue: number; sat: number; val: number }][] = [
        [[4, 7], { hue: 0.66, sat: 0.85, val: 1 }],
        [[5, 6], { hue: 0.66, sat: 1, val: 1 }],
      ];
      // The bottom four rings stay dark through bar 57, while the sun rings light up above them.
      elements([4, 5, 6, 7], () => beats(VERSE1_SEA_BAR - 4, VERSE1_SEA_BAR, () => fade({ start: 0, end: 0 })));
      const SKY_RINGS = [8, 9, 10, 11, 12, 1, 2, 3];
      // The sky at full brightness through bar 58, and through bar 59 too except the rings saying "היי משם".
      elements(SKY_RINGS, () => beats(VERSE1_SEA_BAR, VERSE1_SEA_BAR + 4, () =>
        addEffect({ timed_brightness: { mult_factor_increase: K(1) } })));
      elements(SKY_RINGS.filter(r => !HEY_RINGS.includes(r)), () => beats(VERSE1_HEY_BAR, VERSE1_HEY_BAR + 4, () =>
        addEffect({ timed_brightness: { mult_factor_increase: K(1) } })));
      // Bar 60: everything at full brightness (the sky raised, the sea fully revealed), with the low brightness of
      // rings 2 and 3 moving on as a vertical band from right to left across the whole big ring, one column a beat:
      // rings 1 and 4, then 12, 11, 5 and 6 (the middle), then 10 and 7, then 9 and 8 (the far left) drop to half.
      const VERSE1_PASS_BAR = VERSE1_HEY_BAR + 4, PASS_LOW = [[1, 4], [12, 11, 5, 6], [10, 7], [9, 8]];
      elements(SKY_RINGS, () => beats(VERSE1_PASS_BAR, VERSE1_END, () =>
        addEffect({ timed_brightness: { mult_factor_increase: K(1) } })));

      // The sea is revealed from each ring's outer edge inwards along rad (1.0 down to 0.0), a quarter more each beat
      // (from 0.75, 0.5, 0.25, then 0, to the edge): the sea's blue for the whole bar, what is not revealed yet a
      // darker blue (a window: brightness kept inside it, SEA_DIM of it outside).
      const SEA_REVEAL = [0.75, 0.5, 0.25, 0], SEA_DIM = 0.3;
      // Bar 64 (VERSE1_SUN_BACK): the scene's parts turn back into the sun's colors (the verse' base) a part a beat,
      // from the top down: the tree, its stump, then the whole sea at once on the bar's last beat.
      const VERSE1_SUN_BACK = VERSE1_START + 4 * 15;
      const SEA_SUN_BACK = [VERSE1_SUN_BACK + 3, VERSE1_SUN_BACK + 3];
      SEA.forEach(([rings, color], depth) => elements(rings, () => {
        // Through bars 59-65 too, fully revealed there.
        beats(VERSE1_SEA_BAR, SEA_SUN_BACK[depth], () => constColor(color));
        segment("rad", () => SEA_REVEAL.forEach((from, j) => beats(VERSE1_SEA_BAR + j, VERSE1_SEA_BAR + j + 1, () =>
          addEffect({ position_brightness: { mult_factor_decrease: { fixed_window: { start: from, end: ALL, outside_value: SEA_DIM, func: K(1) } } } }))));
      }));
      // Bar 60's travelling low brightness, after the sea's color so the color does not reset it.
      PASS_LOW.forEach((rings, j) => {
        if (rings.length) elements(rings, () => beats(VERSE1_PASS_BAR + j, VERSE1_PASS_BAR + j + 1, () => fade({ start: 0.5, end: 0.5 })));
      });
      // Bar 61, "at the window": the sea and the sky stay lit as in bar 60 (the sky's full brightness above runs
      // through it), and rings 2 and 9, on opposite sides of the big ring, open like windows into the dark: a dark
      // gap opens in the middle of each along rad and widens to both edges a step each beat, until the ring is
      // dark on the last beat.
      const VERSE1_WINDOW_BAR = VERSE1_PASS_BAR + 4, TREE_RINGS = [2, 9], BRANCH_RINGS = [3, 8];
      // The window opens a beat early, on the last beat of bar 60.
      const WINDOW_START = VERSE1_WINDOW_BAR - 1;
      const WINDOW_RINGS = [...TREE_RINGS, ...BRANCH_RINGS], WINDOW_OPEN = [0.125, 0.25, 0.375, 0.6];
      elements(WINDOW_RINGS, () => segment("rad", () => WINDOW_OPEN.forEach((w, j) =>
        beats(WINDOW_START + j, WINDOW_START + j + 1, () => addEffect({
          position_brightness: { mult_factor_decrease: { fixed_window: { start: 0.5 - w, end: 0.5 + w, outside_value: 1, func: K(0) } } },
        })))));
      // Bar 62, "a tree": the window rings (2 and 9) reveal a tree, while the sea and the rest of the sky stay lit. A
      // leafy green texture along rand (scattered pixels, so it is mottled, not striped): a green base, and three
      // sins of different lengths along rand nudging the hue between yellow-green and blue-green, the saturation
      // and the brightness (darker and brighter leaves). A soft glow drifts slowly through rand, lifting the leaves
      // it passes, so the tree shimmers. It is revealed like the window in bar 61 in reverse: the dark gap in the
      // middle of the ring narrows each beat until it is gone.
      const VERSE1_TREE_BAR = VERSE1_WINDOW_BAR + 4, TREE_GREEN = { hue: 0.33, sat: 1, val: 1 };
      // The tree comes a beat early, on the last beat of bar 61 (over the window's last, darkest step).
      const TREE_START = VERSE1_TREE_BAR - 1;
      const along = (min: number, max: number, repeats: number, phase = 0) => ({ sin: { min, max, phase, repeats } });
      /** The texture shared by the tree and its branches: brightness varying along rand (darker and brighter
       *  leaves) and a soft glow drifting slowly through rand, so it shimmers; then revealed like the window in bar
       *  61 in reverse, the dark gap in the middle along rad closing back to nothing. */
      const leafy = () => {
        segment(segment_rand, () => {
          addEffect({ position_brightness: { mult_factor_decrease: along(0.35, 1, 11, 0.6) } });
          addEffect({
            snake_brightness: { head: L(0, 1), tail_length: K(0.3), cyclic: true, mult_factor_increase: along(0, 0.6, 1, -0.25) },
          });
        });
        segment("rad", () => [0.375, 0.25, 0.125].forEach((w, j) => beats(TREE_START + j, TREE_START + j + 1, () => addEffect({
          position_brightness: { mult_factor_decrease: { fixed_window: { start: 0.5 - w, end: 0.5 + w, outside_value: 1, func: K(0) } } },
        }))));
      };
      // The tree (rings 2 and 9): green, its hue nudged between yellow-green and blue-green and its saturation
      // varied along rand.
      elements(TREE_RINGS, () => beats(TREE_START, VERSE1_SUN_BACK + 1, () => {
        constColor(TREE_GREEN);
        segment(segment_rand, () => {
          addEffect({ position_hue: { offset_factor: along(-0.05, 0.04, 7) } });
          addEffect({ position_saturation: { mult_factor_decrease: along(0.7, 1, 5, 0.3) } });
        });
        leafy();
      }));
      // Its branches (rings 3 and 8, just below): brown wood, with about a third of the pixels (scattered along
      // rand, a window repeated three times) turned to the tree's green as leaves.
      const BRANCH_BROWN = { hue: 0.07, sat: 0.85, val: 0.75 };
      elements(BRANCH_RINGS, () => beats(TREE_START, VERSE1_SUN_BACK + 2, () => {
        constColor(BRANCH_BROWN);
        segment(segment_rand, () => addEffect({
          position_hue: { offset_factor: repeatFn(3, { fixed_window: { start: 0, end: 0.33, outside_value: 0, func: K(TREE_GREEN.hue - BRANCH_BROWN.hue) } }) },
        }));
        leafy();
      }));
      // Bar 63, "וילון": a curtain over the whole scene (sky, tree, sea), which carries on underneath, on every ring
      // for 4 beats: CURTAIN_STRIPES dark and light stripes along rad (a window
      // repeated along it, dimmed to CURTAIN_DIM), the dark and light stripes swapping on every beat.
      const VERSE1_CURTAIN_BAR = VERSE1_TREE_BAR + 4, CURTAIN_DIM = 0.3, CURTAIN_STRIPES = 10;
      // A beat early: from the last beat of bar 62 to the third beat of bar 63.
      const CURTAIN_START = VERSE1_CURTAIN_BAR - 1;
      const curtainStripes = (odd: boolean) => segment("rad", () => addEffect({
        position_brightness: {
          mult_factor_decrease: repeatFn(CURTAIN_STRIPES / 2, {
            fixed_window: { start: odd ? 0.5 : 0, end: odd ? 1 : 0.4995, outside_value: 1, func: K(CURTAIN_DIM) },
          }),
        },
      }));
      elements(all, () => {
        for (let j = 0; j < 4; j++) beats(CURTAIN_START + j, CURTAIN_START + j + 1, () => curtainStripes(j % 2 === 1));
      });
      // Beat 251, after the curtain: the whole scene stays low, at CURTAIN_DIM.
      elements(all, () => beats(CURTAIN_START + 4, VERSE1_SUN_BACK, () => fade({ start: CURTAIN_DIM, end: CURTAIN_DIM })));
      // The 5 beats from bar 64: the scene lights back up from CURTAIN_DIM to full, while its parts turn back into the
      // sun (above). The sea rings, once back to the sun, at full like the sky.
      const SUN_BACK_LIT = VERSE1_SUN_BACK + 5;
      SEA.forEach(([rings], depth) => elements(rings, () => beats(SEA_SUN_BACK[depth], VERSE1_END, () =>
        addEffect({ timed_brightness: { mult_factor_increase: K(1) } }))));
      elements(all, () => beats(VERSE1_SUN_BACK, SUN_BACK_LIT, () => fade({ start: CURTAIN_DIM, end: 1 })));
      // The whole verse, over everything else: a small pulse on every beat, the scene dipping to VERSE1_PULSE on the
      // beat and coming back up linearly to full in the first quarter of the beat.
      const VERSE1_PULSE = 0.75;
      elements(all, () => beats(VERSE1_START, VERSE1_END, () => cycle(1, () => addEffect({
        timed_brightness: { mult_factor_decrease: { half: { f1: { half: { f1: L(VERSE1_PULSE, 1), f2: K(1) } }, f2: K(1) } } },
      }))));
    });

    // The drum fill into verse 1 (beats 190-192), on top of the party and the verse fading in: 2 hits in beat 190
    // a quarter beat apart, then 5 quick ones in beat 191 an eighth apart (as heard in the audio, ~190.45, 190.7 and
    // ~191.45 to 191.95). The whole installation is low over the 2 beats, and on each hit every ring flashes up
    // (DRUM_PEAK of the way from low to full, not all of it, so the quick hits do not flicker) and fades back to low
    // over the rest of the hit, a pulse that speeds up with the drums. One cycle per hit.
    const DRUM_LOW = 0.3, DRUM_PEAK = 0.5;
    const drumFlash = () => addEffect({ timed_brightness: { mult_factor_increase: L(DRUM_PEAK, 0) } });
    elements(all, () => {
      beats(190, 192, () => fade({ start: DRUM_LOW, end: DRUM_LOW }));
      beats(190.45, 190.95, () => cycle(0.25, drumFlash));
      beats(191.45, 192.075, () => cycle(0.125, drumFlash));
    });

    // Over a chorus' sun, the whole chorus: a snake lifting the pixels it covers toward SHINE_PEAK and back on a sin,
    // so the dark parts glimmer like confetti. It only raises brightness, so the lit parts of the sun stay as they are.
    // Mostly a slow snake on rand, a third of the pixels long, passing once a bar; for bars 5-8 of the chorus a snake
    // on centric instead, going round every small ring once a beat.
    const SHINE_PEAK = 0.5;
    const chorusShine = (start: number, end: number) => {
      const spinStart = start + 16, spinEnd = spinStart + 16;
      const shine = (seg: string, cycleBeats: number) => segment(seg, () => cycle(cycleBeats, () => addEffect({
        snake_brightness: {
          head: L(0, 1),
          tail_length: K(0.33),
          cyclic: true,
          mult_factor_increase: { sin: { min: 0, max: SHINE_PEAK, phase: -0.25, repeats: 1 } },
        },
      })));
      elements(all, () => {
        beats(start, spinStart, () => shine(segment_rand, 4));
        beats(spinStart, spinEnd, () => shine(segment_centric, 1));
        beats(spinEnd, end, () => shine(segment_rand, 4));
      });
    };

    // Chorus 1, bars 67-82 (beats 264-328), fading in over the 2 beats before it (beats 262-264).
    // The coloring: the whole installation as one burning sun, hotter toward its center. Every ring at full
    // saturation, its hue running along rad from orange on the inner side (facing the center of the
    // big ring) to deep red on the outer side, so the 12 rings together make a glowing orange core with a red rim.
    // The odd and even rings are a little apart (the even ones redder), so neighbouring rings still differ.
    // Past the outer edge of rad, so a window to it takes the outermost pixels too.
    const ALL_RAD = 1.01;
    const CHORUS1_START = 264, CHORUS1_END = 328, CHORUS1_FADE_IN = 2, CHORUS1_SWING = 4, CHORUS1_PHRASE = 16, CHORUS1_CIRCLE_PHRASES = 2;
    // Each ring's inner (core) and outer (rim) hue. The rim stops at red: the hue never goes below 0, which on the
    // rings shows as pink.
    const CHORUS1_SUN: Record<"odd" | "even", { core: number; rim: number }> = {
      odd: { core: 0.09, rim: 0.02 },
      even: { core: 0.06, rim: 0 },
    };
    // Bar 65 (beats 256-260), the end of verse 1: its 4 hits introduce the chorus, a part of it each, on the chorus'
    // sun coloring (orange core to red rim along rad, otherwise dark), in sharp blinks: each part switches on at full
    // on its hit and off on the next, nothing fades and nothing moves. In order: the coloring alone (the whole ring),
    // the sun (off center: on every ring a still disc along rad from the inner side, biggest on the ring at
    // INTRO_SUN_RING (1:30), covering the whole ring there, and smaller the further a ring is from it, down to
    // INTRO_DISC_MIN on the opposite side, so the sun sits up and to the right), the confetti
    // (chorusShine's snake on rand, held still, at full), then all of them together (the coloring at INTRO_BASE so
    // the disc and the confetti stand out on it), held for INTRO_LAST beats and
    // cut at 261, a beat of dark before the chorus' lightning.
    const INTRO = 256, INTRO_LAST = 2, INTRO_SUN_RING = 1, INTRO_DISC_MIN = 0.1, INTRO_BASE = 0.35;
    const introColor = (val = 1) => addEffect({ timed_brightness: { mult_factor_increase: K(val) } });
    /** How far along rad ring `ring`'s part of the sun reaches: 1 at INTRO_SUN_RING, INTRO_DISC_MIN opposite it. */
    const introDisc = (ring: number) =>
      INTRO_DISC_MIN + (1.01 - INTRO_DISC_MIN) * (Math.cos(((ring - INTRO_SUN_RING) * Math.PI) / 6) + 1) / 2;
    const introCircle = (ring: number) => segment("rad", () => addEffect({
      position_brightness: { mult_factor_increase: { fixed_window: { start: 0, end: introDisc(ring), outside_value: 0, func: K(1) } } },
    }));
    const introConfetti = () => segment(segment_rand, () => addEffect({
      snake_brightness: { head: K(0), tail_length: K(0.33), cyclic: true, mult_factor_increase: { sin: { min: 0, max: 1, phase: -0.25, repeats: 1 } } },
    }));
    all.forEach(ring => elements([ring], () => {
      const { core, rim } = ring % 2 ? CHORUS1_SUN.odd : CHORUS1_SUN.even;
      beats(INTRO, INTRO + 3 + INTRO_LAST, () => {
        constColor({ hue: core, sat: 1, val: 0 });
        segment("rad", () => addEffect({ position_hue: { offset_factor: L(0, rim - core) } }));
      });
      beats(INTRO, INTRO + 1, () => introColor());
      beats(INTRO + 1, INTRO + 2, () => introCircle(ring));
      beats(INTRO + 2, INTRO + 3, introConfetti);
      beats(INTRO + 3, INTRO + 3 + INTRO_LAST, () => { introColor(INTRO_BASE); introCircle(ring); introConfetti(); });
    }));

    section("chorus 1", { start: CHORUS1_START, end: CHORUS1_END, fadeIn: CHORUS1_FADE_IN }, () => {
      ([[ODD_RINGS, CHORUS1_SUN.odd], [EVEN_RINGS, CHORUS1_SUN.even]] as const).forEach(([rings, { core, rim }]) => elements([...rings], () => {
        // Brightness 0: dark except where the effects below raise it.
        constColor({ hue: core, sat: 1, val: 0 });
        segment("rad", () => addEffect({ position_hue: { offset_factor: L(0, rim - core) } }));
      }));
      // Over the 2 beats of the fade-in, every ring at full, for the lightning below to strike in.
      elements(all, () => beats(CHORUS1_START - CHORUS1_FADE_IN, CHORUS1_START, () =>
        addEffect({ timed_brightness: { mult_factor_increase: K(1) } })));
      // Then a light circling round the big ring: on every ring a window along rad from the inner side (0) out to an
      // edge swinging on a sin from 0 to 1 and back every CHORUS1_SWING beats, so the light grows out from the inner
      // side to the whole ring and shrinks back. Ring r's sin is (r - 1) / 12 of a swing behind ring 1 (phase by the
      // index), a full swing across the 12 rings, so the biggest light moves clockwise round the big ring once a
      // swing. A position window cannot change over time, so the window is a snake from just below 0 to its head, the
      // head on the sin.
      // For the second CHORUS1_PHRASE beats (bars 5-8) the same circle grows in from the outer side instead: the window
      // runs from the outer edge (1) in to 1 - the sin, so the light comes in from the rim. The circle runs for the
      // first CHORUS1_CIRCLE_PHRASES phrases (8 bars); then the sun's rays (below).
      all.forEach(ring => elements([ring], () => segment("rad", () => {
        for (let start = CHORUS1_START, k = 0; k < CHORUS1_CIRCLE_PHRASES; start += CHORUS1_PHRASE, k++) {
          const fromOuter = k % 2 === 1;
          beats(start, Math.min(start + CHORUS1_PHRASE, CHORUS1_END), () => cycle(CHORUS1_SWING, () => {
            const edge = { sin: { min: 0, max: 1, phase: -(ring - 1) / 12 - 0.25, repeats: 1 } };
            addEffect({
              snake_brightness: {
                head: fromOuter ? K(1.005) : edge, tail_length: shift(edge, 0.01), cyclic: false, mult_factor_increase: K(1),
              },
            });
          }));
        }
      })));
      chorusShine(CHORUS1_START, CHORUS1_END);
      // Bars 9-16: the sun with rays, alternating between the odd and the even rings: each group's ray comes every
      // RAY_CYCLE beats (half a bar), the even rings' half a cycle after the odd rings'. A ray grows out of the core for
      // RAY_BAR beats, a window along rad from RAY_FROM out to an edge moving steadily to the outer edge (1), then for
      // RAY_FADE beats the ray (rad RAY_FROM - 1) fades back to black. The growing window is a snake from just below
      // RAY_FROM to its head, since a position window cannot change over time. The core, every ring along rad from 0
      // to RAY_FROM, stays lit throughout: it comes after the rays so their fade does not dim it.
      const CHORUS1_RAYS_START = CHORUS1_START + CHORUS1_CIRCLE_PHRASES * CHORUS1_PHRASE;
      const RAY_BAR = 0.5, RAY_GROUPS = 2, RAY_CYCLE = 2;
      // Where the core ends and the rays start along rad, and how long a ray takes to fade (twice its growing).
      const RAY_FROM = 0.4, RAY_FADE = 2 * RAY_BAR;
      const rayWindow = (start: number, end: number) => addEffect({
        position_brightness: { mult_factor_increase: { fixed_window: { start, end, outside_value: 0, func: K(1) } } },
      });
      // One cycle of RAY_CYCLE beats per group, from its first ray: the ray grows in the cycle's first
      // RAY_BAR beats and fades in the next RAY_FADE, then the group waits for the others.
      // The rays run for one CHORUS1_PHRASE (bars 9-12, up to CHORUS1_FILL_START), each group's last cycle ending in
      // time.
      const head = L(RAY_FROM, 1.005), CHORUS1_FILL_START = CHORUS1_RAYS_START + CHORUS1_PHRASE;
      for (let g = 0; g < RAY_GROUPS; g++) elements(all.filter(r => (r - 1) % RAY_GROUPS === g), () => segment("rad", () =>
        beats(CHORUS1_RAYS_START + g * RAY_CYCLE / RAY_GROUPS, CHORUS1_FILL_START, () => {
          cycleBeats(RAY_CYCLE, 0, RAY_BAR, () =>
            addEffect({ snake_brightness: { head, tail_length: shift(head, -(RAY_FROM - 0.01)), cyclic: false, mult_factor_increase: K(1) } }));
          cycleBeats(RAY_CYCLE, RAY_BAR, RAY_BAR + RAY_FADE, () => {
            rayWindow(RAY_FROM, ALL_RAD);
            addEffect({ timed_brightness: { mult_factor_decrease: L(1, 0) } });
          });
        })));
      elements(all, () => beats(CHORUS1_RAYS_START, CHORUS1_FILL_START, () => segment("rad", () => rayWindow(0, RAY_FROM - 0.0005))));
      // Bars 79 - 80.5 (beats 312-318): every ring fills up from the core to the outer edge, the lit window along rad
      // growing steadily from 0 - RAY_FROM to 0 - 1. Bars 80.5 - 82 (beats 318-324): it empties out towards the
      // outside, the window's end staying at the outer edge (1) while its start moves steadily from 0 to 1. Bar 82
      // stays dark. Both windows are snakes,
      // since a position window cannot change over time.
      const CHORUS1_FILL = 6, CHORUS1_UNFILL = 6;
      elements(all, () => segment("rad", () => {
        const fillEdge = L(RAY_FROM, 1.005);
        beats(CHORUS1_FILL_START, CHORUS1_FILL_START + CHORUS1_FILL, () =>
          addEffect({ snake_brightness: { head: fillEdge, tail_length: shift(fillEdge, 0.01), cyclic: false, mult_factor_increase: K(1) } }));
        beats(CHORUS1_FILL_START + CHORUS1_FILL, CHORUS1_FILL_START + CHORUS1_FILL + CHORUS1_UNFILL, () =>
          addEffect({ snake_brightness: { head: K(1.005), tail_length: L(1.015, 0), cyclic: false, mult_factor_increase: K(1) } }));
      }));
      // Bars 75-79 (beats 296-316), over the rays and the fill: dark confetti, a snake on rand a third of the pixels
      // long, jumping a quarter of rand back on every off-beat (half a beat late; a lap a bar, the other way to the
      // shine), dimming the pixels it covers down to DARK_CONFETTI and back on a sin, so the lit parts get moving
      // darker specks. It comes after the rays, core and fill so it dims them too. When the steps end it stops where it
      // is and fades out over CONFETTI_FADE beats, in CONFETTI_FADE_STEPS windows of weakening strength (a snake's
      // strength is a function along the snake, not of time).
      const DARK_CONFETTI = 0.15, CONFETTI_FADE = 2, CONFETTI_FADE_STEPS = 8;
      const CONFETTI_START = CHORUS1_RAYS_START + 0.5, CONFETTI_END = CHORUS1_FILL_START + 4.5;
      /** The dark confetti snake, its head at `head`, at strength `s` (1 full, 0 none). */
      const confetti = (head: object, s: number) =>
        addEffect({
          snake_brightness: {
            head, tail_length: K(0.35), cyclic: true,
            mult_factor_decrease: { sin: { min: 1 - s * (1 - DARK_CONFETTI), max: 1, phase: 0.25, repeats: 1 } },
          },
        });
      elements(all, () => segment(segment_rand, () => {
        beats(CONFETTI_START, CONFETTI_END, () => cycle(4, () => confetti(
          { steps: { num_steps: 4, first_step_value: 1, diff_per_step: -0.25 } }, 1)));
        // The last step of a cycle: the head at 0.25.
        for (let k = 0; k < CONFETTI_FADE_STEPS; k++) {
          const from = CONFETTI_END + k * CONFETTI_FADE / CONFETTI_FADE_STEPS;
          beats(from, from + CONFETTI_FADE / CONFETTI_FADE_STEPS, () => confetti(K(0.25), 1 - (k + 0.5) / CONFETTI_FADE_STEPS));
        }
      }));
      // Lit up from dark like lightning, in 2 groups on the 2 beats before the chorus: on the first beat half of every
      // small ring strikes on (6 pixels in a row, along centric), the other half staying dark, and on the second beat
      // the other half. The same half (pixels 0-5) on every ring.
      elements(all, () => segment(segment_centric, () => {
        const from = 0.5;
        beats(CHORUS1_START - CHORUS1_FADE_IN, CHORUS1_START - CHORUS1_FADE_IN + 1, () => addEffect({
          position_brightness: {
            mult_factor_decrease: { fixed_window: { start: from - 0.001, end: from + 0.49, cyclic: true, outside_value: 1, func: K(0) } },
          },
        }));
      }));
    });

    // Party 2, bars 83-92 (beats 328-368): the party comes back, built like the first one (the same blues, 8-beat
    // blocks of a different motion phased in ring groups, and a beat in the hue), but everything in it is a snake.
    const PARTY2_START = 328, PARTY2_END = 368, PARTY2_BLOCK = 8;
    // The two snakes of every block: one round its segment every beat, one every bar.
    const PARTY2_CYCLES = [1, 4];
    section("party 2", { start: PARTY2_START, end: PARTY2_END }, () => {
      // Every ring its party blue, at brightness 0: dark except where the snakes below light it.
      all.forEach(ring => elements([ring], () => constColor({ ...RING_BLUES[ring], val: 0 })));
      // Every PARTY2_BLOCK beats (2 bars: 83-84, 85-86, …) a different kind of snake, two of them on the same segment:
      // one going round it every beat and one every bar (PARTY2_CYCLES), each brightest at its head and fading along
      // its tail. The rings are phased in groups of 2, 4 or 6 (changing
      // every block): in a group of N, ring r is (r - 1) mod N / N of a lap behind, so the snakes ripple round the big
      // ring. All the snakes are cyclic, so a phase only shifts the head and nothing is cut.
      // Similar mappings are grouped, so each holds for 4 bars: rad out and in (bars 83-86), then inside every small
      // ring, centric and arc (bars 87-90), then round the big ring on ind (bars 91-92).
      const PARTY2_SNAKES: [string, number, number][] = [
        // [segment, length, direction]
        ["rad", 0.35, 1], // pulses out from the inner side to the outer side
        ["rad", 0.35, -1], // pulses in from the outer side
        [segment_centric, 0.5, 1], // round every small ring
        [segment_arc, 0.5, 1], // from pixel 0 down both sides of every small ring
        [segment_ind, 0.4, 1], // round the big ring through the small rings
      ];
      const PARTY2_PHASE_GROUPS = [2, 4, 6, 2, 4];
      PARTY2_SNAKES.forEach(([seg, tail, dir], k) => {
        const from = PARTY2_START + k * PARTY2_BLOCK, to = from + PARTY2_BLOCK, n = PARTY2_PHASE_GROUPS[k];
        all.forEach(ring => elements([ring], () => beats(from, to, () => segment(seg, () => PARTY2_CYCLES.forEach(c => cycle(c, () => {
          const phase = 1 - ((ring - 1) % n) / n; // behind, kept positive so the cyclic head wraps right
          addEffect({
            snake_brightness: {
              head: dir > 0 ? L(phase, phase + 1) : L(phase + 1, phase), tail_length: K(tail), cyclic: true,
              mult_factor_increase: dir > 0 ? L(0, 1) : L(1, 0),
            },
          });
        }))))));
      });
      // The beat in the hue, also a snake: a hue snake half the big ring long goes round the small rings (ind) once
      // every 2 beats, shifting the colors it passes by up to HUE_SNAKE_SHIFT (staying around blue); every block it
      // turns the other way.
      const HUE_SNAKE_SHIFT = 0.12;
      elements(all, () => segment(segment_ind, () => PARTY2_SNAKES.forEach((_, k) => {
        const from = PARTY2_START + k * PARTY2_BLOCK, to = from + PARTY2_BLOCK;
        beats(from, to, () => cycle(2, () => addEffect({
          snake_hue: {
            head: k % 2 ? L(1, 0) : L(0, 1), tail_length: K(0.5), cyclic: true,
            offset_factor: { sin: { min: 0, max: HUE_SNAKE_SHIFT, phase: -0.25, repeats: 1 } },
          },
        })));
      })));
    });

    // Verse 2, bars 93-100 (beats 368-400), fading out over bars 101-102 (beats 400-406, 406 not included): warm, sunny coloring, every ring
    // lit, picked in the gallery (ui/gallery.html, src/songs/shemesh-gallery-options.ts): bars 93-96 a yellow core and
    // red rim on every ring with a slightly warmer band spinning round every small ring on each beat, bars 97-100 every
    // small ring orange at pixel 0 to gold round both sides, drifting slowly warmer and back. The second coloring runs
    // on through the fade-out.
    const VERSE2_START = 368, VERSE2_END = 400, VERSE2_FADE_OUT = 6;
    const VERSE2_FLOW: Record<number, MixPick> = { 0: { option: "Comets along all ×2, pale", speed: "medium", hit: "beat" } };
    const VERSE2_MIX: Record<number, MixPick> = {
      0: { option: "Sun core, warm band", speed: "medium", hit: "beat" },
      1: { option: "Petals, slow drift", speed: "fast", hit: "beat" },
    };
    section("verse 2", { start: VERSE2_START, end: VERSE2_END, fadeOut: VERSE2_FADE_OUT }, () => {
      galleryMix("verse2", VERSE2_MIX, { tail: VERSE2_FADE_OUT });
      // Beats 368-375, the verse's start darker, with "wake up" and "fall asleep" as brightness over it: the big ring
      // as an eye, its top and bottom rings the eyelids. Each ring's distance from the middle line (3 to 9 o'clock),
      // lid = |cos| of its angle: 0.26 for rings 2, 3, 8, 9, 0.71 for 1, 4, 7, 10, 0.97 for the top and bottom rings
      // 11, 12, 5, 6.
      // Beats 368-370: every ring at EYE_DIM.
      // Beat 370, "wake up": the eye opens from the middle line out to the top and bottom: each ring rises smoothly
      // from EYE_DIM to full over EYE_OPEN, EYE_SPREAD lid beats in, with a soft flash (raised to EYE_FLASH and
      // settling over half a beat).
      // Beats 371-373, "fall asleep": the lids close slowly, from the top and bottom in to the middle: each ring sinks
      // back to EYE_DIM over EYE_CLOSE beats, starting (1 - lid) EYE_SPREAD_SLEEP beats after 371, so the middle rings
      // are the last open; held, then the verse rising slowly to its own brightness over EYE_BACK - EYE_ASLEEP beats,
      // under the pulses of "לא נדם" (below), so they stand out and the scene builds with them up to the blue wind.
      const EYE_START = VERSE2_START, EYE_WAKE = 370, EYE_SLEEP_START = 371, EYE_ASLEEP = 373, EYE_BACK = 378;
      const EYE_DIM = 0.3, EYE_OPEN = 0.4, EYE_SPREAD = 0.6, EYE_FLASH = 0.6, EYE_CLOSE = 0.8, EYE_SPREAD_SLEEP = 1.2;
      all.forEach(ring => elements([ring], () => {
        const lid = Math.abs(Math.cos(((ring + 0.5) * Math.PI) / 6));
        const opens = EYE_WAKE + EYE_SPREAD * lid;
        beats(EYE_START, opens, () => fade({ start: EYE_DIM, end: EYE_DIM }));
        beats(opens, opens + EYE_OPEN, () => fade({ start: EYE_DIM, end: 1 }));
        beats(opens, opens + 0.5, () => addEffect({ timed_brightness: { mult_factor_increase: L(EYE_FLASH, 0) } }));
        const closes = EYE_SLEEP_START + EYE_SPREAD_SLEEP * (1 - lid);
        beats(closes, closes + EYE_CLOSE, () => fade({ start: 1, end: EYE_DIM }));
        beats(closes + EYE_CLOSE, EYE_ASLEEP, () => fade({ start: EYE_DIM, end: EYE_DIM }));
        beats(EYE_ASLEEP, EYE_BACK, () => fade({ start: EYE_DIM, end: 1 }));
      }));
      // Beats 374-378, "לא נדם" (did not fall silent): it keeps going, a pulse of light pushing out along rad from the
      // inner side past the rim on every beat on every ring, like a heartbeat or a sound wave, brightest at its front
      // and fading along a STILL_TAIL tail; soft (STILL_SOFT) for the first 2 beats, at full for the last 2, so it grows
      // louder rather than quieter.
      const STILL = 374, STILL_TAIL = 0.35, STILL_SOFT = 0.6;
      elements(all, () => segment("rad", () => [STILL_SOFT, 1].forEach((peak, k) =>
        beats(STILL + 2 * k, STILL + 2 * k + 2, () => cycle(1, () => addEffect({
          snake_brightness: { head: L(0, 1 + STILL_TAIL), tail_length: K(STILL_TAIL), cyclic: false, mult_factor_increase: L(0, peak) },
        }))))));
      // Beats 378-383, "blue wind": the bottom four rings (4-7) turn into the sea, as in verse 1, and stay it for the
      // rest of the verse (through its fade-out, until the chorus' sparkles take each ring over): over SEA_TURN their
      // hue slides smoothly down by SEA_SHIFT (through red and violet to blue, rather than through green), then the
      // sea's blue itself, paler on the outer two, near the sun. Over the water the wind blows, once over beats
      // 378-383: a single burst of wind, scattered whitening flecks (a snake on rand lowering the saturation, most at
      // its head, passing once through the ring over WIND_GUST beats), emerges on the rightmost sea ring (4) and passes
      // on to the left (5, 6, 7), each ring WIND_LAG behind the one to its right and weaker (its head's saturation from
      // WIND_SAT on ring 4 up by WIND_WEAKEN a ring), so it dies out going left. Its tail is short (WIND_TAIL), so only a
      // few flecks at a time, but each ring holds the burst for WIND_GUST beats, so it is on 2-3 rings at a time; gone
      // off ring 7 just after 383.
      const WIND = 378, SEA_TURN = 1, SEA_SHIFT = -0.44, WIND_SAT = 0.15, WIND_WEAKEN = 0.12, WIND_TAIL = 0.45, WIND_LAG = 0.75, WIND_GUST = 3;
      // The burst also glints: while it is on a ring, fast brightness sparkles (a short snake on rand, round the ring
      // every GLINT_LAP beats, so it lights a few scattered pixels one after another) raise the water to full, weaker on
      // each ring to the left like the whitening. The sea is a little below full (SEA_VAL) so the glints show.
      const SEA_VAL = 0.75, GLINT_LAP = 1, GLINT_TAIL = 0.05, GLINT_PEAK = 1, GLINT_WEAKEN = 0.15;
      const VERSE2_SEA: [number, { hue: number; sat: number; val: number }][] = [
        [4, { hue: 0.66, sat: 0.85, val: SEA_VAL }],
        [5, { hue: 0.66, sat: 1, val: SEA_VAL }],
        [6, { hue: 0.66, sat: 1, val: SEA_VAL }],
        [7, { hue: 0.66, sat: 0.85, val: SEA_VAL }],
      ];
      VERSE2_SEA.forEach(([ring, sea], k) => elements([ring], () => {
        beats(WIND, WIND + SEA_TURN, () => addEffect({ timed_hue: { offset_factor: L(0, SEA_SHIFT) } }));
        beats(WIND + SEA_TURN, VERSE2_END + VERSE2_FADE_OUT, () => constColor(sea));
        beats(WIND + k * WIND_LAG, WIND + k * WIND_LAG + WIND_GUST, () => segment(segment_rand, () => addEffect({
          snake_saturation: { head: L(0, 1 + WIND_TAIL), tail_length: K(WIND_TAIL), cyclic: false, mult_factor_decrease: L(1, WIND_SAT + k * WIND_WEAKEN) },
        })));
        beats(WIND + k * WIND_LAG, WIND + k * WIND_LAG + WIND_GUST, () => segment(segment_rand, () => cycle(GLINT_LAP, () => addEffect({
          snake_brightness: { head: L(0, 1), tail_length: K(GLINT_TAIL), cyclic: true, mult_factor_increase: { sin: { min: 0, max: GLINT_PEAK - k * GLINT_WEAKEN, phase: -0.25, repeats: 1 } } },
        }))));
      }));
      // Beats 383-386, "raise your head up": the light climbs the big ring. Ring r's height h runs from 0 at the bottom
      // to 1 at the top; it dims to RAISE_LOW + (1 - RAISE_LOW) h² (the bottom rings nearly black, the top ones still
      // lit), starting RAISE_DELAY h beats in and taking RAISE_DIM beats, so the bottom goes dark first and the
      // darkness creeps upward, all within the first beat; the top rings also lift a little brighter (RAISE_TOP h³).
      // Then kept for 2 beats, to RAISE_END, the dark bottom moving with the beat: on each beat the light reaches
      // RAISE_PUSH further down (every ring lit as if it were that much higher) and the darkness stretches back up by
      // the middle of the beat (a sin once a beat). Then filling back to the coloring gradually over the next
      // RAISE_BACK beat (under the inward darkening that starts there).
      const RAISE = 383, RAISE_END = 386, RAISE_LOW = 0.04, RAISE_DELAY = 0.5, RAISE_DIM = 0.5, RAISE_TOP = 0.3, RAISE_BACK = 1;
      const RAISE_PUSH = 0.15, RAISE_HELD = RAISE + 1;
      all.forEach(ring => elements([ring], () => {
        const h = (Math.cos(((ring + 0.5) * Math.PI) / 6) + 1) / 2;
        const lowAt = (h: number) => RAISE_LOW + (1 - RAISE_LOW) * h * h;
        const low = lowAt(h), pushed = lowAt(Math.min(1, h + RAISE_PUSH)), top = RAISE_TOP * h * h * h;
        const dimFrom = RAISE + RAISE_DELAY * h, dimTo = dimFrom + RAISE_DIM, backFrom = RAISE_END;
        const both = (dec: object, inc: object) => {
          addEffect({ timed_brightness: { mult_factor_decrease: dec } });
          addEffect({ timed_brightness: { mult_factor_increase: inc } });
        };
        beats(dimFrom, dimTo, () => both(L(1, low), L(0, top)));
        if (dimTo < RAISE_HELD) beats(dimTo, RAISE_HELD, () => both(K(low), K(top)));
        beats(RAISE_HELD, backFrom, () =>
          both({ sin: { min: low, max: pushed, phase: 0.25, repeats: backFrom - RAISE_HELD } }, K(top)));
        beats(backFrom, backFrom + RAISE_BACK, () => both(L(low, 1), L(top, 0)));
      }));
      // Beats 386-389, the same inward: on every ring the light gathers to its inner side (towards the center of the
      // installation) and its outside goes dark. A dark snake on rad with its head past the rim and its tail growing
      // inward to IN_REACH over the first beat (IN_DIM), darkest (IN_LOW) over its outer half and fading to nothing at
      // its inner end, so the darkness creeps in from the outside. Then kept close for 2 beats, to IN_END, its edge
      // moving with the beat: on each beat the light pushes out to IN_PUSH and closes back in to IN_REACH by the
      // middle of the beat (a sin once a beat). Then over beat 389 the darkness recedes smoothly out past the rim, so
      // the whole ring is lit again when the flow starts at 390.
      const IN_START = RAISE_END, IN_END = 389, IN_REACH = 0.85, IN_PUSH = 0.7, IN_LOW = 0.04, IN_DIM = 1, IN_BACK = 1;
      elements(all, () => segment("rad", () => {
        const dark = (tail: object) => addEffect({
          snake_brightness: { head: K(1.01), tail_length: tail, cyclic: false, mult_factor_decrease: { half: { f1: L(1, IN_LOW), f2: K(IN_LOW) } } },
        });
        beats(IN_START, IN_START + IN_DIM, () => dark(L(0, IN_REACH)));
        const held = IN_END - IN_START - IN_DIM;
        beats(IN_START + IN_DIM, IN_END, () => dark({ sin: { min: IN_PUSH, max: IN_REACH, phase: -0.25, repeats: held } }));
        beats(IN_END, IN_END + IN_BACK, () => dark(L(IN_PUSH, 0)));
      }));
      // Beats 390-399, "light is flowing": the flow picked in the gallery (its part "Verse 2
      // flow"): 2 comets running along all through every ring's small rings, a lap every 1.25 beats, paling the colors
      // almost to white where they pass, on the verse's coloring. Faster (fast) over beats 393-399, where they stop;
      // the last beat is the verse's coloring alone.
      const FLOW_FAST: [number, number] = [393, 399];
      galleryRange("flow", VERSE2_FLOW[0], 390, FLOW_FAST[0]);
      galleryRange("flow", { ...VERSE2_FLOW[0], speed: "fast" }, FLOW_FAST[0], FLOW_FAST[1]);
      // The flow brings its own warm coloring (hue about 0.02-0.14); on the sea rings it is turned to the sea's blue
      // (and saturation), so the light flows over the water.
      const FLOW_TO_SEA = -0.41;
      VERSE2_SEA.forEach(([ring, sea]) => elements([ring], () => beats(390, FLOW_FAST[1], () => {
        addEffect({ timed_hue: { offset_factor: K(FLOW_TO_SEA) } });
        if (sea.sat < 1) addEffect({ timed_saturation: { mult_factor_decrease: K(sea.sat) } });
      })));
      // The fade-out (beats 400-406) brings in the chorus' red sparkles, a square of rings a beat: on beats 400, 401
      // and 402 one square (rings 1, 4, 7, 10, then 2, 5, 8, 11, then 3, 6, 9, 12) turns to the chorus' sun coloring
      // with a flash of its sparkles, fading out to the static sparkles of the chorus 2 intro, while the rings still
      // waiting fade the verse's coloring out. On beat 403 all the sparkles flash together and fade back, on beat
      // 404 small snakes swell up over them (below), and on beat 405 they go out (below), so the chorus 2 intro starts from dark at 406.
      const FLASH_START = VERSE2_END, FLASH_SAT = 0.75, LAST_FLASH = FLASH_START + 3, SWELL = LAST_FLASH + 1, SPARKLES_END = VERSE2_END + VERSE2_FADE_OUT;
      const SQUARES = [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]];
      /** A flash: raised to full for the first quarter, then down linearly to nothing over the rest, the colors a
       *  little pale on the hit (saturation times FLASH_SAT) and warming back up over the first beat. */
      const flash = (start: number, length: number) => {
        beats(start, start + length, () => addEffect({
          timed_brightness: { mult_factor_increase: { half: { f1: { half: { f1: K(1), f2: L(1, 2 / 3) } }, f2: L(2 / 3, 0) } } },
        }));
        beats(start, start + 1, () => addEffect({ timed_saturation: { mult_factor_decrease: L(FLASH_SAT, 1) } }));
      };
      SQUARES.forEach((rings, k) => {
        const start = FLASH_START + k;
        // Until its beat, the verse's coloring fading out (to nothing by beat 403).
        if (k > 0) elements(rings, () => beats(FLASH_START, start, () => fade({ start: 1, end: 1 - k / 3 })));
        rings.forEach(ring => elements([ring], () => beats(start, SPARKLES_END, () => {
          // The chorus' sun coloring (as in chorus 2, at brightness 0), over the verse's.
          const { core, rim } = ring % 2 ? CHORUS1_SUN.odd : CHORUS1_SUN.even;
          constColor({ hue: core, sat: 1, val: 0 });
          segment("rad", () => addEffect({ position_hue: { offset_factor: L(0, rim - core) } }));
          flash(start, 2);
          flash(LAST_FLASH, 1);
          // Only the sparkles flash: the rest of the ring is cut back to dark. The sparkles' snake (below) covers rand
          // from 0.67 to 1, dimmest at its ends, so the flash keeps a little inside that.
          segment(segment_rand, () => addEffect({
            position_brightness: { mult_factor_decrease: { fixed_window: { start: 0.7, end: 0.97, outside_value: 0, func: K(1) } } },
          }));
          // The sparkles: chorusShine's snake on rand, held still at its head's start (as in the chorus 2 intro).
          segment(segment_rand, () => addEffect({
            snake_brightness: { head: K(0), tail_length: K(0.33), cyclic: true, mult_factor_increase: { sin: { min: 0, max: SHINE_PEAK, phase: -0.25, repeats: 1 } } },
          }));
        })));
      });
      // Beat 405, the last before the chorus 2 intro: the sparkles go out one by one in a scattered order, a dark
      // snake on rand growing over their part of it (0.66 to 1) through the beat, all dark by 406.
      const SPARKLES_OUT = SPARKLES_END - 1;
      elements(all, () => beats(SPARKLES_OUT, SPARKLES_END, () => segment(segment_rand, () => addEffect({
        snake_brightness: { head: L(0.66, 1.01), tail_length: L(0, 0.36), cyclic: false, mult_factor_decrease: K(0) },
      }))));
      // Beat 404, a stretched swell rather than a hit: on top of the sparkles, on every ring a small snake moves
      // round every small ring (centric), a lap a beat (SWELL_LAP), brightest at its head, each ring a twelfth of a
      // lap behind the one before; its tail grows from nothing to SWELL_TAIL over the beat, then shrinks away over beat 405 while the
      // sparkles go out. After the darkening above, so it does not cut them.
      const SWELL_TAIL = 0.3, SWELL_LAP = 1;
      all.forEach(ring => elements([ring], () => segment(segment_centric, () => {
        const at = (ring - 1) / 12;
        const swell = (from: number, tail: object) =>
          addEffect({ snake_brightness: { head: L(from, from + SWELL_LAP), tail_length: tail, cyclic: true, mult_factor_increase: L(0, 1) } });
        beats(SWELL, SWELL + 1, () => swell(at, L(0, SWELL_TAIL)));
        beats(SWELL + 1, SPARKLES_END, () => swell(at + SWELL_LAP, L(SWELL_TAIL, 0)));
      })));
    });

    // Chorus 2, bars 103-118 (beats 408-472), fading in over the 2 beats before it (beats 406-408): chorus 1 again,
    // part for part (the same sun coloring, a fill-in, the circle, the circle from the rim, the rays, filling and
    // emptying), but each part made of moving snakes: lit bands, brightest at their head and fading along their tail.
    const CHORUS2_START = 408, CHORUS2_END = 472, CHORUS2_FADE_IN = 2, CHORUS2_PHRASE = 16;
    section("chorus 2", { start: CHORUS2_START, end: CHORUS2_END, fadeIn: CHORUS2_FADE_IN }, () => {
      // The sun coloring of chorus 1 (orange core to red rim along rad), at brightness 0.
      ([[ODD_RINGS, CHORUS1_SUN.odd], [EVEN_RINGS, CHORUS1_SUN.even]] as const).forEach(([rings, { core, rim }]) => elements([...rings], () => {
        constColor({ hue: core, sat: 1, val: 0 });
        segment("rad", () => addEffect({ position_hue: { offset_factor: L(0, rim - core) } }));
      }));
      /** A lit snake on the segment in use, from `head` back `tail` long, brightest at its head. */
      const lit = (head: object, tail: object, cyclic: boolean, headFirst = true) =>
        addEffect({ snake_brightness: { head, tail_length: tail, cyclic, mult_factor_increase: headFirst ? L(0, 1) : L(1, 0) } });
      // The circle's band length along rad (bars 1-8, below).
      const CHORUS2_BAND = 0.35;
      // The intro's 2 hits (instead of chorus 1's lightning), each bringing in a part of the chorus, frozen until the
      // chorus starts and they move on from there: on the first the red sparkles (chorusShine's snake on rand, held
      // at its head's start), on the second the circle's bands along rad (each ring's band held where its first lap
      // starts).
      elements(all, () => beats(CHORUS2_START - 2, CHORUS2_START, () => segment(segment_rand, () => addEffect({
        snake_brightness: { head: K(0), tail_length: K(0.33), cyclic: true, mult_factor_increase: { sin: { min: 0, max: SHINE_PEAK, phase: -0.25, repeats: 1 } } },
      }))));
      all.forEach(ring => elements([ring], () => beats(CHORUS2_START - 1, CHORUS2_START, () => segment("rad", () =>
        lit(K(1 - (ring - 1) / 12), K(CHORUS2_BAND), true)))));
      // Bars 1-8, the circle: on every ring a snake CHORUS2_BAND long runs along rad once a lap, ring r (r - 1) / 12 of
      // a lap behind ring 1, so across the 12 rings the bands sit at every depth: a spiral turning clockwise round the
      // big ring once a lap. The head moves on a comb of two: steadily once along rad over the lap (linear), plus a sin
      // either way, so the band surges forward and falls back as it goes. Every CHORUS2_PHRASE beats (4 bars) a
      // different motion (CHORUS2_CIRCLES): bars 1-4 out from the inner side, a lap a bar and a surge a beat; bars 5-8
      // the same in from the rim.
      const CHORUS2_CIRCLES: { dir: number; lap: number; surges: number; surge: number }[] = [
        { dir: 1, lap: 4, surges: 4, surge: 0.08 },
        { dir: -1, lap: 4, surges: 4, surge: 0.08 },
      ];
      CHORUS2_CIRCLES.forEach(({ dir, lap, surges, surge }, k) => all.forEach(ring => elements([ring], () => segment("rad", () =>
        beats(CHORUS2_START + k * CHORUS2_PHRASE, CHORUS2_START + (k + 1) * CHORUS2_PHRASE, () => cycle(lap, () => {
          const phase = 1 - (ring - 1) / 12; // behind, kept positive so the cyclic head wraps right
          const head = {
            comb2: {
              f1: dir > 0 ? L(phase, phase + 1) : L(phase + 1, phase), amount1: 1,
              f2: { sin: { min: -surge, max: surge, phase: 0, repeats: surges } }, amount2: 1,
            },
          };
          lit(head, K(CHORUS2_BAND), true, dir > 0);
        }))))));
      // Bars 9-12, the rays: the core lit along rad from 0 to CHORUS2_RAY_FROM (as in chorus 1), and the odd and even
      // rings taking turns to shoot a ray, a short snake running from the core out past the outer edge in a beat,
      // every 2 beats (the even rings a beat after the odd ones). The ray's head moves on a comb like the circle's, with
      // other cycles: steadily out over its beat (linear), plus a sin of CHORUS2_RAY_SURGE either way twice in that
      // beat, so each ray shoots out in two spurts.
      const CHORUS2_RAYS = CHORUS2_START + 2 * CHORUS2_PHRASE, CHORUS2_RAY = 0.2, CHORUS2_RAY_FROM = 0.4;
      const CHORUS2_RAY_SURGE = 0.05;
      const rayHead = {
        comb2: {
          f1: L(CHORUS2_RAY_FROM, 1 + CHORUS2_RAY), amount1: 1,
          f2: { sin: { min: -CHORUS2_RAY_SURGE, max: CHORUS2_RAY_SURGE, phase: 0, repeats: 2 } }, amount2: 1,
        },
      };
      [ODD_RINGS, EVEN_RINGS].forEach((rings, g) => elements([...rings], () => segment("rad", () =>
        beats(CHORUS2_RAYS + g, CHORUS2_RAYS + CHORUS2_PHRASE, () => cycleBeats(2, 0, 1, () => lit(rayHead, K(CHORUS2_RAY), false))))));
      elements(all, () => beats(CHORUS2_RAYS, CHORUS2_RAYS + CHORUS2_PHRASE, () => segment("rad", () => addEffect({
        position_brightness: { mult_factor_increase: { fixed_window: { start: 0, end: CHORUS2_RAY_FROM - 0.0005, outside_value: 0, func: K(1) } } },
      }))));
      // Bars 13-16, filling and emptying: for 6 beats a snake runs round every big ring through its small rings (ind)
      // with its tail staying at the start, so the whole ring fills up behind it; for the next 6 its tail follows round
      // after it, so the light runs off the end; the last bar stays dark. The whole snake, head and tail end together,
      // rocks on the beat: a sin of CHORUS2_ROCK either way, once a beat, on top of the head's steady move, so both
      // ends go forward and back and forth a bit with every beat.
      const CHORUS2_FILL = CHORUS2_START + 3 * CHORUS2_PHRASE, CHORUS2_FILL_BEATS = 6, CHORUS2_ROCK = 0.07;
      const rock = (f: Fn) =>
        ({ comb2: { f1: f, amount1: 1, f2: { sin: { min: -CHORUS2_ROCK, max: CHORUS2_ROCK, phase: 0, repeats: CHORUS2_FILL_BEATS } }, amount2: 1 } });
      elements(all, () => segment(segment_ind, () => {
        beats(CHORUS2_FILL, CHORUS2_FILL + CHORUS2_FILL_BEATS, () =>
          addEffect({ snake_brightness: { head: rock(L(0, 1.01)), tail_length: L(0, 1.02), cyclic: false, mult_factor_increase: K(1) } }));
        beats(CHORUS2_FILL + CHORUS2_FILL_BEATS, CHORUS2_FILL + 2 * CHORUS2_FILL_BEATS, () =>
          addEffect({ snake_brightness: { head: rock(K(1.01)), tail_length: L(1.02, 0), cyclic: false, mult_factor_increase: K(1) } }));
      }));
      chorusShine(CHORUS2_START, CHORUS2_END);
      // Bars 111-114 (beats 440-456), the beat over everything: the odd and even rings take turns, a beat each (a
      // cycle of 2 beats), one of them at CHORUS2_BEAT_DIM of its brightness while the other is at full, switching on
      // the off-beats (half way between beats): the odd rings dimmed from 440.5, the even ones from 441.5, and so on.
      const CHORUS2_BEAT = 440, CHORUS2_BEAT_END = 456, CHORUS2_BEAT_DIM = 0.75;
      [ODD_RINGS, EVEN_RINGS].forEach((rings, g) => elements([...rings], () => beats(CHORUS2_BEAT + 0.5, CHORUS2_BEAT_END, () =>
        cycleBeats(2, g, g + 1, () => addEffect({ timed_brightness: { mult_factor_decrease: K(CHORUS2_BEAT_DIM) } })))));
    });

    // The colors of parties 3 and 4, one per ring (index ring - 1): sun colors from red to yellow (hue 0 - 0.15),
    // every third ring slightly paler (saturation 0.9), so the rings vary.
    const SUN_PALETTE: { hue: number; sat: number }[] = [
      { hue: 0.02, sat: 1 }, { hue: 0.12, sat: 1 }, { hue: 0.08, sat: 0.9 },
      { hue: 0.06, sat: 1 }, { hue: 0.15, sat: 1 }, { hue: 0.11, sat: 0.9 },
      { hue: 0, sat: 1 }, { hue: 0.09, sat: 1 }, { hue: 0.03, sat: 0.9 },
      { hue: 0.14, sat: 1 }, { hue: 0.04, sat: 1 }, { hue: 0.13, sat: 0.9 },
    ];
    const sunColor = (ring: number, val: number) => constColor({ ...SUN_PALETTE[ring - 1], val });

    // Party 3, bars 119-133 (beats 472-532): the party once more, toward the end of the song, so calmer and darker.
    // Each ring its own sun color (SUN_PALETTE), every ring dark except one whole small ring at a time, moving across the d1
    // ring: in a wave round the big ring for the first 4 bars, then swinging, phased differently every 4 bars.
    const PARTY3_START = 472, PARTY3_END = 532, PARTY3_BLOCK = 16;
    section("party 3", { start: PARTY3_START, end: PARTY3_END }, () => {
      // Each ring one solid sun color. Brightness 0: the ring is dark except where the snakes below raise it.
      all.forEach(ring => elements([ring], () => sunColor(ring, 0)));

      // One whole small ring lit at a time: a snake on ind (the small ring at clock position k at relPos k/11, 0 at
      // local 0:30) exactly one small ring long (1/11), raising it to full. It lights small ring j while its head is
      // between j/11 and (j + 1)/11, so a head at FIRST lights the first small ring alone and at LAST the last one,
      // each half way between those edges; moving at a steady speed between them, every small ring is lit for the
      // same time, the end ones too (half on the way in and half on the way out).
      const FIRST = 1 / 22, LAST = 1 + 1 / 22;
      const lit = (head: object) => addEffect({
        snake_brightness: { head, tail_length: K(1 / 11), cyclic: false, mult_factor_increase: K(1) },
      });
      /** The head across the d1 ring and back at a steady speed, at position u of a back-and-forth (0 and 1: FIRST, 0.5: LAST). */
      const across = (u: number) => (u < 0.5 ? FIRST + (LAST - FIRST) * 2 * u : LAST - (LAST - FIRST) * 2 * (u - 0.5));
      // Swinging back and forth across the d1 ring at a steady speed, turning straight round at each end, once
      // every 2 * PARTY3_SWING beats. The rings are phased in groups of `group`: ring r is (r - 1) mod group /
      // group of a swing on. A steady back and forth that starts part way through is not one float function, so
      // it is straight runs: the rest of the swing the ring starts in, then whole swings as a cycle (out, then
      // back), then what is left before the end. With `mirrored`, a second small ring swings the other way at the
      // same time (its head at FIRST + LAST - the first one's), so the two meet in the middle of the d1 ring.
      const PARTY3_SWING = 2;
      const glow = (group: number, mirrored = false) => (start: number, end: number) => all.forEach(ring => elements([ring], () => segment(segment_ind, () => {
        const period = 2 * PARTY3_SWING;
        const mirror = (x: number) => FIRST + LAST - x;
        const run = (a: number, b: number) => { lit(L(a, b)); if (mirrored) lit(L(mirror(a), mirror(b))); };
        /** Straight runs from `from` to `to`, starting at position u of the swing. */
        const runs = (from: number, to: number, u: number) => {
          while (from < to - 1e-9) {
            const turn = u < 0.5 ? 0.5 : 1, toTurn = from + (turn - u) * period;
            // A run that reaches the turn ends exactly on it (so rounding cannot leave a sliver of a run behind).
            const reaches = toTurn <= to, until = reaches ? toTurn : to;
            const uEnd = reaches ? turn : u + (until - from) / period;
            beats(from, until, () => run(across(u), across(uEnd)));
            from = until;
            u = uEnd >= 1 ? 0 : uEnd;
          }
        };
        const u0 = ((ring - 1) % group) / group;
        const firstSwingEnd = Math.min(start + (u0 ? (1 - u0) * period : 0), end);
        runs(start, firstSwingEnd, u0);
        const wholeEnd = firstSwingEnd + Math.floor((end - firstSwingEnd) / period) * period;
        if (wholeEnd > firstSwingEnd) beats(firstSwingEnd, wholeEnd, () => cycle(period, () => {
          lit({ half: { f1: L(FIRST, LAST), f2: L(LAST, FIRST) } });
          if (mirrored) lit({ half: { f1: L(LAST, FIRST), f2: L(FIRST, LAST) } });
        }));
        runs(wholeEnd, end, 0);
      })));
      // A wave of motion round the big ring: each ring's lit small ring holds still, and when the wave reaches the ring
      // it sweeps across the d1 ring (from the first small ring to the last, or back) over WAVE_SWEEP beats at a steady
      // speed, then holds again on the far side. There are WAVE_HEADS waves, evenly spread round the big ring, each
      // reaching the next ring WAVE_STEP beats later: ring r is reached ((r mod 12) mod (12 / WAVE_HEADS)) * WAVE_STEP
      // beats after they set off. They set off every WAVE_EVERY beats, alternately out and back.
      const WAVE_HEADS = 1, WAVE_STEP = 0.5, WAVE_SWEEP = 2, WAVE_EVERY = 4;
      const sweepWave = (start: number, end: number) => all.forEach(ring => elements([ring], () => segment(segment_ind, () => {
        // Ring 12 (at the top) first, then 1, 2, … clockwise.
        const delay = ((ring % 12) % (12 / WAVE_HEADS)) * WAVE_STEP;
        // A pass every WAVE_EVERY beats, alternately out (to the last small ring) and back; the ring holds where it
        // is between them. A sweep still running at the end of the block is cut there.
        let still = start, atFirst = true;
        for (let pass = start; pass < end; pass += WAVE_EVERY) {
          const from = pass + delay, to = Math.min(from + WAVE_SWEEP, end);
          if (from >= end) break;
          const [a, b] = atFirst ? [FIRST, LAST] : [LAST, FIRST];
          beats(still, from, () => lit(K(a)));
          beats(from, to, () => lit(L(a, a + ((b - a) * (to - from)) / WAVE_SWEEP)));
          still = to;
          atFirst = !atFirst;
        }
        beats(still, end, () => lit(K(atFirst ? FIRST : LAST)));
      })));
      // Two small rings opposite each other (starting at clock positions 0 and 6) going round and round the d1 ring a
      // small ring at a time, odd rings clockwise and even rings counter-clockwise, a lap every SPIN_LAP beats, the
      // last SPIN_FAST beats of the block twice as fast. Each is a snake 0.002 long round a head on its small ring's
      // relPos on ind (clock position k at k/11); as that cannot wrap past 1, a lap is a steps function repeated,
      // after the rest of the lap it starts part way through.
      const SPIN_LAP = 4, SPIN_FAST = 4;
      const spin = (start: number, end: number) => all.forEach(ring => elements([ring], () => segment(segment_ind, () => {
        const down = ring % 2 === 0;
        const dot = (head: object) => addEffect({ snake_brightness: { head, tail_length: K(0.002), cyclic: false, mult_factor_increase: K(1) } });
        /** Round and round from clock position k over from - to, a lap every `lap` beats. */
        const around = (from: number, to: number, k: number, lap: number) => {
          const step = lap / 12, rest = down ? k + 1 : 12 - k, restEnd = Math.min(from + rest * step, to);
          const lapOf = (n: number, first: number) => stepsFn(n, first / 11 + 0.001, (down ? -1 : 1) / 11);
          beats(from, restEnd, () => dot(lapOf(rest, k)));
          if (to > restEnd) beats(restEnd, to, () => dot(repeatFn((to - restEnd) / lap, lapOf(12, down ? 11 : 0))));
        };
        const fast = end - SPIN_FAST;
        [0, 6].forEach(k => {
          around(start, fast, k, SPIN_LAP);
          // Where it is when it speeds up: whole laps bring it back to k.
          const moved = Math.round((fast - start) / (SPIN_LAP / 12)) % 12;
          around(fast, end, (((k + (down ? -moved : moved)) % 12) + 12) % 12, SPIN_LAP / 2);
        });
      })));
      const PARTY3_GLOWS: ((start: number, end: number) => void)[] = [
        // Bars 119-122: a wave of motion round the big ring, each ring sweeping across only as it passes.
        sweepWave,
        // Bars 123-126: the rings phased in groups of 3.
        glow(3),
        // Bars 127-130: each ring a step behind the one before, so it ripples round the big ring, with a second small
        // ring swinging the other way.
        glow(12, true),
        // Bars 131-133 (3 bars, to the end of the section): two small rings opposite each other spinning round the d1
        // ring, odd rings clockwise and even rings the other way; a lap a bar, then twice as fast in the last bar.
        spin,
      ];
      PARTY3_GLOWS.forEach((g, k) =>
        g(PARTY3_START + k * PARTY3_BLOCK, Math.min(PARTY3_START + (k + 1) * PARTY3_BLOCK, PARTY3_END)));
    });

    // Party 4, bars 135-141 (beats 536-564): the party again, quieter still. One dot per ring in the ring's sun color
    // (SUN_PALETTE), and from bar 137 a second, pastel orange one, a few pixels round pixel 0 of a small ring, over a dark ring. Every PARTY4_STEP beats
    // (half a beat) it jumps to the next small ring, so it goes round the 12 small rings once every 6 beats. The d1
    // rings are phased a twelfth of a lap apart (one lap across the big ring): ring r runs r - 1 steps ahead. A
    // position window cannot move over time, so the stepping comes from a snake on ind (the small ring at clock
    // position k at relPos k/11), exactly one small ring long, its head stepping a small ring every PARTY4_STEP beats
    // (steps, no cycle). A window on centric then keeps only the pixels round pixel 0 of every small ring: fixed until
    // bar 139, then growing and shrinking.
    const PARTY4_START = 536, PARTY4_END = 564, PARTY4_STEP = 0.5;
    // From bar 139 the dot grows and shrinks.
    const PARTY4_TURN = 552;
    // From bar 137 to the end: a second dot, in pastel orange, a quarter lap (PARTY4_GAP small rings) ahead of the
    // first.
    const PARTY4_SECOND: [number, number] = [544, 564], PARTY4_GAP = 3;
    const PARTY4_SECOND_COLOR = { hue: 0.07, sat: 0.9 };
    // Bars 139-141: the half width of the window round pixel 0 of each small ring, smallest (pixel 0 alone) and
    // largest (just past 0.5, so the dark snake covers nothing and the whole small ring is lit).
    const PARTY4_BREATHE: [number, number] = [0.05, 0.52], PARTY4_BREATHE_BEATS = 4;
    // Bar 134 (beats 532-536) fades into party 4: black, with a white flash on each of the drum hits, each on a
    // different part of the rings, from the inside out, fading out over a quarter beat (the shortest gap between two
    // hits), at PARTY4_DRUM_VAL brightness. Windows are kept with dark snakes (segWindow), not fixed_window, so they
    // also work on rings with the older firmware.
    const PARTY4_FADE_IN = 4, PARTY4_DRUM_VAL = 0.5;
    const white = (val: number) => constColor({ hue: 0, sat: 0, val });
    const PARTY4_DRUMS: [number, (val: number) => void][] = [
      // The inner part of every ring, closest to the center of the big ring.
      [534, val => { white(val); segWindow("rad", K(-0.02), K(0.25)); }],
      // Every third pixel of every small ring (pixels 0, 3, 6, 9).
      [534.75, val => segment(segment_b1, () => white(val))],
      // The other two thirds.
      [535, val => segment(segment_b2, () => white(val))],
      // The sides of every small ring (arc 0.36 - 0.79: pixels 3-5 and 7-9).
      [535.5, val => { white(val); segWindow(segment_arc, K(0.36), K(0.79)); }],
      // The outer part of every ring.
      [535.75, val => { white(val); segWindow("rad", K(0.75), K(1.02)); }],
    ];
    section("party 4", { start: PARTY4_START, end: PARTY4_END, fadeIn: PARTY4_FADE_IN }, () => {
      PARTY4_DRUMS.forEach(([hit, flash]) => elements(all, () => beats(hit, hit + 0.25, () => {
        flash(PARTY4_DRUM_VAL);
        fade({ start: 1, end: 0 });
      })));
      all.forEach(ring => elements([ring], () => {
        // The color at brightness 0: the ring is dark except where the dot raises it. From the start of the section
        // itself, not its fade-in, so it does not cover the drum flashes.
        beats(PARTY4_START, PARTY4_END, () => sunColor(ring, 0));
        // A dot stepping forward from `from` to `to`, starting on the small ring at clock position k (0 at local
        // 0:30), each of its snakes made by `effects(head)`. On ind, the small ring at clock position k is at relPos
        // k/11 (0 to 1), so the head cannot just wrap round past 1: it steps through the rest of the first lap, then
        // repeats whole laps of 0 to 11/11. The snakes are 0.002 long, round the head.
        const stepDot = (from: number, to: number, k: number, effects: (head: object) => void) => segment(segment_ind, () => {
          const k0 = k % 12, lapBeats = 12 * PARTY4_STEP;
          const firstLapEnd = Math.min(from + (12 - k0) * PARTY4_STEP, to);
          beats(from, firstLapEnd, () => effects(stepsFn(12 - k0, k0 / 11 + 0.001, 1 / 11)));
          if (to > firstLapEnd) beats(firstLapEnd, to, () => effects(repeatFn((to - firstLapEnd) / lapBeats, stepsFn(12, 0.001, 1 / 11))));
        });
        const snake = (head: object) => ({ head, tail_length: K(0.002), cyclic: false });
        // The ring's dot, the whole section, starting on the small ring at clock position r - 1.
        stepDot(PARTY4_START, PARTY4_END, ring - 1, head =>
          addEffect({ snake_brightness: { ...snake(head), mult_factor_increase: K(1) } }));
        // From bar 137: a second dot in pastel orange, a quarter lap (PARTY4_GAP small rings) ahead of the first one:
        // raised like it, with a hue snake and a saturation snake over the same small ring for its color.
        const firstAtSecond = ring - 1 + (PARTY4_SECOND[0] - PARTY4_START) / PARTY4_STEP;
        stepDot(PARTY4_SECOND[0], PARTY4_SECOND[1], firstAtSecond + PARTY4_GAP, head => {
          addEffect({ snake_brightness: { ...snake(head), mult_factor_increase: K(1) } });
          addEffect({ snake_hue: { ...snake(head), offset_factor: K(PARTY4_SECOND_COLOR.hue - SUN_PALETTE[ring - 1].hue) } });
          addEffect({ snake_saturation: { ...snake(head), mult_factor_decrease: K(PARTY4_SECOND_COLOR.sat / SUN_PALETTE[ring - 1].sat) } });
        });
        segment(segment_centric, () => {
          // Until the turn, keep only pixels 11, 0 and 1 of every small ring (0.9 - 1.1, cyclic, wrapping through 0).
          beats(PARTY4_START, PARTY4_TURN, () => addEffect({
            position_brightness: {
              mult_factor_decrease: { fixed_window: { start: 0.9, end: 1.1, cyclic: true, outside_value: 0, func: K(1) } },
            },
          }));
          // After it, a window round pixel 0 that grows and shrinks: a position window cannot change over time, so a
          // dark snake blacks out relPos w to 1 - w, leaving 1 - w to w (through 0) lit, with w swinging on a sin from
          // PARTY4_BREATHE[0] (pixel 0 alone) to PARTY4_BREATHE[1] (the whole small ring) and back every
          // PARTY4_BREATHE_BEATS (a bar). The rings are phased in groups of 4: ring r is (r - 1) mod 4 / 4 of a swing
          // on.
          const w: Fn = { sin: { min: PARTY4_BREATHE[0], max: PARTY4_BREATHE[1], phase: ((ring - 1) % 4) / 4 - 0.25, repeats: 1 } };
          beats(PARTY4_TURN, PARTY4_END, () => cycle(PARTY4_BREATHE_BEATS, () => darkSnake(shift(w, 1, true), shift(scale(w, 2), 1, true))));
        });
      }));
    });

    // Chorus 3, bars 143-157 (beats 568-628), fading in over the 2 beats before it (beats 566-568): a happy, ecstatic
    // rainbow with many things going on. The rings are dark except where snakes light them. Every CHORUS3_BLOCK beats
    // (4 bars) a different layout of the big rings, its groups doing different things. Bars 1-12 are the options
    // picked for them in the gallery (CHORUS3_MIX); bars 13-15 the triangle rays.
    const CHORUS3_START = 568, CHORUS3_END = 628, CHORUS3_FADE_IN = 2, CHORUS3_BLOCK = 16;
    // The options picked in the gallery for chorus 3's blocks (by block, 0 = bars 1-4).
    const CHORUS3_MIX: Record<number, MixPick> = {
      0: { option: "Arc breath odd-even", speed: "medium", hit: "beat" },
      1: { option: "Bounce wave", speed: "medium", hit: "beat" },
      2: { option: "Ticks odd-even", speed: "fast", hit: "beat" },
    };
    section("chorus 3", { start: CHORUS3_START, end: CHORUS3_END, fadeIn: CHORUS3_FADE_IN }, () => {
      /** A snake on the segment in use, raising brightness from 0 at its tail end to `peak` at its head. */
      const lit = (head: object, tail: number, cyclic = true, peak = 1) =>
        addEffect({ snake_brightness: { head, tail_length: K(tail), cyclic, mult_factor_increase: L(0, peak) } });
      /** A head going once round the segment in use per cycle, starting `at` (backwards with `dir` -1). */
      const lap = (at: number, dir = 1): Fn => (dir > 0 ? L(at, at + 1) : L(at + 1, at));
      const block = (b: number) => [CHORUS3_START + b * CHORUS3_BLOCK, Math.min(CHORUS3_START + (b + 1) * CHORUS3_BLOCK, CHORUS3_END)];
      /** The rainbow for block `b`: ring r starts (r - 1) / 12 round the hue circle, so the big ring is a rainbow, the
       * full circle again along `seg` so the snakes run through every color, the hues turning a quarter over the block. */
      const rainbow = (b: number, seg: string) => all.forEach(ring => elements([ring], () => beats(block(b)[0], block(b)[1], () => {
        constColor({ hue: (ring - 1) / 12, sat: 1, val: 0 });
        segment(seg, () => addEffect({ position_hue: { offset_factor: L(0, 1) } }));
        addEffect({ timed_hue: { offset_factor: L(0, 0.25) } });
      })));

      // Bars 13-15, triangles: the rings in 4 triangles (1, 5, 9 / 2, 6, 10 / 3, 7, 11 / 4, 8, 12) shoot a ray along rad
      // from the inner side out past the rim, one triangle per beat, so the triangle turns round the big ring on the
      // beats. Under the rays, 3 snakes evenly round every d1 ring (all), a lap every 2 bars.
      rainbow(3, "rad");
      beats(block(3)[0], block(3)[1], () => all.forEach(ring => elements([ring], () => {
        const g = (ring - 1) % 4;
        segment("rad", () => cycleBeats(4, g, g + 2, () => lit(L(0, 1.4), 0.4, false)));
        segment(segment_all, () => cycle(8, () => [0, 1, 2].forEach(k => lit(lap(k / 3), 0.12))));
      })));

      // The 2 beats before the chorus (beats 566-568) introduce its colors, in 2 groups: on the first beat the odd rings
      // light up in the colors the chorus starts with (ring r (r - 1) / 12 round the hue circle, the rainbow along arc,
      // as in its first block), on the second beat the even rings; each flashes on at full and settles to about half
      // by the chorus.
      [ODD_RINGS, EVEN_RINGS].forEach((rings, k) => rings.forEach(ring => elements([ring], () =>
        beats(CHORUS3_START - CHORUS3_FADE_IN + k, CHORUS3_START, () => {
          constColor({ hue: (ring - 1) / 12, sat: 1, val: 1 });
          segment(segment_arc, () => addEffect({ position_hue: { offset_factor: L(0, 1) } }));
          fade({ start: 1, end: k ? 0.6 : 0.4 });
        }))));

      // Bars 1-12: the options picked in the gallery (ui/gallery.html, src/songs/shemesh-gallery-options.ts) for the
      // first 3 blocks, each over its 4 bars.
      galleryMix("chorus3", CHORUS3_MIX);

      // The beats and the bars on top: every beat the whole scene lifts a little, to CHORUS3_BEAT, dropping back over
      // half a beat, and every bar's downbeat it flashes to CHORUS3_BAR, fading over half a beat. Not the beat lift in
      // block 3 (bars 9-12, the ticks): there the rings are dark but for the ticks, which step on the beat already, and
      // a lift fading on the dark shows only its lowest, flickery levels on the LEDs; the bar flash fades quickly for
      // the same reason.
      const CHORUS3_BEAT = 0.15, CHORUS3_BAR = 0.5, TICKS_BLOCK = 2;
      elements(all, () => {
        [[CHORUS3_START, CHORUS3_START + CHORUS3_BLOCK * TICKS_BLOCK], [CHORUS3_START + CHORUS3_BLOCK * (TICKS_BLOCK + 1), CHORUS3_END]].forEach(([from, to]) =>
          beats(from, to, () => cycleBeats(1, 0, 0.5, () => addEffect({ timed_brightness: { mult_factor_increase: L(CHORUS3_BEAT, 0) } }))));
        beats(CHORUS3_START, CHORUS3_END, () =>
          cycleBeats(4, 0, 0.5, () => addEffect({ timed_brightness: { mult_factor_increase: L(CHORUS3_BAR, 0) } })));
      });
    });

    // Party 5, bars 158-176 (beats 628-704): the party once more, to the end of the song, dark and sparse: the options
    // picked for it in the gallery (ui/gallery.html, src/songs/shemesh-gallery-options.ts), a block of 4 bars each (the
    // last 3), all hitting on the off-beats: sparse breaths, sparse rain, a busy starfield, fireflies, then a single
    // starfield to the end.
    const PARTY5_START = 628, PARTY5_END = 704;
    const PARTY5_MIX: Record<number, MixPick> = {
      0: { option: "Sparse breaths, 15%", speed: "medium", hit: "offbeat" },
      1: { option: "Sparse rain, 15%", speed: "medium", hit: "offbeat" },
      2: { option: "Starfield ×4, small, on the beat", speed: "fast", hit: "offbeat" },
      3: { option: "Fireflies", speed: "medium", hit: "offbeat" },
      4: { option: "Starfield ×1, tiny, on the beat", speed: "fast", hit: "offbeat" },
    };
    // On top, overlays showing the roles of the bars, AAAB in every 4 bars (3 bars of A, then a bar of B): in A bars
    // rings 1, 4, 7, 10 (a square) light up, in B bars the other 8, fading out a different way in every block; the
    // first block lights the inner side of every ring in A bars and the outer side in B bars. Picked in the gallery too.
    const PARTY5_OVERLAY: OverlayPick = {
      roles: "AAAB",
      blocks: {
        0: ["Inner / outer by role"],
        1: ["Fade: beat steps, square / the rest"],
        2: ["Fade: snakes spin out, square / the rest"],
        3: ["Fade: ripple out, square / the rest"],
      },
    };
    section("party 5", { start: PARTY5_START, end: PARTY5_END }, () => {
      // From beat 670, where a bright yellow wave passes out along rad (below), the scene turns YELLOW to the end:
      // its options from there on again in yellow instead of the rainbow (a wave cannot color only the pixels it
      // passes). Then the role overlays on top, and the wave lifting the pixels it passes to full, brightest at its
      // front, from every ring's inner side past its rim.
      const WAVE_START = 670, WAVE_END = 677, YELLOW = 0.1, WAVE_TAIL = 0.6;
      const blockStart = (k: number) => PARTY5_START + 16 * k;
      galleryMix("party5", { 0: PARTY5_MIX[0], 1: PARTY5_MIX[1] });
      galleryRange("party5", PARTY5_MIX[2], blockStart(2), WAVE_START);
      galleryRange("party5", PARTY5_MIX[2], WAVE_START, blockStart(3), { hue: YELLOW });
      galleryRange("party5", PARTY5_MIX[3], blockStart(3), blockStart(4), { hue: YELLOW });
      galleryRange("party5", PARTY5_MIX[4], blockStart(4), PARTY5_END, { hue: YELLOW });
      galleryOverlay("party5", PARTY5_OVERLAY);
      elements(all, () => beats(WAVE_START, WAVE_END, () => segment("rad", () => addEffect({
        snake_brightness: { head: L(0, 1 + WAVE_TAIL), tail_length: K(WAVE_TAIL), cyclic: false, mult_factor_increase: L(0, 1) },
      }))));
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
