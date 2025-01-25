
export type ThingName = string;
export type SegmentName = string;

export type EffectConfig = {
    start_time: number;
    end_time: number;
    segments: SegmentName;
}

export type Effect = {
    effect_config: EffectConfig;
    const_color: {
        color: {
            hue: number;
            sat: number;
            val: number;
        }
    }
};

export type Sequence = {
    effects: Effect[];
    duration_ms: number;
    num_repeats: number;
}