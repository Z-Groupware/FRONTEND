/** 공지 삭제 확인창 문구 — `notice-delete-button.tsx` 하나만 쓰지만, 카피 하드코딩 금지
 * 원칙(CLAUDE.md §도메인 상수)에 맞춰 컴포넌트 밖으로 뺐다. 제목은 공지 제목을 끼워 넣어야
 * 해서 여기 넣지 않고 부르는 쪽에서 그대로 조립한다. */
export const NOTICE_DELETE_CONFIRM = {
  description: "삭제하면 공지 내용을 되돌릴 수 없습니다.",
  confirmLabel: "삭제",
  pendingLabel: "삭제 중",
} as const;
