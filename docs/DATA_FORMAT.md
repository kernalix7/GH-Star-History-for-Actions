# Data format and accuracy

`history.json` contains aggregate repository-level data only. Stargazer usernames,
user IDs, profile URLs, and email addresses are never written to disk.

## Schema

```json
{
  "schemaVersion": 1,
  "repository": "owner/repository",
  "repositoryCreatedAt": "2024-01-01",
  "updatedAt": "2026-09-01T03:00:00.000Z",
  "observedFrom": "2026-09-01",
  "backfill": {
    "generatedAt": "2026-09-01T03:00:00.000Z",
    "basis": "currently-active-stargazers",
    "limitation": "Stars removed before the first collection cannot be recovered."
  },
  "points": [
    { "date": "2024-01-03", "count": 1, "source": "backfill" },
    { "date": "2026-09-01", "count": 125, "source": "observed" }
  ]
}
```

## Backfilled points

On the first run, GitHub returns the `starred_at` timestamp for every user who
currently stars the repository. The Action groups those timestamps by UTC date
and creates a cumulative curve. A zero point at `repositoryCreatedAt` anchors
the graph to the repository's official creation date.

This curve cannot contain users who removed their stars before the first run.
It is therefore a reconstruction of currently active stars, not a complete
historical event ledger.

## Observed points

Starting with the first run, the Action stores the authoritative total reported
by GitHub on each execution date. Observed values can increase or decrease and
take precedence over a backfilled value for the same UTC date.

Daily scheduling provides daily-resolution observations, but a delayed or
disabled workflow can leave gaps. The Action does not invent values for dates on
which it did not run.

## Force backfill

Set `force-backfill: true` for one run to reconstruct the backfilled portion from
the current active stargazer set again. Existing observed values are preserved.
Because users may have unstarred since the original backfill, this can alter the
estimated historical curve.
