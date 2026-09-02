# Installation and application guide

[한국어 안내](#한국어-설치-안내)

## Publish this action

The project must be available on GitHub before another repository can use it.

1. Create a GitHub repository for this project and push the `main` branch.
2. Run the included CI workflow and confirm that it passes.

The included example follows `main`, so no release, tag, or commit SHA is
required for normal personal use:

```yaml
uses: kernalix7/GH-Star-History-for-Actions@main
```

For a higher-assurance repository, you can optionally replace `main` with a
reviewed full commit SHA:

```yaml
uses: OWNER/GH-Star-History-for-Actions@FULL_COMMIT_SHA
```

The action repository should normally be public. A private action repository
requires additional GitHub Actions access configuration and may not be available
across unrelated accounts or organizations.

## Install it in a target repository

Copy `examples/star-history.yml` from this project unchanged to:

```text
.github/workflows/star-history.yml
```

Commit and push the workflow to the target repository's default branch.

The first scheduled run creates the files automatically. To generate them
immediately instead of waiting for the next schedule, select:

```text
Actions → Update star history → Run workflow
```

The first run creates the backfill and these files:

```text
.github/star-history/history.json
.github/star-history/chart.svg
.github/star-history/chart-dark.svg
```

Later scheduled runs update the observed total only when the generated files
change.

## Embed the graph

Use raw GitHub URLs so both themes work reliably in a public README:

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

Replace `OWNER`, `REPOSITORY`, and `BRANCH`.

## Protected default branches

The example pushes generated files directly to the default branch. If branch
rules reject that push, choose one of these approaches:

- allow GitHub Actions to bypass the rule for this workflow;
- commit generated files to a dedicated branch and embed them from that branch;
- modify the workflow to open a pull request instead of pushing directly.

Do not weaken an important branch rule solely for a chart.

## Installing in many repositories

Each repository must contain its own scheduled workflow because GitHub does not
apply a cron trigger from one personal repository to every other repository.
The same workflow file can be copied unchanged to every repository. Repositories
following `main` automatically use the latest Action implementation on their next
run. Teams that choose SHA pinning must update it through normal reviewed pull
requests.

---

## 한국어 설치 안내

### Action 프로젝트 게시

다른 저장소에서 사용하려면 이 프로젝트를 먼저 GitHub에 올려야 합니다.

1. 이 프로젝트용 GitHub 저장소를 만들고 `main` 브랜치를 push합니다.
2. 포함된 CI workflow가 통과하는지 확인합니다.

기본 예제는 `main`을 사용하므로 개인 프로젝트에서는 릴리스, 태그, 커밋 SHA를
별도로 만들 필요가 없습니다.

```yaml
uses: kernalix7/GH-Star-History-for-Actions@main
```

보안 수준을 더 높여야 하는 저장소에서는 `main` 대신 검토한 전체 커밋 SHA로
선택적으로 고정할 수 있습니다.

```yaml
uses: OWNER/GH-Star-History-for-Actions@FULL_COMMIT_SHA
```

Action 저장소는 공개로 두는 것이 가장 간단합니다. 비공개 Action 저장소는 별도
Actions 접근 설정이 필요하며 계정이나 조직 경계를 넘어 사용하지 못할 수 있습니다.

### 대상 저장소에 설치

이 프로젝트의 `examples/star-history.yml`을 대상 저장소의 다음 경로에
복사합니다.

```text
.github/workflows/star-history.yml
```

예제 파일을 변경하지 않고 대상 저장소의 기본 브랜치에 커밋하고 push합니다.

다음 예약 실행에서 파일이 자동 생성됩니다. 기다리지 않고 즉시 만들고 싶다면
GitHub에서 다음 메뉴를 실행합니다.

```text
Actions → Update star history → Run workflow
```

최초 실행은 과거 구간을 재구성하고 다음 파일을 만듭니다.

```text
.github/star-history/history.json
.github/star-history/chart.svg
.github/star-history/chart-dark.svg
```

이후 예약 실행은 관측값이 바뀌었을 때 생성 파일을 갱신합니다.

### 보호 브랜치

예제는 생성 파일을 기본 브랜치에 직접 push합니다. 브랜치 규칙이 이를 거절한다면
전용 데이터 브랜치를 사용하거나, workflow가 pull request를 만들도록 변경하세요.
그래프 하나를 위해 중요한 브랜치 보호 규칙을 약화하는 것은 권장하지 않습니다.

### 여러 저장소에 적용

GitHub는 개인 저장소 하나의 cron을 다른 모든 저장소에 자동 적용하지 않습니다.
따라서 각 저장소에 작은 예약 workflow 파일이 하나씩 필요합니다. `main`을
사용하면 다음 실행부터 Action의 최신 구현이 자동 적용됩니다.
