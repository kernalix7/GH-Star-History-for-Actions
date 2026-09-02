import assert from "node:assert/strict";
import test from "node:test";
import { getAllCurrentStargazerDates, getCurrentStarCount, GitHubApiError } from "../src/github.mjs";

test("stargazer collection follows pagination without retaining users", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    starred_at: `2025-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    user: { login: `user-${index}` },
  }));

  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    if (new URL(url).searchParams.get("page") === "1") {
      return new Response(JSON.stringify(firstPage), {
        status: 200,
        headers: { link: '<https://api.github.com/repositories/1/stargazers?per_page=100&page=2>; rel="next"' },
      });
    }
    return new Response(JSON.stringify([{ starred_at: "2025-02-01T00:00:00Z", user: { login: "last-user" } }]), { status: 200 });
  };

  try {
    const dates = await getAllCurrentStargazerDates("owner/repo", "test-token");
    assert.equal(dates.length, 101);
    assert.equal(dates.at(-1), "2025-02-01T00:00:00Z");
    assert.equal(requests.length, 2);
    assert.equal(requests[0].options.headers.Authorization, "Bearer test-token");
    assert.equal(requests[0].options.headers.Accept, "application/vnd.github.star+json");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("current total comes from repository metadata", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ stargazers_count: 42 }), { status: 200 });
  try {
    assert.equal(await getCurrentStarCount("owner/repo", "test-token"), 42);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("transient GitHub failures are retried", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts < 3) {
      return new Response(JSON.stringify({ message: "Service unavailable" }), {
        status: 503,
        headers: { "retry-after": "0" },
      });
    }
    return new Response(JSON.stringify({ stargazers_count: 7 }), { status: 200 });
  };

  try {
    assert.equal(await getCurrentStarCount("owner/repo", "test-token"), 7);
    assert.equal(attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API errors expose GitHub's accepted permissions hint", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Resource not accessible by integration" }), {
    status: 403,
    headers: { "x-accepted-github-permissions": "metadata=read; contents=write" },
  });
  try {
    await assert.rejects(
      getAllCurrentStargazerDates("owner/repo", "test-token"),
      (error) => error instanceof GitHubApiError && error.permissions === "metadata=read; contents=write",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
