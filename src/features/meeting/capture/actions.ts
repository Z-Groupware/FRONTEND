"use server";

import { requireAccessToken } from "@/features/auth/session";
import { serverApi, toUserMessage } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import type { ActiveCapture, CaptionChunkInput, CapturePart, CaptureSession } from "./types";

/**
 * 캡처 창구 — 격리막(§Mock 격리막).
 *
 * 화면(`use-capture.ts`)은 이 파일의 모양만 안다. BE shape은 전부 여기서 흡수한다.
 *
 * ⚠️ **경로 접두사가 두 갈래다.** 캡처 세션은 `/api/v1/`, 자막은 `/api/`다 — `ep`에 적어 뒀다.
 * ⚠️ **토큰은 브라우저로 안 나간다**(§핵심 4원칙 ②). 브라우저는 이 액션만 부르고,
 *    BE와의 대화는 Next 서버가 대신한다.
 * ⚠️ 목으로 돌 때는 **서버를 안 부르고 그럴듯한 값을 돌려준다.** 회의 화면은 목으로도
 *    끝까지 굴러가야 한다(§정직성 — 안 되는 척도, 되는 척도 안 한다).
 */

/** 실패하면 화면에 그대로 띄울 한 줄이 담긴다 */
export interface CaptureActionResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

/* ────────────────────────── CAP-01 · 02 · 03 세션 생명주기 ────────────────────────── */

/** [확인] BE `CaptureSessionController.startCaptureSession` — 201 */
interface CaptureSessionStartResponse {
  captureSessionId: number;
  status: string;
  isPaused: boolean;
  startedBy: number;
  startedAtEpochMs: number;
  roster: { personKey: string; memberId: number | null; name: string; type: string }[];
}

/**
 * 녹음 시작을 서버에 알린다(CAP-01).
 *
 * ⚠️ **시간 기준점을 여기서 받는다**(`startedAtEpochMs`). 브라우저 시계를 쓰면 사람마다
 *    자막 오프셋이 어긋나서, 나중에 녹음 정본과 시간창을 못 맞춘다 — 화자 이식이 깨진다.
 * ⚠️ 오디오는 안 보낸다. 상태만 알리는 호출이다(§3-3).
 */
export async function startCaptureSessionAction(
  meetingId: number,
): Promise<CaptureActionResult<CaptureSession>> {
  if (isMock) {
    return { ok: true, data: { captureSessionId: 0, startedAtEpochMs: Date.now() } };
  }

  try {
    const accessToken = await requireAccessToken();
    const response = await serverApi<CaptureSessionStartResponse>(ep.captureSession(meetingId), {
      method: "POST",
      accessToken,
    });
    return {
      ok: true,
      data: {
        captureSessionId: response.captureSessionId,
        startedAtEpochMs: response.startedAtEpochMs,
      },
    };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

/* ────────────────────────── CAP-09 진행 중 캡처 조회(새로고침·크래시 복구) ────────────────────────── */

/** [확인] BE `CaptureQueryController.active` — `ActiveCaptureResponse`, 진행 중 없으면 data:null */
interface ActiveCaptureApiResponse {
  meetingId: number;
  captureSessionId: number | null;
  segmentSeq: number;
  lastSeq: number;
  recorderPersonId: number | null;
  canTakeover: boolean;
  elapsedMs: number;
}

/**
 * 진행 중 캡처 조회(CAP-09) — 새로고침·크래시 복구의 첫 단추.
 *
 * ⚠️ **`data: null`이 정상값이다**(진행 중 캡처 없음). 오류로 올리지 않는다 — 아무것도 없는
 *    사용자의 첫 진입 때 오류 배너가 뜨면 오히려 고장으로 읽힌다.
 * ⚠️ **파라미터가 없다.** 회의는 토큰의 memberId로 서버가 찾는다(남의 진행 캡처 열람 차단).
 *    여기서 `meetingId`를 받아 검사하지 않는 이유는, 사용자가 A 회의 녹음 중 B 회의 캡처
 *    화면을 열었을 때 이 액션이 A 회의 정보를 그대로 돌려주는 것이 **정상 동작**이기
 *    때문이다("지금 다른 회의 녹음 중"을 알리는 데 쓴다). 이 화면과 무관한지 판정은
 *    호출부(`use-capture`)가 `meetingId` 비교로 한다.
 * ⚠️ 목 모드는 항상 `{ok:true, data:null}`이다 — 목엔 서버 상태가 없다(§정직한 목업).
 */
export async function getActiveCaptureAction(): Promise<CaptureActionResult<ActiveCapture | null>> {
  if (isMock) return { ok: true, data: null };

  try {
    const accessToken = await requireAccessToken();
    const response = await serverApi<ActiveCaptureApiResponse | null>(ep.capturesActive(), {
      accessToken,
    });
    if (response === null) return { ok: true, data: null };
    /*
      ⚠️ `captureSessionId`는 화면 계약에서 뺀다 — 안 쓰는 값이다(BE 응답에도 null로 오는
         경우가 있고, 이후 다른 액션이 이 값을 참조하지 않는다).
    */
    return {
      ok: true,
      data: {
        meetingId: response.meetingId,
        segmentSeq: response.segmentSeq,
        lastSeq: response.lastSeq,
        recorderPersonId: response.recorderPersonId,
        canTakeover: response.canTakeover,
        elapsedMs: response.elapsedMs,
      },
    };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

/* ────────────────────────── CAP-04 · 07 오디오 조각 업로드 ────────────────────────── */

/** [확인] BE `CaptureUploadController.presign` — `PresignedPartsResponse` */
interface PresignedPartsApiResponse {
  segmentSeq: number;
  parts: { seq: number; presignedUrl: string; expiresIn: number }[];
}

/**
 * 조각 업로드용 presigned URL을 배치로 받는다(CAP-04).
 *
 * ⚠️ **한 번에 여러 개 받는다**(기본 20개=5분치, `upload.ts`가 정한다). 15초마다 새로
 *    발급받으면 그 왕복이 매번 녹음 조각 전송을 가로막는다.
 * ⚠️ 목에서는 **빈 배치를 돌려준다** — 목은 S3가 없어서 업로드를 안 한다(자막만 오간다).
 */
export async function presignCaptureUploadAction(
  meetingId: number,
  count: number,
  contentType: string,
): Promise<CaptureActionResult<{ segmentSeq: number; parts: CapturePart[] }>> {
  if (isMock) return { ok: true, data: { segmentSeq: 0, parts: [] } };

  try {
    const accessToken = await requireAccessToken();
    const response = await serverApi<PresignedPartsApiResponse>(ep.partsPresign(meetingId), {
      method: "POST",
      accessToken,
      json: { count, contentType },
    });
    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * 조각 하나가 S3에 다 올라갔음을 알린다(CAP-07) — 이 호출 자체가 녹음자 하트비트다.
 *
 * ⚠️ **BE가 재검증한다.** 여기 실은 `sizeBytes`를 그대로 믿지 않고 S3 HEAD로 실제 업로드
 *    여부를 다시 본다 — 우리가 보내는 값은 참고일 뿐 신뢰 경계는 서버에 있다.
 */
export async function completeCaptureUploadAction(
  meetingId: number,
  seq: number,
  body: { segmentSeq: number; s3Key: string; sizeBytes: number },
): Promise<CaptureActionResult<void>> {
  if (isMock) return { ok: true };

  try {
    const accessToken = await requireAccessToken();
    await serverApi<unknown>(ep.partComplete(meetingId, seq), {
      method: "POST",
      accessToken,
      json: body,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * 일시정지(CAP-02) · 재개(CAP-03).
 *
 * ⚠️ BE 주석: 일시정지는 **마지막 조각 업로드와 완료 통보를 끝낸 뒤** 불러야 한다.
 *    먼저 부르면 서버가 그 구간을 닫아 버려 뒤늦게 올라온 조각이 갈 곳을 잃는다.
 */
export async function pauseCaptureSessionAction(
  meetingId: number,
): Promise<CaptureActionResult<void>> {
  return postCaptureSignal(ep.captureSessionPause(meetingId));
}

export async function resumeCaptureSessionAction(
  meetingId: number,
): Promise<CaptureActionResult<void>> {
  return postCaptureSignal(ep.captureSessionResume(meetingId));
}

/**
 * 회의 종료 + 분석 접수(MEET-08).
 *
 * ⚠️ **AI 분석을 프론트가 부르지 않는다**(§3-3 4번). 서버가 종료 처리 안에서 큐에 걸고
 *    실패해도 재시도한다 — 사용자가 창을 닫아도 안전하다.
 * ⚠️ 되돌릴 수 없다. 확인 창을 거친 뒤에만 부른다(§3-3 종료 정책).
 */
export async function completeMeetingAction(meetingId: number): Promise<CaptureActionResult<void>> {
  return postCaptureSignal(ep.meetingComplete(meetingId));
}

async function postCaptureSignal(path: string): Promise<CaptureActionResult<void>> {
  if (isMock) return { ok: true };

  try {
    const accessToken = await requireAccessToken();
    await serverApi<unknown>(path, { method: "POST", accessToken });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

/* ────────────────────────────── CAP-11 자막 청크 ────────────────────────────── */

/**
 * 자막 청크를 **배치로** 보낸다(CAP-11).
 *
 * ⚠️ **한 문장마다 한 번씩 부르지 않는다.** BE가 배치 API로 만들어 뒀고, 말이 빠른 회의에서는
 *    초당 여러 문장이 확정된다 — 낱개로 보내면 그만큼 왕복이 늘고 순서가 뒤집힌다.
 * ⚠️ **`rms`가 없으면 422다.** 화자 판정의 유일한 근거라 BE가 NOT NULL로 잡아 뒀다
 *    (`CaptionChunk.java`). 값은 `level.ts`가 잰 dBFS(음수)다.
 * ⚠️ **`seq`는 (회의, 사람)마다 0부터 이어 붙는다.** 같은 `seq`가 다시 오면 BE가 조용히
 *    건너뛴다 — 재전송이 안전하다는 뜻이라, 실패한 배치는 그대로 다시 보내면 된다.
 * ⚠️ **자막은 정본이 아니다.** 실시간 표시와 STT 실패 폴백용이다(BE 주석) — 못 보내도
 *    회의는 굴러가야 하므로, 실패를 화면 전체 오류로 키우지 않는다.
 */
export async function submitCaptionsAction(
  meetingId: number,
  chunks: CaptionChunkInput[],
): Promise<CaptureActionResult<void>> {
  if (chunks.length === 0) return { ok: true };
  if (isMock) return { ok: true };

  try {
    const accessToken = await requireAccessToken();
    await serverApi<unknown>(ep.captions(meetingId), {
      method: "POST",
      accessToken,
      json: { chunks },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}
