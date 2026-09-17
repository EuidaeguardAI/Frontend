import { create } from "zustand";

/**
 * 듣기(녹음) 상태. 상담 세션과 분리돼 있다.
 *
 * 왜 세션 스토어가 아닌가: 상시 녹음으로 바뀌면서 마이크는 여러 상담에 걸쳐 계속 살아 있다.
 * 음소거도 마이크의 속성이지 상담의 속성이 아니다 — "다음 고객"으로 상담이 바뀌었다고
 * 음소거가 풀리면 직원 입장에서는 버그로 보인다. micAvailable도 마찬가지로 기기의 사정이다.
 *
 * 영구 저장은 하지 않는다. 탭을 새로 열면 마이크 권한부터 다시 확인하는 것이 맞다.
 */
interface ListeningState {
  /** 이 기기에서 녹음을 쓸 수 있는지. false면 live 화면이 수동 입력으로 동작한다. */
  micAvailable: boolean;
  muted: boolean;
  /**
   * 다른 화면의 "지금 긴급해요"에서 넘어온 참이다. live 화면이 마운트되면서 한 번 소비하고
   * 곧바로 고정 안전 절차를 띄운다. (화면 전환 한 번을 아끼려는 것이지 상태를 들고 있으려는 게 아니다)
   */
  pendingEmergency: boolean;
  setMicAvailable: (value: boolean) => void;
  toggleMute: () => void;
  declareEmergency: () => void;
  /** pendingEmergency를 읽으면서 동시에 내린다. 두 번 처리되지 않게 한다. */
  consumeEmergency: () => boolean;
}

export const useListeningStore = create<ListeningState>()((set, get) => ({
  micAvailable: true,
  muted: false,
  pendingEmergency: false,
  setMicAvailable: (value) => set({ micAvailable: value }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  declareEmergency: () => set({ pendingEmergency: true }),
  consumeEmergency: () => {
    const pending = get().pendingEmergency;
    if (pending) set({ pendingEmergency: false });
    return pending;
  },
}));
