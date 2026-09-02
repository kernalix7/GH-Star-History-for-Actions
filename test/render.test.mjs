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
  const svg = renderChart(history, { title: "owner/repo", width: 900, height: 600 });
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /<svg[^>]+role="img"/);
  assert.match(svg, /★ 1,234/);
  assert.match(svg, /daily observations begin/);
  assert.match(svg, /inspired by star-history\.com/);
  assert.doesNotMatch(svg, /undefined|NaN/);
});

test("renderChart escapes custom titles", () => {
  const svg = renderChart(history, { title: "<script>alert('x')</script>", theme: "dark" });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  assert.match(svg, /#0d1117/);
});
