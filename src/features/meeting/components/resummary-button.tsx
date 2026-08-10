"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { requestResummaryAction } from "../actions";

/**
 * [다시 요약하기] — **재분석 요청만** 한다(WORKFLOW §3-5).
 *
 * ⚠️ **잎사귀 하나만 클라이언트다**(§핵심 4원칙 ①). 카드도 목록도 서버에서 그리고,
 *    누르는 이 버튼만 `use client`다.
 * ⚠️ **누르는 동안 잠근다.** 분석은 몇 분짜리라 반응이 바로 없어 두 번 세 번 누르게 되고,
 *    그때마다 잡이 하나씩 더 걸린다.
 * ⚠️ 결과는 토스트다 — 화면이 바뀌긴 하지만(배지가 요약 중으로) 실패했을 때 말해 줄 자리가
 *    달리 없다(§토스트: 변경 결과 피드백).
 */
export function ResummaryButton({
  meetingId,
  className,
}: {
  meetingId: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={className}
      onClick={() => {
        startTransition(async () => {
          const result = await requestResummaryAction(meetingId);
          if (result.ok) {
            /*
              ⚠️ **`revalidatePath`만으로는 이 화면이 안 바뀐다**(실측 2026-08-10). 서버 캐시는
                 지워지지만 이미 그려진 라우터 트리는 그대로라, 새로고침해야 배지가 요약 중으로
                 바뀌었다 — 눌러도 아무 일 없는 것처럼 보이니 또 누른다.
            */
            router.refresh();
            toast.success("다시 요약을 시작했습니다");
            return;
          }
          toast.error(result.error ?? "다시 요약하지 못했습니다");
        });
      }}
    >
      <RotateCw className="size-3.5" aria-hidden />
      {/*
        ⚠️ **"다시 요약"까지만 적는다.** 카드 발치는 일시·장소·인원과 자리를 나눠 쓰는데
           "다시 요약하기"는 그 줄을 밀어 **회의실 이름을 두 글자로 잘라 놨다**(대…).
           뜻은 그대로고 자리는 산다 — 회의 상세에서는 긴 라벨을 쓴다.
      */}
      <span>{isPending ? "요청 중" : "다시 요약"}</span>
    </button>
  );
}
