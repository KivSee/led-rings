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
  const anim = new Animation("loop", 300, 248.70, 3000, [3035,3383,3708,4033,4382,4707,5043,5368,5705,6030,6367,6704,7029,7365,7679,8004,8341,8666,8979,9304,9618,9931,10245,10558,10860,11173,11475,11777,12079,12381,12671,12973,13263,13554,13844,14134,14413,14703,14982,15260,15539,15817,16096,16375,16630,16909,17176,17443,17698,17965,18221,18488,18743,18999,19254,19509,19765,20009,20264,20508,20752,20996,21239,21483,21727,21959,22203,22447,22667,22900,23143,23364,23596,23840,24061,24281,24502,24722,24955,25175,25396,25616,25837,26057,26266,26487,26696,26905,27126,27335,27544,27753,27938,28159,28368,28565,28774,28972,29169,29378,29575,29773,29970,30156,30353,30562,30736,30945,31131,31328,31514,31700,31886,32083,32257,32455,32605,32814,33000,33186,33372,33558,33732,33894,34092,34266,34440,34626,34800,34974,35160,35334,35485,35682,35856,36019,36193,36379,36553,36715,36901,37064,37226,37400,37563,37749,37911,38085,38260,38434,38585,38759,38921,39084,39258,39409,39595,39734,39920,40082,40256,40407,40593,40744,40907,41092,41255,41406,41580,41754,41893,42091,42253,42404,42567,42729,42915,43078,43229,43426,43577,43728,43902,44076,44239,44378,44541,44728,44889,45057,45237,45389,45539,45736,45887,46061,46224,46375,46526,46712,46874,47037,47199,47373,47536,47710,47873,48024,48209,48360,48523,48709,48848,49022,49185,49347,49521,49707,49846,50020,50183,50346,50496,50682,50845,51019,51170,51344,51495,51669,51832,51994,52157,52331,52493,52668,52830,52993,53167,53318,53480,53643,53817,53979,54154,54305,54479,54653,54804,54990,55140,55303,55466,55628,55791,55953,56127,56301,56452,56627,56777,56952,57115,57277,57439,57613,57776,57938,58124,58275,58426,58600,58763,58902,59085,59239,59413,59587,59761,59912,60081,60249,60411,60562,60748,60911,61083,61247,61398,61572,61723,61897,62064,62223,62400,62559,62722,62896,63057,63221,63384,63552,63709,63883,64044,64208,64382,64545,64719,64870,65042,65201,65380,65543,65708,65868,66022,66193,66367,66518,66692,66867,67022,67192,67343,67528,67691,67853,68016,68178,68340,68515,68693,68855,69006,69168,69336,69514,69676,69827,69990,70164,70338,70489,70663,70837,70965,71162,71325,71499,71661,71940,72139,72300,72497,72660,72822,72950,73310,73484,73713,74018,74483,74970,75319,75899,76538,76990,77757,78593,79185,79603,80114,81066,81702,82656,83585,84142,84908,85605,86011,86592,87091,87393,87811,88182,88438,88809,89177,89285,89427,89796,90175,90295,90415,90783,91177,91288,91412,91770,92159,92281,92400,92757,93152,93256,93384,93767,94138,94254,94371,94747,95125,95241,95374,95741,96112,96251,96365,96739,97114,97238,97354,97726,98100,98225,98352,98481,98724,99096,99224,99328,99711,100083,100199,100326,100698,101081,101197,101325,101696,102068,102196,102312,102684,103056,103183,103312,103682,104053,104181,104297,104425,104553,104680,104808,104922,105052,105165,105296,105418,105563,105667,105795,105911,106039,106155,106282,106408,106549,106661,106791,106909,107037,107153,107281,107403,107543,107652,107792,107896,108024,108152,108270,108397,108535,108649,108779,108895,109011,109138,109260,109381,109522,109635,109777,109882,110009,110125,110250,110378,110520,110628,110764,110880,110996,111117,111240,111368,111495,111623,111751,111863,111995,112111,112237,112366,112505,112610,112738,112858,112981,113109,113227,113348,113492,113604,113733,113852,113980,114096,114212,114340,114491,114596,114723,114839,114967,115083,115210,115338,115466,115583,115721,115826,115954,116070,116197,116325,116464,116580,116720,116836,116952,117070,117201,117321,117457,117567,117707,117816,117950,118067,118189,118308,118448,118562,118717,118812,118937,119053,119178,119300,119448,119553,119727,119919,120168,120305,120542,120690,120795,120923,121036,121165,121282,121426,121537,121669,121782,121909,122034,122158,122282,122412,122523,122664,122769,122896,123029,123140,123272,123415,123521,123628,123767,123895,124011,124150,124255,124406,124510,124654,124754,124893,125004,125130,125253,125392,125497,125636,125741,125880,125996,126112,126240,126391,126496,126635,126739,126867,126983,127111,127238,127378,127488,127616,127726,127854,127970,128100,128225,128365,128476,128608,128724,128841,128968,129095,129215,129375,129478,129609,129711,129851,129955,130083,130211,130338,130454,130602,130710,130836,130949,131086,131197,131325,131453,131581,131704,131824,131940,132075,132197,132335,132451,132591,132701,132827,132935,133062,133183,133322,133438,133577,133692,133810,133926,134059,134182,134321,134425,134551,134673,134797,134924,135040,135176,135296,135422,135563,135667,135795,135911,136027,136155,136294,136410,136550,136665,136782,136909,137032,137142,137293,137404,137529,137641,137780,137896,138027,138152,138280,138398,138547,138653,138767,138891,139011,139136,139278,139389,139522,139630,139774,139893,139998,140125,140253,140381,140520,140625,140761,140876,141009,141124,141252,141372,141530,141628,141751,141867,141986,142111,142250,142355,142459,142610,142738,142857,142982,143098,143237,143366,143481,143585,143736,143850,143968,144084,144224,144340,144468,144607,144711,144828,144961,145087,145211,145338,145469,145589,145710,145838,145942,146081,146221,146325,146476,146585,146708,146824,146941,147080,147184,147312,147451,147579,147695,147811,147927,148067,148171,148311,148452,148566,148694,148798,148914,149042,149181,149309,149448,149558,149681,149797,149913,150052,150180,150284,150442,150551,150667,150783,150923,151039,151294,151538,151677,151782,151898,152026,152384,158016,159247,159630,160037,160443,160826,161209,161592,161964,162347,162707,163067,163427,163775,164123,164460,164808,165133,165458,165784,166097,166410,166724,167014,167316,167606,167885,168164,168442,168698,168976,169232,169476,169731,169963,170207,170439,170683,170915,171124,171356,171574,171774,171995,172192,172390,172587,172784,172982,173167,173365,173539,173736,173887,174085,174259,174433,174596,174770,174932,175095,175257,175420,175582,175768,175919,176082,176256,176418,176569,176720,176918,177080,177254,177405,177579,177695,177811,178067,178195,178311,178555,178694,178798,178903,179054,179193,179309,179448,179553,179681,179797,179936,180540,180712,180885,181039,181155,181294,181434,181546,181666,181770,181921,182026,182154,182281,182378,182524,182689,182780,182920,183029,183152,183268,183522,183683,183867,184024,184151,184255,184406,184530,184650,184754,184998,185149,185280,185497,185637,185741,185892,186006,186101,186240,186391,186500,186623,186740,186896,186994,187111,187239,187375,187491,187640,187736,187877,187990,188118,188231,188377,188494,188609,188729,188874,188976,189108,189224,189363,189478,189606,189722,189863,189979,190106,190211,190356,190466,190601,190710,190849,190954,191093,191198,191349,191464,191581,191697,191848,191954,192080,192196,192336,192440,192591,192777,192928,193055,193192,193334,193449,193555,193682,193822,193939,194065,194170,194321,194431,194565,194677,194820,194925,195052,195168,195319,195428,195598,195749,195911,196039,196260,196399,196585,196747,196906,197084,197247,197400,197583,197734,197897,198036,198141,198291,198404,198533,198639,198779,198884,199046,199147,199278,199383,199522,199635,199778,199893,200020,200130,200277,200396,200521,200625,200770,200874,201012,201124,201264,201378,201496,201627,201763,201878,201995,202114,202262,202374,202506,202623,202750,202861,203000,203111,203249,203353,203481,203597,203748,203863,203992,204103,204236,204340,204480,204584,204735,204847,204956,205083,205234,205346,205455,205583,205722,205826,205954,206082,206221,206326,206453,206569,206709,206813,206941,207069,207208,207312,207440,207568,207707,207812,207939,208055,208195,208311,208439,208566,208694,208799,208926,209054,209193,209298,209425,209553,209692,209797,209925,210052,210180,210296,210424,210540,210679,210784,210923,211039,211179,211283,211411,211527,211666,211782,211898,212026,212165,212282,212525,212653,212780,212903,213025,213174,213283,213407,213524,213651,213776,213884,214011,214151,214267,214421,214521,214638,214759,214894,215013,215149,215263,215381,215508,215621,215757,215869,216004,216144,216250,216380,216500,216624,216748,216872,217000,217134,217248,217406,217498,217624,217737,217874,217989,218141,218236,218365,218481,218609,218724,218864,218978,219120,219468,219596,219700,219840,219967,220107,220211,220339,220455,220594,220699,220815,220954,221093,221198,221442,221581,221697,221802,221929,222185,222336,222580,222684,222800,222928,223079,223427,223566,223682,223799,223926,224066,224170,224414,224565,224785,224913,225064,225331,225517,225656,225784,225912,226132,226306,226539,226643,226771,226898,227154,227293,227398,227537,227642,227769,227885,228036,228152,228385,228524,228756,228884,229035,229267,229371,229511,229755,229871,230022,230126,230312,230474,230614,230741,230869,231020,231357,231496,231601,231728,231868,232007,232111,232355,232494,232599,232727,232854,232994,233098,233342,233481,233597,233725,233841,233981,234085,234282,234468,234584,234700,234828,234979,235083,235223,235467,235699,235827,235966,236082,236314,236453,236558,236686,236825,236953,237069,237208,237313,237452,237556,237684,237800,237951,238056,238207,238450,238555,238694,238799,238938,239042,239205,239437,239542,239681,239797,239925,240053,240157,240296,240529,240680,240796,240923,241039,241190,241423,241539,241643,241782,241922,242258,242409,242525,242642,242769,242920,243176,243396,243512,243628,243768,243907,244348]);
  anim.sync(() => {
    beats(0, 76, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(6, 70, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.8009, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(12, 64, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.8842, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(18, 58, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9675, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(24, 52, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.0509, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(30, 46, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.1342, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(30, 46, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.2175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(24, 52, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.3009, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(18, 58, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.3842, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(12, 64, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.4675, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(6, 70, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.5509, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(0, 76, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.6342, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(76, 124, () => {
      cycle(6, () => {
        elements([1], () => {
          segment(segment_ind, () => {
            constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(82, 124, () => {
      cycle(6, () => {
        elements([2], () => {
          segment(segment_ind, () => {
            constColor({ hue: 0.8009, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(88, 124, () => {
      cycle(6, () => {
        elements([3], () => {
          segment(segment_ind, () => {
            constColor({ hue: 0.8842, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(94, 124, () => {
      cycle(6, () => {
        elements([4], () => {
          segment(segment_ind, () => {
            constColor({ hue: 0.9675, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(100, 124, () => {
      cycle(6, () => {
        elements([5], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.0509, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(106, 124, () => {
      cycle(6, () => {
        elements([6], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.1342, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(106, 124, () => {
      cycle(6, () => {
        elements([7], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.2175, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(100, 124, () => {
      cycle(6, () => {
        elements([8], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.3009, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(94, 124, () => {
      cycle(6, () => {
        elements([9], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.3842, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(88, 124, () => {
      cycle(6, () => {
        elements([10], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.4675, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(82, 124, () => {
      cycle(6, () => {
        elements([11], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.5509, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(76, 124, () => {
      cycle(6, () => {
        elements([12], () => {
          segment(segment_ind, () => {
            constColor({ hue: 1.6342, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(124, 166, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(124, 166, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(192, 312, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(192, 312, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(166, 192, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(166, 192, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(308, 356, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(6, () => {
              constColor({ hue: 0.0288, sat: 1.0000, val: 1.0000 })
            });
          });
        });
      });
    })

    beats(308, 356, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
          });
        });
      });
    })

    beats(380, 381, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.2991, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(382, 383, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4658, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(383, 384, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.1324, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(384, 385, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.4658, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(381, 382, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.7991, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(385, 386, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 2.1324, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(386, 387, () => {
      cycle(0.1, () => {
        elements(all, () => {
          segment(segment_all, () => {
            constColor({ hue: 0.7466, sat: 0.9351, val: 0.7255 })
          });
        });
      });
    })

    beats(387, 831, () => {
      cycle(8, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(387, 831, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(356, 380, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.2991, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(360, 380, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4658, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(378, 380, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6324, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(376, 380, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7991, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(368, 380, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9658, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(362, 380, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.1324, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(372, 380, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.2991, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(364, 380, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.4658, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(374, 380, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.6324, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(358, 380, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.7991, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(370, 380, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 1.9658, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(366, 380, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 2.1324, sat: 0.9573, val: 0.9176 })
        });
      });
    })

    beats(831, 833, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          phase(1, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(833, 925, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          constColor({ hue: 0.6152, sat: 0.5020, val: 0.9608 })
        });
      });
    })

    beats(0, 6, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(36, 38, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(6, 12, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(12, 18, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(18, 24, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(24, 30, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(30, 36, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(30, 36, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(24, 30, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(18, 24, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(12, 18, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(6, 12, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(0, 6, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(36, 38, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(68, 74, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(62, 68, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(56, 62, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(50, 56, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(44, 50, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(38, 44, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(74, 76, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(38, 44, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(74, 76, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(44, 50, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(50, 56, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(56, 62, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(62, 68, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(68, 74, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(76, 82, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(112, 118, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(82, 88, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(118, 124, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(88, 94, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(94, 100, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(100, 106, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(106, 112, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(106, 112, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(100, 106, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(94, 100, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(88, 94, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(82, 88, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(118, 124, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(76, 82, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(112, 118, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(124, 166, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 7, diff_per_step: 0.143, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(192, 193, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          phase(1, () => {
            pulse({ low: 0 })
          });
        });
      });
    })

    beats(192, 312, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { steps: { num_steps: 5, diff_per_step: -0.14, first_step_value: 1 } } } })
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 5, diff_per_step: 0.25, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(116, 132, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOutIn({ low: 0 })
        });
      });
    })

    beats(166, 192, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 8, diff_per_step: 0.5, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(158, 174, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOutIn({ low: 0 })
        });
      });
    })

    beats(308, 356, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            hueShiftStartToEnd({ start: 0, end: 1 })
            phase(2, () => {
              pulse({ low: 0.6065, staticPhase: 0 })
            });
          });
        });
      });
    })

    beats(380, 381, () => {
      elements([1], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(382, 383, () => {
      elements([2], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(383, 384, () => {
      elements([6], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(384, 385, () => {
      elements([8], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(381, 382, () => {
      elements([10], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(385, 386, () => {
      elements([12], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(386, 387, () => {
      cycle(0.1, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.5, staticPhase: 0 })
          });
        });
      });
    })

    beats(387, 831, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 7, diff_per_step: 0.143, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(387, 391, () => {
      elements([1], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(435, 439, () => {
      elements([1], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(395, 399, () => {
      elements([2], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(443, 447, () => {
      elements([2], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(431, 435, () => {
      elements([3], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(427, 431, () => {
      elements([4], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(411, 415, () => {
      elements([5], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(399, 403, () => {
      elements([6], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(447, 451, () => {
      elements([6], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(419, 423, () => {
      elements([7], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(403, 407, () => {
      elements([8], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(451, 452, () => {
      elements([8], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(423, 427, () => {
      elements([9], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(391, 395, () => {
      elements([10], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(439, 443, () => {
      elements([10], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(415, 419, () => {
      elements([11], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(407, 411, () => {
      elements([12], () => {
        segment(segment_all, () => {
          blink({ low: 0 })
        });
      });
    })

    beats(454, 831, () => {
      cycleBeats(16, 2, 8, () => {
        elements([1], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(470, 815, () => {
      cycleBeats(16, 2, 8, () => {
        elements([2], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(486, 799, () => {
      cycleBeats(16, 2, 8, () => {
        elements([3], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(502, 783, () => {
      cycleBeats(16, 2, 8, () => {
        elements([4], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(518, 767, () => {
      cycleBeats(16, 2, 8, () => {
        elements([5], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(534, 751, () => {
      cycleBeats(16, 2, 8, () => {
        elements([6], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(550, 735, () => {
      cycleBeats(16, 2, 8, () => {
        elements([7], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(566, 719, () => {
      cycleBeats(16, 2, 8, () => {
        elements([8], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(582, 703, () => {
      cycleBeats(16, 2, 8, () => {
        elements([9], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(598, 687, () => {
      cycleBeats(16, 2, 8, () => {
        elements([10], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(614, 671, () => {
      cycleBeats(16, 2, 8, () => {
        elements([11], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(630, 655, () => {
      cycleBeats(16, 2, 8, () => {
        elements([12], () => {
          segment(segment_all, () => {
            blink({ low: 0 })
          });
        });
      });
    })

    beats(296, 312, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(312, 328, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(356, 380, () => {
      elements([1], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(360, 380, () => {
      elements([2], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(378, 380, () => {
      elements([3], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(376, 380, () => {
      elements([4], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(368, 380, () => {
      elements([5], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(362, 380, () => {
      elements([6], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(372, 380, () => {
      elements([7], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(364, 380, () => {
      elements([8], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(374, 380, () => {
      elements([9], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(358, 380, () => {
      elements([10], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(370, 380, () => {
      elements([11], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(366, 380, () => {
      elements([12], () => {
        segment(segment_all, () => {
          pulse({ low: 0.5, staticPhase: 0 })
        });
      });
    })

    beats(452, 454, () => {
      cycle(0.2, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.2, staticPhase: 0 })
          });
        });
      });
    })

    beats(573, 576, () => {
      cycle(0.2, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.2, staticPhase: 0 })
          });
        });
      });
    })

    beats(831, 833, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          fadeOut()
        });
      });
    })

    beats(833, 925, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          fadeIn()
        });
      });
    })

    beats(76, 124, () => {
      cycle(6, () => {
        elements([1], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(82, 124, () => {
      cycle(6, () => {
        elements([2], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(88, 124, () => {
      cycle(6, () => {
        elements([3], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(94, 124, () => {
      cycle(6, () => {
        elements([4], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(100, 124, () => {
      cycle(6, () => {
        elements([5], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(106, 124, () => {
      cycle(6, () => {
        elements([6], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(106, 124, () => {
      cycle(6, () => {
        elements([7], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(100, 124, () => {
      cycle(6, () => {
        elements([8], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(94, 124, () => {
      cycle(6, () => {
        elements([9], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(88, 124, () => {
      cycle(6, () => {
        elements([10], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(82, 124, () => {
      cycle(6, () => {
        elements([11], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(76, 124, () => {
      cycle(6, () => {
        elements([12], () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(124, 166, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(192, 312, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(166, 192, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(308, 356, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            snakeHeadSteps({ steps: 6, tailLength: 0.5 })
          });
        });
      });
    })

    beats(387, 831, () => {
      cycle(8, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(831, 833, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          phase(1, () => {
            snake({ tailLength: 0.5, cyclic: false, reverse: false })
          });
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("loop", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("loop", 0);
  }
};

(async () => {
  await loop();
})();
