export const SCHEMA_VERSION = 1;

export function utcDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date.toISOString().slice(0, 10);
}

export function createBackfill(stargazerDates) {
  const byDate = new Map();
  for (const value of stargazerDates) {
    const date = utcDate(value);
    byDate.set(date, (byDate.get(date) || 0) + 1);
  }

  let cumulative = 0;
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => {
      cumulative += amount;
      return { date, count: cumulative, source: "backfill" };
    });
}

function normalizePoints(points) {
  const byDate = new Map();
  for (const point of points || []) {
    if (!point || !Number.isFinite(Number(point.count))) continue;
    const normalized = {
      date: utcDate(point.date),
      count: Math.max(0, Math.trunc(Number(point.count))),
      source: point.source === "observed" ? "observed" : "backfill",
    };

    const existing = byDate.get(normalized.date);
    if (!existing || normalized.source === "observed") byDate.set(normalized.date, normalized);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function updateHistory({
  existing,
  repository,
  repositoryCreatedAt,
  currentCount,
  stargazerDates,
  now = new Date(),
}) {
  const today = utcDate(now);
  const shouldBackfill = !existing || Array.isArray(stargazerDates);
  const backfilled = shouldBackfill
    ? createBackfill(stargazerDates || [])
    : normalizePoints(existing.points);

  const existingObserved = normalizePoints(existing?.points).filter((point) => point.source === "observed");
  const points = normalizePoints([
    ...backfilled.filter((point) => point.source === "backfill"),
    ...existingObserved,
    { date: today, count: currentCount, source: "observed" },
  ]);

  const firstObserved = points.find((point) => point.source === "observed")?.date || today;

  return {
    schemaVersion: SCHEMA_VERSION,
    repository,
    repositoryCreatedAt: repositoryCreatedAt
      ? utcDate(repositoryCreatedAt)
      : existing?.repositoryCreatedAt || null,
    updatedAt: now.toISOString(),
    observedFrom: existing?.observedFrom || firstObserved,
    backfill: {
      generatedAt: shouldBackfill ? now.toISOString() : existing?.backfill?.generatedAt || null,
      basis: "currently-active-stargazers",
      limitation: "Stars removed before the first collection cannot be recovered.",
    },
    points,
  };
}

export function chartPoints(history) {
  const points = normalizePoints(history?.points);
  const createdAt = history?.repositoryCreatedAt ? utcDate(history.repositoryCreatedAt) : null;

  if (points.length === 0) {
    return [{ date: createdAt || utcDate(), count: 0, source: "observed" }];
  }

  const first = points[0];
  if (first.count === 0 || !createdAt || createdAt >= first.date) return points;

  return [{ date: createdAt, count: 0, source: "backfill" }, ...points];
}
