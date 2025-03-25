import { getLineAndCharacterOfPosition } from "typescript";
import { phase } from "../phase/phase";
import { addEffect } from "./effect";
import { reverse } from "dns";
import { cycle } from "../time/time";

export const snakeHeadMove = ({
  start,
  end,
  tail,
}: {
  start: number;
  end: number;
  tail: number;
}) => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          linear: {
            start: start,
            end: end,
          },
        },
        tailLength: {
          constValue: {
            value: tail,
          },
        },
      },
    };
  });
};

export const staticSnake = ({ start, end }: { start: number; end: number }) => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          constValue: {
            value: start + phase,
          },
        },
        tailLength: {
          constValue: {
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
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          linear: {
            start: reverse ? phase + 1 : phase,
            end: reverse ? phase : phase + 1,
          },
        },
        tailLength: {
          constValue: {
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
        tailLength: {
          constValue: {
            value: tailLength,
          },
        },
      },
    };
  });
};

export const snakeFillGrow = () => {
  addEffect({
    snake: {
      head: {
        half: {
          f1: {
            linear: {
              start: 0,
              end: 1.0,
            },
          },
          f2: {
            const_value: {
              value: 1.0,
            },
          },
        },
      },
      tailLength: {
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
        tailLength: {
          constValue: {
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
        tailLength: {
          constValue: {
            value: tailLength ?? 0.5,
          },
        },
        cyclic: true,
      },
    };
  });
};

export const snakeTailShrinkGrow = () => {
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
        tailLength: {
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
