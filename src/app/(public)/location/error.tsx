"use client";

import { ScreenError } from "@/components/common/screen-error";

export default function Error({ reset }: { reset: () => void }) {
  return <ScreenError title="오시는 길을 불러오지 못했어요" reset={reset} />;
}
