"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResultDialog } from "@/components/common/result-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
 * 계정 발급 — **모달**로 연다(전용 라우트를 두지 않는다).
 *
 * ⚠️ 목록에서 하는 일이라 목록을 떠나지 않는다. 공지 작성(`NoticeCreateDialog`)·할 일 추가와
 *    같은 패턴이다 — 한 번 쓰고 마는 폼에 주소를 만들면 뒤로 가기가 어색해진다.
 * ⚠️ 비밀번호를 받지 않는다. 발급하면 아이디와 첫 비밀번호가 **메일로 나간다** — 화면에서
 *    정하면 그 값을 누군가 알고 있게 된다(§온보딩 3단계와 같은 방식).
 * ⚠️ **보내기 전에 한 번 묻고**(ConfirmDialog), 끝나면 **결과 창**으로 알린다(ResultDialog).
 *    토스트는 사라지는데 여기서 알아야 할 건 "어디로 메일이 갔는지"라 남아 있어야 한다.
 * ⚠️ 검증 오류는 **칸 밑 인라인**, 칸과 무관한 실패만 밑단 문구다(§토스트).
 */
export function AccountIssueDialog({ teamNames }: { teamNames: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<AccountDraft>({
    name: "",
    email: "",
    teamName: teamNames[0] ?? "",
    position: "",
    authority: AUTHORITY.MEMBER,
  });
  const [errors, setErrors] = useState<AccountErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [issued, setIssued] = useState<{ id: number; name: string; email: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    // 고치는 순간 그 칸의 오류는 감춘다 — 다 고칠 때까지 빨간 글씨를 남길 이유가 없다
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const reset = () => {
    setDraft({
      name: "",
      email: "",
      teamName: teamNames[0] ?? "",
      position: "",
      authority: AUTHORITY.MEMBER,
    });
    setErrors({});
    setMessage(null);
  };

  /** 보내기 전에 화면에서 먼저 본다 — 서버 왕복 없이 잡히는 건 여기서 잡는다 */
  const handleSubmit = () => {
    const found = validateAccount(draft);
    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const handleIssue = () =>
    startTransition(async () => {
      const result = await issueAccountAction(draft);
      setIsConfirming(false);

      if (result.message) {
        setMessage(result.message);
        return;
      }
      if (Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
        return;
      }

      /*
        ⚠️ 여기서 **비우지 않는다.** 확인 창이 닫히는 동안 아직 화면에 남아 있어서,
           지금 비우면 "이 사람 님의 계정을 발급할까요?"로 글자가 바뀌는 게 보인다 —
           결과 창을 닫을 때 비운다.
      */
      setIsOpen(false);
      setIssued(result.issued ?? null);
      toast.success("계정을 발급했습니다");
      // 목록은 서버 컴포넌트라 다시 받아온다(`revalidatePath`가 캐시를 이미 비웠다)
      router.refresh();
    });

  /** 라벨 · 입력 · 오류 한 덩이 — 오류 자리는 비워 두지 않는다(떠도 창이 안 출렁인다) */
  const field = (key: keyof AccountDraft, label: string, control: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`account-${key}`}>{label}</Label>
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

      <Dialog
        open={isOpen}
        onOpenChange={(next) => {
          // ⚠️ 보내는 중엔 Esc·바깥 클릭으로 안 닫는다 — 요청은 계속 가는데 화면만 사라진다
          if (!next && isPending) return;
          setIsOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>계정 발급</DialogTitle>
            <DialogDescription>
              발급하면{" "}
              <span className="text-foreground font-medium">아이디와 첫 비밀번호가 메일로</span>{" "}
              나갑니다. 비밀번호는 여기서 정하지 않습니다.
            </DialogDescription>
          </DialogHeader>

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

            <div className="sm:col-span-2">
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
            </div>
          </div>

          <div className="flex items-center gap-2">
            {message && (
              <p role="alert" className="text-destructive mr-auto text-[12px] leading-4 break-keep">
                {message}
              </p>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={message ? "" : "ml-auto"}
              disabled={isPending}
              onClick={() => setIsOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ink"
              disabled={isPending || teamNames.length === 0}
              onClick={handleSubmit}
            >
              계정 발급
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ⚠️ 누르는 순간 메일이 나간다 — 어디로 가는지 적고 한 번 더 받는다 */}
      <ConfirmDialog
        isOpen={isConfirming}
        onOpenChange={() => setIsConfirming(false)}
        title={`${draft.name || "이 사람"} 님의 계정을 발급할까요?`}
        description={
          <>
            {draft.email}으로 아이디와 첫 비밀번호가 바로 나갑니다.
            <br />
            보낸 메일은 되돌릴 수 없습니다.
          </>
        }
        confirmLabel="발급"
        isPending={isPending}
        pendingLabel="발급 중…"
        onConfirm={handleIssue}
      />

      {/*
        ⚠️ 결과는 **남는 창**으로 알린다. 여기서 알아야 할 건 "어디로 메일이 갔는지"인데
           토스트는 몇 초 뒤 사라진다 — 다음 걸음(그 사람 보기)도 같이 준다.
      */}
      <ResultDialog
        isOpen={issued !== null}
        onOpenChange={() => {
          setIssued(null);
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
