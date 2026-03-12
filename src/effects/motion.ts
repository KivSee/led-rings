import { addEffect } from "./effect";
import { tagEffect } from "../recorder/effect-key-map";

export const snakeHeadMove = ({
  start,
  end,
  tail,
}: {
  start: number;
  end: number;
  tail: number;
}) => {
  tagEffect("snakeHeadMove", { start, end, tail });
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          linear: {
            start: start,
            end: end,
          },
        },
        tail_length: {
          const_value: {
            value: tail,
          },
        },
      },
    };
  });
};

export const staticSnake = ({ start, end }: { start: number; end: number }) => {
  tagEffect("staticSnake", { start, end });
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          const_value: {
            value: start + phase,
          },
        },
        tail_length: {
          const_value: {
            value: start - end,
          },
        },
        cyclic: true,
      },
    };
  });
};

export const snake = ({
  tailLength,
  cyclic,
  reverse,
}: {
  tailLength: number;
  cyclic?: boolean;
  reverse?: boolean;
}) => {
  tagEffect("snake", { tailLength, cyclic, reverse });
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          linear: {
            start: reverse ? phase + 1 : phase,
            end: reverse ? phase : phase + 1,
          },
        },
        tail_length: {
          const_value: {
            value: tailLength ?? 0.5,
          },
        },
        cyclic: cyclic ?? false,
      },
    };
  });
};

export const snakeHeadSin = ({
  tailLength,
  cyclic,
}: {
  tailLength: number;
  cyclic?: boolean;
}) => {
  tagEffect("snakeHeadSin", { tailLength, cyclic });
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          sin: {
            min: 0.1,
            max: 1.0,
            phase: phase,
            repeats: 1.0,
          },
        },
        tail_length: {
          const_value: {
            value: tailLength,
          },
        },
        cyclic: cyclic ?? false,
      },
    };
  });
};

export const snakeFillGrow = (reverse?: boolean) => {
  tagEffect("snakeFillGrow", { reverse });
  const f1 = {
    linear: {
      start: 0,
      end: 1.0,
    },
  }
  const f2 = {
    const_value: {
      value: 1.0,
    },
  }
  addEffect({
    snake: {
      head: {
        half: {
          f1: reverse ? f2 : f1,
          f2: reverse ? f1 : f2,
        },
      },
      tail_length: {
        half: {
          f1: {
            const_value: {
              value: 0.5,
            },
          },
          f2: {
            linear: {
              start: 0.5,
              end: 3.0,
            },
          },
        },
      },
      cyclic: false,
    },
  });
};

export const snakeInOut = (opt?: { start: number; end: number }) => {
  tagEffect("snakeInOut", opt || {});
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          sin: {
            min: 0,
            max: 1.0,
            phase: phase,
            repeats: 1.0,
          },
        },
        tail_length: {
          const_value: {
            value: 0.5,
          },
        },
      },
    };
  });
};

export const snakeSlowFast = ({ tailLength }: {
  tailLength?: number;
}) => {
  tagEffect("snakeSlowFast", { tailLength });
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          comb2: {
            f1: {
              sin: {
                min: 0,
                max: 1.0,
                phase: phase,
                repeats: 1.0,
              },
            },
            amount1: 1.0,
            f2: {
              linear: {
                start: 0,
                end: 1.0,
              },
            },
            amount2: 1.0,
          },
        },
        tail_length: {
          const_value: {
            value: tailLength ?? 0.5,
          },
        },
        cyclic: true,
      },
    };
  });
};

export const snakeTailShrinkGrow = () => {
  tagEffect("snakeTailShrinkGrow", {});
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          sin: {
            min: 0,
            max: 1.0,
            phase: phase,
            repeats: 1.0,
          },
        },
        tail_length: {
          half: {
            f1: {
              linear: {
                start: 0.5,
                end: 1,
              },
            },
            f2: {
              linear: {
                start: 1,
                end: 0.5,
              },
            },
          },
        },
        cyclic: true,
      },
    };
  });
};

export const snakeHeadSteps = ({ steps, tailLength }: {
  steps: number;
  tailLength?: number;
}) => {
  tagEffect("snakeHeadSteps", { steps, tailLength });
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          steps: {
            num_steps: steps,
            diff_per_step: 1.0 / steps,
            first_step_value: phase,
          },
        },
        tail_length: {
          const_value: {
            value: tailLength ?? 0.5,
          },
        },
        cyclic: true,
      },
    };
  });
}