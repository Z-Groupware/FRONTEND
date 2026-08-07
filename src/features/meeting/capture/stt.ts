/**
 * STT 계층 — **여기 한 곳만 브라우저 음성 인식을 안다**(WORKFLOW §3-3).
 *
 * ⚠️ 화면은 이 파일의 `SttEngine` 모양만 안다. 나중에 상용 STT로 갈아탈 때 이 파일만
 *    바꾸면 되게 두는 것이 §3-3의 요구다("STT 계층만 교체 가능하게 분리").
 * ⚠️ **Chrome 계열 전용이다**(`webkitSpeechRecognition`). 미지원 브라우저에서 조용히 안 되는
 *    척하지 않는다 — `isSttSupported()`로 먼저 묻고 화면이 안내를 띄운다(CLAUDE.md §정직성).
 */

/** 자막 한 조각 — 문장 단위다(§3-3 "문장=청크 단위") */
export interface TranscriptChunk {
  id: string;
  /** 화면 표기용 `10:04` — 화자 구분은 없다(§3-2 "화자 구분 없이 청크 단위") */
  at: string;
  text: string;
}

export interface SttEngine {
  start(): void;
  stop(): void;
}

export interface SttHandlers {
  /** 문장이 확정될 때마다 — 서버로도 이 단위로 보낸다(§3-3 자막 청크 전송 API) */
  onChunk(text: string): void;
  /** 되돌릴 수 없는 실패(권한 거부 등) — 화면이 안내를 띄운다 */
  onFatal(message: string): void;
}

/*
  ⚠️ `SpeechRecognition`은 표준 타입이 없다. `any`를 쓰지 않고(CLAUDE.md) 우리가 쓰는 만큼만
     좁게 적는다 — 여기 적힌 것 말고는 부르지 않는다.
*/
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function ctorOf(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** 이 브라우저가 STT를 하는가 — 화면은 이걸 먼저 묻고 안내를 띄운다 */
export function isSttSupported(): boolean {
  return ctorOf() !== null;
}

/**
 * 권한 거부처럼 **다시 시작해도 소용없는** 실패인가.
 *
 * ⚠️ `no-speech`·`aborted`·`network`는 여기 없다 — 조용한 구간이나 순간적인 끊김이라
 *    자동 재시작으로 이어가야 한다. 이걸 치명으로 보면 3~4초 침묵마다 회의가 멈춘다.
 */
function isFatalSttError(error: string): boolean {
  return error === "not-allowed" || error === "service-not-allowed" || error === "audio-capture";
}

const FATAL_MESSAGE: Record<string, string> = {
  "not-allowed": "마이크 사용이 거부되어 자막을 받을 수 없습니다. 브라우저 권한을 열어 주세요.",
  "service-not-allowed": "브라우저가 음성 인식을 막았습니다. 주소창 옆 권한 설정을 확인해 주세요.",
  "audio-capture": "마이크를 찾지 못했습니다. 연결 상태를 확인해 주세요.",
};

/**
 * 끊김 없이 듣는 것처럼 도는 STT를 만든다.
 *
 * ⚠️ **`onend`에서 다시 켠다**(§3-3). 브라우저 STT는 3~4초 조용하면 세션을 스스로 닫는다 —
 *    자동 재시작이 없으면 회의 중간에 자막이 조용히 죽는다.
 * ⚠️ 우리가 `stop()`을 부른 경우에는 **다시 켜지 않는다.** 그 구분이 없으면 일시정지·종료가
 *    먹히지 않고 마이크가 계속 열려 있다.
 * ⚠️ 미지원 브라우저면 `null`을 준다 — 부르는 쪽이 안내를 띄우게 하고, 여기서 조용히
 *    아무 일도 안 하는 가짜 엔진을 돌려주지 않는다(§정직성).
 */
export function createSttEngine(handlers: SttHandlers): SttEngine | null {
  const Ctor = ctorOf();
  if (!Ctor) return null;

  let recognition: SpeechRecognitionLike | null = null;
  /** 우리가 멈춘 것인가 — 자동 재시작을 할지 가른다 */
  let stopped = true;

  const spawn = () => {
    const instance = new Ctor();
    instance.lang = "ko-KR";
    instance.continuous = true;
    // 확정된 문장만 올린다 — 중간 결과까지 보내면 같은 말이 여러 번 쌓인다
    instance.interimResults = false;

    instance.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result?.isFinal) continue;
        const text = result[0]?.transcript?.trim();
        if (text) handlers.onChunk(text);
      }
    };

    instance.onerror = (event) => {
      if (!isFatalSttError(event.error)) return;
      stopped = true;
      handlers.onFatal(FATAL_MESSAGE[event.error] ?? "자막을 받지 못했습니다.");
    };

    instance.onend = () => {
      if (stopped) return;
      // 세션이 스스로 닫힌 것이다 — 바로 다시 연다
      spawn();
    };

    recognition = instance;
    instance.start();
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      spawn();
    },
    stop() {
      stopped = true;
      recognition?.abort();
      recognition = null;
    },
  };
}
