import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllCurrentStargazerDates, getRepository, GitHubApiError } from "./github.mjs";
import { updateHistory } from "./history.mjs";
import { renderChart } from "./render.mjs";

function input(name, fallback = "") {
  return process.env[`INPUT_${name.toUpperCase().replaceAll("-", "_")}`] || fallback;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function notice(message) {
  process.stdout.write(`::notice::${message}\n`);
}

function warning(message) {
  process.stdout.write(`::warning::${message}\n`);
}

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  return appendFile(outputFile, `${name}=${value}\n`, "utf8");
}

async function readExisting(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw new Error(`Could not read ${file}: ${error.message}`);
  }
}

function validateRepository(value) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`Invalid repository '${value}'. Expected owner/name.`);
  }
  return value;
}

async function run() {
  const token = input("github-token");
  const repository = validateRepository(input("repository", process.env.GITHUB_REPOSITORY || ""));
  const outputDirectory = input("output-directory", ".github/star-history");
  const width = Number(input("width", "900"));
  const height = Number(input("height", "600"));
  const title = input("title", repository);
  const forceBackfill = input("force-backfill", "false").toLowerCase() === "true";

  if (!token) throw new Error("github-token is required. Pass ${{ github.token }} from the caller workflow.");
  if (path.isAbsolute(outputDirectory) || outputDirectory.split(/[\\/]/).includes("..")) {
    throw new Error("output-directory must be a safe path relative to the checked-out repository.");
  }

  const root = process.env.GITHUB_WORKSPACE || process.cwd();
  const targetDirectory = path.join(root, outputDirectory);
  const historyPath = path.join(targetDirectory, "history.json");
  const chartPath = path.join(targetDirectory, "chart.svg");
  const chartDarkPath = path.join(targetDirectory, "chart-dark.svg");
  await mkdir(targetDirectory, { recursive: true });

  const existing = await readExisting(historyPath);
  const needsBackfill = forceBackfill || !existing;
  let stargazerDates;

  if (needsBackfill) {
    log(`Backfilling ${repository} from current stargazers...`);
    try {
      stargazerDates = await getAllCurrentStargazerDates(repository, token, ({ page, fetched }) => {
        log(`Fetched page ${page} (${fetched} stargazers)`);
      });
    } catch (error) {
      if (error instanceof GitHubApiError && error.permissions) {
        warning(`GitHub reports that this endpoint accepts: ${error.permissions}`);
      }
      throw error;
    }
  }

  const repositoryMetadata = await getRepository(repository, token);
  const currentCount = Number(repositoryMetadata.stargazers_count || 0);
  if (stargazerDates && stargazerDates.length !== currentCount) {
    warning(`Fetched ${stargazerDates.length} active stargazers, while GitHub reports ${currentCount} total stars. The observed total is authoritative.`);
  }

  const history = updateHistory({
    existing,
    repository,
    repositoryCreatedAt: repositoryMetadata.created_at,
    currentCount,
    stargazerDates,
  });
  const json = `${JSON.stringify(history, null, 2)}\n`;
  const light = renderChart(history, { title, width, height, theme: "light" });
  const dark = renderChart(history, { title, width, height, theme: "dark" });

  await Promise.all([
    writeFile(historyPath, json, "utf8"),
    writeFile(chartPath, light, "utf8"),
    writeFile(chartDarkPath, dark, "utf8"),
  ]);

  await Promise.all([
    setOutput("history-path", path.relative(root, historyPath)),
    setOutput("chart-path", path.relative(root, chartPath)),
    setOutput("chart-dark-path", path.relative(root, chartDarkPath)),
    setOutput("star-count", String(currentCount)),
  ]);

  notice(`Updated ${repository}: ${currentCount} stars`);
}

run().catch((error) => {
  const detail = error?.status ? ` [HTTP ${error.status}]` : "";
  process.stderr.write(`::error::${error.message}${detail}\n`);
  process.exitCode = 1;
});
