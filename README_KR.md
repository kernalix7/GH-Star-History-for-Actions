# GH Star History for Actions

[English](README.md) | [한국어](README_KR.md)

각 GitHub 저장소가 자신의 Star 이력을 직접 수집하고 보관하며 그래프로
생성하도록 해주는 독립형 GitHub Action입니다. 저장소마다 자동으로 발급되는
단기 `GITHUB_TOKEN`만 사용하므로 PAT와 외부 서버가 필요 없습니다.

## 실제 작동 예시

아래 그래프는 이 저장소의 실제 Star 이력을 Action이 직접 생성하고 다시
커밋한 결과입니다.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/main/.github/star-history/chart-dark.svg"
  >
  <img
    alt="GH Star History for Actions 실제 Star 이력"
    src="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/main/.github/star-history/chart.svg"
    width="900"
  >
</picture>

생성되는 파일은 다음과 같습니다.

- `.github/star-history/history.json`
- `.github/star-history/chart.svg`
- `.github/star-history/chart-dark.svg`

## 작동 방식

최초 실행에서는 **현재도 Star를 유지하고 있는 사용자**의 `starred_at` 날짜를
가져와 과거 곡선을 재구성합니다. 사용자명과 사용자 ID는 저장하지 않고 날짜별
누적 개수만 보관합니다.

그래프는 GitHub가 제공하는 저장소의 공식 `created_at` 날짜에서 0 Star로
시작합니다. 최초 실행 이후에는 실행할 때마다 GitHub가 제공하는 현재 총 Star
수를 기록하므로 Star 증가와 감소가 실제 관측값으로 보존됩니다.

다음 한계가 있습니다.

- 최초 실행 전에 Star를 취소한 기록은 복구할 수 없습니다.
- 최초 실행 이전 구간은 현재 남아 있는 Star를 기준으로 재구성한 값입니다.
- 최초 실행 이후 구간은 예약 실행 시점에 직접 관측한 값입니다.

## 저장소에 적용하기

먼저 이 Action 프로젝트를 GitHub에 올려야 합니다. 공개 저장소로 만드는 것이
공개·비공개 프로젝트 모두에서 사용하기 가장 간단합니다.

1. [`examples/star-history.yml`](examples/star-history.yml)을 적용할 저장소의
   `.github/workflows/star-history.yml`로 복사합니다.
2. 생성될 그래프를 대상 저장소의 README에 추가합니다. 다음 예약 실행에서 최초
   백필이 자동으로 생성되며, 즉시 만들고 싶을 때만 **Run workflow**를 누릅니다.

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

비공개 저장소에서는 인증된 GitHub 화면 안의 상대 경로 이미지는 보이지만,
외부 페이지에서 raw 이미지 주소를 표시하지 못할 수 있습니다.

Action 게시, 여러 저장소 적용, 선택적인 버전 고정, 보호 브랜치 처리 방법은
[설치 문서](docs/INSTALLATION.md)를 참고하세요.

## Git 이메일을 설정하는 이유

Git은 커밋을 만들 때 작성자 이름과 이메일을 요구합니다.

```sh
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```

이 값은 권한이나 인증을 제공하지 않습니다. 자동 커밋을 표준 GitHub Actions
봇이 만든 것으로 표시할 뿐이며, 실제 push 인증에는 저장소의 자동 토큰이
사용됩니다.

## 입력값

| 입력값 | 기본값 | 설명 |
| --- | --- | --- |
| `github-token` | 필수 | `${{ github.token }}`을 전달합니다. |
| `repository` | 실행 저장소 | `owner/name` 형식의 저장소입니다. |
| `output-directory` | `.github/star-history` | 생성 파일을 저장할 디렉터리입니다. |
| `title` | 저장소 이름 | 그래프 제목입니다. |
| `width` | `900` | SVG 너비이며 480–2400 범위로 제한됩니다. |
| `height` | `600` | SVG 높이이며 320–1600 범위로 제한됩니다. |
| `force-backfill` | `false` | 현재 stargazer 전체를 다시 수집합니다. |

## 권한과 보안

예제 workflow는 `contents: write`를 사용합니다. GitHub의 제한된 stargazers
API가 저장소의 쓰기 수준 협업 권한을 확인하며, 생성된 JSON과 SVG를 같은
저장소에 커밋해야 하기 때문입니다.

토큰은 해당 workflow 실행과 해당 저장소에만 제한되고 작업 종료 후 만료됩니다.
보안 수준을 더 높여야 하는 저장소에서는 Action을 검토한 커밋 SHA로 선택적으로
고정할 수 있습니다. 신뢰할 수 없는 PR 코드에서는 쓰기 권한 workflow를
실행하지 마세요.

활동이 60일 이상 없는 공개 저장소에서는 GitHub가 예약 workflow를 자동으로
중지할 수 있습니다. 이 경우 수동 실행 버튼은 계속 사용할 수 있습니다.

자세한 내용은 [SECURITY.md](SECURITY.md)를 참고하세요.

## 문서

- [설치 및 적용](docs/INSTALLATION.md)
- [데이터 형식과 정확도](docs/DATA_FORMAT.md)
- [문제 해결](docs/TROUBLESHOOTING.md)
- [보안 정책과 권한 구조](SECURITY.md)

## 개발

Node.js 20 이상이 필요하며 런타임 외부 패키지는 없습니다.

```sh
npm test
npm run check
```

## 라이선스와 출처

이 프로젝트는 MIT 라이선스로 배포됩니다. 손그림 그래프 스타일은 MIT
라이선스의 [Star History](https://github.com/star-history/star-history)에서
영감을 받았습니다. 자세한 고지는
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)에 있습니다.
