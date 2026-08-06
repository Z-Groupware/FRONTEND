"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_ELIGIBLE_AUTHORITIES,
  AUTHORITY,
  type Authority,
  AUTHORITY_LABEL,
  POSITION_AUTHORITIES,
} from "@/constants/authority";

import { canChangeGradeOf } from "../grade";
import { changeMemberGradeAction } from "../manage-actions";
import type { ManagedMember } from "../manage-types";

/**
 * 직급 및 권한 변경 — **Owner·Admin 겸직자 둘 다** 쓴다(WORKFLOW §11).
 *
 * ⚠️ 권한 선택지는 **Leader·Member뿐**이다. Owner는 회사에 하나라 여기서 만들지 않고,
 *    Admin은 권한이 아니라 **위에 덧붙는 겸직**이라 별도 칸이다(§권한: 축이 2개다).
 * ⚠️ Owner인 사람에게는 Admin 칸을 안 보인다 — 이미 다 되는 사람에게 겸직을 붙이면
 *    "Admin을 빼면 권한이 줄어든다"는 오해가 생긴다(`ADMIN_ELIGIBLE_AUTHORITIES`).
 * ⚠️ 안 고쳤으면 [저장]을 안 연다 — 눌러도 아무 뜻이 없는 저장을 만들지 않는다.
 */
export function MemberGradeCard({ member, canEdit }: { member: ManagedMember; canEdit: boolean }) {
  const [position, setPosition] = useState(member.position);
  const [authority, setAuthority] = useState<Authority>(member.authority);
  const [isAdmin, setIsAdmin] = useState(member.isAdmin);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  /*
    ⚠️ **권한을 올릴 때만** 한 번 더 묻는다. 직급 이름을 고치는 건 되돌리기 쉬운 일이지만,
       Leader 승격과 Admin 부여는 **그 사람이 볼 수 있는 화면이 늘어나는 일**이라 실수로
       누르면 바로 회사 정보가 열린다(§토스트: 무게 있는 변경은 Dialog).
    ⚠️ 내리는 건 안 묻는다 — 권한이 줄어드는 쪽은 잘못 눌러도 다시 올리면 그만이다.
  */
  const [isConfirming, setIsConfirming] = useState(false);

  /*
    ⚠️ 판정을 `lib/permission`에서 가져오지 않는다 — 그 모듈은 `server-only`라 클라이언트
       컴포넌트가 import하면 빌드가 깨진다. 여기서 보는 건 **상수 하나**뿐이고, 진짜 판정은
       Server Action이 다시 한다(§권한: 화면 숨김은 보안이 아니다).
    ⚠️ Owner에게는 Admin 칸을 안 보인다 — 이미 다 되는 사람에게 겸직을 붙이면
       "Admin을 빼면 권한이 줄어든다"는 오해가 생긴다(`ADMIN_ELIGIBLE_AUTHORITIES`).
  */
  const eligible: readonly string[] = ADMIN_ELIGIBLE_AUTHORITIES;
  const showsAdmin = eligible.includes(authority);
  const isDirty =
    position !== member.position ||
    authority !== member.authority ||
    (showsAdmin ? isAdmin : false) !== member.isAdmin;

  const raisesAuthority =
    (authority === AUTHORITY.LEADER && member.authority !== AUTHORITY.LEADER) ||
    (showsAdmin && isAdmin && !member.isAdmin);

  const handleSave = () =>
    startTransition(async () => {
      const result = await changeMemberGradeAction(member.id, {
        position,
        authority,
        // Owner에게는 칸 자체가 없다 — 화면에 없는 값을 보내지 않는다
        isAdmin: showsAdmin ? isAdmin : false,
      });
      if (!result.isSuccess) {
        /*
          ⚠️ 확인 창을 **먼저 닫는다.** 안 닫으면 오류 문구가 창 뒤에 그려져 보이지 않고,
             사용자는 아무 일도 안 일어난 줄 알고 같은 버튼을 다시 누른다.
        */
        setIsConfirming(false);
        setError(result.message ?? "저장하지 못했습니다");
        return;
      }
      setError(null);
      setIsConfirming(false);
      toast.success("직급·권한을 저장했습니다");
    });

  /*
    ⚠️ **대표에게는 이 카드를 아예 안 그린다.** 전에는 카드를 세워 놓고 안에
       "대표 계정은 이 화면에서 바꿀 수 없습니다" 한 줄만 넣었는데, 제목·설명까지 갖춘
       카드가 통째로 아무 일도 안 하는 자리가 됐다 — 오른쪽 칸이 빈 상자 둘로 남았다.
       못 고친다는 사실은 **사람 카드**가 한 줄로 말한다(`MemberProfileCard`).
    ⚠️ 판정은 `canChangeGradeOf` 한 곳이 한다 — 두 카드가 각자 세면 한쪽은 폼을 감추고
       다른 쪽은 이유를 안 적는 상태가 조용히 생긴다.
  */
  if (!canChangeGradeOf(member)) return null;

  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <h2 className="flex items-center gap-2 px-7 pt-6 pb-3 text-[15px] leading-6 font-semibold tracking-[-0.2px]">
        {/* 다른 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        직급·권한 변경
      </h2>
      <p className="text-muted-foreground px-7 pb-5 text-[12px] leading-[18px] break-keep">
        권한은 이 사람이 <span className="text-foreground font-medium">볼 수 있는 화면</span>을
        정합니다. 관리자 권한은 권한을 대체하지 않고 위에 덧붙습니다.
      </p>

      {/*
        ⚠️ 구분선은 **카드 전폭**이다. 상한을 이 줄에 걸면 선이 카드 절반에서 끊겨,
           카드가 반쯤 잘린 것처럼 보인다 — 상한은 안쪽 칸에만 건다.
        ⚠️ 그 상한이 필요한 이유: 카드가 넓어져도 셀렉트 하나가 800px가 되면 라벨과 값이
           멀어져 읽고 쓰기가 나빠진다(§폼 규격을 둔 이유와 같다).
      */}
      <div className="border-border border-t px-7 py-5">
        <div className="flex max-w-[640px] flex-col gap-4">
          <>
            {/*
              ⚠️ **셀렉트가 아니라 토글이다.** 켜고 끄는 값 하나에 목록을 열게 하면 두 번 눌러야
                 하고, 닫힌 칸에 "관리자 권한 없음"이라 적혀 있으면 그게 현재 상태인지 고를 수
                 있는 항목인지 헷갈린다(WORKFLOW §11도 "토글"이라 부른다).
            */}
            {showsAdmin && (
              <label
                htmlFor="member-admin"
                className="border-border bg-secondary/40 flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3"
              >
                <Checkbox
                  id="member-admin"
                  checked={isAdmin}
                  onCheckedChange={(checked) => setIsAdmin(checked === true)}
                  disabled={!canEdit || isPending}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] leading-5 font-medium">관리자 권한 부여</span>
                  <span className="text-muted-foreground text-[12px] leading-4 break-keep">
                    사원·회의실 관리와 구독·저장소 화면에 들어갈 수 있습니다.
                  </span>
                </span>
              </label>
            )}

            {/*
                ⚠️ **권한·직급을 두 열로** 놓는다(§디자인 토큰: 폼 2열). 한 줄에 하나씩 쌓으면
                   카드는 넓은데 칸은 상한에 묶여 오른쪽 절반이 통째로 비고, 카드만 길어져
                   왼쪽 프로필 칸과 높이가 안 맞는다. 좁아지면 한 열로 접힌다.
              */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="member-authority">권한</Label>
                <Select
                  items={AUTHORITY_LABEL}
                  value={authority}
                  onValueChange={(value) => setAuthority(value as Authority)}
                  disabled={!canEdit || isPending}
                >
                  <SelectTrigger id="member-authority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {POSITION_AUTHORITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {AUTHORITY_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="member-position">직급</Label>
                {/*
                ⚠️ 직급은 **회사가 만든 목록**이라 원래 셀렉트가 맞다. 다만 그 목록은
                   기업 설정이 들고 있고 아직 이 화면으로 오지 않는다 — 없는 목록을
                   지어내느니 적게 두고, 목록이 오면 셀렉트로 바꾼다(§연동 검증).
              */}
                <Input
                  id="member-position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  disabled={!canEdit || isPending}
                  placeholder="사원"
                />
              </div>
            </div>
          </>
        </div>
      </div>

      {/*
        ⚠️ 제출 버튼은 **밑단 우측**이다(§디자인 토큰). 폭 가득한 버튼은 이 카드만 다르게
           보이고, 비활성일 때 회색 덩어리가 카드 절반을 차지한다.
      */}
      {canEdit && (
        <div className="border-border flex items-center justify-end gap-2 border-t px-7 py-4">
          {error && (
            <p role="alert" className="text-destructive mr-auto text-[12px] leading-4 break-keep">
              {error}
            </p>
          )}
          <Button
            type="button"
            size="sm"
            variant="ink"
            disabled={isPending || !isDirty}
            onClick={() => (raisesAuthority ? setIsConfirming(true) : handleSave())}
          >
            {isPending ? "저장 중…" : "저장"}
          </Button>
        </div>
      )}

      {/*
        ⚠️ **무엇이 열리는지** 적는다. "권한을 바꿀까요?"만 묻는 건 확인이 아니다 —
           올려 주는 쪽이 무엇을 할 수 있게 되는지 알아야 판단할 수 있다.
      */}
      <ConfirmDialog
        isOpen={isConfirming}
        onOpenChange={() => setIsConfirming(false)}
        title={`${member.name} 님의 권한을 올릴까요?`}
        description={
          <>
            {authority === AUTHORITY.LEADER && member.authority !== AUTHORITY.LEADER && (
              <>
                Leader가 되면 자기 팀 전체를 관리하고 팀원의 인수인계를 중간 승인합니다.
                <br />
              </>
            )}
            {showsAdmin && isAdmin && !member.isAdmin && (
              <>사원·회의실 관리와 구독·저장소 화면에 들어갈 수 있게 됩니다.</>
            )}
          </>
        }
        confirmLabel="권한 올리기"
        isPending={isPending}
        pendingLabel="저장 중…"
        onConfirm={handleSave}
      />
    </section>
  );
}
