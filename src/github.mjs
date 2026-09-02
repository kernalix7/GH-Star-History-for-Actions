const API_VERSION = "2026-03-10";
const USER_AGENT = "gh-star-history-for-actions";
const MAX_ATTEMPTS = 3;
const MAX_AVATAR_BYTES = 256 * 1024;
const AVATAR_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export class GitHubApiError extends Error {
  constructor(message, response, body) {
    super(message);
    this.name = "GitHubApiError";
    this.status = response?.status;
    this.permissions = response?.headers?.get("x-accepted-github-permissions") || "";
    this.body = body;
  }
}

function headers(token, accept = "application/vnd.github+json") {
  return {
    Accept: accept,
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": USER_AGENT,
  };
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function shouldRetry(response) {
  if (!response) return true;
  if (response.status === 429 || response.status >= 500) return true;
  return response.status === 403 && Boolean(response.headers.get("retry-after"));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(retryAfter * 1000, 30_000);
  }
  return 250 * (2 ** (attempt - 1));
}

async function request(url, token, accept) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(url, { headers: headers(token, accept) });
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(retryDelay(null, attempt));
      continue;
    }

    const body = await response.json().catch(() => null);

    if (response.ok) return { response, body };

    const detail = body?.message ? `: ${body.message}` : "";
    lastError = new GitHubApiError(
      `GitHub API request failed (${response.status})${detail}`,
      response,
      body,
    );

    if (!shouldRetry(response) || attempt === MAX_ATTEMPTS) throw lastError;
    await sleep(retryDelay(response, attempt));
  }

  throw lastError;
}

export async function getRepository(repository, token) {
  const url = `https://api.github.com/repos/${repository}`;
  const { body } = await request(url, token);
  return body;
}

export async function getCurrentStarCount(repository, token) {
  const repo = await getRepository(repository, token);
  return Number(repo.stargazers_count || 0);
}

function avatarUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "avatars.githubusercontent.com") {
    throw new Error("GitHub returned an unsupported owner avatar URL.");
  }
  url.searchParams.set("s", "44");
  return url;
}

export async function getOwnerAvatarDataUrl(value) {
  if (!value) return "";
  const url = avatarUrl(value);
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "image/png,image/jpeg,image/webp,image/gif",
          "User-Agent": USER_AGENT,
        },
        redirect: "error",
      });
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(retryDelay(null, attempt));
      continue;
    }

    if (!response.ok) {
      lastError = new Error(`GitHub avatar request failed (${response.status}).`);
      if (!shouldRetry(response) || attempt === MAX_ATTEMPTS) throw lastError;
      await sleep(retryDelay(response, attempt));
      continue;
    }

    const contentType = response.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
    if (!AVATAR_CONTENT_TYPES.has(contentType)) {
      throw new Error("GitHub returned an unsupported owner avatar image type.");
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) {
      throw new Error("GitHub owner avatar exceeds the safe size limit.");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_AVATAR_BYTES) {
      throw new Error("GitHub owner avatar exceeds the safe size limit.");
    }
    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  }

  throw lastError;
}

export async function getAllCurrentStargazerDates(repository, token, onProgress = () => {}) {
  const dates = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/repos/${repository}/stargazers?per_page=100&page=${page}`;
    const { response, body } = await request(
      url,
      token,
      "application/vnd.github.star+json",
    );

    if (!Array.isArray(body)) {
      throw new GitHubApiError("GitHub returned an unexpected stargazers response", response, body);
    }

    for (const item of body) {
      if (item?.starred_at) dates.push(item.starred_at);
    }

    onProgress({ page, fetched: dates.length });

    if (body.length < 100 || !response.headers.get("link")?.includes('rel="next"')) break;
    page += 1;
  }

  return dates;
}
