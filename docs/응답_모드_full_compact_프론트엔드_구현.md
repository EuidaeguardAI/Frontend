# 실시간 응답 모드 프론트엔드 구현

## 목적

실시간 고객 응대 화면에서 `긴 응대`와 `짧은 안내`를 선택하고, 다음 `/analyze` 요청부터 선택한 모드를 적용한다. 모드 변경 자체는 API나 LLM을 호출하지 않는다.

## 변경 파일

- `src/lib/types.ts`
- `src/lib/api/schemas.ts`
- `src/lib/store/responseModeStore.ts`
- `src/lib/safety/emergencyRules.ts`
- `src/app/session/live/page.tsx`
- `src/app/session/live/page.css.ts`
- `src/components/session/CitationList.tsx`
- `src/components/session/CitationList.css.ts`

## 상태와 API 요청

`responseModeStore`는 Zustand persist를 사용하고 localStorage 키는 `euidaeguard-response-mode`다. 기본값은 `full`이다.

라이브 화면의 세그먼트 버튼은 `긴 응대`/`짧은 안내`와 현재 선택 상태를 보여주며 `다음 추천부터 적용`을 안내한다. TTS의 `coach`/`customer` 설정과 별도 저장소·별도 UI로 유지한다.

STT 녹음 effect가 오래된 값을 캡처하지 않도록 `runAnalysis()`가 요청을 만들기 직전에 `useResponseModeStore.getState().responseMode`를 읽어 `AnalyzeRequestBody.responseMode`로 전송한다.

## 타입과 하위 호환

- `ResponseMode = "full" | "compact"`를 추가했다.
- 새 API 응답 타입의 `responseMode`는 필수다.
- 앱의 `Recommendation.responseMode`는 과거 Zustand 저장 데이터 호환을 위해 선택값이며, 없으면 화면에서 `full`로 본다.
- `glanceSummary`와 `ttsText`도 기존 저장 데이터 호환을 위해 선택값이다.
- compact에서 `glanceSummary`가 없으면 `sayNow`를 최대 3단계 표시의 원문으로 사용한다.
- coach TTS에서 `ttsText`가 없으면 `sayNow`로 폴백한다.

## 모드별 화면

### full

- 기존 `sayNow`를 카드의 첫 콘텐츠로 표시한다.
- 검증된 근거를 고객 응대 멘트 바로 아래에 항상 표시한다.
- 수정, 예상 답변, 다음 행동·금지 행동 상세와 고객 읽기 동작을 유지한다.
- `지금 할 일` 패널은 표시하지 않는다.
- 직원 안내 듣기와 고객에게 읽기는 모두 `sayNow`를 사용한다.

### compact

- `지금 할 일`을 먼저 표시하고 `→` 기준 최대 3단계로 나눈다.
- 직원 안내 듣기는 `ttsText`를, 고객에게 읽기는 항상 `sayNow`를 사용한다.
- `sayNow`는 `전체 멘트 보기`에서 펼친다.
- 검증된 citation 근거를 요약 바로 아래 표시한다.

## RAG 근거 표시

compact 화면은 응답의 `citations`만 사용하며 별도 source summary를 만들지 않는다. 기존 `CitationList`를 재사용해 source type, 문서명, section을 표시하고 `근거 문장 보기`를 펼쳤을 때 서버가 grounding한 quote를 보여준다.

근거가 비어 있으면 문서나 조항을 추측하지 않고 다음 상태를 표시한다.

```text
확인된 RAG 근거 없음
일반적인 응대 원칙으로 작성됨 · 상담사 검토 필요
```

고정 안전 추천의 citation 영역 제목은 `안전 절차 근거`로 바꿔 일반 RAG 근거와 구분한다.

## TTS와 안전 처리

- compact + coach: `ttsText`, 없으면 `sayNow`
- compact + customer: `sayNow`
- full + coach/customer: `sayNow`
- 고객에게 읽기 버튼은 어떤 경우에도 `ttsText`를 사용하지 않는다.
- 위협·긴급·고정 안전 추천의 자동 재생 금지와 수동 재생 허용은 유지한다.

프론트가 긴급 진입 시 직접 만드는 고정 안전 추천도 요청 직전의 최신 모드를 기록한다. full은 보조 필드를 만들지 않고 compact만 고정 요약과 코칭 문장을 포함한다.

## 검증 결과

- `npm run lint`: 통과
- `npx tsc --noEmit`: 통과
- `npm run build`: 통과
- Next.js 16.3.4 프로덕션 빌드에서 `/session/live` 정적 생성 확인

## 남은 수동 검증

- 모바일 폭에서 모드 선택 UI와 TTS 메뉴가 겹치지 않는지 확인
- 마이크 루프 중 모드를 바꾼 뒤 바로 다음 발화의 요청 payload 확인
- full/compact 카드의 수정·펼치기·직원 안내·고객 읽기 동작 확인
- 근거 있음/없음과 고정 안전 추천의 근거 제목 확인
