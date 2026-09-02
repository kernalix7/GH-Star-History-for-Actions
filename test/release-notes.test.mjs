import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderReleaseNotes } from "../scripts/render-release-notes.mjs";

test("release notes include overview, main installation, and immutable pin", async () => {
  const template = await readFile(".github/release-notes-template.md", "utf8");
  const sha = "a".repeat(40);
  const notes = renderReleaseNotes(template, {
    RELEASE_TAG: "v1.2.3",
    RELEASE_SHA: sha,
    REPOSITORY: "owner/project",
    CHANGES: "- Improve the renderer (`abc1234`)",
  });

  assert.match(notes, /# GH Star History for Actions v1\.2\.3/);
  assert.match(notes, /reusable-star-history\.yml@main/);
  assert.match(notes, new RegExp(`reusable-star-history\\.yml@${sha}`));
  assert.match(notes, /## Highlights/);
  assert.match(notes, /## Data accuracy/);
  assert.match(notes, /## Security and licensing/);
  assert.match(notes, /## Source/);
  assert.match(notes, new RegExp(`tree/${sha}`));
  assert.match(notes, /Improve the renderer/);
  assert.doesNotMatch(notes, /\{\{[A-Z][A-Z_]*\}\}/);
});

test("release notes reject missing values", () => {
  assert.throws(
    () => renderReleaseNotes("{{RELEASE_TAG}}", { RELEASE_TAG: "v1.0.0" }),
    /RELEASE_SHA is required/,
  );
});
