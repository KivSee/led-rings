import { phase } from "../phase/phase";
import { addEffect } from "./effect";

export const snakeHeadMove = ({start, end, tail}: {
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

export const staticSnake = ({ start, end }: {
  start: number;
  end: number;
}) => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          constValue: {
            value: start
          }
        },
        tailLength: {
          constValue: {
            value: start - end
          }
        },
        cyclic: true,
      },
    };
  });
}

export const snake = (
  {
    tailLength,
    cyclic,
  }: {
    tailLength: number;
    cyclic?: boolean;
  }
) => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          linear: {
            start: phase,
            end: phase + 1,
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
            phase: 0.75,
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
