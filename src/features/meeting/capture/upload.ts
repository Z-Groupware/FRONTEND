/**
 * 업로드 계층 — 15초 조각(`recorder.ts`)을 모아 서버 presign(CAP-04)으로 받은 URL에
 * **브라우저가 S3로 직접 PUT**하고, 성공하면 complete(CAP-07)로 알린다(WORKFLOW §3-3).
 *
 * ⚠️ presign은 **배치**로 받는다(기본 20개=5분치) — 조각마다 새로 부르면 15초마다
 *    왕복이 끼어든다. 배치가 바닥나기 전에 다음 배치를 미리 받아 둔다.
 * ⚠️ **순서대로, 하나씩 올린다.** 동시에 여러 개를 올리면 늦게 끝난 것 때문에 순서가
 *    뒤집혀 BE의 결원 판정(`missingSeqs`)이 실제로는 안 밀린 조각까지 결원으로 본다.
 * ⚠️ **실패해도 녹음은 안 멈춘다.** 오디오가 정본이라고 해서 여기서 회의를 막으면 자막·
 *    녹음을 둘 다 잃는다 — 연속 실패만 화면에 알리고(`onFailure`) 다음 조각은 계속 받는다.
 * ⚠️ **Content-Type이 서명에 들어간다**(BE `CapS3ObjectStorageAdapter`가 `PutObjectRequest`에
 *    `contentType`을 실어 presign한다) — PUT 헤더가 여기서 요청한 값과 다르면 S3가
 *    서명 불일치로 거절한다. presign 요청·PUT 헤더가 항상 같은 상수를 써야 한다.
 */

import { completeCaptureUploadAction, presignCaptureUploadAction } from "./actions";
import type { CapturePart } from "./types";

/** 15초 × 20 = 5분치 — 한 배치의 크기 */
const BATCH_COUNT = 20;

/** 이 개수 이하로 남으면 다음 배치를 미리 받는다(바닥나고서 받으면 그사이 조각이 밀린다) */
const REFILL_THRESHOLD = 3;

/** presign 요청·PUT 헤더가 공유하는 값 — `recorder.ts`가 이 형식으로 녹음한다 */
export const RECORDING_CONTENT_TYPE = "audio/webm";

export interface UploadHandlers {
  /** 연속 실패 — 녹음은 계속되지만 화면에 남긴다(§정직성) */
  onFailure(message: string): void;
}

export interface SliceUploader {
  /** 조각 하나를 큐에 넣는다 — 호출 순서대로 올라간다 */
  enqueue(blob: Blob): void;
  /** 큐에 남은 조각을 마저 올릴 때까지 기다린다 — 종료 직전에 부른다 */
  flush(): Promise<void>;
}

/** 연속 실패 이 횟수부터 화면에 알린다 — 한두 번의 튐은 흔하다(§captions와 같은 기준) */
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * presigned URL 경로에서 오브젝트 키를 뽑는다.
 *
 * ⚠️ presign 응답엔 키가 따로 안 온다 — BE는 서명된 URL만 주고, complete에 실어 보낼 키는
 *    이 URL 자신에서 읽어야 한다(`CaptureUploadService.buildS3Key`가 서버 안에서만 안다).
 */
function keyOf(presignedUrl: string): string {
  const { pathname } = new URL(presignedUrl);
  return decodeURIComponent(pathname.replace(/^\//, ""));
}

export function createSliceUploader(meetingId: number, handlers: UploadHandlers): SliceUploader {
  let pool: CapturePart[] = [];
  let segmentSeq: number | null = null;
  let refilling: Promise<void> | null = null;
  let consecutiveFailures = 0;
  /** 순서를 지키는 직렬 큐 — 각 조각은 앞 조각이 끝난 뒤에만 시작한다 */
  let chain: Promise<void> = Promise.resolve();

  const refill = (): Promise<void> => {
    if (refilling) return refilling;
    refilling = presignCaptureUploadAction(meetingId, BATCH_COUNT, RECORDING_CONTENT_TYPE)
      .then((result) => {
        if (result.ok && result.data) {
          segmentSeq = result.data.segmentSeq;
          pool = [...pool, ...result.data.parts];
        }
      })
      .finally(() => {
        refilling = null;
      });
    return refilling;
  };

  const nextPart = async (): Promise<CapturePart | null> => {
    // 여유 있게 미리 채운다 — 기다리지 않는다(바닥나기 전이라 급하지 않다)
    if (pool.length > 0 && pool.length <= REFILL_THRESHOLD) void refill();
    // 정말 바닥났으면 이번엔 기다린다 — 줄 새 조각을 그냥 버릴 수는 없다
    if (pool.length === 0) await refill();
    const [part, ...rest] = pool;
    if (!part) return null;
    pool = rest;
    return part;
  };

  const uploadOne = async (blob: Blob) => {
    const part = await nextPart();
    if (!part || segmentSeq === null) {
      consecutiveFailures += 1;
      if (consecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
        handlers.onFailure("녹음 파일을 서버에 올리지 못하고 있습니다. 자막은 계속 기록됩니다.");
      }
      return;
    }

    try {
      const response = await fetch(part.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": RECORDING_CONTENT_TYPE },
        body: blob,
      });
      if (!response.ok) throw new Error(`S3 PUT ${response.status}`);

      const completed = await completeCaptureUploadAction(meetingId, part.seq, {
        segmentSeq,
        s3Key: keyOf(part.presignedUrl),
        sizeBytes: blob.size,
      });
      if (!completed.ok) throw new Error(completed.error ?? "complete 실패");

      consecutiveFailures = 0;
    } catch {
      consecutiveFailures += 1;
      if (consecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
        handlers.onFailure("녹음 파일을 서버에 올리지 못하고 있습니다. 자막은 계속 기록됩니다.");
      }
    }
  };

  return {
    enqueue(blob) {
      chain = chain.then(() => uploadOne(blob));
    },
    flush() {
      return chain;
    },
  };
}
