import { ZAssembleLoader } from "@/components/common/z-assemble-loader";

/** 전역 로딩 — 화면이 준비되는 동안 Z 조각이 맞춰진다. */
export default function Loading() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <ZAssembleLoader />
    </div>
  );
}
