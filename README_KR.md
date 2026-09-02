# GH Star History for Actions

[English](README.md) | [한국어](README_KR.md)

각 GitHub 저장소가 자신의 Star 이력을 직접 수집하고 보관하며 그래프로
생성하도록 해주는 독립형 GitHub Action입니다. 저장소마다 자동으로 발급되는
단기 `GITHUB_TOKEN`만 사용하므로 PAT와 외부 서버가 필요 없습니다.

> [!IMPORTANT]
> 이 프로젝트는 오픈소스 Star History 렌더러를 바탕으로 만든 독립
> 프로젝트입니다. Star History 프로젝트와 제휴하거나 그 승인을 받은 공식
> 배포판이 아닙니다. Star History에 대한 언급은 원본 프로젝트의 출처를 밝히기
> 위한 용도로만 사용합니다.

## 실제 작동 예시

아래 그래프는 이 저장소의 실제 Star 이력을 Action이 직접 생성해 전용
`star-history` 브랜치에 커밋한 결과입니다.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/star-history/chart-dark.svg"
  >
  <img
    alt="GH Star History for Actions 실제 Star 이력"
    src="https://raw.githubusercontent.com/kernalix7/GH-Star-History-for-Actions/star-history/chart.svg"
    width="900"
  >
</picture>

최초 실행에서는 별도의 `star-history` 브랜치를 만들고 다음 파일을 저장합니다.

- `.gh-star-history` (내부 소유권 표시 파일)
- `history.json`
- Date/Timeline, 선형/로그 축, 밝은/어두운 테마 조합의 SVG 그래프 8개

생성 커밋은 기본 브랜치를 건드리지 않습니다.
같은 이름의 기존 브랜치에 다른 파일이 있으면 덮어쓰지 않고 안전하게 중단합니다.

## 그래프 종류

GitHub README에 넣은 이미지는 정적이므로 SVG 내부 버튼으로 축 종류를 안전하게
전환할 수 없습니다. Action이 유용한 조합을 모두 만들며, README URL의 파일명만
바꿔 원하는 그래프를 선택할 수 있습니다.

| 보기 | 밝은 테마 | 어두운 테마 |
| --- | --- | --- |
| Date, 선형(기본값) | `chart.svg` | `chart-dark.svg` |
| Date, 로그 | `chart-log.svg` | `chart-log-dark.svg` |
| Timeline, 선형 | `chart-timeline.svg` | `chart-timeline-dark.svg` |
| Timeline, 로그 | `chart-timeline-log.svg` | `chart-timeline-log-dark.svg` |

Timeline은 저장소 생성일부터 흐른 시간을 표시합니다. 로그 그래프는 실제 0 Star
시작점을 유지하는 대칭 로그 축을 사용합니다. 모든 그래프에는 GitHub가 반환한
저장소 소유자 또는 조직 아바타를 내장합니다. GitHub 저장소 자체에는 별도의
저장소 아이콘 항목이 없습니다.

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
    srcset="https://raw.githubusercontent.com/OWNER/REPOSITORY/star-history/chart-dark.svg"
  >
  <img
    alt="GitHub star history"
    src="https://raw.githubusercontent.com/OWNER/REPOSITORY/star-history/chart.svg"
    width="900"
  >
</picture>
```

비공개 저장소에서는 인증된 GitHub 화면 안의 상대 경로 이미지는 보이지만,
외부 페이지에서 raw 이미지 주소를 표시하지 못할 수 있습니다.

Action 게시, 여러 저장소 적용, 선택적인 버전 고정, 보호 브랜치 처리 방법은
[설치 문서](docs/INSTALLATION.md)를 참고하세요.

복사하는 파일에는 예약 시간, 쓰기 권한, 중앙 재사용 workflow 호출만 들어
있습니다. `@main`을 사용하면 예약 실행마다 이 저장소의 최신 workflow와 Action
구현을 자동으로 사용합니다. 예약 파일 자체는 각 대상 저장소의 기본 브랜치에
계속 있어야 합니다.

복사한 파일의 `@main`을 검토한 전체 커밋 SHA로 바꾸면 버전이 고정됩니다. 이후
이 프로젝트가 업데이트되더라도 해당 저장소는 고정된 재사용 workflow와 Action
구현을 계속 사용하며, SHA를 직접 교체할 때만 새 버전이 적용됩니다.

수동 실행 화면에서는 그래프 크기와 범례 위치를 드롭다운으로 고르고, 과거 기록
재수집 여부를 체크박스로 선택할 수 있습니다. 제목은 원하는 문구를 입력할 수
있도록 텍스트 칸으로 유지합니다. 어떤 값을 선택해도 Date/Timeline, 선형/로그,
밝은/어두운 테마 조합의 기본 SVG 그래프 8개는 항상 모두 생성됩니다.

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
| `output-directory` | `.github/star-history` | Action 내부 작업 디렉터리입니다. |
| `title` | `Star History` | 그래프 제목입니다. |
| `width` | `900` | SVG 너비이며 480–2400 범위로 제한됩니다. |
| `height` | `600` | SVG 높이이며 320–1600 범위로 제한됩니다. |
| `legend-position` | `top-left` | 모든 그래프에 적용할 `top-left` 또는 `bottom-right`입니다. |
| `force-backfill` | `false` | 현재 stargazer 전체를 다시 수집합니다. |

## 권한과 보안

예제 workflow는 `contents: write`를 사용합니다. GitHub의 제한된 stargazers
API가 저장소의 쓰기 수준 협업 권한을 확인하며, 생성된 JSON과 SVG를 같은
저장소의 전용 브랜치에 커밋해야 하기 때문입니다.

토큰은 해당 workflow 실행과 해당 저장소에만 제한되고 작업 종료 후 만료됩니다.
공개된 소유자 또는 조직 아바타는 GitHub 아바타 호스트에서만 내려받아 SVG에
직접 내장합니다. 이 이미지 요청에는 저장소 토큰을 보내지 않으며 생성된
그래프에도 외부 이미지 주소가 남지 않습니다.
보안 수준을 더 높여야 하는 저장소에서는 재사용 workflow 호출을 검토한 전체
커밋 SHA로 선택적으로 고정할 수 있습니다. 신뢰할 수 없는 PR 코드에서는 쓰기
권한 workflow를 실행하지 마세요.

활동이 60일 이상 없는 공개 저장소에서는 GitHub가 예약 workflow를 자동으로
중지할 수 있습니다. 이 경우 수동 실행 버튼은 계속 사용할 수 있습니다.

자세한 내용은 [SECURITY.md](SECURITY.md)를 참고하세요.

## 문서

- [설치 및 적용](docs/INSTALLATION.md)
- [데이터 형식과 정확도](docs/DATA_FORMAT.md)
- [문제 해결](docs/TROUBLESHOOTING.md)
- [보안 정책과 권한 구조](SECURITY.md)

## 개발

Node.js 24 이상이 필요합니다. 실행 중 패키지 설치는 필요하지 않으며, 검토한
D3 빌드를 Action 내부에 고정해 두었습니다.

```sh
npm test
npm run check
```

## 라이선스와 출처

아래 제3자 구성요소를 제외한 이 프로젝트의 자체 코드는 최상위
[MIT 라이선스](LICENSE)로 배포되며 저작권자는 Kim DaeHyun입니다.

- 그래프 렌더러는 MIT 라이선스의
  [Star History](https://github.com/star-history/star-history)를 바탕으로
  수정했습니다.
- 고정된 D3 6.7.0 빌드에는 BSD 3-Clause 라이선스가 적용됩니다.
- 내장 Patrick Hand 폰트 서브셋에는 SIL Open Font License 1.1이 적용됩니다.

제3자 구성요소에는 각각의 원래 라이선스가 계속 적용되며, 최상위 MIT
라이선스가 이를 대체하지 않습니다. 저작권 고지, 라이선스 전문, 출처 및
비제휴 고지는 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)를 참고하세요.
