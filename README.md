# GH Star History for Actions

[English](README.md) | [한국어](README_KR.md)

A self-contained GitHub Action that lets every repository collect, store, and
render its own star history. It uses the repository's short-lived automatic
`GITHUB_TOKEN`; no personal access token or hosted service is required.

## Live example

This chart is generated from this repository's own Star history and committed
back by the Action itself:

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/main/.github/star-history/chart-dark.svg"
  >
  <img
    alt="GH Star History for Actions live star history"
    src="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/main/.github/star-history/chart.svg"
    width="900"
  >
</picture>

The action generates:

- `.github/star-history/history.json`
- `.github/star-history/chart.svg`
- `.github/star-history/chart-dark.svg`

## How it works

On the first run, the action fetches every **currently active** stargazer and
uses each `starred_at` timestamp to reconstruct the historical curve. It stores
only daily aggregate counts, never GitHub usernames or user IDs.

The graph begins at the repository's official GitHub `created_at` date with
zero stars, rather than one day before the first currently active star.

From that run onward, it records the repository's authoritative total star count
once per run. This means:

- stars removed before the first run cannot be recovered;
- decreases and increases after the first run are preserved as observations;
- later runs use one lightweight repository request instead of downloading the
  full stargazer list again.

## Install in a repository

The action repository must first be pushed to GitHub. Making it public is the
simplest way to use it from both public and private repositories.

1. Copy [`examples/star-history.yml`](examples/star-history.yml) to
   `.github/workflows/star-history.yml` in the repository you want to track.
2. Commit this snippet to the tracked repository's README. The first scheduled
   run creates the initial backfill automatically. Use **Run workflow** only if
   you want it immediately.

```html
<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/OWNER/REPOSITORY/BRANCH/.github/star-history/chart-dark.svg"
  >
  <img
    alt="GitHub star history"
    src="https://raw.githubusercontent.com/OWNER/REPOSITORY/BRANCH/.github/star-history/chart.svg"
    width="900"
  >
</picture>
```

For a private repository, relative image paths work while browsing authenticated
repository content, but raw image embedding outside GitHub may not.

See the complete [installation guide](docs/INSTALLATION.md) for publishing the
action, installing it in multiple repositories, optional version pinning, and
handling protected branches.

## Why the workflow configures a Git email

Git requires an author name and email before creating a commit. These values do
not grant permissions or authenticate to GitHub:

```sh
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```

They only make generated commits appear as the standard GitHub Actions bot. The
actual push is authenticated by the caller repository's automatic token.

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `github-token` | required | Pass `${{ github.token }}`. |
| `repository` | caller repository | Repository in `owner/name` form. |
| `output-directory` | `.github/star-history` | Generated file directory. |
| `title` | `Star History` | Chart title. |
| `width` | `900` | SVG width, clamped to 480–2400. |
| `height` | `600` | SVG height, clamped to 320–1600. |
| `force-backfill` | `false` | Refetch all active stargazer timestamps. |

## Permissions and security

The example grants `contents: write` because GitHub currently uses repository
write-level collaboration to authorize the restricted stargazers endpoint and
because the workflow commits generated files. The token is created for the
workflow run, scoped to the caller repository, and expires after the job.

For higher-assurance repositories:

- optionally reference this action by a reviewed commit SHA instead of `main`;
- do not run the write-enabled job on untrusted pull-request code;
- keep the generated data aggregate-only;
- review changes before enabling this across important repositories.

Scheduled workflows in inactive public repositories may be disabled by GitHub
after 60 days. `workflow_dispatch` remains available for manual runs.

More details are available in [SECURITY.md](SECURITY.md).

## Documentation

- [Installation](docs/INSTALLATION.md)
- [Data format and accuracy](docs/DATA_FORMAT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Security policy and permission model](SECURITY.md)

## Development

Node.js 24 or newer is required. No package installation is needed at runtime;
the renderer's reviewed D3 build is pinned inside the action.

```sh
npm test
npm run check
```

## License and attribution

The project source is MIT licensed. Its chart renderer is adapted from
[Star History](https://github.com/star-history/star-history), also MIT licensed.
The pinned D3 build is BSD-3-Clause licensed.
The embedded Patrick Hand font subset is separately licensed under SIL OFL 1.1.
See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for attribution and terms.
