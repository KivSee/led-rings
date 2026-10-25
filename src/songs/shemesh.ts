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
    const SUNRISE_START = 6, SKY_END = 140, SUNRISE_STEP = 6, SUNRISE_FILL = 16, SUNRISE_HUE = 16;
    // The dark snake starts a bit past the outer edge so the ring starts fully dark, edge included.
    const DARK_HEAD_START = 1.15;
    const DAWN_PURPLE = 0.75, SUN_RED_ORANGE = 1.03; // 1.03 is hue 0.03, reached going up the hue scale
    const RINGS_BOTTOM_UP = [[5, 6], [4, 7], [3, 8], [2, 9], [1, 10], [11, 12]];
    const SUN_SHINE_END = 64;
    const SKY_HUE_SHIFT = SUN_RED_ORANGE - DAWN_PURPLE;
    const SKY_DIM = 0.4;

    // Sun shine, beats 0-64 (the first 16 bars). The rings start dark (every frame starts black: hue 0, sat 0,
    // val 0), so the stars light up white.
    section("sun shine", { start: 0, end: SUN_SHINE_END }, () => {
      // Sunrise, beats 6-60: the light climbs the big ring from the bottom pair of rings to the top pair, one pair
      // every SUNRISE_STEP beats. Each ring fills up from its outer edge inward along segment rad over SUNRISE_FILL
      // beats (4 bars): a dark snake covers the unlit inner part and shrinks toward the center, with a soft edge (the
      // last 1/8 of the snake ramps up to full). Its hue slides from purple through pink to reddish orange over
      // SUNRISE_HUE beats and then stays there; the lower rings start earlier and are always further along, so the
      // warm colors climb up from the bottom. The reddish orange sky then stays on every ring until SKY_END (after this
      // section), as the background of the sun overlays below.
      RINGS_BOTTOM_UP.forEach((pair, level) => {
        const start = SUNRISE_START + level * SUNRISE_STEP;
        elements(pair, () => beats(start, SUN_SHINE_END, () => {
          constColor({ hue: DAWN_PURPLE, sat: 1, val: 1 });
          beats(start, start + SUNRISE_HUE, () => addEffect({ timed_hue: { offset_factor: { linear: { start: 0, end: SKY_HUE_SHIFT } } } }));
          beats(start + SUNRISE_HUE, SUN_SHINE_END, () => addEffect({ timed_hue: { offset_factor: { const_value: { value: SKY_HUE_SHIFT } } } }));
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

      // On top of the fill, the whole sky slowly brightens from SKY_DAWN to full over the sunrise (beats 6-60), so
      // the darkness turns into light gradually. It comes before the stars, so they keep their own brightness.
      const SKY_DAWN = 0.15;
      elements(all, () => beats(SUNRISE_START, 60, () => fade({ start: SKY_DAWN, end: 1 })));

      // From beat 60 the sky dims to SKY_DIM over 2 beats and stays dim until SKY_END, so the sun overlays below
      // stand out: they raise the brightness back toward full along with the yellow. It comes before the stars, so
      // they stay bright on the dim sky.
      elements(all, () => {
        beats(60, 62, () => fade({ start: 1, end: SKY_DIM }));
        beats(62, SUN_SHINE_END, () => fade({ start: SKY_DIM, end: SKY_DIM }));
      });

      // Stars on the 6 top rings, over the sky: a snake on rand covering 8% of the pixels crawls half way around
      // over the whole section, so each pixel slowly fades in and out again. Brightest at the top and dimmer to the
      // sides: rings 11, 12 peak at 1, rings 10, 1 at 0.5 and rings 9, 2 at 0.25. Each ring starts at its own point,
      // so the rings show different stars. They fade in over the first bar.
      const STAR_PEAK: [number, number][] = [[9, 0.25], [10, 0.5], [11, 1], [12, 1], [1, 0.5], [2, 0.25]];
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
    section("verse 1", { start: VERSE1_START, end: VERSE1_END, fadeIn: VERSE1_FADE_IN }, () => {
      all.forEach(ring => elements([ring], () => constColor({
        hue: VERSE1_YELLOW + (((ring - 1) % VERSE1_HUES) / (VERSE1_HUES - 1)) * (VERSE1_ORANGE - VERSE1_YELLOW),
        sat: 1,
        val: VERSE1_BASE_VAL,
      })));
      // Paler toward the d2 center: along rad, saturation is multiplied by 0.5 at the inner edge (relPos 0), rising
      // linearly to 1 at relPos 0.8, and stays full from there to the outer edge.
      elements(all, () => segment("rad", () => addEffect({
        position_saturation: {
          mult_factor_decrease: { fixed_window: { start: 0, end: 0.8, outside_value: 1, func: { linear: { start: 0.5, end: 1 } } } },
        },
      })));

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
      const ODD = all.filter(r => r % 2), EVEN = all.filter(r => r % 2 === 0);
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
        // 64 and 65: the scene lighting back up and turning back into the sun (below, VERSE1_SUN_BACK), no beat
        // windows.
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
      // Bar 65: the scene goes dark, a part more on each beat, each part a different static section (a position
      // window darkening it, kept to the end of the bar), so the light breaks up instead of whole rings switching
      // off. The odd rings: the pixel 0 side of every small ring (arc 0 - 0.3, pixels 10-2), then the opposite side
      // (arc 0.55 - 1, pixels 4-8), leaving only pixels 3 and 9 of every small ring, then those on the outer half of
      // the big ring (rad 0.5 - 1), then those on the inner half. The even rings take the outer half out first, so for
      // the first two beats neighbouring rings differ (whole small rings next to broken ones), and they meet again
      // on the third beat (pixels 3 and 9 of the inner half).
      const VERSE1_DARK_BAR = VERSE1_SUN_BACK + 4;
      const darkWindow = (seg: string, start: number, end: number) => segment(seg, () => addEffect({
        position_brightness: { mult_factor_decrease: { fixed_window: { start, end, outside_value: 1, func: K(0) } } },
      }));
      type DarkPart = [string, number, number];
      const PIXEL0_SIDE: DarkPart = [segment_arc, 0, 0.3], FAR_SIDE: DarkPart = [segment_arc, 0.55, ALL];
      const OUTER: DarkPart = ["rad", 0.5, ALL], INNER: DarkPart = ["rad", 0, 0.4995];
      ([[ODD, [PIXEL0_SIDE, FAR_SIDE, OUTER, INNER]], [EVEN, [OUTER, FAR_SIDE, PIXEL0_SIDE, INNER]]] as [number[], DarkPart[]][])
        .forEach(([rings, parts]) => elements(rings, () => parts.forEach(([seg, start, end], k) =>
          beats(VERSE1_DARK_BAR + k, VERSE1_END, () => darkWindow(seg, start, end)))));
    });

    // The drum fill into verse 1 (beats 190-192), on top of the party and the verse fading in: 2 hits in beat 190
    // a quarter beat apart, then 5 quick ones in beat 191 an eighth apart (as heard in the audio, ~190.45, 190.7 and
    // ~191.45 to 191.95). On each hit two thirds of every small ring (segment b2, all but pixels 0, 3, 6, 9) go
    // dark and fades back in over the rest of the hit, a sharp strobe leaving only dots over the whole installation
    // that speeds up with the drums. One cycle per hit.
    const drumPulse = () => segment(segment_b2, () => {
      addEffect({ timed_brightness: { mult_factor_decrease: L(0, 1) } });
    });
    elements(all, () => {
      beats(190.45, 190.95, () => cycle(0.25, drumPulse));
      beats(191.45, 192.075, () => cycle(0.125, drumPulse));
    });

    // Chorus 1, bars 67-82 (beats 264-328), fading in over the 2 beats before it (beats 262-264).
    // The coloring: the whole installation as one burning sun, hotter toward its center. Every ring at full
    // saturation, its hue running along rad from orange on the inner side (facing the center of the
    // big ring) to deep red on the outer side, so the 12 rings together make a glowing orange core with a red rim.
    // The odd and even rings are a little apart (the even ones redder), so neighbouring rings still differ.
    const CHORUS1_START = 264, CHORUS1_END = 328, CHORUS1_FADE_IN = 2, CHORUS1_SWING = 4;
    // Each ring's inner (core) and outer (rim) hue; the rim goes past red into crimson (hue just under 1).
    const CHORUS1_SUN: Record<"odd" | "even", { core: number; rim: number }> = {
      odd: { core: 0.09, rim: 0 },
      even: { core: 0.06, rim: -0.03 },
    };
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
      // edge swinging on a sin from 0 to 1 and back every CHORUS1_SWING beats, so the light grows out from the inner side to the
      // whole ring and shrinks back. Ring r's sin is (r - 1) / 12 of a swing behind ring 1 (phase by the index), a
      // full swing across the 12 rings, so the biggest light moves clockwise round the big ring once a swing. A
      // position window cannot change over time, so the window is a snake from just below 0 to its head, the head on
      // the sin.
      all.forEach(ring => elements([ring], () => beats(CHORUS1_START, CHORUS1_END, () => segment("rad", () => cycle(CHORUS1_SWING, () => {
        const edge = { sin: { min: 0, max: 1, phase: -(ring - 1) / 12 - 0.25, repeats: 1 } };
        addEffect({
          snake_brightness: { head: edge, tail_length: shift(edge, 0.01), cyclic: false, mult_factor_increase: K(1) },
        });
      })))));
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

    // Party 2, bars 83-92 (beats 328-368): the party comes back. No effects yet.
    const PARTY2_START = 328, PARTY2_END = 368;
    section("party 2", { start: PARTY2_START, end: PARTY2_END }, () => {
    });

    // Verse 2, bars 93-100 (beats 368-400), fading out over bar 101 (beats 400-404): verse 1 again, to be more interesting and energetic. No effects yet.
    const VERSE2_START = 368, VERSE2_END = 400, VERSE2_FADE_OUT = 4;
    section("verse 2", { start: VERSE2_START, end: VERSE2_END, fadeOut: VERSE2_FADE_OUT }, () => {
    });

    // Chorus 2, bars 103-118 (beats 408-472), fading in over the 2 beats before it (beats 406-408). No effects yet.
    const CHORUS2_START = 408, CHORUS2_END = 472, CHORUS2_FADE_IN = 2;
    section("chorus 2", { start: CHORUS2_START, end: CHORUS2_END, fadeIn: CHORUS2_FADE_IN }, () => {
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

    // Chorus 3, bars 143-157 (beats 568-628), fading in over the 2 beats before it (beats 566-568). No effects yet.
    const CHORUS3_START = 568, CHORUS3_END = 628, CHORUS3_FADE_IN = 2;
    section("chorus 3", { start: CHORUS3_START, end: CHORUS3_END, fadeIn: CHORUS3_FADE_IN }, () => {
    });

    // Party 5, bars 158-176 (beats 628-704): the party once more, to the end of the song. No effects yet.
    const PARTY5_START = 628, PARTY5_END = 704;
    section("party 5", { start: PARTY5_START, end: PARTY5_END }, () => {
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
