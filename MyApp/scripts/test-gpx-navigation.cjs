// Kiểm tra chỉ dẫn rẽ và dữ liệu tuyến GPX bằng Node (không cần React Native).
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
const {
  gpxTracks,
  gpxTrackByDestination,
  getTrackHeading,
} = require("../data/gpxTracks.ts");
const {
  buildSteps,
  getNextStep,
  formatDistance,
} = require("../data/navigationSteps.ts");

for (const track of gpxTracks) {
  assert.equal(track.route.length, track.cumulative.length);
  for (let i = 1; i < track.cumulative.length; i++)
    assert.ok(
      track.cumulative[i] >= track.cumulative[i - 1],
      `${track.id}: cumulative giảm tại ${i}`,
    );
  const steps = buildSteps(track.route, track.totalMeters, track.toName);
  assert.ok(steps.at(-1).end, `${track.id}: thiếu bước đến nơi`);
  assert.equal(steps.at(-1).distance, track.totalMeters);
  for (let i = 1; i < steps.length; i++)
    assert.ok(steps[i].distance > steps[i - 1].distance);
  const heading = getTrackHeading(track, 0);
  assert.ok(heading >= 0 && heading < 360);
  console.log(
    track.id,
    track.totalMeters + " m:",
    steps.map((s) => `${Math.round(s.distance)}m ${s.text}`).join(" | "),
  );
}
const nn = gpxTrackByDestination[10];
const steps = buildSteps(nn.route, nn.totalMeters, nn.toName);
assert.deepEqual(
  steps.slice(0, -1).map((s) => Math.sign(s.turn)),
  [1, -1, 1],
);
assert.equal(getNextStep(steps, 0).index, 0);
assert.equal(getNextStep(steps, nn.totalMeters).step.end, true);
assert.equal(formatDistance(1234), "1.2 km");
console.log("PASS: dữ liệu tuyến GPX và chỉ dẫn rẽ.");
