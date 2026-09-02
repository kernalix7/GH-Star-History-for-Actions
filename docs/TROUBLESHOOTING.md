# Troubleshooting

## `403 Resource not accessible by integration`

Confirm that the target workflow contains:

```yaml
permissions:
  contents: write
```

The Action prints GitHub's `X-Accepted-GitHub-Permissions` hint when available.
Also confirm that Actions are allowed by the repository or organization policy.

## Push rejected

The workflow writes only to the dedicated `star-history` branch. Confirm that
the workflow token has `contents: write` and that an organization or repository
ruleset does not block creating or updating that branch. Default-branch
protection does not need to be weakened.

## The `star-history` branch was not created

Open the reusable job in the Actions log and check the first failed step. The
most common causes are a read-only workflow token, a branch ruleset, or a policy
that does not allow this public reusable workflow. The first successful run
creates the branch automatically.

## The branch contains unmanaged files

The workflow never takes over a pre-existing `star-history` branch that contains
unrelated files or an unknown `.gh-star-history` marker. Rename that existing
branch, or deliberately move its content elsewhere, before running this
workflow. Do not delete a branch until you have confirmed that it is unrelated.

The default branch also cannot be named `star-history`, because generated data
must remain separate from source code.

## The history belongs to a different repository

Schema 2 stores GitHub's stable repository ID. This error means a `history.json`
from another repository was copied into the generated branch. Restore the
correct file or remove the generated branch and start a fresh backfill. Normal
repository renames and transfers retain the same ID and continue automatically.

## A central update is not being used

Confirm that the caller ends in `@main`. A new cron or manual run resolves the
current central workflow. A failed-job-only rerun intentionally keeps the same
resolved workflow commit as its first attempt; start a new run to pick up the
latest commit. A caller pinned to a full SHA updates only after that SHA changes.

## The scheduled workflow stopped

GitHub may automatically disable scheduled workflows in public repositories
after 60 days without repository activity. Re-enable the workflow in the Actions
tab and run it manually once.

## Old stars appear to be missing

GitHub does not return users who removed their stars before the first collection.
That information cannot be recovered by this Action. See
[`DATA_FORMAT.md`](DATA_FORMAT.md) for the distinction between backfilled and
observed points.

## The chart does not appear in a private repository README

Raw private-repository files require authentication. Use a relative path while
viewing the README on GitHub, or publish the generated SVG through an access-
controlled site appropriate for the repository's privacy requirements.

## The chart URL still returns `404`

The raw URL works only after the first successful workflow run creates the
`star-history` branch. Use `OWNER/REPOSITORY/star-history/chart.svg`; do not add
the default branch or `.github/star-history` to the URL.

## The first run takes a long time

The Action downloads all currently active stargazer pages only for the initial
backfill. Large repositories require more API requests. Later runs normally use
one lightweight repository metadata request.
