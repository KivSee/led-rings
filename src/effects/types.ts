import { SegmentName } from "../objects/types";
import { FloatFunction } from "./functions";

export type EffectConfig = {
    start_time: number;
    end_time: number;
    segments: SegmentName;

    repeat_num?: number;
    repeat_start?: number;
    repeat_end?: number;
}

export type ConstColor = {
    color: {
        hue: number;
        sat: number;
        val: number;
    }
}

export type Rainbow = {
    hue_start: FloatFunction;
    hue_end: FloatFunction;
};

export type Brightness = {
    mult_factor: FloatFunction;
};

export type Hue = {
    offset_factor: FloatFunction;
};

export type Saturation = {
    mult_factor: FloatFunction;
};

export type Snake = {
    head: FloatFunction;
    tail_length: FloatFunction;
    cyclic: boolean;
};

export type Segment = {
    start: FloatFunction;
    end: FloatFunction;
};

export type Glitter = {
    intensity: FloatFunction;
    sat_mult_factor: FloatFunction;
};

export type Alternate = {
    numberOfPixels: number;
    hue_offset: FloatFunction;
    sat_mult: FloatFunction;
    brightness_mult: FloatFunction;
};

/** Position-based brightness: one of mult_factor_increase or mult_factor_decrease (by position in segment). */
export type PositionBrightness = {
    mult_factor_increase?: FloatFunction;
    mult_factor_decrease?: FloatFunction;
};

/** Hue offset by position in segment. */
export type PositionHue = {
    offset_factor: FloatFunction;
};

/** Position-based saturation: one of mult_factor_increase or mult_factor_decrease (by position in segment). */
export type PositionSaturation = {
    mult_factor_increase?: FloatFunction;
    mult_factor_decrease?: FloatFunction;
};

/** Brightness along snake (head/tail); one of mult_factor_increase or mult_factor_decrease. */
export type SnakeBrightness = {
    head: FloatFunction;
    tail_length: FloatFunction;
    cyclic: boolean;
    repeat_num?: number;
    mult_factor_increase?: FloatFunction;
    mult_factor_decrease?: FloatFunction;
};

/** Hue offset along snake (head/tail). */
export type SnakeHue = {
    head: FloatFunction;
    tail_length: FloatFunction;
    cyclic: boolean;
    repeat_num?: number;
    offset_factor: FloatFunction;
};

/** Saturation along snake; one of mult_factor_increase or mult_factor_decrease. */
export type SnakeSaturation = {
    head: FloatFunction;
    tail_length: FloatFunction;
    cyclic: boolean;
    repeat_num?: number;
    mult_factor_increase?: FloatFunction;
    mult_factor_decrease?: FloatFunction;
};

/** Time-based brightness: one of mult_factor_increase or mult_factor_decrease (by time). */
export type TimedBrightness = {
    mult_factor_increase?: FloatFunction;
    mult_factor_decrease?: FloatFunction;
};

/** Hue offset by time (same for all pixels). */
export type TimedHue = {
    offset_factor: FloatFunction;
};

/** Time-based saturation: one of mult_factor_increase or mult_factor_decrease (by time). */
export type TimedSaturation = {
    mult_factor_increase?: FloatFunction;
    mult_factor_decrease?: FloatFunction;
};

export type Effect = {
    effect_config: EffectConfig;
    const_color?: ConstColor;
    rainbow?: Rainbow;
    brightness?: Brightness;
    hue?: Hue;
    saturation?: Saturation;
    snake?: Snake;
    segment?: Segment;
    glitter?: Glitter;
    alternate?: Alternate;
    position_brightness?: PositionBrightness;
    position_hue?: PositionHue;
    position_saturation?: PositionSaturation;
    snake_brightness?: SnakeBrightness;
    snake_hue?: SnakeHue;
    snake_saturation?: SnakeSaturation;
    timed_brightness?: TimedBrightness;
    timed_hue?: TimedHue;
    timed_saturation?: TimedSaturation;
};

export type Sequence = {
    effects: Effect[];
    duration_ms: number;
    num_repeats: number;
}