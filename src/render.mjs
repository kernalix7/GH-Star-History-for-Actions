import { chartPoints } from "./history.mjs";

const THEMES = {
  light: {
    background: "#ffffff",
    foreground: "#24292f",
    muted: "#57606a",
    grid: "#d0d7de",
    line: "#0969da",
    fill: "#ddf4ff",
    observed: "#1a7f37",
  },
  dark: {
    background: "#0d1117",
    foreground: "#f0f6fc",
    muted: "#8c959f",
    grid: "#30363d",
    line: "#58a6ff",
    fill: "#0c2d4a",
    observed: "#3fb950",
  },
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function niceMaximum(value) {
  if (value <= 5) return Math.max(5, value);
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

function formatCount(value) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}m`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}k`;
  return String(Math.round(value));
}

function formatDate(dateString, spanDays) {
  const date = new Date(`${dateString}T00:00:00Z`);
  if (spanDays > 90) return date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function simplify(points, maxPoints = 500) {
  if (points.length <= maxPoints) return points;
  const result = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let index = 0; index < maxPoints; index += 1) {
    result.push(points[Math.round(index * step)]);
  }
  return result;
}

function polylinePath(points) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

export function renderChart(history, options = {}) {
  const theme = THEMES[options.theme || "light"] || THEMES.light;
  const width = clamp(Number(options.width) || 900, 480, 2400);
  const height = clamp(Number(options.height) || 600, 320, 1600);
  const title = options.title || history.repository || "GitHub Star History";
  const rawPoints = chartPoints(history);
  const timestamps = rawPoints.map((point) => new Date(`${point.date}T00:00:00Z`).getTime());
  let minTime = Math.min(...timestamps);
  let maxTime = Math.max(...timestamps);
  if (minTime === maxTime) maxTime += 86_400_000;

  const maxCount = Math.max(0, ...rawPoints.map((point) => point.count));
  const yMaximum = niceMaximum(maxCount);
  const margin = { top: 82, right: 38, bottom: 76, left: 82 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const spanDays = Math.max(1, (maxTime - minTime) / 86_400_000);

  const x = (timestamp) => margin.left + ((timestamp - minTime) / (maxTime - minTime)) * plotWidth;
  const y = (count) => margin.top + plotHeight - (count / yMaximum) * plotHeight;
  const plotted = simplify(rawPoints).map((point) => ({
    ...point,
    x: x(new Date(`${point.date}T00:00:00Z`).getTime()),
    y: y(point.count),
  }));
  const linePath = polylinePath(plotted);
  const areaPath = `${linePath} L${plotted.at(-1).x.toFixed(2)},${(margin.top + plotHeight).toFixed(2)} L${plotted[0].x.toFixed(2)},${(margin.top + plotHeight).toFixed(2)} Z`;

  const xTicks = [];
  const yTicks = [];
  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const timestamp = minTime + (maxTime - minTime) * ratio;
    xTicks.push({ x: margin.left + plotWidth * ratio, label: formatDate(new Date(timestamp).toISOString().slice(0, 10), spanDays) });
    const value = yMaximum * ratio;
    yTicks.push({ y: margin.top + plotHeight - plotHeight * ratio, label: formatCount(value) });
  }

  const observedIndex = plotted.findIndex((point) => point.source === "observed");
  const observedPoint = observedIndex >= 0 ? plotted[observedIndex] : null;
  const current = rawPoints.at(-1)?.count || 0;
  const generated = history.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)} star history</title>
  <desc id="desc">${escapeXml(history.repository)} has ${current} stars as of ${generated}. Data before ${escapeXml(history.observedFrom || generated)} is reconstructed from currently active stargazers.</desc>
  <defs>
    <filter id="sketch" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.35" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.fill}" stop-opacity="0.75"/>
      <stop offset="1" stop-color="${theme.fill}" stop-opacity="0.08"/>
    </linearGradient>
    <style>
      text { font-family: ui-rounded, "Comic Sans MS", "Segoe Print", "Bradley Hand", sans-serif; }
      .axis { stroke: ${theme.foreground}; stroke-width: 2.4; stroke-linecap: round; }
      .grid { stroke: ${theme.grid}; stroke-width: 1; stroke-dasharray: 4 8; opacity: .65; }
      .tick { fill: ${theme.muted}; font-size: 15px; }
    </style>
  </defs>
  <rect width="100%" height="100%" rx="14" fill="${theme.background}"/>
  <text x="${margin.left}" y="39" fill="${theme.foreground}" font-size="25" font-weight="700">${escapeXml(title)}</text>
  <text x="${width - margin.right}" y="39" fill="${theme.foreground}" font-size="22" text-anchor="end">★ ${current.toLocaleString("en-US")}</text>
  <text x="${margin.left}" y="62" fill="${theme.muted}" font-size="13">observed since ${escapeXml(history.observedFrom || generated)}</text>
  ${yTicks.map((tick) => `<line class="grid" x1="${margin.left}" y1="${tick.y}" x2="${width - margin.right}" y2="${tick.y}"/><text class="tick" x="${margin.left - 13}" y="${tick.y + 5}" text-anchor="end">${tick.label}</text>`).join("\n  ")}
  ${xTicks.map((tick) => `<text class="tick" x="${tick.x}" y="${height - margin.bottom + 31}" text-anchor="middle">${tick.label}</text>`).join("\n  ")}
  <g filter="url(#sketch)">
    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"/>
    <line class="axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"/>
    <path d="${areaPath}" fill="url(#area)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="${theme.line}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
  ${observedPoint ? `<line x1="${observedPoint.x}" y1="${margin.top}" x2="${observedPoint.x}" y2="${height - margin.bottom}" stroke="${theme.observed}" stroke-width="1.5" stroke-dasharray="5 7" opacity=".8"/><text x="${Math.min(observedPoint.x + 8, width - 155)}" y="${margin.top + 18}" fill="${theme.observed}" font-size="12">daily observations begin</text>` : ""}
  <circle cx="${plotted.at(-1).x}" cy="${plotted.at(-1).y}" r="5" fill="${theme.background}" stroke="${theme.line}" stroke-width="3"/>
  <text x="${width - margin.right}" y="${height - 21}" fill="${theme.muted}" font-size="12" text-anchor="end">generated by GH Star History for Actions · inspired by star-history.com (MIT)</text>
</svg>`;
}
