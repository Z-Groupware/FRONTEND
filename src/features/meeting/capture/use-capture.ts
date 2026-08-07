"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CAPTURE_PHASE,
  type CapturePhase,
  closedSegmentCountOf,
  formatRecordedTime,
  isCapturing,
  recordedMsOf,
  type RecordingSpan,
} from "./phase";
import { type CaptureRecorder, createCaptureRecorder, isRecordingSupported } from "./recorder";
import { createSttEngine, isSttSupported, type SttEngine, type TranscriptChunk } from "./stt";

/**
 * 캡처 화면의 손발 — 단계·시간·자막을 한 곳에서 든다.
 *
 * ⚠️ 화면(컴포넌트)은 브라우저 API를 모른다. 여기가 `stt`·`recorder` 두 계층을 부르고,
 *    컴포넌트는 값과 핸들러만 받는다(CLAUDE.md §로직은 커스텀 훅).
 * ⚠️ 서버 호출(CAP-01/02/03·청크·종료)은 **아직 연결 전**이라 `onEvent`로 흘려보내기만 한다 —
 *    붙일 자리를 비워 두되 되는 척하지 않는다(§정직성).
 */

/** 지원 여부 — 화면이 안내를 띄울 때 무엇이 없는지 말해야 한다 */
export interface CaptureSupport {
  stt: boolean;
  recording: boolean;
}

export interface UseCaptureResult {
  phase: CapturePhase;
  support: CaptureSupport;
  /** 실제 녹음 누적 ms — 일시정지는 빠진다 */
  recordedMs: number;
  chunks: TranscriptChunk[];
  /** 되돌릴 수 없는 실패 한 줄 — 화면에 남긴다(토스트는 사라진다) */
  error: string | null;
  enter(): void;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  end(): void;
}

/** 1초마다 다시 그린다 — 경과 시간이 흘러야 녹음 중인 게 보인다 */
const TICK_MS = 1_000;

export function useCapture(): UseCaptureResult {
  const [phase, setPhase] = useState<CapturePhase>(CAPTURE_PHASE.BEFORE_ENTER);
  const [spans, setSpans] = useState<RecordingSpan[]>([]);
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  /*
    ⚠️ 지원 여부는 **첫 렌더에 한 번만** 본다(`useState` 지연 초기화). 캡처 화면은
       `next/dynamic(ssr:false)`로만 들어와서 서버 렌더가 아예 없다 — 그래서 렌더 중에
       `window`를 물어도 하이드레이션이 어긋날 자리가 없다.
    ⚠️ 효과 안에서 `setState`로 채우지 않는다. 첫 그림이 "지원함"으로 한 번 그려졌다가
       바로 다시 그려져, 미지원 브라우저에서 안내가 깜빡인다.
  */
  const [support] = useState<CaptureSupport>(() => ({
    stt: isSttSupported(),
    recording: isRecordingSupported(),
  }));

  /* 콜백이 최신 구간을 읽을 창구 — 상태를 의존성에 걸면 STT가 문장마다 재시작된다 */
  const spansRef = useRef<RecordingSpan[]>([]);
  useEffect(() => {
    spansRef.current = spans;
  }, [spans]);

  const sttRef = useRef<SttEngine | null>(null);
  const recorderRef = useRef<CaptureRecorder | null>(null);
  /** 이미 닫은 세그먼트 수 — 같은 경계에서 두 번 닫지 않으려고 든다 */
  const closedRef = useRef(0);

  const recordedMs = recordedMsOf(spans, now);

  /* 녹음 중일 때만 시계를 돌린다 — 멈춘 화면에서 1초마다 리렌더할 이유가 없다 */
  useEffect(() => {
    if (!isCapturing(phase)) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  /*
    10분(실제 녹음)이 찰 때마다 세그먼트를 닫는다.
    ⚠️ 벽시계가 아니라 `recordedMs` 기준이다 — 일시정지가 길어도 빈 파일이 안 생긴다.
  */
  useEffect(() => {
    if (!isCapturing(phase)) return;
    const closed = closedSegmentCountOf(recordedMs);
    if (closed <= closedRef.current) return;
    closedRef.current = closed;
    recorderRef.current?.rotate(closed);
  }, [phase, recordedMs]);

  /*
    ⚠️ 자막 시각은 **녹음 시작 기준 경과 시간**이다(팀 확정). 벽시계(`10:04`)로 찍으면 나중에
       기록을 볼 때 녹음의 어느 지점인지 알 수 없다 — 회의 시작 10초 뒤의 말은 `00:10`이다.
    ⚠️ 일시정지 구간은 빠진다. 위 타이머·10분 세그먼트와 **같은 시계**를 쓴다 — 자막만 다른
       기준으로 세면 나중에 오디오와 자막이 어긋난다.
    ⚠️ 구간을 `spansRef`로 읽는다. `spans` 상태를 의존성에 넣으면 문장이 쌓일 때마다 STT
       엔진에 새 콜백이 물려 재시작이 걸린다.
  */
  const pushChunk = useCallback((text: string) => {
    const at = formatRecordedTime(recordedMsOf(spansRef.current, Date.now()));
    setChunks((prev) => [
      ...prev,
      // 같은 문장이 반복돼도 키가 겹치지 않게 순번을 쓴다
      { id: `chunk-${prev.length}-${Date.now()}`, at, text },
    ]);
  }, []);

  const teardown = useCallback(() => {
    sttRef.current?.stop();
    sttRef.current = null;
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  /* 화면을 떠나면 마이크를 반드시 끈다 — 안 끄면 표시등이 계속 켜져 있다 */
  useEffect(() => teardown, [teardown]);

  const enter = useCallback(() => setPhase(CAPTURE_PHASE.READY), []);

  /*
    ⚠️ **마이크가 열린 뒤에 "녹음 중"으로 넘어간다.** 먼저 넘어가 두면 권한이 막힌 브라우저에서
       배지는 `녹음 중`, 타이머는 도는데 담기는 건 아무것도 없다 — 화면이 거짓말을 한다
       (§정직성). 실패하면 `READY`에 머물고 이유만 남긴다.
    ⚠️ STT는 녹음이 열린 **뒤에** 켠다. 마이크를 못 얻는 상황이면 자막도 못 받는데, 먼저
       켜 두면 실패한 자리에 자막만 홀로 도는 이상한 상태가 된다.
  */
  const start = useCallback(async () => {
    setError(null);

    const recorder = createCaptureRecorder({
      // TODO(BE 협의): 조각 업로드 API — 지금은 만들어만 두고 보내지 않는다
      onSlice: () => {},
      // TODO(BE 협의): 세그먼트 확정 알림
      onSegmentClosed: () => {},
      onFatal: setError,
    });

    if (!recorder) {
      setError("이 브라우저에서는 녹음을 시작할 수 없습니다.");
      return;
    }

    const opened = await recorder.start();
    if (!opened) return; // 이유는 `onFatal`이 이미 남겼다

    recorderRef.current = recorder;

    const stt = createSttEngine({ onChunk: pushChunk, onFatal: setError });
    stt?.start();
    sttRef.current = stt;

    // TODO(BE 협의): CAP-01 녹음 시작 이벤트 — 서버가 시간 기준점을 발급한다
    const at = Date.now();
    setNow(at);
    setSpans((prev) => [...prev, { from: at, to: null }]);
    setPhase(CAPTURE_PHASE.RECORDING);
  }, [pushChunk]);

  const pause = useCallback(() => {
    sttRef.current?.stop();
    recorderRef.current?.pause();
    // TODO(BE 협의): CAP-02 일시정지 이벤트
    const at = Date.now();
    setSpans((prev) => prev.map((span, i) => (i === prev.length - 1 ? { ...span, to: at } : span)));
    setNow(at);
    setPhase(CAPTURE_PHASE.PAUSED);
  }, []);

  const resume = useCallback(() => {
    sttRef.current?.start();
    recorderRef.current?.resume();
    // TODO(BE 협의): CAP-03 재개 이벤트
    const at = Date.now();
    setNow(at);
    setSpans((prev) => [...prev, { from: at, to: null }]);
    setPhase(CAPTURE_PHASE.RECORDING);
  }, []);

  const end = useCallback(() => {
    teardown();
    const at = Date.now();
    setSpans((prev) => prev.map((span, i) => (i === prev.length - 1 ? { ...span, to: at } : span)));
    setNow(at);
    setPhase(CAPTURE_PHASE.ENDED);
  }, [teardown]);

  return { phase, support, recordedMs, chunks, error, enter, start, pause, resume, end };
}
