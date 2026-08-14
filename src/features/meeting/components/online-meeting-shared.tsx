"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

/**
 * 제출 중인지를 창에 올려 보낸다 — `OnlineMeetingStep1`·`OnlineMeetingStep2`가 함께 쓴다
 * (`RoomReservationDialog`의 `PendingReporter`와 같은 이유).
 */
export function PendingReporter({ onChange }: { onChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onChange(pending);
  }, [pending, onChange]);

  return null;
}
