"use client";

import { ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResultDialog } from "@/components/common/result-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
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
  AUTHORITY,
  type Authority,
  AUTHORITY_LABEL,
  POSITION_AUTHORITIES,
} from "@/constants/authority";
import { cn } from "@/lib/utils";

import { validateAccount } from "../account-validate";
import { issueAccountAction } from "../manage-actions";
import type { AccountDraft, AccountErrors } from "../manage-types";

/**
 * 계정 발급 — **공용 확인 창**(`ConfirmDialog`)에 폼을 담아 연다.
 *
 * ⚠️ 전용 라우트를 두지 않는다. 목록에서 하는 일이라 목록을 떠나지 않는다 — 한 번 쓰고 마는
 *    폼에 주소를 만들면 뒤로 가기가 어색해진다(공지 작성과 같은 판단).
 * ⚠️ 모달 껍데기를 직접 그리지 않는다. `ConfirmDialog`의 `children`이 "제목과 버튼 사이"
 *    자리라 폼이 그대로 들어간다 — 창마다 다르게 생기면 같은 서비스로 안 읽힌다.
 * ⚠️ **확인 창을 두 번 겹치지 않는다.** 이 창 자체가 확인이다 — 설명이 "메일이 바로 나가고
 *    되돌릴 수 없다"고 말하고 실행 버튼이 [계정 발급]이다. 똑같이 생긴 창을 하나 더 띄우면
 *    무엇을 두 번 확인하는지 알 수 없다.
 * ⚠️ 비밀번호를 받지 않는다. 아이디와 첫 비밀번호는 **메일로 나간다** — 화면에서 정하면
 *    그 값을 누군가 알고 있게 된다(§온보딩 3단계와 같은 방식).
 * ⚠️ 끝나면 **결과 창**으로 알린다. 여기서 알아야 할 건 "어디로 메일이 갔는지"라 토스트처럼
 *    사라지면 안 된다 — 다음 걸음(그 사람 보기)도 같이 준다.
 */
export function AccountIssueDialog({ teamNames }: { teamNames: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<AccountDraft>(() => emptyDraft(teamNames));
  const [errors, setErrors] = useState<AccountErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ id: number; name: string; email: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    // 고치는 순간 그 칸의 오류는 감춘다 — 다 고칠 때까지 빨간 글씨를 남길 이유가 없다
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    /*
      ⚠️ 밑단 문구도 같이 지운다. 안 지우면 옛 실패 사유가 남아, 이번엔 다른 이유로 막혔는데
         **서로 다른 두 사유가 동시에** 보인다.
    */
    setMessage(null);
  };

  const reset = () => {
    setDraft(emptyDraft(teamNames));
    setErrors({});
    setMessage(null);
  };

  const handleIssue = () => {
    /*
      ⚠️ 보내기 전에 **화면에서 먼저 본다.** 서버 왕복 없이 잡히는 건 여기서 잡아야
         창이 닫혔다 열렸다 하지 않는다. 서버는 같은 함수로 다시 본다(§검증은 한 벌).
    */
    const found = validateAccount(draft);
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const result = await issueAccountAction(draft);

      if (result.message) {
        setMessage(result.message);
        return;
      }
      if (Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
        return;
      }

      setIsOpen(false);
      setIssued(result.issued ?? null);
      toast.success("계정을 발급했습니다");
      // 목록은 서버 컴포넌트라 다시 받아온다(`revalidatePath`가 캐시를 이미 비웠다)
      router.refresh();
    });
  };

  /** 라벨 · 입력 · 오류 한 덩이 — 오류 자리는 비워 두지 않는다(떠도 창이 안 출렁인다) */
  const field = (
    key: keyof AccountDraft,
    label: string,
    control: React.ReactNode,
    /*
      ⚠️ 가리킬 입력이 없으면 **라벨을 붙이지 않는다.** 없는 id를 가리키는 `htmlFor`는
         스크린리더에서 이름 없는 라벨이 되어 오히려 방해가 된다(§a11y).
    */
    hasControl = true,
  ) => (
    <div className="flex flex-col gap-1.5 text-left">
      {hasControl ? (
        <Label htmlFor={`account-${key}`}>{label}</Label>
      ) : (
        <p className="text-sm leading-none font-medium">{label}</p>
      )}
      {control}
      <p
        id={`account-${key}-error`}
        role="alert"
        className="text-destructive min-h-4 text-[12px] leading-4"
      >
        {errors[key]}
      </p>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ink"
        className="gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <UserPlus className="size-3.5" aria-hidden />
        계정 발급
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        onOpenChange={(next) => {
          // ⚠️ 보내는 중엔 Esc·바깥 클릭으로 안 닫는다 — 요청은 계속 가는데 화면만 사라진다
          if (isPending) return;
          setIsOpen(next);
          if (!next) reset();
        }}
        title="계정 발급"
        description={
          <>
            발급하면{" "}
            <span className="text-foreground font-medium">아이디와 첫 비밀번호가 메일로</span> 바로
            나갑니다. 보낸 메일은 되돌릴 수 없습니다.
            {/*
              ⚠️ 겸직을 켰으면 **무엇이 열리는지** 적는다. 권한이 늘어나는 일이라 발급과 함께
                 조용히 나가면 안 된다(직급·권한 변경 창과 같은 규칙).
            */}
            {draft.isAdmin && (
              <>
                <br />
                관리자 겸직으로 나가서 사원·회의실 관리와 구독·저장소 화면에 들어갈 수 있습니다.
              </>
            )}
          </>
        }
        confirmLabel="계정 발급"
        isPending={isPending}
        pendingLabel="발급 중…"
        onConfirm={handleIssue}
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {field(
            "name",
            "이름",
            <Input
              id="account-name"
              value={draft.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="홍길동"
              aria-invalid={Boolean(errors.name)}
              aria-describedby="account-name-error"
            />,
          )}

          {field(
            "email",
            "이메일",
            <Input
              id="account-email"
              type="email"
              value={draft.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="name@company.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby="account-email-error"
            />,
          )}

          {field(
            "teamName",
            "소속 팀",
            teamNames.length > 0 ? (
              <Select
                items={Object.fromEntries(teamNames.map((name) => [name, name]))}
                value={draft.teamName}
                onValueChange={(value) => set("teamName", value ?? "")}
              >
                <SelectTrigger id="account-teamName" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {teamNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              /* ⚠️ 팀이 하나도 없으면 고를 게 없다 — 빈 셀렉트 대신 갈 곳을 말한다 */
              <p className="text-muted-foreground py-2 text-[13px] leading-5 break-keep">
                기업 설정에서 팀을 먼저 만들어 주세요
              </p>
            ),
            teamNames.length > 0,
          )}

          {field(
            "position",
            "직급",
            <Input
              id="account-position"
              value={draft.position}
              onChange={(event) => set("position", event.target.value)}
              placeholder="사원"
              aria-invalid={Boolean(errors.position)}
              aria-describedby="account-position-error"
            />,
          )}

          {field(
            "authority",
            "권한",
            <Select
              items={AUTHORITY_LABEL}
              value={draft.authority}
              onValueChange={(value) => set("authority", value as Authority)}
            >
              <SelectTrigger id="account-authority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              {/* ⚠️ Owner는 회사에 하나라 발급 대상이 아니다(WORKFLOW §11) */}
              <SelectContent alignItemWithTrigger={false}>
                {POSITION_AUTHORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {AUTHORITY_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )}

          {/*
            ⚠️ **권한 칸 오른쪽에 나란히 둔다**(온보딩 초대 줄과 같은 자리). 겸직은 권한을
               대체하는 값이 아니라 그 위에 덧붙는 플래그라, 권한 셀렉트 안에 넣으면
               "Member 대신 Admin"으로 읽힌다(§권한: 축이 2개다).
            ⚠️ 높이를 `h-8`로 맞춘다 — 옆 셀렉트와 같은 값이라 두 칸의 위아래가 한 선에 선다.
               `field`를 그대로 써서 라벨·오류 자리까지 다른 칸과 같은 구조를 갖는다.
            ⚠️ 켜짐을 **채움과 아이콘**으로 알린다 — 색으로 알리는 건 에러뿐이다(§디자인 토큰).
               온보딩 `InviteAdminToggle`이 같은 방식이다.
          */}
          {field(
            "isAdmin",
            "관리자 겸직",
            <button
              type="button"
              id="account-isAdmin"
              aria-pressed={draft.isAdmin}
              onClick={() => set("isAdmin", !draft.isAdmin)}
              className={cn(
                "focus-visible:ring-ring flex h-8 w-full items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-hidden",
                draft.isAdmin
                  ? "bg-foreground text-background border-foreground"
                  : "border-input text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              <ShieldCheck className="size-4 shrink-0" aria-hidden />
              {draft.isAdmin ? "부여함" : "부여 안 함"}
            </button>,
          )}

          {/* 칸과 무관한 실패는 칸 밑이 아니라 여기 — 그 칸이 틀렸다는 뜻이 아니다 */}
          {message && (
            <p
              role="alert"
              className="text-destructive text-left text-[12px] leading-4 break-keep sm:col-span-2"
            >
              {message}
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ResultDialog
        isOpen={issued !== null}
        onOpenChange={() => {
          setIssued(null);
          // ⚠️ 여기서 비운다 — 확인 창이 닫히는 동안 비우면 글자가 바뀌는 게 보인다
          reset();
        }}
        title="계정을 발급했습니다"
        description={
          <>
            {issued?.email}으로 아이디와 첫 비밀번호를 보냈습니다.
            <br />첫 로그인 때 비밀번호를 바꾸게 됩니다.
          </>
        }
        action={
          <Link
            href={issued ? `/manage/members/${issued.id}` : "/manage/members"}
            className={cn(buttonVariants({ variant: "ink" }), "w-full")}
          >
            {issued?.name} 님 보기
          </Link>
        }
      />
    </>
  );
}

/** 팀이 하나뿐이면 고를 것도 없으니 첫 팀을 미리 넣어 둔다 */
function emptyDraft(teamNames: string[]): AccountDraft {
  return {
    name: "",
    email: "",
    teamName: teamNames[0] ?? "",
    position: "",
    authority: AUTHORITY.MEMBER,
    // ⚠️ 겸직은 **기본 꺼짐**이다. 권한을 주는 값이라 미리 켜 두면 확인 없이 나간다
    isAdmin: false,
  };
}
