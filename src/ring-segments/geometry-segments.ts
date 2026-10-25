// Adds segments computed from where each pixel sits in space, to segments.json (and its UI copy).
// Run after changing the geometry below: yarn ts-node src/ring-segments/geometry-segments.ts
//
// Every d1 ring is laid out the same way relative to the installation's center (CLAUDE.md "Orientation in space"),
// so one mapping works for all 12 rings:
// - physical small ring i sits at local (i + D0_OFFSET):30 on the d1 ring's clock, whose 12 o'clock faces the d2
//   center (the wiring starts at d0 position 9, not at the inner side);
// - pixel p sits at local p:30 on the small ring's clock, whose 12 o'clock faces the d1 center;
// - physical pixel index = i * 12 + p.

import fs from "fs";
import path from "path";

/** Radius of a small ring (d0) relative to the radius of the d1 ring its centers sit on. */
const D0_RADIUS_RATIO = 0.2;
/** Clock position (in half hours past 12) of the small ring holding physical pixels 0-11. */
const D0_OFFSET = 9;

interface Pixel { index: number; relPos: number }
interface Segment { name: string; pixels: Pixel[] }

/** A point at clock angle `deg` (0 = local 12, clockwise) and radius `r`, as [x, up]. */
const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return [r * Math.sin(a), r * Math.cos(a)];
};

/** Position of every pixel in its d1 ring's own frame: x to the side, `up` toward the d2 center. */
function pixelPositions() {
    const out: { index: number; x: number; up: number }[] = [];
    for (let i = 0; i < 12; i++) {
        const di = (((i + D0_OFFSET) % 12) + 0.5) * 30;
        const [cx, cu] = at(di, 1);
        for (let p = 0; p < 12; p++) {
            // The small ring's 12 o'clock faces the d1 center, i.e. it is turned by di + 180.
            const [px, pu] = at(di + 180 + (p + 0.5) * 30, D0_RADIUS_RATIO);
            out.push({ index: i * 12 + p, x: cx + px, up: cu + pu });
        }
    }
    return out;
}

/** rad (radial): 0 for the pixels nearest the d2 center (the inner side), 1 for the farthest out. */
function radialSegment(): Segment {
    const pos = pixelPositions();
    // Distance from the installation's center is (d1 radius - up); only the order and spread matter here.
    const outward = pos.map(p => -p.up);
    const min = Math.min(...outward), max = Math.max(...outward);
    const pixels = pos.map((p, k) => ({ index: p.index, relPos: +((outward[k] - min) / (max - min)).toFixed(6) }));
    return { name: "rad", pixels };
}

/** Writes segments.json in its existing style: one pixel per line. */
function format(data: { numberOfPixels: number; segments: Segment[] }) {
    const segs = data.segments.map(s => [
        "    {",
        `      "name": ${JSON.stringify(s.name)},`,
        `      "pixels": [`,
        s.pixels.map(p => `        { "index": ${p.index}, "relPos": ${p.relPos} }`).join(",\n"),
        "      ]",
        "    }",
    ].join("\n"));
    return `{\n  "numberOfPixels": ${data.numberOfPixels},\n  "segments": [\n${segs.join(",\n")}\n  ]\n}\n`;
}

const files = [
    path.join(__dirname, "segments.json"),
    path.join(__dirname, "..", "..", "ui", "src", "segments.json"),
];
const added = [radialSegment()];
for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const seg of added) {
        const k = data.segments.findIndex((s: Segment) => s.name === seg.name);
        if (k >= 0) data.segments[k] = seg;
        else data.segments.push(seg);
    }
    fs.writeFileSync(file, format(data));
    console.log(`Updated ${path.relative(process.cwd(), file)}: ${added.map(s => s.name).join(", ")}`);
}
