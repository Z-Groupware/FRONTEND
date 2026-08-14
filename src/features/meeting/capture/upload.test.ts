jest.mock("./actions", () => ({
  presignCaptureUploadAction: jest.fn(),
  completeCaptureUploadAction: jest.fn(),
}));

import { completeCaptureUploadAction, presignCaptureUploadAction } from "./actions";
import { createSliceUploader } from "./upload";

/**
 * 오디오 조각 업로더 — presign 배치 소진·S3 키 파싱·연속 실패 알림만 확인한다.
 * ⚠️ 실제 S3 PUT은 `fetch`를 목으로 대체한다 — 네트워크 계층은 여기서 안 본다.
 */

const presignMock = presignCaptureUploadAction as unknown as jest.Mock;
const completeMock = completeCaptureUploadAction as unknown as jest.Mock;

function batch(segmentSeq: number, seqs: number[]) {
  return {
    ok: true,
    data: {
      segmentSeq,
      parts: seqs.map((seq) => ({
        seq,
        presignedUrl: `https://bucket.s3.amazonaws.com/companies/1/meetings/9/segments/${segmentSeq}/parts/${seq}.webm?X-Amz-Signature=abc`,
        expiresIn: 300,
      })),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  completeMock.mockResolvedValue({ ok: true });
});

it("배치가 바닥나면 다음 배치를 받아 이어서 올린다", async () => {
  /*
    ⚠️ threshold(3)보다 작은 배치라 매번 pop할 때마다 배경 refill이 걸린다 — 정확히 몇 번
       불렸는지는 타이밍에 좌우되는 구현 세부라 안 세고, `mockResolvedValue`로 그 이후
       호출도 항상 답을 받게만 해 둔다.
  */
  presignMock.mockResolvedValueOnce(batch(0, [1, 2])).mockResolvedValue(batch(0, [3, 4, 5]));

  const uploader = createSliceUploader(9, { onFailure: jest.fn() });
  uploader.enqueue(new Blob(["a"]));
  uploader.enqueue(new Blob(["b"]));
  uploader.enqueue(new Blob(["c"]));
  await uploader.flush();

  expect(presignMock).toHaveBeenCalled();
  expect(completeMock).toHaveBeenCalledTimes(3);
  expect(completeMock).toHaveBeenNthCalledWith(1, 9, 1, {
    segmentSeq: 0,
    s3Key: "companies/1/meetings/9/segments/0/parts/1.webm",
    sizeBytes: expect.any(Number),
  });
  expect(completeMock).toHaveBeenNthCalledWith(2, 9, 2, {
    segmentSeq: 0,
    s3Key: "companies/1/meetings/9/segments/0/parts/2.webm",
    sizeBytes: expect.any(Number),
  });
});

it("presigned URL 경로에서 S3 키를 정확히 뽑아 complete에 실어 보낸다", async () => {
  presignMock.mockResolvedValue(batch(2, [1, 2, 3]));

  const uploader = createSliceUploader(9, { onFailure: jest.fn() });
  uploader.enqueue(new Blob(["a"]));
  await uploader.flush();

  expect(completeMock).toHaveBeenCalledWith(9, 1, {
    segmentSeq: 2,
    s3Key: "companies/1/meetings/9/segments/2/parts/1.webm",
    sizeBytes: expect.any(Number),
  });
});

it("S3 PUT이 연속 3번 실패하면 알리고, 성공하면 실패 횟수가 되돌아간다", async () => {
  presignMock.mockResolvedValue(batch(0, [1, 2, 3, 4]));
  const onFailure = jest.fn();
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({ ok: true });

  const uploader = createSliceUploader(9, { onFailure });
  uploader.enqueue(new Blob(["a"]));
  uploader.enqueue(new Blob(["b"]));
  uploader.enqueue(new Blob(["c"]));
  uploader.enqueue(new Blob(["d"]));
  await uploader.flush();

  expect(onFailure).toHaveBeenCalledTimes(1);
  expect(completeMock).toHaveBeenCalledTimes(1); // 네 번째만 PUT이 성공해 complete까지 감
});

it("순서대로, 하나씩 올린다 — 동시에 여러 조각을 PUT하지 않는다", async () => {
  presignMock.mockResolvedValue(batch(0, [1, 2, 3]));
  let inFlight = 0;
  let maxInFlight = 0;
  (global.fetch as jest.Mock).mockImplementation(async () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 5));
    inFlight -= 1;
    return { ok: true };
  });

  const uploader = createSliceUploader(9, { onFailure: jest.fn() });
  uploader.enqueue(new Blob(["a"]));
  uploader.enqueue(new Blob(["b"]));
  await uploader.flush();

  expect(maxInFlight).toBe(1);
});
