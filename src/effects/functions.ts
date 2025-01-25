
export type FloatFunction = {
    const_value?: ConstValueFloatFunction;
    linear?: LinearFloatFunction;
    sin?: SinFloatFunction;
    steps?: StepsFloatFunction;
    repeat?: RepeatFloatFunction;
    half?: HalfFloatFunction;
    comb2?: Comb2FloatFunction;
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
