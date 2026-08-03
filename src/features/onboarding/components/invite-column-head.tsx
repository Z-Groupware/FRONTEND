/**
 * 초대 목록의 열 머리.
 *
 * ⚠️ 행(`InviteRow`)과 **같은 padding·gap·칸 너비·shrink 규칙**을 쓴다. 이메일 칸을 `flex-1`
 *    하나로 두면 폭이 좁아질 때 머리만 먼저 줄어 **열이 통째로 밀린다** — 줄어들더라도 같이 줄어야 한다.
 * ⚠️ 행에서 떼어 둔다. 두 곳이 같은 숫자를 보고 있어서, 한 파일에 두면 어느 쪽을 고치는지
 *    헷갈리고 파일도 200줄을 넘긴다.
 */
export function InviteColumnHead() {
  return (
    <div className="text-muted-foreground/60 border-border bg-card flex h-7 shrink-0 items-center gap-2 border-b px-4 text-[11px] leading-4">
      <span className="w-5 shrink-0" aria-hidden />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-[196px] min-w-0 shrink pl-2">이메일</span>
        <span
          className="sr-only md:not-sr-only md:block md:w-[208px] md:min-w-0 md:shrink"
          aria-hidden
        />
      </span>
      <span className="w-[92px] shrink-0 text-center">부서</span>
      <span className="w-[92px] shrink-0 text-center">역할</span>
      <span className="w-[92px] shrink-0 text-center">직급</span>
      <span className="w-[44px] shrink-0 text-center">Admin</span>
      <span className="size-6 shrink-0" aria-hidden />
    </div>
  );
}
