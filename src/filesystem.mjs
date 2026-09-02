import { lstat, mkdir, realpath } from "node:fs/promises";
import path from "node:path";

const OUTPUT_FILES = ["history.json", "chart.svg", "chart-dark.svg"];

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`)
    && relative !== ".."
    && !path.isAbsolute(relative));
}

async function requireRegularFileOrMissing(file) {
  try {
    const metadata = await lstat(file);
    if (!metadata.isFile()) {
      throw new Error(`Output path is not a regular file: ${file}`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
}

async function createDirectoryWithoutLinks(root, outputDirectory) {
  let current = root;
  const segments = outputDirectory.split(/[\\/]/).filter((segment) => segment && segment !== ".");

  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      const metadata = await lstat(current);
      if (!metadata.isDirectory()) {
        throw new Error(
          `output-directory contains a symbolic link or non-directory component: ${current}`,
        );
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await mkdir(current);
    }
  }

  return current;
}

export async function prepareOutputPaths(root, outputDirectory) {
  if (path.isAbsolute(outputDirectory) || outputDirectory.split(/[\\/]/).includes("..")) {
    throw new Error("output-directory must be a safe path relative to the checked-out repository.");
  }

  const resolvedRoot = await realpath(root);
  const targetDirectory = await createDirectoryWithoutLinks(resolvedRoot, outputDirectory);
  const resolvedTarget = await realpath(targetDirectory);

  if (!isInside(resolvedRoot, resolvedTarget)) {
    throw new Error("output-directory resolves outside the checked-out repository.");
  }

  const [historyPath, chartPath, chartDarkPath] = OUTPUT_FILES
    .map((name) => path.join(resolvedTarget, name));
  await Promise.all([
    requireRegularFileOrMissing(historyPath),
    requireRegularFileOrMissing(chartPath),
    requireRegularFileOrMissing(chartDarkPath),
  ]);

  return { targetDirectory: resolvedTarget, historyPath, chartPath, chartDarkPath };
}
