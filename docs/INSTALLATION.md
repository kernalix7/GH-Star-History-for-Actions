# Installation and application guide

[한국어 안내](#한국어-설치-안내)

## Install it in a target repository

Copy [`examples/star-history.yml`](../examples/star-history.yml) unchanged to:

```text
.github/workflows/star-history.yml
```

Commit and push that one file to the target repository's default branch. No PAT,
repository name, branch name, package installation, or Git identity setting is
required in the target repository.

The first scheduled run creates a dedicated `star-history` branch. To run it
immediately, select:

```text
Actions → Update star history → Run workflow
```

The branch contains only:

```text
.gh-star-history
history.json
chart.svg
chart-dark.svg
```

`.gh-star-history` is an internal ownership marker. If an existing branch with
that name contains unrelated files or an unknown marker, the workflow fails
safely instead of changing it. The repository's default branch therefore cannot
itself be named `star-history`.

Later runs restore `history.json` from that branch, add the current observation,
and commit only when one of those files changed. Generated commits never touch
the default branch.

When upgrading from the older default-branch layout, the workflow searches the
current checkout and, if necessary, the repository's earlier commits for the
last legacy `history.json`. It then upgrades the data without discarding prior
observations.

## Embed the graph

Use raw GitHub URLs in a public README:

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

Replace only `OWNER` and `REPOSITORY`.

Raw private-repository files require authentication, so embedding them outside
authenticated GitHub pages may not work.

## What updates automatically

The small file in each target repository owns only its schedule and permission.
Its job calls:

```yaml
uses: kernalix7/GH-Star-History-for-Actions/.github/workflows/reusable-star-history.yml@main
```

Because it follows `@main`, each new cron or manual run resolves the current
reusable workflow. That workflow also checks out the Action implementation from
the exact same commit, so central publishing logic and renderer updates move
together.

The copied schedule file itself is not rewritten remotely. If its cron time,
permission, or caller syntax ever needs to change, update that small file in the
target repository. Scheduled workflows run only while that file exists on the
target repository's default branch.

## Version pinning

Following `main` is convenient, but a branch reference is mutable. For a
higher-assurance repository, replace `main` with a reviewed full commit SHA:

```yaml
uses: kernalix7/GH-Star-History-for-Actions/.github/workflows/reusable-star-history.yml@FULL_COMMIT_SHA
```

The reusable workflow uses its own resolved commit SHA when loading the Action,
so this pins both pieces together. Pinned repositories do not receive central
updates until you review and change the SHA.

## Branch protection

The workflow writes only to `star-history`, so normal protection on the default
branch does not need an exception. If a ruleset covers every branch, allow this
workflow's `GITHUB_TOKEN` to create and update `star-history`, or exclude that
generated branch from rules intended for source code.

Do not weaken important default-branch protections solely for a chart.

## Installing in many repositories

Each repository needs its own copied schedule file because one repository's
cron trigger cannot schedule workflows in other repositories. The same file can
be copied unchanged: repository identity, default branch, token, and generated
branch are resolved in the caller repository automatically.

---

## 한국어 설치 안내

### 대상 저장소에 설치

[`examples/star-history.yml`](../examples/star-history.yml)을 변경하지 않고 대상
저장소의 다음 경로로 복사합니다.

```text
.github/workflows/star-history.yml
```

이 파일 하나를 대상 저장소의 기본 브랜치에 커밋하고 push하면 됩니다. PAT,
저장소 이름, 브랜치 이름, 패키지 설치, Git 작성자 설정은 필요하지 않습니다.

최초 예약 실행에서는 전용 `star-history` 브랜치를 자동으로 만듭니다. 즉시
실행하려면 다음 메뉴를 선택합니다.

```text
Actions → Update star history → Run workflow
```

전용 브랜치에는 다음 파일만 들어갑니다.

```text
.gh-star-history
history.json
chart.svg
chart-dark.svg
```

`.gh-star-history`는 내부 소유권 표시 파일입니다. 같은 이름의 기존 브랜치에
관계없는 파일이나 알 수 없는 표시 파일이 있으면 workflow는 이를 변경하지 않고
안전하게 실패합니다. 따라서 저장소의 기본 브랜치 자체가 `star-history`여서는
안 됩니다.

이후 실행은 해당 브랜치의 `history.json`을 복원하고 현재 관측값을 추가한 뒤,
파일이 실제로 달라졌을 때만 커밋합니다. 생성 커밋은 기본 브랜치에 들어가지
않습니다.

기존 기본 브랜치 저장 방식에서 업그레이드할 때는 현재 checkout과 필요시 과거
커밋 전체에서 마지막 `history.json`을 찾아 이전 관측값을 버리지 않고 새 형식으로
올립니다.

### 그래프 넣기

공개 저장소 README에는 다음 주소를 사용합니다.

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

`OWNER`와 `REPOSITORY`만 바꾸면 됩니다. 비공개 저장소의 raw 파일은 인증이
필요하므로 외부 페이지에서는 이미지가 표시되지 않을 수 있습니다.

### 자동으로 갱신되는 범위

각 대상 저장소의 작은 파일은 예약 시간과 권한만 담당하며 다음 중앙 workflow를
호출합니다.

```yaml
uses: kernalix7/GH-Star-History-for-Actions/.github/workflows/reusable-star-history.yml@main
```

`@main`을 사용하면 새 cron 실행이나 수동 실행이 시작될 때마다 중앙 저장소의
최신 재사용 workflow를 불러옵니다. 재사용 workflow는 자신과 정확히 같은
커밋의 Action 구현을 불러오므로 저장 로직과 그래프 코드가 함께 갱신됩니다.

대상 저장소에 복사한 예약 파일 자체를 중앙에서 덮어쓰지는 않습니다. cron 시간,
권한, 호출 형식을 바꿔야 할 때만 대상 저장소의 작은 파일을 수정하면 됩니다.
예약 실행을 위해 이 파일은 대상 저장소의 기본 브랜치에 있어야 합니다.

### 버전 고정

`main`은 편리하지만 내용이 바뀔 수 있습니다. 보안 수준을 더 높이려면 검토한
전체 커밋 SHA로 고정합니다.

```yaml
uses: kernalix7/GH-Star-History-for-Actions/.github/workflows/reusable-star-history.yml@FULL_COMMIT_SHA
```

이 경우 재사용 workflow와 Action 구현이 함께 고정되며, SHA를 직접 바꾸기
전까지 중앙 업데이트가 자동 적용되지 않습니다.

### 브랜치 보호

workflow는 `star-history` 브랜치에만 씁니다. 따라서 일반적인 기본 브랜치 보호
규칙에는 예외가 필요 없습니다. 모든 브랜치에 적용되는 ruleset이 있다면 이
workflow의 `GITHUB_TOKEN`이 `star-history`를 만들고 갱신할 수 있게 허용하거나,
소스 코드용 규칙에서 생성 브랜치를 제외하세요.

그래프 하나를 위해 중요한 기본 브랜치 보호를 약화하지 마세요.

### 여러 저장소에 적용

저장소 하나의 cron이 다른 저장소의 workflow까지 예약할 수는 없으므로 각
저장소에 작은 예약 파일 하나가 필요합니다. 같은 파일을 그대로 복사해도 저장소
이름, 기본 브랜치, 토큰, 생성 브랜치를 대상 저장소 기준으로 자동 인식합니다.
