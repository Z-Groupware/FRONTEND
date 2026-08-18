"use client";

import { Loader2, Paperclip, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";

import { deleteProjectAttachmentAction, getProjectAttachmentDownloadUrlAction } from "../actions";
import type { ProjectAttachment } from "../types";
import { useAttachmentUpload } from "../use-attachment-upload";

interface ProjectAttachmentManagerProps {
  projectId: number;
  attachments: ProjectAttachment[];
  /**
   * OWNER만 true — 그 외엔 조회·다운로드만(`canEditProjectPlan`, WORKFLOW.md §1
   * "수정·첨부파일 교체는 Owner만"). 화면 숨김은 UX일 뿐이라 서버 액션에서도 다시 검사한다.
   */
  canEdit: boolean;
}

/**
 * 프로젝트 기획 탭의 첨부파일 — 조회(전 구성원)는 그대로, **교체(삭제 + 새로 올리기)만
 * Owner에게 연다**(FE 감사 항목 #11).
 *
 * ⚠️ **BE에 "교체" API가 없다.** 있는 건 업로드(발급→확정)·삭제 둘뿐이라 교체는 이 화면이
 *    두 동작을 이어 붙인 것이다 — 삭제가 실패하면 새로 올리는 시도로 넘어가지 않는다.
 * ⚠️ 삭제는 **되돌릴 수 없다** — `ConfirmDialog`(파괴적 확인)를 반드시 거친다(§파괴적 작업 확인).
 */
export function ProjectAttachmentManager({
  projectId,
  attachments,
  canEdit,
}: ProjectAttachmentManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { phase: uploadPhase, upload } = useAttachmentUpload(() => router.refresh());
  const isUploading = uploadPhase.kind === "uploading";

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteProjectAttachmentAction(projectId, pendingDelete.id);
    setIsDeleting(false);

    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }

    setPendingDelete(null);
    router.refresh();
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일을 다시 골라도 change가 뜨게 비운다
    if (!file) return;
    void upload(projectId, file);
  }

  if (!canEdit) {
    return <ReadOnlyAttachmentList projectId={projectId} attachments={attachments} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-2">
              <DownloadLink projectId={projectId} attachment={attachment} />
              <button
                type="button"
                onClick={() => setPendingDelete(attachment)}
                aria-label={`${attachment.fileName} 삭제`}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={handlePickFile}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            올리는 중
          </>
        ) : (
          "첨부파일 추가"
        )}
      </Button>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        title="첨부파일을 지울까요?"
        description={
          <>
            <strong className="text-foreground">{pendingDelete?.fileName}</strong> 파일이 사라지고
            되돌릴 수 없습니다.
          </>
        }
        confirmLabel="삭제"
        isDestructive
        isPending={isDeleting}
        pendingLabel="삭제 중"
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

/** Owner가 아닐 때 — 다운로드만 되는 목록. 삭제·추가 UI가 없다. */
function ReadOnlyAttachmentList({
  projectId,
  attachments,
}: {
  projectId: number;
  attachments: ProjectAttachment[];
}) {
  if (attachments.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <DownloadLink projectId={projectId} attachment={attachment} />
        </li>
      ))}
    </ul>
  );
}

function DownloadLink({
  projectId,
  attachment,
}: {
  projectId: number;
  attachment: ProjectAttachment;
}) {
  async function handleClick() {
    const url = await getProjectAttachmentDownloadUrlAction(projectId, attachment.id);
    if (!url) {
      toast("다운로드는 아직 연동되지 않았습니다");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-[13px] leading-5 underline-offset-2 hover:underline"
    >
      <Paperclip className="size-3.5" aria-hidden />
      {attachment.fileName}
    </button>
  );
}
