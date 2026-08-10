"use server";

import { requireAccessToken } from "@/features/auth/session";
import { serverApi, toUserMessage } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import type { CaptionChunkInput,CaptureSession } from "./types";

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
