# 실시간 응대 요약·TTS 프론트엔드 구현

## 목적

실시간 상담 화면에서 직원이 긴 고객 응대 문장을 읽기 전에 현재 해야 할 행동을 빠르게 파악하고, 직원 코칭 또는 고객 응대 문장을 선택적으로 음성 재생할 수 있게 한다.

## 변경 파일

- `src/lib/types.ts`
- `src/lib/api/schemas.ts`
- `src/lib/safety/emergencyRules.ts`
- `src/lib/store/ttsSettingsStore.ts`
- `src/app/session/live/page.tsx`
- `src/app/session/live/page.css.ts`

## 타입과 하위 호환

앱 내부 `Recommendation`에는 다음 필드를 선택값으로 추가했다.

```ts
glanceSummary?: string;
ttsText?: string;
```

선택값으로 둔 이유는 Zustand에 저장된 과거 상담 기록에 해당 필드가 없을 수 있기 때문이다. 새 `/analyze` API 응답 타입에서는 두 필드를 필수로 선언해 새 백엔드 계약은 엄격하게 유지한다.

화면의 폴백 규칙은 다음과 같다.

- `glanceSummary`가 없거나 빈 문자열이면 `sayNow`를 표시한다.
- `ttsText`가 없거나 빈 문자열이면 직원 안내에서도 `sayNow`를 읽는다.

프론트에서 직접 생성하는 고정 안전 추천에도 두 필드를 명시적으로 채웠다.

## ‘지금 할 일’ 패널

추천 답변 카드의 첫 번째 계층에 큰 요약 패널을 배치했다.

- `glanceSummary`의 `→`를 기준으로 단계를 분리한다.
- 화면에는 최대 3단계만 표시한다.
- 각 단계에 번호와 큰 글씨를 적용한다.
- 일반, 위협, 긴급 상태에 기존 primary·warning·danger 색상 체계를 적용한다.
- 새 추천이 도착하면 기존의 최신 추천 선택 로직을 통해 즉시 새 내용으로 교체된다.

기존 `sayNow`는 제거하거나 축약하지 않았다. 기본 화면에서는 요약을 먼저 보여주고, `전체 멘트 보기`를 누르면 원문 전체를 같은 카드 안에서 펼친다. 기존 수정 기능을 시작하면 전체 멘트 영역이 자동으로 열린다.

기존 예상 답변, 다음 행동, 인용 근거, 검토 상태와 위협 안내 UI는 유지했다.

## TTS 설정 저장소

`ttsSettingsStore.ts`에 Zustand persist 저장소를 추가했다. localStorage 키는 `euidaeguard-tts-settings`이다.

```ts
ttsEnabled: boolean;       // 기본값 false
ttsMode: "coach" | "customer"; // 기본값 coach
ttsAutoPlay: boolean;      // 기본값 false
```

실시간 화면 상단의 작은 TTS 설정 메뉴에서 사용 여부, 자동 재생 모드와 자동 재생 여부를 변경할 수 있다.

## TTS 모드별 동작

### 직원 안내

- 버튼: `직원 안내 듣기`
- 재생 문장: `ttsText`
- `ttsText`가 없으면 `sayNow`로 폴백

### 고객 응대

- 버튼: `고객에게 읽기`
- 재생 문장: 항상 `sayNow`
- 직원 코칭 문장인 `ttsText`를 고객용 버튼에서 사용하지 않음

수동 재생 버튼은 `ttsEnabled`가 꺼져 있어도 사용할 수 있다.

## 자동 재생과 안전 처리

- `ttsEnabled`와 `ttsAutoPlay`를 모두 사용자가 켠 경우에만 자동 재생한다.
- 새 추천 ID를 ref로 기록해 같은 추천을 리렌더나 설정 변경 때문에 반복 재생하지 않는다.
- 새 문장을 재생하기 전에 `speechSynthesis.cancel()`로 이전 음성을 중지한다.
- `ko-KR` 언어 설정을 유지한다.
- 컴포넌트 unmount 및 상담 종료 시 재생을 중지한다.
- 빈 문자열은 재생하지 않는다.
- `threat`, `emergency` 또는 고정 안전 추천은 모드와 관계없이 자동 재생하지 않는다.
- 위협·긴급 추천이 도착하면 이전에 재생 중이던 음성도 중지한다.
- 긴급 상황에서도 사용자가 누르는 수동 듣기 버튼은 사용할 수 있다.

## TTS 미지원 브라우저

Web Speech API 지원 여부는 hydration-safe한 외부 스냅샷으로 확인한다.

- 미지원 시 두 음성 버튼을 비활성화한다.
- 버튼 툴팁과 화면 문구로 미지원 상태를 알린다.
- `window`와 `speechSynthesis` 존재 여부를 확인하므로 런타임 오류가 발생하지 않는다.

## 검증

- `npm run lint`: 통과
- `npx tsc --noEmit`: 통과
- `npm run build`: 통과
- Next.js 프로덕션 빌드에서 `/session/live` 정적 생성 확인
- Git diff whitespace 검사: 통과

실제 음성의 목소리·속도·발음은 운영체제와 브라우저가 제공하는 한국어 음성 엔진에 따라 달라진다. 실제 브라우저에서 연속 추천, 수동 재생과 긴급 전환의 청각적 품질을 추가로 확인해야 한다.
