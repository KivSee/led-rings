// Generated from Timeline Manager.
import { sendSequence } from "../services/sequence";
import { startSong, trigger } from "../services/trigger";
import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats } from "../time/time";
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

const loop = async () => {
  const anim = new Animation("loop", 116, 245.00, 0, [69.7,568.9,1068.1,1567.3,2066.6,2565.8,3065,3564.3,4063.5,4551.1,5038.7,5526.3,6014,6490,6966,7430.4,7894.8,8510.1,9113.8,9705.9,10298,10878.5,11447.4,12016.3,12573.6,13119.3,13664.9,14210.6,14733.1,15255.5,15778,16288.8,16799.6,17298.9,17786.5,18274.1,18761.7,19237.7,19713.7,20178.1,20642.5,21095.3,21548.1,21989.3,22430.5,22871.7,23301.2,23730.8,24160.4,24578.3,24996.3,25402.6,25809,26215.3,26807.4,27387.9,27794.3,28363.2,28932.1,29489.3,30046.6,30592.3,31126.3,31660.4,32194.5,32716.9,33239.4,33761.8,34272.7,34783.5,35294.3,35793.6,36292.8,36792,37291.2,37790.5,38289.7,38788.9,39288.2,39775.8,40275,40774.2,41273.5,41761.1,42260.3,42759.5,43258.8,43746.4,44245.6,44733.2,45232.5,45731.7,46230.9,46718.5,47217.8,47717,48204.6,48703.9,49203.1,49702.3,50201.5,50689.2,51188.4,51676,52175.2,52674.5,53162.1,53661.3,54148.9,54648.2,55147.4,55635,56134.2,56621.9,57121.1,57608.7,58107.9,58607.2,59106.4,59594,60093.2,60592.5,61080.1,61579.3,62078.5,62577.8,63065.4,63564.6,64063.9,64551.5,65050.7,65549.9,66037.6,66536.8,67036,67535.2,68034.5,68533.7,69021.3,69520.5,70019.8,70519,71029.8,71505.9,72005.1,72527.5,73038.4,73560.8,74025.2,74559.3,75093.3,75615.8,76207.9,76637.5,77136.7,77612.7,78088.7,78727.3,79203.3,79679.3,80155.3,80619.7,81177,81664.6,82152.2,82628.2,83057.8,83615.1,84114.3,84671.6,85217.2,85832.6,86331.8,86831,87330.2,87817.9,88317.1,88816.3,89303.9,89803.2,90302.4,90801.6,91289.3,91788.5,92287.7,92775.3,93274.6,93773.8,94273,94760.6,95259.9,95759.1,96246.7,96745.9,97245.2,97732.8,98232,98731.2,99230.5,99718.1,100217.3,100716.6,101215.8,101703.4,102202.6,102701.9,103189.5,103688.7,104187.9,104675.6,105174.8,105674,106161.6,106660.9,107160.1,107659.3,108146.9,108646.2,109145.4,109644.6,110132.2,110631.5,111130.7,111618.3,112117.6,112616.8,113116,113603.6,114102.9,114602.1,115089.7,115588.9,116088.2,116575.8,117075,117574.2,118073.5,118561.1,119060.3,119559.5,120058.8,120546.4,121045.6,121544.9,122032.5,122531.7,123030.9,123518.5,124017.8,124517,125016.2,125503.9,126003.1,126502.3,126989.9,127489.2,127988.4,128487.6,128975.2,129474.5,129973.7,130461.3,130960.5,131459.8,131959,132446.6,132945.9,133445.1,133932.7,134431.9,134931.2,135430.4,135918,136417.2,136916.5,137404.1,137903.3,138402.5,138901.8,139389.4,139888.6,140387.8,140875.5,141374.7,141873.9,142361.5,142860.8,143360,143859.2,144346.8,144846.1,145345.3,145844.5,146332.2,146831.4,147330.6,147818.2,148317.5,148816.7,149315.9,149815.1,150314.4,150813.6,151301.2,151800.5,152299.7,152798.9,153298.1,153797.4,154285,154784.2,155283.4,155782.7,156270.3,156757.9,157257.1,157756.4,158244,158743.2,159242.4,159741.7,160275.7,160809.8,161320.6,161831.5,162330.7,162818.3,163294.3,163758.7,164339.2,164919.7,165477,165999.5,166510.3,167009.5,167485.5,167938.3,168391.1,168913.6,169436,170016.5,170573.8,171119.5,171630.3,172129.5,172617.1,173116.4,173615.6,174103.2,174602.4,175101.7,175589.3,176088.5,176587.8,177075.4,177563,178062.2,178561.5,179060.7,179548.3,180047.5,180546.8,181046,181533.6,182032.8,182532.1,183019.7,183518.9,184018.1,184517.4,185005,185504.2,186003.4,186491.1,186990.3,187489.5,187977.1,188476.4,188975.6,189474.8,189962.4,190461.7,190960.9,191448.5,191947.8,192447,192946.2,193433.8,193933.1,194432.3,194931.5,195419.1,195918.4,196417.6,196916.8,197404.4,197903.7,198391.3,198890.5,199389.8,199889,200376.6,200875.8,201375.1,201862.7,202361.9,202861.1,203348.8,203848,204347.2,204846.4,205334.1,205833.3,206332.5,206831.7,207319.4,207818.6,208317.8,208805.4,209304.7,209803.9,210291.5,210790.7,211290,211789.2,212276.8,212776.1,213275.3,213762.9,214262.1,214761.4,215260.6,215748.2,216247.4,216746.7,217234.3,217733.5,218232.7,218732,219219.6,219718.8,220218,220717.3,221204.9,221704.1,222191.7,222691,223190.2,223689.4,224177.1,224676.3,225175.5,225663.1,226162.4,226661.6,227160.8,227648.4,228147.7,228646.9,229146.1,229633.7,230133,230632.2,231119.8,231619,232118.3,232617.5,233105.1,233604.4,234103.6,234591.2,235090.4,235589.7,236077.3,236576.5,237075.7,237575,238062.6,238561.8,239061,239548.7,240047.9,240547.1]);
  anim.sync(() => {
    beats(0, 4, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
        });
      });
    })

    beats(4, 8, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(8, 12, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
        });
      });
    })

    beats(12, 16, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(16, 19, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(19, 22, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(22, 25, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
        });
      });
    })

    beats(4, 43, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
        });
      });
    })

    beats(8, 40, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(12, 37, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
        });
      });
    })

    beats(16, 34, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(19, 31, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(22, 28, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(25, 28, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
        });
      });
    })

    beats(28, 31, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(31, 34, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(34, 37, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(37, 40, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
        });
      });
    })

    beats(40, 43, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(43, 46, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
        });
      });
    })

    beats(46, 49, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
          });
        });
      });
    })

    beats(49, 52, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(52, 55, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
          });
        });
      });
    })

    beats(55, 58, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
          });
        });
      });
    })

    beats(58, 61, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
          });
        });
      });
    })

    beats(61, 64, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([6], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
          });
        });
      });
    })

    beats(49, 67, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
          });
        });
      });
    })

    beats(52, 67, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(55, 67, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
          });
        });
      });
    })

    beats(58, 67, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
          });
        });
      });
    })

    beats(61, 67, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
          });
        });
      });
    })

    beats(67, 82, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(67, 82, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(0, 4, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(4, 8, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(8, 12, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(12, 16, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(16, 19, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(19, 22, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(22, 25, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(4, 43, () => {
      elements([12], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(8, 40, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(12, 37, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(16, 34, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(19, 31, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(22, 28, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(25, 28, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(28, 31, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(31, 34, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34, 37, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(37, 40, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(40, 43, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(43, 46, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(46, 49, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(49, 52, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(52, 55, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(55, 58, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(58, 61, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(61, 64, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([6], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(49, 67, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(52, 67, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(55, 67, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(58, 67, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(61, 67, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(67, 82, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 9, diff_per_step: 0.083, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(46, 49, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(49, 52, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(52, 55, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(55, 58, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(58, 61, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(61, 64, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([6], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(49, 67, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(52, 67, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(55, 67, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(58, 67, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(61, 67, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(67, 82, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("loop", anim.getSequence());
  await startSong("loop", 0);
};

(async () => {
  await loop();
})();
