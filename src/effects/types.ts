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
};

export type Sequence = {
    effects: Effect[];
    duration_ms: number;
    num_repeats: number;
}