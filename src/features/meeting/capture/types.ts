/**
 * 캡처 UI 계약 — **화면이 아는 모양은 여기까지다**(§Mock 격리막).
 *
 * BE의 응답 shape(`captureSessionId`·`roster`·봉투 등)은 `actions.ts`가 흡수한다.
 * 연동이 바뀌면 `actions.ts`만 고치고 화면은 0줄이다.
 */

/** CAP-01이 발급한 세션 — 화면이 실제로 쓰는 건 시간 기준점뿐이다 */
export interface CaptureSession {
  captureSessionId: number;
  /**
   * 서버가 정한 녹음 시작 시각.
   *
   * ⚠️ **자막 오프셋의 기준이다.** 브라우저 시계로 재면 사람마다 몇 초씩 어긋나서,
   *    나중에 녹음 정본과 시간창을 맞출 때 화자가 엉뚱한 문장에 붙는다.
   */
  startedAtEpochMs: number;
}

/**
 * 서버로 보낼 자막 한 조각 — [확인] BE `SubmitCaptionsRequest.ChunkRequest`.
 *
 * ⚠️ 필드 이름을 바꾸지 않는다. 이 모양 그대로 JSON이 된다.
 */
export interface CaptionChunkInput {
  /** (회의, 사람)마다 0부터. 같은 값이 다시 오면 BE가 건너뛴다 — 재전송 안전 */
  seq: number;
  /** 세션 시작(`startedAtEpochMs`)부터 이 문장이 시작될 때까지 */
  startMs: number;
  /** 〃 끝날 때까지 */
  endMs: number;
  text: string;
  /**
   * 그 구간의 마이크 음량(dBFS, 음수).
   *
   * ⚠️ **필수다.** 화자 판정의 유일한 근거라 BE가 NOT NULL로 잡아 뒀다 — 빼면 422다.
   */
  rms: number;
}
