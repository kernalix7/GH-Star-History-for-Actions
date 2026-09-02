const API_VERSION = "2026-03-10";
const USER_AGENT = "gh-star-history-for-actions";

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

async function request(url, token, accept) {
  const response = await fetch(url, { headers: headers(token, accept) });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.message ? `: ${body.message}` : "";
    throw new GitHubApiError(`GitHub API request failed (${response.status})${detail}`, response, body);
  }

  return { response, body };
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
