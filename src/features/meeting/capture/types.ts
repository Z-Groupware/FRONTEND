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

/**
 * 화면에 뜨는 자막 한 줄 — **내 말도 남의 말도 이 모양이다.**
 *
 * ⚠️ `personId`가 있어야 **누가 한 말인지** 보여 줄 수 있다. 자막(caption)은 참석자
 *    브라우저가 보낸 것이라 **화자가 확실하다** — 정본(transcript)은 화자를 모른다
 *    (BE `CaptionChunk` 주석). 그 확실한 값을 화면에서 버리면 남의 말과 내 말이 섞인다.
 * ⚠️ `personId`가 `null`인 줄이 있다. 명단 밖 발화(sentinel)라 이름을 못 붙인다 —
 *    그때는 이름 자리를 비우지 말고 **모르는 사람으로 표시**한다(§정직성).
 */
export interface LiveCaption {
  id: string;
  /** 녹음 시작 기준 경과 `03:12` */
  at: string;
  /**
   * 같은 값의 ms 원본 — **정렬은 이걸로 한다.**
   *
   * ⚠️ `at` 문자열로 정렬하면 한 시간을 넘는 순간 깨진다. `1:05:00`과 `59:00`을 글자로
   *    비교하면 `1` < `5`라 **한 시간 지난 말이 59분 앞에 선다.**
   */
  atMs: number;
  text: string;
  personId: number | null;
}
