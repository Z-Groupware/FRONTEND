"use client";

import { useEffect, useRef } from "react";

import { markNoticeReadAction } from "../actions";

/**
 * 공지 상세를 열면 그 공지를 읽음 처리한다 — 화면엔 안 보이는 폼을 마운트 시 한 번 제출한다.
 *
 * ⚠️ **폼 제출로 부른다**(useEffect에서 액션을 직접 호출하지 않는다) — 직접 호출은 dev에서 액션이
 *    RSC와 다른 모듈 인스턴스에서 돌아 목 변경이 목록 렌더에 안 보였다. 폼 액션 경로는 작성(create)과
 *    같은 경로라 변경이 그대로 반영된다. 액션이 `revalidatePath`로 목록·사이드바를 갱신한다.
 */
export function MarkNoticeRead({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={markNoticeReadAction} className="hidden" aria-hidden>
      <input type="hidden" name="id" value={id} />
    </form>
  );
}
