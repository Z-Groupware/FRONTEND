"use client";

import { useCallback, useState } from "react";

import { confirmProjectAttachmentAction, issueProjectAttachmentUploadUrlAction } from "./actions";

/**
 * 업로드 진행 상태 — 화면이 이 넷만 보고 그린다.
 * ⚠️ `failed`에는 문장이 **반드시** 실린다 — 조용히 멈추면 파일이 사라진 것처럼 보인다(§정직성).
 */
export type AttachmentUploadPhase =
  { kind: "idle" } | { kind: "uploading" } | { kind: "done" } | { kind: "failed"; message: string };

/**
 * 프로젝트 첨부 업로드 3단계를 도는 훅 — 발급(서버 액션) → **브라우저가 S3에 직접 PUT** →
 * 확정(서버 액션). 로직은 컴포넌트에 안 둔다(§폴더·네이밍: 로직=커스텀훅).
 *
 * ⚠️ **PUT은 브라우저에서 한다.** BE는 바이너리를 안 받고(§핵심 4원칙 ②의 예외가 아니라
 *    설계다 — [확인] BE `ProjectAttachmentController` 주석 "BE는 바이너리를 받지 않는다"),
 *    presigned URL은 서명 자체가 인증이라 우리 토큰이 브라우저로 나갈 일도 없다.
 * ⚠️ **헤더를 손대지 않는다.** presign 서명에 Content-Type이 안 들어 있어([확인] BE
 *    `ProjectAttachmentS3StorageAdapter.issueUploadUrl` — `PutObjectRequest`가 bucket·key뿐)
 *    브라우저가 파일 타입으로 알아서 채우는 값이 그대로 통과한다. 굳이 세팅하면
 *    서명 규약이 바뀌는 날 여기가 먼저 깨진다.
 * ⚠️ **재시도해도 안전하다.** 발급은 매번 새 키(UUID)를 받고, 확정은 같은 `fileUrl`이면
 *    기존 레코드를 돌려준다(idempotent — [확인] BE `ProjectAttachmentService.confirm`).
 */
export function useAttachmentUpload(onDone: () => void) {
  const [phase, setPhase] = useState<AttachmentUploadPhase>({ kind: "idle" });

  const upload = useCallback(
    async (projectId: number, file: File) => {
      setPhase({ kind: "uploading" });

      const issued = await issueProjectAttachmentUploadUrlAction(projectId, file.name, file.size);
      if (!issued.ok) {
        setPhase({ kind: "failed", message: issued.message });
        return;
      }

      // `uploadUrl`이 없으면 목 단계 — PUT을 건너뛰고 확정으로 간다(UI 계약 `AttachmentUploadTicket`).
      if (issued.ticket.uploadUrl) {
        try {
          const response = await fetch(issued.ticket.uploadUrl, { method: "PUT", body: file });
          if (!response.ok) {
            // S3 오류 본문은 XML이라 사람에게 못 보여준다 — 상태 코드만 단서로 남긴다.
            setPhase({
              kind: "failed",
              message: `저장소가 업로드를 거부했습니다 (HTTP ${response.status}). 다시 시도해 주세요.`,
            });
            return;
          }
        } catch {
          setPhase({
            kind: "failed",
            message: "업로드 중 연결이 끊겼습니다. 네트워크를 확인하고 다시 시도해 주세요.",
          });
          return;
        }
      }

      const confirmed = await confirmProjectAttachmentAction(projectId, {
        fileName: file.name,
        fileUrl: issued.ticket.fileUrl,
        fileSize: file.size,
      });
      if (!confirmed.ok) {
        setPhase({ kind: "failed", message: confirmed.message });
        return;
      }

      setPhase({ kind: "done" });
      onDone();
    },
    [onDone],
  );

  return { phase, upload };
}
