import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prepareOutputPaths } from "./filesystem.mjs";
import { getAllCurrentStargazerDates, getRepository, GitHubApiError } from "./github.mjs";
import {
  updateHistory,
  validateHistory,
  validateRepositoryIdentity,
} from "./history.mjs";
import { actionInput } from "./input.mjs";
import { renderChart } from "./render.mjs";

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
  const token = actionInput("github-token");
  const repository = validateRepository(actionInput("repository", process.env.GITHUB_REPOSITORY || ""));
  const outputDirectory = actionInput("output-directory", ".github/star-history");
  const width = Number(actionInput("width", "900"));
  const height = Number(actionInput("height", "600"));
  const title = actionInput("title", "Star History");
  const forceBackfill = actionInput("force-backfill", "false").toLowerCase() === "true";

  if (!token) throw new Error("github-token is required. Pass ${{ github.token }} from the caller workflow.");
  const root = process.env.GITHUB_WORKSPACE || process.cwd();
  const {
    historyPath,
    chartPath,
    chartDarkPath,
  } = await prepareOutputPaths(root, outputDirectory);

  const existing = await readExisting(historyPath);
  validateHistory(existing);

  const repositoryMetadata = await getRepository(repository, token);
  const repositoryId = String(repositoryMetadata.id || "");
  if (!/^\d+$/.test(repositoryId)) {
    throw new Error("GitHub returned an invalid repository ID.");
  }
  validateRepositoryIdentity(existing, repositoryId);
  if (existing?.repository && existing.repository !== repository) {
    if (!existing.repositoryId) {
      const previousRepository = await getRepository(existing.repository, token);
      validateRepositoryIdentity(
        { repositoryId: String(previousRepository.id || "") },
        repositoryId,
      );
    }
    warning(`Repository name changed from ${existing.repository} to ${repository}; preserving its history.`);
  }

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

  const currentCount = Number(repositoryMetadata.stargazers_count || 0);
  if (stargazerDates && stargazerDates.length !== currentCount) {
    warning(`Fetched ${stargazerDates.length} active stargazers, while GitHub reports ${currentCount} total stars. The observed total is authoritative.`);
  }

  const history = updateHistory({
    existing,
    repository,
    repositoryId,
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
