import assert from "node:assert/strict";
import test from "node:test";
import { chartPoints, createBackfill, updateHistory, utcDate } from "../src/history.mjs";

test("utcDate normalizes timestamps", () => {
  assert.equal(utcDate("2026-08-31T23:59:59Z"), "2026-08-31");
});

test("createBackfill aggregates active stargazers by day", () => {
  assert.deepEqual(
    createBackfill([
      "2024-01-02T10:00:00Z",
      "2024-01-01T09:00:00Z",
      "2024-01-02T11:00:00Z",
    ]),
    [
      { date: "2024-01-01", count: 1, source: "backfill" },
      { date: "2024-01-02", count: 3, source: "backfill" },
    ],
  );
});

test("updateHistory preserves observations and replaces same-day values", () => {
  const initial = updateHistory({
    existing: null,
    repository: "owner/repo",
    repositoryCreatedAt: "2023-06-15T12:00:00Z",
    currentCount: 3,
    stargazerDates: ["2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z", "2024-01-02T01:00:00Z"],
    now: new Date("2026-09-01T03:00:00Z"),
  });

  const updated = updateHistory({
    existing: initial,
    repository: "owner/repo",
    repositoryCreatedAt: "2023-06-15T12:00:00Z",
    currentCount: 2,
    now: new Date("2026-09-02T03:00:00Z"),
  });

  assert.deepEqual(
    updated.points.map(({ date, count, source }) => ({ date, count, source })),
    [
      { date: "2024-01-01", count: 1, source: "backfill" },
      { date: "2024-01-02", count: 3, source: "backfill" },
      { date: "2026-09-01", count: 3, source: "observed" },
      { date: "2026-09-02", count: 2, source: "observed" },
    ],
  );
});

test("chartPoints starts at the repository creation date", () => {
  const points = chartPoints({
    repositoryCreatedAt: "2022-07-10",
    points: [{ date: "2024-01-02", count: 2, source: "backfill" }],
  });
  assert.deepEqual(points[0], { date: "2022-07-10", count: 0, source: "backfill" });
});

test("chartPoints does not invent a date for legacy histories", () => {
  const points = chartPoints({ points: [{ date: "2024-01-02", count: 2, source: "backfill" }] });
  assert.deepEqual(points[0], { date: "2024-01-02", count: 2, source: "backfill" });
});
