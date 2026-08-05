"use client";

import { ScreenError } from "@/components/common/screen-error";

interface ProjectsErrorProps {
  reset: () => void;
}

export default function Error({ reset }: ProjectsErrorProps) {
  return <ScreenError title="프로젝트를 불러오지 못했습니다" reset={reset} />;
}
