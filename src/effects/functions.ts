
export type FloatFunction = {
    const_value?: ConstValueFloatFunction;
    linear?: LinearFloatFunction;
    sin?: SinFloatFunction;
    steps?: StepsFloatFunction;
    repeat?: RepeatFloatFunction;
    half?: HalfFloatFunction;
    comb2?: Comb2FloatFunction;
    fixed_window?: FixedWindowFloatFunction;
    moving_window?: MovingWindowFloatFunction;
}

export type ConstValueFloatFunction = {
    value: number;
}

export type  LinearFloatFunction = {
    start: number;
    end: number;
}

export type  SinFloatFunction = {
    min: number;
    max: number;
    phase: number;
    repeats: number;
}

export type  StepsFloatFunction = {
    num_steps: number;
    diff_per_step: number;
    first_step_value: number;
}

export type  RepeatFloatFunction = {
    numberOfTimes: number;
    funcToRepeat: FloatFunction;
}

export type  HalfFloatFunction = {
    f1: FloatFunction;
    f2: FloatFunction;
}

export type  Comb2FloatFunction = {
    f1: FloatFunction;
    amount1: number;
    f2: FloatFunction;
    amount2: number;
}

/** func, stretched over x in start - end; outside_value elsewhere. With cyclic, x wraps around into the window. */
export type  FixedWindowFloatFunction = {
    start: number;
    end: number;
    cyclic?: boolean;
    outside_value: number;
    func: FloatFunction;
}

/** inside_value while x is between start(x) and end(x), outside_value elsewhere. */
export type  MovingWindowFloatFunction = {
    start: FloatFunction;
    end: FloatFunction;
    inside_value: number;
    outside_value: number;
    cyclic?: boolean;
}
