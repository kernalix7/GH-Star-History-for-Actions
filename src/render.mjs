import { createRequire } from "node:module";
import { chartPoints } from "./history.mjs";
import { handFontUrl } from "./hand-font.mjs";

const require = createRequire(import.meta.url);
const d3 = require("./vendor/d3-6.7.0.min.cjs");

const THEMES = {
  light: {
    background: "#ffffff",
    foreground: "#000000",
    line: "#dd4528",
  },
  dark: {
    background: "#0d1117",
    foreground: "#ffffff",
    line: "#ff6b6b",
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

function numberFormatUnit(value) {
  if (value >= 1_000_000) return 1_000_000;
  if (value >= 300) return 1_000;
  return 1;
}

function formatNumber(value, unit = 1) {
  if (unit === 1) return `${value}`;
  if (unit === 1_000_000) {
    return value >= 1_000_000 && value % 1_000_000 === 0
      ? `${value / 1_000_000}M`
      : `${(value / 1_000_000).toFixed(1)}M`;
  }
  return value >= 1_000 && value % 1_000 === 0
    ? `${value / 1_000}K`
    : `${(value / 1_000).toFixed(1)}K`;
}

function yLabelOffset(maximum) {
  if (maximum > 100_000) return 2;
  if (maximum > 10_000) return 8;
  if (maximum > 1_000) return 12;
  if (maximum > 100) return 20;
  return 24;
}

export function renderChart(history, options = {}) {
  const theme = THEMES[options.theme || "light"] || THEMES.light;
  const width = clamp(Number(options.width) || 900, 480, 2400);
  const height = clamp(Number(options.height) || 600, 320, 1600);
  const title = options.title || "Star History";
  const repository = history.repository || "GitHub repository";
  const rawPoints = chartPoints(history);
  const data = rawPoints.map((point) => ({
    ...point,
    time: new Date(`${point.date}T00:00:00Z`),
  }));

  const margin = { top: 60, right: 30, bottom: 50, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const minTime = Math.min(...data.map((point) => Number(point.time)));
  const maxTime = Math.max(...data.map((point) => Number(point.time)));
  const maxCount = Math.max(...data.map((point) => point.count));

  const xScale = d3.scaleTime().domain([minTime, maxTime]).range([0, plotWidth]);
  const yScale = d3.scaleLinear().domain([0, maxCount]).range([plotHeight, 0]);
  const xTickFormat = xScale.tickFormat(5);
  const xTicks = xScale.ticks(5).map((value) => ({
    position: Number(xScale(value)) || 0,
    label: xTickFormat(value),
  }));

  let yUnit;
  const yTicks = yScale.ticks(5).map((value) => {
    let label = "";
    if (value !== 0) {
      if (!yUnit) yUnit = numberFormatUnit(value);
      label = formatNumber(value, yUnit);
    }
    return {
      position: Number(yScale(value)) || 0,
      label,
    };
  });

  const linePath = d3
    .line()
    .x((point) => Number(xScale(point.time)) || 0)
    .y((point) => Number(yScale(point.count)) || 0)
    .curve(d3.curveMonotoneX)(data);

  const legendWidth = repository.length * 7.5 + 29;
  const current = rawPoints.at(-1)?.count || 0;
  const generated = history.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const labelOffset = yLabelOffset(maxCount);
  const yLabelX = Math.floor(50 - height / 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="title desc" style="stroke-width:3; font-family:'GH Star Hand'; background:${theme.background}">
  <title id="title">${escapeXml(title)} — ${escapeXml(repository)}</title>
  <desc id="desc">${escapeXml(repository)} has ${current} stars as of ${generated}. Data before ${escapeXml(history.observedFrom || generated)} is reconstructed from currently active stargazers.</desc>
  <defs>
    <style>
      @font-face { font-family: "GH Star Hand"; src: url("${handFontUrl}") format("woff2"); }
      text { font-family: "GH Star Hand", "Comic Sans MS", "Segoe Print", cursive; }
      .axis-tick { font-family: "GH Star Hand", "Comic Sans MS", "Segoe Print", cursive; font-size: 16px; fill: ${theme.foreground}; }
    </style>
    <filter id="xkcdify" filterUnits="userSpaceOnUse" x="-5" y="-5" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${theme.background}"/>
  <text x="50%" y="30" fill="${theme.foreground}" font-size="20px" font-weight="bold" text-anchor="middle">${escapeXml(title)}</text>
  <text x="50%" y="${height - 10}" fill="${theme.foreground}" font-size="17px" text-anchor="middle">Date</text>
  <text x="${yLabelX}" y="${labelOffset}" dy=".75em" fill="${theme.foreground}" font-size="17px" text-anchor="end" transform="rotate(-90)">GitHub Stars</text>
  <g transform="translate(${margin.left},${margin.top})" pointer-events="all">
    <text transform="translate(${plotWidth - 50},${plotHeight + 40})" fill="#666666" font-size="16px" text-anchor="middle">GH Star History</text>
    <g class="xaxis" transform="translate(0,${plotHeight})" fill="none" font-size="10" text-anchor="middle">
      <path class="domain" stroke="${theme.foreground}" d="M0.5,0.5H${plotWidth + 0.5}" filter="url(#xkcdify)"/>
      ${xTicks.map((tick) => `<g class="tick" opacity="1" transform="translate(${tick.position + 0.5},0)"><line stroke="${theme.foreground}" y2="0"/><text class="axis-tick" y="6" dy="0.71em">${escapeXml(tick.label)}</text></g>`).join("\n      ")}
    </g>
    <g class="yaxis" fill="none" font-size="10" text-anchor="end">
      <path class="domain" stroke="${theme.foreground}" d="M-1,${plotHeight + 0.5}H0.5V0.5H-1" filter="url(#xkcdify)"/>
      ${yTicks.map((tick) => `<g class="tick" opacity="1" transform="translate(0,${tick.position + 0.5})"><line stroke="${theme.foreground}" x2="-1"/><text class="axis-tick" x="-7" dy="0.32em">${tick.label}</text></g>`).join("\n      ")}
    </g>
    <path class="xkcd-chart-xyline" d="${linePath || ""}" fill="none" stroke="${theme.line}" filter="url(#xkcdify)"/>
    <g class="legend">
      <rect x="8" y="5" width="${legendWidth}" height="32" rx="5" ry="5" fill="${theme.background}" fill-opacity="0.85" stroke="${theme.foreground}" stroke-width="2" filter="url(#xkcdify)"/>
      <rect x="15" y="17" width="8" height="8" rx="2" ry="2" fill="${theme.line}" filter="url(#xkcdify)"/>
      <text x="29" y="25" fill="${theme.foreground}" font-size="15px">${escapeXml(repository)}</text>
    </g>
  </g>
</svg>`;
}
