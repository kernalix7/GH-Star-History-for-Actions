import assert from "node:assert/strict";
import test from "node:test";
import {
  chartPoints,
  createBackfill,
  updateHistory,
  utcDate,
  validateHistory,
  validateRepositoryIdentity,
} from "../src/history.mjs";

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
    repositoryId: "12345",
    repositoryCreatedAt: "2023-06-15T12:00:00Z",
    currentCount: 3,
    stargazerDates: ["2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z", "2024-01-02T01:00:00Z"],
    now: new Date("2026-09-01T03:00:00Z"),
  });

  const updated = updateHistory({
    existing: initial,
    repository: "owner/repo",
    repositoryId: "12345",
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

test("history validation accepts schema 1 and requires identity in schema 2", () => {
  assert.doesNotThrow(() => validateHistory({
    schemaVersion: 1,
    repository: "owner/repo",
    points: [],
  }));

  assert.throws(
    () => validateHistory({ schemaVersion: 2, repository: "owner/repo", points: [] }),
    /repositoryId/,
  );
});

test("repository identity prevents data from another repository", () => {
  assert.doesNotThrow(() => validateRepositoryIdentity({ repositoryId: "12345" }, "12345"));
  assert.throws(
    () => validateRepositoryIdentity({ repositoryId: "99999" }, "12345"),
    /different GitHub repository/,
  );
});

test("repository renames preserve history when the repository ID matches", () => {
  const existing = updateHistory({
    existing: null,
    repository: "owner/old-name",
    repositoryId: "12345",
    repositoryCreatedAt: "2024-01-01T00:00:00Z",
    currentCount: 1,
    stargazerDates: ["2024-01-02T00:00:00Z"],
    now: new Date("2026-09-01T03:00:00Z"),
  });

  validateRepositoryIdentity(existing, "12345");
  const renamed = updateHistory({
    existing,
    repository: "owner/new-name",
    repositoryId: "12345",
    repositoryCreatedAt: "2024-01-01T00:00:00Z",
    currentCount: 2,
    now: new Date("2026-09-02T03:00:00Z"),
  });

  assert.equal(renamed.repository, "owner/new-name");
  assert.equal(renamed.repositoryId, "12345");
  assert.equal(renamed.points.at(-1).count, 2);
});

test("chartPoints starts at the repository creation date", () => {
  const points = chartPoints({
    repositoryCreatedAt: "2022-07-10",
    points: [{ date: "2024-01-02", count: 2, source: "backfill" }],
  });
  assert.deepEqual(points[0], { date: "2022-07-10", count: 0, source: "backfill" });
});

test("chartPoints keeps the creation-date anchor for a zero-star repository", () => {
  const points = chartPoints({
    repositoryCreatedAt: "2022-07-10",
    points: [{ date: "2024-01-02", count: 0, source: "observed" }],
  });
  assert.deepEqual(points, [
    { date: "2022-07-10", count: 0, source: "backfill" },
    { date: "2024-01-02", count: 0, source: "observed" },
  ]);
});

test("chartPoints does not invent a date for legacy histories", () => {
  const points = chartPoints({ points: [{ date: "2024-01-02", count: 2, source: "backfill" }] });
  assert.deepEqual(points[0], { date: "2024-01-02", count: 2, source: "backfill" });
});
