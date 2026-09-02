# Release guide

[한국어 안내](#한국어-릴리즈-안내)

## Create a release

The project uses stable `vMAJOR.MINOR.PATCH` tags. After the intended release
commit is on `main`, create and push the tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The tag push runs `.github/workflows/release.yml`. It verifies the tag, creates
the GitHub Release, generates GitHub's change notes, and prepends a structured
project overview containing:

- project highlights and installation instructions;
- the exact 40-character commit SHA resolved from the tag;
- both the default `@main` reference and a copy-ready immutable SHA reference;
- meaningful commit subjects since the previous release, excluding generated
  Star-history commits;
- data-accuracy, privacy, security, and licensing notes.

The distributed install template in `examples/star-history.yml` intentionally
stays on `@main`. This keeps the default installation simple and automatically
updated. Users who prefer an immutable version can copy the SHA reference from
the corresponding release.

Before tagging, confirm:

```sh
npm test
npm run check
git diff --check
```

Also verify that `package.json` has the intended version and that the tag points
to the intended commit:

```sh
git show --no-patch --oneline v0.1.0
```

Do not create the release manually in the GitHub web interface for the same
tag. Pushing the tag is the release trigger, and the workflow creates it.

---

## 한국어 릴리즈 안내

### 릴리즈 생성

이 프로젝트는 `vMAJOR.MINOR.PATCH` 형식의 안정 버전 태그를 사용합니다. 릴리즈할
커밋이 `main`에 올라간 뒤 다음처럼 태그를 생성하고 push합니다.

```sh
git tag v0.1.0
git push origin v0.1.0
```

태그를 push하면 `.github/workflows/release.yml`이 실행됩니다. 태그를 확인하고
GitHub Release와 GitHub 변경 내역을 생성하며, 릴리즈 설명 맨 위에 다음 내용을
구조화해 자동으로 추가합니다.

- 프로젝트 주요 기능과 설치 방법
- 태그가 실제로 가리키는 40자리 전체 커밋 SHA
- 기본 `@main` 문구와 해당 SHA로 고정된 복사용 `uses:` 문구
- 이전 릴리즈 이후의 주요 커밋 목록(자동 그래프 갱신 커밋 제외)
- 데이터 정확도, 개인정보 보호, 보안 및 라이선스 안내

배포용 `examples/star-history.yml`은 의도적으로 `@main`을 유지합니다. 기본 설치는
간단하게 자동 업데이트를 받고, 고정이 필요한 사용자는 릴리즈 설명의 SHA 문구만
복사해 바꿀 수 있습니다.

태그를 만들기 전 다음 검사를 통과하는지 확인합니다.

```sh
npm test
npm run check
git diff --check
```

`package.json`의 버전이 의도한 값인지 확인하고, 태그가 올바른 커밋을 가리키는지도
확인합니다.

```sh
git show --no-patch --oneline v0.1.0
```

같은 태그의 Release를 GitHub 웹 화면에서 먼저 만들지 마세요. 태그 push가
릴리즈 시작 신호이며 workflow가 Release를 생성합니다.
