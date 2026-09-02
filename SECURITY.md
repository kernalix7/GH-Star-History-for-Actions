# Security policy

## Permission model

The recommended workflow grants only:

```yaml
permissions:
  contents: write
```

GitHub creates `GITHUB_TOKEN` for the caller repository and workflow run. The
token is not a personal access token, is not shared with other repositories, and
expires after the job. `contents: write` is needed both for GitHub's restricted
stargazers endpoint and for committing generated files.

The Action does not send the token or collected data to a third-party service.
It communicates with `api.github.com` and writes files inside the checked-out
repository.

## Safe usage

- For higher-assurance repositories, pin the Action to a reviewed full commit SHA.
- Do not run this write-enabled job against untrusted pull-request code.
- Keep repository and organization Action policies enabled.
- Review dependency and workflow changes before updating the pinned SHA.
- Avoid passing a PAT; the caller repository's `${{ github.token }}` is enough.

## Stored data

Only dates and aggregate star counts are stored. GitHub usernames and user IDs
received during initial pagination are discarded in memory and never committed.

## Reporting a vulnerability

Use the Action repository's **Security → Report a vulnerability** feature so a
report can be handled privately. Do not open a public issue containing an active
token, private repository data, or exploit details.
