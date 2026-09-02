import assert from "node:assert/strict";
import test from "node:test";
import { renderChart } from "../src/render.mjs";

const history = {
  repository: "owner/repo",
  repositoryCreatedAt: "2024-03-11",
  updatedAt: "2026-09-01T03:00:00.000Z",
  observedFrom: "2026-09-01",
  points: [
    { date: "2025-01-01", count: 1, source: "backfill" },
    { date: "2025-06-01", count: 250, source: "backfill" },
    { date: "2026-09-01", count: 1234, source: "observed" },
  ],
};

test("renderChart produces an accessible standalone SVG", () => {
  const svg = renderChart(history, { width: 900, height: 600 });
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /<svg[^>]+role="img"/);
  assert.match(svg, />Star History<\/text>/);
  assert.match(svg, />owner\/repo<\/text>/);
  assert.match(svg, />GitHub Stars<\/text>/);
  assert.match(svg, />Date<\/text>/);
  assert.match(svg, /font-family: "GH Star Hand"/);
  assert.match(svg, /id="xkcdify"/);
  assert.match(svg, /baseFrequency="0\.05"/);
  assert.match(svg, /scale="5"/);
  assert.match(svg, /filterUnits="userSpaceOnUse" x="-5" y="-5" width="100%" height="100%"/);
  assert.match(svg, /stroke="#dd4528"/);
  assert.match(svg, /class="xaxis" transform="translate\(0,490\)"/);
  assert.match(svg, /d="M0\.5,0\.5H800\.5"/);
  assert.match(svg, /d="M-1,490\.5H0\.5V0\.5H-1"/);
  assert.match(svg, /width="104" height="32"/);
  assert.match(svg, /x="29" y="25"/);
  assert.match(svg, /<text x="-250" y="12" dy="\.75em"/);
  assert.match(svg, /class="xkcd-chart-xyline" d="M[^\"]+C[^\"]+"/);
  assert.match(svg, />200<\/text>/);
  assert.match(svg, />1200<\/text>/);
  assert.doesNotMatch(svg, /linearGradient|daily observations begin|★/);
  assert.doesNotMatch(svg, /undefined|NaN/);
});

test("renderChart escapes custom titles", () => {
  const svg = renderChart(history, { title: "<script>alert('x')</script>", theme: "dark" });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  assert.match(svg, /#0d1117/);
  assert.match(svg, /stroke="#ff6b6b"/);
});
