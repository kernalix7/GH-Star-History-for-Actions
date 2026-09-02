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

The default branch may be protected, the workflow token may be read-only, or an
organization policy may prevent direct pushes. Review the workflow permissions
and branch rules. Prefer a dedicated data branch or pull-request workflow over
weakening important protections.

## The first run says `No star history changes to commit`

Update to the latest workflow example. Older examples checked `git diff` before
staging generated files, which did not detect untracked files on the first run.
The current example runs `git add .github/star-history` before checking the
staged diff.

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

## The first run takes a long time

The Action downloads all currently active stargazer pages only for the initial
backfill. Large repositories require more API requests. Later runs normally use
one lightweight repository metadata request.
