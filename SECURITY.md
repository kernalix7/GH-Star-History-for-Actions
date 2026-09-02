# Security policy

## Permission model

The recommended workflow grants only:

```yaml
permissions:
  contents: write
```

GitHub creates `GITHUB_TOKEN` for the caller repository and workflow run. The
token is not a personal access token and expires after the job. Its permissions
apply to the caller repository. `contents: write` is needed both for GitHub's
restricted stargazers endpoint and for committing generated files to that
repository's dedicated `star-history` branch.

The Action does not send the token or collected data to a third-party service.
It communicates with GitHub, loads the reusable workflow and Action code from
this repository, and writes aggregate output to the caller repository.

The repository owner or organization avatar is downloaded without credentials
from `avatars.githubusercontent.com`, restricted to common raster image types
and a 256 KiB maximum, and embedded as a data URL. Avatar URLs from other hosts
are rejected. The generated SVG therefore has no external image dependency.

## Safe usage

- A caller using `@main` automatically trusts future commits to this repository.
- For higher-assurance repositories, pin the reusable workflow call to a
  reviewed full commit SHA. The Action implementation is loaded from that same
  resolved commit.
- Do not run this write-enabled job against untrusted pull-request code.
- Keep repository and organization Action policies enabled.
- Review dependency and workflow changes before updating the pinned SHA.
- Avoid passing a PAT; the caller repository's `${{ github.token }}` is enough.
- Keep normal default-branch protection enabled. Generated commits go only to
  `star-history` unless you modify the workflow.
- The generated branch carries a management marker and accepts only the marker,
  JSON history, and the documented SVG variants. An unrelated branch with the
  same name is rejected rather than overwritten. Symbolic links and other
  non-regular Git entries are also rejected.
- Schema 2 records GitHub's stable numeric repository ID. A history file from a
  different repository is rejected, while repository renames and transfers keep
  their existing observations.
- Output-directory components and existing output files must be real directories
  and regular files inside the checked-out repository; symlink escapes are not
  followed.

## Stored data

Only dates and aggregate star counts are stored in `history.json`. GitHub
usernames and user IDs received during initial pagination are discarded in
memory and never committed. Each generated SVG also contains the repository
owner or organization avatar that GitHub already exposes publicly; no profile
URL or repository token is embedded.

## Reporting a vulnerability

Use the Action repository's **Security → Report a vulnerability** feature so a
report can be handled privately. Do not open a public issue containing an active
token, private repository data, or exploit details.
