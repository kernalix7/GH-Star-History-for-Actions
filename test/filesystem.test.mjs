import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareOutputPaths } from "../src/filesystem.mjs";

test("output paths stay inside the checked-out repository", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "star-history-files-"));
  const paths = await prepareOutputPaths(root, ".github/star-history");
  assert.equal(paths.historyPath, path.join(root, ".github/star-history/history.json"));
  assert.equal(
    paths.outputPaths["chart-timeline-log-dark.svg"],
    path.join(root, ".github/star-history/chart-timeline-log-dark.svg"),
  );

  await assert.rejects(
    prepareOutputPaths(root, "../outside"),
    /safe path relative/,
  );
});

test("output directory symlinks cannot escape the repository", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "star-history-root-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "star-history-outside-"));
  await mkdir(path.join(root, ".github"));
  await symlink(outside, path.join(root, ".github/star-history"));

  await assert.rejects(
    prepareOutputPaths(root, ".github/star-history"),
    /symbolic link/,
  );
});

test("existing output symlinks are rejected", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "star-history-output-"));
  const output = path.join(root, ".github/star-history");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(root, "target.json"), "{}\n");
  await symlink(path.join(root, "target.json"), path.join(output, "history.json"));

  await assert.rejects(
    prepareOutputPaths(root, ".github/star-history"),
    /not a regular file/,
  );
});

test("variant chart symlinks are also rejected", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "star-history-variant-"));
  const output = path.join(root, ".github/star-history");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(root, "target.svg"), "<svg/>\n");
  await symlink(
    path.join(root, "target.svg"),
    path.join(output, "chart-timeline-log-dark.svg"),
  );

  await assert.rejects(
    prepareOutputPaths(root, ".github/star-history"),
    /not a regular file/,
  );
});
