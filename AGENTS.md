<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 커밋 메시지 규칙

커밋을 요청받으면 **Conventional Commits 형식 + 한국어 본문**으로 작성한다.

```
<type>: <한국어로 무엇을 왜 바꿨는지 한 줄 요약>
```

- 타입은 영어 소문자로 고정: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`, `build`, `ci`
- 콜론 뒤 제목은 **한국어**로 쓴다. (영어 제목 금지)
- 제목은 50자 내외, 마침표 없이 끝낸다.
- 필요하면 빈 줄 뒤에 한국어로 본문(상세 설명)을 덧붙인다.

타입 선택 기준:

| 타입 | 사용 시점 |
| --- | --- |
| `feat` | 새 기능, 새 화면, 새 API 추가 |
| `fix` | 버그 수정, 잘못된 동작 교정 |
| `chore` | 의존성/설정/빌드 스크립트 등 코드 외 잡일 |
| `docs` | 문서만 변경 |
| `refactor` | 동작 변화 없는 구조 개선 |
| `style` | 포맷팅, 세미콜론, 공백 등 |
| `test` | 테스트 추가·수정 |
| `perf` | 성능 개선 |

예시:

```
feat: 상담 세션 목록에 검색 드로어 추가
fix: 무음 구간에서 STT 환각 문장이 삽입되는 문제 수정
chore: playwright를 개발 의존성으로 추가
docs: 지식베이스 동작 메커니즘 문서 정리
refactor: 인용 검증 로직을 별도 모듈로 분리
```
