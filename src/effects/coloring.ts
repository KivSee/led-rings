import { als } from "../async-local-storage";
import { segment } from "../objects/elements";
import { segment_b1, segment_b2 } from "../objects/ring-elements";
import { addEffect } from "./effect";
import { defaultHue, maxBrightness } from "./defaults";
import { Effect } from "./types";
import { brightness } from "./brightness";

// effect that will override any coloring effect with no color (black, turned off)
export const noColor = () => {
  addEffect({
    constColor: {
      color: {
        hue: 0.0,
        sat: 0.0,
        val: 0.0,
      },
    },
  });
};

// create a vivid coloring effect with a given hue
// vivid color is maximum saturation
// if phase is set, it will offset the hue
export const vivid = (opts: { hue: number }) => {
  addEffect((phase: number) => {
    return {
      const_color: {
        color: {
          hue: opts.hue + phase,
          sat: 1.0,
          val: maxBrightness,
        },
      },
    };
  });
};

// create a pastel coloring effect with a given hue
// pastel color is 80% saturation
// if phase is set, it will offset the hue
export const pastel = (opts: { hue: number }) => {
  addEffect((phase: number) => {
    return {
      const_color: {
        color: {
          hue: opts.hue + phase,
          sat: 0.8,
          val: maxBrightness,
        },
      },
    };
  });
};

// color the segment with a given const color
// all parameters are optional, defaulting to arbitrary hue, max saturation, and max brightness
// phase is honored and will offset the hue
export const constColor = (opts?: {
  hue?: number;
  sat?: number;
  val?: number;
}) => {
  const hue = opts?.hue ?? defaultHue;
  const sat = opts?.sat ?? 1.0;
  const val = opts?.val ?? maxBrightness;
  addEffect((phase: number) => {
    return {
      const_color: {
        color: {
          hue: hue + phase,
          sat: sat,
          val: val,
        },
      },
    };
  });
};

// create a linear changing hue effect from one hue to the other,
// going over all the hues in between
// diff of 1 is full rainbow, diff of 0 is no change.
// diff <1 is a subset of the rainbow in a specific hue range
// diff >1 will iterate the rainbow multiple times
// 
// parameters are optional, and will default to 0.0 and 1.0 (one cycle rainbow).
// phase is honored and will offset the hue
export const rainbow = (opts?: {
  startHue: number;
  endHue: number;
}) => {
  const startHue = opts?.startHue ?? 0.0;
  const endHue = opts?.endHue ?? 1.0;

  addEffect((phase: number) => {
    return {
      rainbow: {
        hue_start: {
          const_value: {
            value: startHue + phase,
          },
        },
        hue_end: {
          const_value: {
            value: endHue + phase,
          },
        },
      },
    };
  });
};

// Dotted effect is static coloring in format of 2 pixels with lesser brightness and 1 pixel with higher brightness.
// don't use segments in this effect.
//
// you can leave the parameters empty to use the default values, or tune them to your liking, controlling:
// hue - the base hue of the highlighted pixels
// hueDiff - how much the lesser brightness pixels differ in hue from the highlighted pixels (0.5 is max, 0.0 and 1.0 are the same)
// contrast - how much the lesser brightness pixels differ in brightness from the highlighted pixels (1.0 is same brightness, 0.0 is off)
//
// this coloring honors phase
export const dotted = (opts?: {
  hue?: number;
  hueDiff?: number;
  contrast?: number;
}) => {
  const hue = opts?.hue ?? defaultHue;
  const hueDiff = opts?.hueDiff ?? 0.5;
  const contrast = opts?.contrast ?? 0.5;

  const highlightedBrightness = maxBrightness;
  const backgroundBrightness = highlightedBrightness * contrast;

  segment(segment_b1, () => {
    constColor({ hue, val: highlightedBrightness });
  });
  segment(segment_b2, () => {
    constColor({ hue: hue + hueDiff, val: backgroundBrightness });
  });
};
