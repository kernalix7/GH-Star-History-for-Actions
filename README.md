# GH Star History for Actions

[English](README.md) | [한국어](README_KR.md)

A self-contained GitHub Action that lets every repository collect, store, and
render its own star history. It uses the repository's short-lived automatic
`GITHUB_TOKEN`; no personal access token or hosted service is required.

> [!IMPORTANT]
> This is an independent project adapted from the open-source Star History
> renderer. It is not affiliated with, endorsed by, or an official distribution
> of the Star History project. References to Star History identify the upstream
> project for attribution only.

## Live example

This chart is generated from this repository's own Star history and committed
by the Action to its dedicated `star-history` branch:

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/star-history/chart-dark.svg"
  >
  <img
    alt="GH Star History for Actions live star history"
    src="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/star-history/chart.svg"
    width="900"
  >
</picture>

The first run creates a separate `star-history` branch containing:

- `.gh-star-history` (internal ownership marker)
- `history.json`
- eight SVG charts covering Date/Timeline, linear/log scale, and light/dark
  theme combinations

Generated commits never touch the default branch.
If a branch with that name already contains unrelated files, the workflow stops
instead of overwriting it.

## Chart variants

GitHub README images are static, so controls inside an embedded SVG cannot
reliably switch its axis mode or scale. The Action generates every useful
combination and you select one by changing only the filename in the README URL.

| View | Light | Dark |
| --- | --- | --- |
| Date, linear (default) | `chart.svg` | `chart-dark.svg` |
| Date, logarithmic | `chart-log.svg` | `chart-log-dark.svg` |
| Timeline, linear | `chart-timeline.svg` | `chart-timeline-dark.svg` |
| Timeline, logarithmic | `chart-timeline-log.svg` | `chart-timeline-log-dark.svg` |

Timeline measures elapsed time from the repository creation date. Logarithmic
charts use a symmetric logarithmic scale so the real zero-star starting point
remains visible. Every chart embeds the repository owner or organization avatar
returned by GitHub. GitHub repositories do not have a separate repository icon.

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
    srcset="https://raw.githubusercontent.com/OWNER/REPOSITORY/star-history/chart-dark.svg"
  >
  <img
    alt="GitHub star history"
    src="https://raw.githubusercontent.com/OWNER/REPOSITORY/star-history/chart.svg"
    width="900"
  >
</picture>
```

For a private repository, relative image paths work while browsing authenticated
repository content, but raw image embedding outside GitHub may not.

See the complete [installation guide](docs/INSTALLATION.md) for publishing the
action, installing it in multiple repositories, optional version pinning, and
handling protected branches.

The copied file contains only the schedule, write permission, and a call to the
centrally maintained reusable workflow. With `@main`, every scheduled run uses
the latest workflow and Action implementation from this repository. The schedule
file itself must remain on each target repository's default branch.

Replace `@main` in that file with a reviewed full commit SHA to pin the
installation. A pinned repository keeps using that exact reusable workflow and
Action implementation even when this project changes; it receives updates only
after you manually replace the SHA.

Manual runs provide dropdowns for chart size and legend position, plus a
checkbox for rebuilding the backfill. The optional title remains a text field.
These controls change the presentation or collection behavior of that run; all
eight Date/Timeline, linear/log, and light/dark chart variants are still always
generated.

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
| `output-directory` | `.github/star-history` | Working directory used by the Action. |
| `title` | `Star History` | Chart title. |
| `width` | `900` | SVG width, clamped to 480–2400. |
| `height` | `600` | SVG height, clamped to 320–1600. |
| `legend-position` | `top-left` | `top-left` or `bottom-right`, applied to every chart. |
| `force-backfill` | `false` | Rebuild past history from current stargazers; normally leave it off. |

## Permissions and security

The example grants `contents: write` because GitHub currently uses repository
write-level collaboration to authorize the restricted stargazers endpoint and
because the workflow commits generated files to the dedicated branch. The token
is created for the workflow run, scoped to the caller repository, and expires
after the job.

The public owner or organization avatar is downloaded only from GitHub's avatar
host and embedded directly into each SVG. The repository token is not sent with
that image request, and no external image URL remains in the generated chart.

For higher-assurance repositories:

- optionally pin the reusable workflow call to a reviewed full commit SHA
  instead of `main`;
- do not run the write-enabled job on untrusted pull-request code;
- keep the generated data aggregate-only;
- review changes before enabling this across important repositories.

Scheduled workflows in inactive public repositories may be disabled by GitHub
after 60 days. `workflow_dispatch` remains available for manual runs.

More details are available in [SECURITY.md](SECURITY.md).

## Documentation

- [Installation](docs/INSTALLATION.md)
- [Release guide](docs/RELEASING.md)
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

Except for the third-party components listed below, the original project code is
licensed under the top-level [MIT License](LICENSE), copyright Kim DaeHyun.

- The chart renderer is adapted from
  [Star History](https://github.com/star-history/star-history), under the MIT
  License.
- The pinned D3 6.7.0 build is under the BSD 3-Clause License.
- The embedded Patrick Hand font subset is under the SIL Open Font License 1.1.

Third-party components retain their respective licenses; the top-level MIT
License does not replace them. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the copyright notices,
license texts, attribution, and non-affiliation statement.
