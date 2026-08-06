/**
 * 공지 작성·수정 모달 문구 — `notice-create-dialog.tsx`·`notice-edit-dialog.tsx`가 같이 쓴다.
 * 화면 컴포넌트에 한글을 직접 적지 않는다(CLAUDE.md §도메인 상수: 라벨 하드코딩 금지).
 */
export const NOTICE_ACTION = {
  CREATE: "CREATE",
  EDIT: "EDIT",
} as const;
export type NoticeAction = (typeof NOTICE_ACTION)[keyof typeof NOTICE_ACTION];

export const NOTICE_ACTION_LABEL: Record<
  NoticeAction,
  {
    /** 트리거 버튼 글자 */
    trigger: string;
    dialogTitle: string;
    submitLabel: string;
    /** 성공 토스트 — 공지 제목을 끼워 넣는다 */
    successToast: (noticeTitle: string) => string;
  }
> = {
  CREATE: {
    trigger: "새 공지",
    dialogTitle: "새 공지 작성",
    submitLabel: "발행",
    successToast: (noticeTitle) => `'${noticeTitle}' 공지를 발행했습니다`,
  },
  EDIT: {
    trigger: "수정",
    dialogTitle: "공지 수정",
    submitLabel: "수정",
    successToast: (noticeTitle) => `'${noticeTitle}' 공지를 수정했습니다`,
  },
};

/** 공지 삭제 확인창 문구 — `notice-delete-button.tsx` 하나만 쓰지만, 카피 하드코딩 금지
 * 원칙(CLAUDE.md §도메인 상수)에 맞춰 컴포넌트 밖으로 뺐다. */
export const NOTICE_DELETE_CONFIRM = {
  /** 확인창 제목 — 공지 제목을 끼워 넣는다 */
  title: (noticeTitle: string) => `'${noticeTitle}' 공지를 삭제할까요?`,
  description: "삭제하면 공지 내용을 되돌릴 수 없습니다.",
  confirmLabel: "삭제",
  pendingLabel: "삭제 중",
} as const;
