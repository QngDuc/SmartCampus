// Kiểm tra đồ thị của app bằng Node, không cần chạy React Native.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    file,
  );
const { locationCoordinates } = require("../data/campusMap.ts");
const {
  canRoute,
  distance,
  findCampusRoute,
  insideCampus,
} = require("../data/campusRouting.ts");
const ids = Object.keys(locationCoordinates).map(Number).filter(canRoute);
let tested = 0;
for (const from of ids)
  for (const to of ids) {
    const route = findCampusRoute(from, to);
    assert.ok(route, `Thiếu tuyến ${from} → ${to}`);
    assert.deepEqual(
      route.points[0],
      locationCoordinates[from === 100 ? 10 : from],
    );
    assert.deepEqual(
      route.points.at(-1),
      locationCoordinates[to === 100 ? 10 : to],
    );
    let length = 0;
    for (let i = 0; i < route.points.length; i++) {
      assert.ok(insideCampus(route.points[i]));
      if (!i) continue;
      const a = route.points[i - 1],
        b = route.points[i];
      length += distance(a, b);
      for (let step = 0; step <= 100; step++) {
        const t = step / 100;
        assert.ok(
          insideCampus({
            latitude: a.latitude + (b.latitude - a.latitude) * t,
            longitude: a.longitude + (b.longitude - a.longitude) * t,
          }),
        );
      }
    }
    assert.ok(Math.abs(route.meters - length) <= 1);
    assert.equal(route.meters, findCampusRoute(to, from).meters);
    if (from === to) assert.equal(route.meters, 0);
    tested++;
  }
assert.equal(findCampusRoute(4, 1), null);
assert.equal(findCampusRoute(1, 999), null);
assert.equal(insideCampus({ latitude: 10, longitude: 106 }), false);
console.log(
  `PASS: ${tested} tuyến, điểm đầu/cuối, độ dài, chiều ngược và giới hạn khuôn viên.`,
);
