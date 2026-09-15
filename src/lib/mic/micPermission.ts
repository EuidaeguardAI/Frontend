// 마이크 권한을 한 번 허용받으면, 다음 상담부터는 "마이크 사용 권한" 화면을 다시 보여주지 않기 위한 저장소.
// Permissions API(navigator.permissions.query)가 되는 브라우저는 그 값을 그대로 신뢰하고,
// 안 되는 브라우저(예: 일부 Safari/Firefox — "microphone"을 PermissionName으로 지원하지 않음)는
// localStorage 플래그로 대체한다. 권한을 브라우저 설정에서 다시 차단하면 Permissions API 쪽이
// "denied"로 바뀌므로, 플래그만 믿고 스킵하는 것보다 항상 Permissions API를 우선 확인한다.

const MIC_GRANTED_KEY = "euidaeguard-mic-granted";

export async function hasMicPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      if (status.state === "granted") return true;
      if (status.state === "denied") return false;
      // "prompt" 상태면 Permissions API로는 판단할 수 없으니 플래그로 폴백한다.
    }
  } catch {
    // 이 브라우저는 "microphone" 권한 조회 자체를 지원하지 않는다.
  }
  return window.localStorage.getItem(MIC_GRANTED_KEY) === "1";
}

export function rememberMicGranted() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MIC_GRANTED_KEY, "1");
}

export function forgetMicGranted() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MIC_GRANTED_KEY);
}
