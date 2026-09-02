export const SCHEMA_VERSION = 2;

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

export function validateHistory(history) {
  if (history === null) return;
  if (!history || typeof history !== "object" || Array.isArray(history)) {
    throw new Error("Existing history.json must contain a JSON object.");
  }

  const schemaVersion = Number(history.schemaVersion);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new Error("Existing history.json has an invalid schemaVersion.");
  }
  if (schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `Existing history.json uses schema version ${schemaVersion}, but this Action supports up to ${SCHEMA_VERSION}.`,
    );
  }
  if (typeof history.repository !== "string" || !history.repository.includes("/")) {
    throw new Error("Existing history.json has an invalid repository value.");
  }
  if (!Array.isArray(history.points)) {
    throw new Error("Existing history.json must contain a points array.");
  }
  if (schemaVersion >= 2 && !/^\d+$/.test(String(history.repositoryId || ""))) {
    throw new Error("Existing history.json has an invalid repositoryId.");
  }
}

export function validateRepositoryIdentity(history, repositoryId) {
  if (!history?.repositoryId) return;
  if (String(history.repositoryId) !== String(repositoryId)) {
    throw new Error(
      "Existing history.json belongs to a different GitHub repository.",
    );
  }
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
  repositoryId,
  repositoryCreatedAt,
  currentCount,
  stargazerDates,
  now = new Date(),
}) {
  if (!/^\d+$/.test(String(repositoryId || ""))) {
    throw new Error("repositoryId must be a numeric GitHub repository ID.");
  }

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
    repositoryId: String(repositoryId),
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
  if (!createdAt || createdAt >= first.date) return points;

  return [{ date: createdAt, count: 0, source: "backfill" }, ...points];
}
