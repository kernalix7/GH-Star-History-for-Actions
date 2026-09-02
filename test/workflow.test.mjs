import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const variantFiles = [
  "chart.svg",
  "chart-dark.svg",
  "chart-log.svg",
  "chart-log-dark.svg",
  "chart-timeline.svg",
  "chart-timeline-dark.svg",
  "chart-timeline-log.svg",
  "chart-timeline-log-dark.svg",
];

test("published chart variants stay aligned with output validation and documentation", async () => {
  const files = await Promise.all([
    readFile("src/filesystem.mjs", "utf8"),
    readFile(".github/workflows/reusable-star-history.yml", "utf8"),
    readFile("README.md", "utf8"),
    readFile("README_KR.md", "utf8"),
    readFile("docs/INSTALLATION.md", "utf8"),
  ]);

  for (const name of variantFiles) {
    for (const contents of files) {
      assert.match(contents, new RegExp(name.replaceAll(".", "\\.")));
    }
  }
});

test("managed branch format 1 is accepted and new branches publish format 2", async () => {
  const workflow = await readFile(
    ".github/workflows/reusable-star-history.yml",
    "utf8",
  );
  assert.match(workflow, /expected_marker_v1=.*format: 1/);
  assert.match(workflow, /expected_marker_v2=.*format: 2/);
  assert.match(workflow, /"format: 2"/);
});

test("manual runs expose safe presentation choices without reducing chart output", async () => {
  const [workflow, example] = await Promise.all([
    readFile(".github/workflows/reusable-star-history.yml", "utf8"),
    readFile("examples/star-history.yml", "utf8"),
  ]);

  for (const contents of [workflow, example]) {
    assert.match(contents, /size:[\s\S]+type: choice[\s\S]+900x600/);
    assert.match(contents, /legend-position:[\s\S]+type: choice/);
    assert.match(contents, /force-backfill:[\s\S]+type: boolean/);
  }

  assert.match(example, /size: \$\{\{ inputs\.size \|\| '900x600' \}\}/);
  assert.match(example, /force-backfill: \$\{\{ inputs\.force-backfill \|\| false \}\}/);
  for (const name of variantFiles) {
    assert.match(workflow, new RegExp(name.replaceAll(".", "\\.")));
  }
});

test("release notes expose an immutable SHA while the install template follows main", async () => {
  const [releaseWorkflow, releaseTemplate, example, releaseGuide] = await Promise.all([
    readFile(".github/workflows/release.yml", "utf8"),
    readFile(".github/release-notes-template.md", "utf8"),
    readFile("examples/star-history.yml", "utf8"),
    readFile("docs/RELEASING.md", "utf8"),
  ]);

  assert.match(releaseWorkflow, /git rev-parse "\$\{RELEASE_TAG\}\^\{commit\}"/);
  assert.match(releaseWorkflow, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(releaseWorkflow, /--verify-tag/);
  assert.match(releaseWorkflow, /--generate-notes/);
  assert.match(releaseWorkflow, /scripts\/render-release-notes\.mjs/);
  assert.match(releaseWorkflow, /git log --no-merges/);
  assert.match(releaseWorkflow, /chore: update star history/);
  assert.match(releaseTemplate, /reusable-star-history\.yml@main/);
  assert.match(releaseTemplate, /reusable-star-history\.yml@\{\{RELEASE_SHA\}\}/);
  assert.match(example, /reusable-star-history\.yml@main/);
  assert.doesNotMatch(
    example,
    /reusable-star-history\.yml@[0-9a-f]{40}/,
  );
  assert.match(releaseGuide, /examples\/star-history\.yml/);
  assert.match(releaseGuide, /intentionally[\s\S]+@main/);
});
