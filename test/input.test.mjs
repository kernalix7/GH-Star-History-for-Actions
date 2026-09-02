import assert from "node:assert/strict";
import test from "node:test";
import { actionInput } from "../src/input.mjs";

test("reads hyphenated GitHub Action input environment keys", () => {
  const key = "INPUT_GITHUB-TOKEN";
  const previous = process.env[key];
  process.env[key] = "automatic-token";

  try {
    assert.equal(actionInput("github-token"), "automatic-token");
  } finally {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
});

test("supports underscore keys for local compatibility", () => {
  const key = "INPUT_OUTPUT_DIRECTORY";
  const previous = process.env[key];
  process.env[key] = "custom-output";

  try {
    assert.equal(actionInput("output-directory"), "custom-output");
  } finally {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
});

test("returns the fallback for an empty input", () => {
  assert.equal(actionInput("missing-value", "fallback"), "fallback");
});
