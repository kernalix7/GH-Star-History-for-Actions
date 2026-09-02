# GH Star History for Actions {{RELEASE_TAG}}

GH Star History for Actions lets each repository collect, store, and render its
own GitHub Star history. It uses the caller repository's short-lived automatic
`GITHUB_TOKEN`, so no personal access token or hosted service is required.

## Highlights

- Reconstructs the initial curve from currently active stargazer timestamps.
- Records later Star increases and decreases as aggregate observations.
- Keeps generated data on a dedicated, managed `star-history` branch.
- Produces eight SVG variants: Date/Timeline, linear/logarithmic, and
  light/dark combinations.
- Embeds the repository owner or organization avatar directly in each SVG.
- Supports scheduled collection and an easy manual-run form.

## Install or update

Copy the release's
[`examples/star-history.yml`](https://github.com/{{REPOSITORY}}/blob/{{RELEASE_SHA}}/examples/star-history.yml)
to `.github/workflows/star-history.yml` in the repository to track. The
distributed template intentionally follows `@main` for automatic updates:

```yaml
uses: {{REPOSITORY}}/.github/workflows/reusable-star-history.yml@main
```

## Pin this exact release

Full commit SHA:

```text
{{RELEASE_SHA}}
```

Copy-ready immutable reference:

```yaml
uses: {{REPOSITORY}}/.github/workflows/reusable-star-history.yml@{{RELEASE_SHA}}
```

GitHub recommends a full commit SHA when an immutable Action or reusable
workflow reference is required. A pinned installation receives updates only
after its SHA is changed manually.

## Commits included in this release

{{CHANGES}}

## Data accuracy

The first backfill represents users who still have the repository starred when
collection begins. Stars removed before that first run cannot be recovered.
Afterward, each run stores GitHub's current authoritative total, preserving
observed increases and decreases without storing usernames or user IDs.

## Security and licensing

The workflow uses only the caller repository's automatic token and writes
generated files to its managed branch. Project code is MIT licensed. Adapted
and bundled components retain their original notices in
[`THIRD_PARTY_NOTICES.md`](https://github.com/{{REPOSITORY}}/blob/{{RELEASE_SHA}}/THIRD_PARTY_NOTICES.md).

## Source

- [Browse the source at this exact release](https://github.com/{{REPOSITORY}}/tree/{{RELEASE_SHA}})
- [View the commit history for {{RELEASE_TAG}}](https://github.com/{{REPOSITORY}}/commits/{{RELEASE_TAG}})
