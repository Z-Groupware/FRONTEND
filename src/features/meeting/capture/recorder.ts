/**
 * 녹음 계층 — **여기 한 곳만 마이크와 `MediaRecorder`를 안다**(WORKFLOW §3-3).
 *
 * ⚠️ **`timeslice`로 10분을 쪼개지 않는다.** `timeslice` 조각은 헤더가 없어 독립 재생이
 *    안 된다 — 10분 완결 파일은 `stop → start`로 구간을 새로 여는 **세그먼트** 방식이다.
 * ⚠️ 거기에 더해 **15초 조각도 함께 흘려보낸다**(`start(15000)`). 크래시 때 유실을
 *    10분 → 15초로 줄이려는 절충이고, 서버가 세그먼트가 닫힐 때 조각들을 이어 붙여
 *    10분 완결 파일을 만든다(백엔드 확정).
 * ⚠️ **일시정지는 파일을 안 쪼갠다.** `pause/resume`은 하나의 연속 파일로 이어진다 —
 *    조용한 구간만 빠진다.
 */

export interface RecorderHandlers {
  /** 15초마다 나오는 조각 — 서버가 모아서 세그먼트를 만든다 */
  onSlice(blob: Blob): void;
  /** 10분(실제 녹음)이 차서 세그먼트가 닫혔다 — 서버가 그 구간을 확정한다 */
  onSegmentClosed(index: number): void;
  /** 마이크를 못 얻었다 — 화면이 안내를 띄운다 */
  onFatal(message: string): void;
}

export interface CaptureRecorder {
  /**
   * 마이크를 열고 첫 구간을 연다 — **열렸는지 돌려준다.**
   * ⚠️ `void`로 두면 부르는 쪽이 실패를 모른 채 "녹음 중"으로 넘어간다. 아무것도 안 담기는
   *    회의를 30분 진행하고 나서야 아는 일이 생긴다(§정직성).
   */
  start(): Promise<boolean>;
  pause(): void;
  resume(): void;
  /** 세그먼트를 닫고 다음 구간을 연다 — 10분 경계에서 부른다 */
  rotate(index: number): void;
  stop(): void;
}

/** 15초 조각(§3-3) */
export const SLICE_MS = 15_000;

/** 이 브라우저가 녹음을 하는가 */
export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.mediaDevices?.getUserMedia !== undefined
  );
}

/**
 * 마이크를 열고 녹음기를 만든다.
 *
 * ⚠️ 스트림은 **한 번만 얻고 계속 쓴다.** 세그먼트마다 `getUserMedia`를 다시 부르면 구간
 *    사이에 권한 창이 다시 뜨거나 소리가 끊긴다.
 * ⚠️ 미지원 브라우저면 `null` — 조용히 되는 척하는 가짜 녹음기를 만들지 않는다(§정직성).
 */
export function createCaptureRecorder(handlers: RecorderHandlers): CaptureRecorder | null {
  if (!isRecordingSupported()) return null;

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;

  const openSegment = () => {
    if (!stream) return;
    const instance = new MediaRecorder(stream);
    instance.ondataavailable = (event) => {
      if (event.data.size > 0) handlers.onSlice(event.data);
    };
    recorder = instance;
    // 15초마다 조각이 떨어진다 — 세그먼트 자체는 stop/start로만 끊는다
    instance.start(SLICE_MS);
  };

  return {
    async start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        handlers.onFatal("마이크를 열지 못했습니다. 브라우저 권한을 확인해 주세요.");
        return false;
      }
      openSegment();
      return true;
    },
    pause() {
      if (recorder?.state === "recording") recorder.pause();
    },
    resume() {
      if (recorder?.state === "paused") recorder.resume();
    },
    rotate(index: number) {
      if (!recorder) return;
      recorder.stop();
      handlers.onSegmentClosed(index);
      openSegment();
    },
    stop() {
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorder = null;
      // 마이크 표시등을 끈다 — 트랙을 안 멈추면 회의가 끝나도 계속 켜져 있다
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    },
  };
}
