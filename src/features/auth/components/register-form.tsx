"use client";

import { ArrowRight, Building2, Mail, MapPin, Phone, ReceiptText, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { type RegisterDraft, type RegisterErrors, validateRegister } from "../register-draft";
import { AddressPicker } from "./address-picker";
import { AuthCard } from "./auth-card";
import { AuthField } from "./auth-field";

/**
 * 기업 등록 신청 — 아직 워크스페이스가 없는 회사가 처음 문을 두드리는 화면.
 *
 * ⚠️ 여기서 계정이 만들어지지 않는다. **신청**이고, 승인 뒤 기업 코드가 메일로 간다.
 *    그래서 비밀번호를 받지 않는다 — 받으면 바로 쓸 수 있다고 오해한다.
 * ⚠️ 지금은 **목**이다. 등록 신청 API가 없다(BE 미개발) — 검증만 하고 완료 화면으로 넘긴다.
 *    연동되면 `submit`을 Server Action 호출로 바꾸고 컴포넌트는 그대로 둔다(§격리막).
 * ⚠️ 브라우저 기본 검증(`required` 말풍선)을 쓰지 않는다 — `noValidate` + 필드 인라인.
 */
const EMPTY: RegisterDraft = {
  companyName: "",
  businessNumber: "",
  managerName: "",
  email: "",
  phone: "",
  place: null,
};

/** 사업자등록번호는 `000-00-00000` 모양으로 굳혀 준다 — 사람마다 다르게 적으면 서버가 고생한다 */
function formatBusinessNumber(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/**
 * 폼을 두 구역으로 나누는 소제목 — 회사 정보 · 관리자 정보.
 *
 * ⚠️ 칸이 여섯이라 한 덩어리로 두면 어디까지가 회사 얘기인지 알 수 없다.
 * ⚠️ 줄이나 상자를 두르지 않는다. 이미 카드 안이라 선을 더하면 층이 하나 더 생긴다.
 */
interface SectionLabelProps {
  title: string;
  hint: string;
}

function SectionLabel({ title, hint }: SectionLabelProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
      <h2 className="text-[13px] leading-5 font-medium">{title}</h2>
      <span className="text-muted-foreground text-[12px] leading-5 break-keep">{hint}</span>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<RegisterDraft>(EMPTY);
  const [errors, setErrors] = useState<RegisterErrors>({});

  /** 고치는 순간 그 칸의 오류는 지운다 — 다 고칠 때까지 빨간 글씨를 남겨 둘 이유가 없다 */
  const handleChange = <K extends keyof RegisterDraft>(key: K, value: RegisterDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateRegister(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // ⚠️ 목이다 — 서버에 보내지 않는다. 실제로는 Server Action이 BFF를 거쳐 BE로 보낸다.
    router.push("/register/done");
  };

  return (
    <AuthCard
      icon={Building2}
      title="기업 등록 신청"
      description="회사 정보를 남겨 주시면 검토 후 기업 코드를 메일로 보내 드려요"
      footer={
        <>
          이미 기업 코드가 있나요?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            로그인
          </Link>
        </>
      }
    >
      {/*
        ⚠️ 칸 사이를 **처음부터 넉넉히** 벌려 둔다. 좁혀 놓고 오류가 뜰 때 벌리면 카드가
           출렁인다 — 오류 자리(`min-h-4`)는 이미 비워 두었으니 뜨고 져도 높이가 그대로다.
        ⚠️ 여기서 늘어나는 건 **지도뿐**이다. 위치를 고르면 지도가 붙으면서 카드가 길어지는데,
           그건 사용자가 방금 한 행동의 결과라 갑작스럽지 않다.
      */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <SectionLabel title="회사 정보" hint="사업자등록증에 적힌 대로" />

        <AuthField
          id="company-name"
          label="기업명"
          icon={Building2}
          value={draft.companyName}
          onValueChange={(value) => handleChange("companyName", value)}
          placeholder="사업자등록증에 적힌 이름"
          autoComplete="organization"
          error={errors.companyName}
        />

        <AuthField
          id="business-number"
          label="사업자등록번호"
          icon={ReceiptText}
          value={draft.businessNumber}
          onValueChange={(value) => handleChange("businessNumber", formatBusinessNumber(value))}
          placeholder="000-00-00000"
          error={errors.businessNumber}
        />

        {/* 위치는 입력이 아니라 **고르는** 일이다 — 칸 대신 지도를 넣는다 */}
        <AuthField
          id="company-address"
          label="회사 위치"
          icon={MapPin}
          value={draft.place?.address ?? ""}
          onValueChange={() => undefined}
          error={errors.place}
        >
          <AddressPicker
            picked={draft.place}
            onPick={(place) => handleChange("place", place)}
            hasError={errors.place !== undefined}
          />
        </AuthField>

        {/*
          ⚠️ 아래 셋은 **첫 관리자(OWNER) 계정이 될 사람**이다. 회사 대표 정보가 아니다 —
             승인되면 이 주소로 코드와 계정이 간다.
          ⚠️ 이걸 회색 안내 상자로 알리지 않는다. 긴 폼 한복판의 잿빛 덩어리는 읽히지 않고
             칸만 끊어 놓는다 — **소제목**으로 두면 구역을 나누면서 같은 말을 한다.
        */}
        <SectionLabel title="관리자 정보" hint="회사 설정과 사원 초대를 맡을 분" />

        <AuthField
          id="manager-name"
          label="담당자 이름"
          icon={User}
          value={draft.managerName}
          onValueChange={(value) => handleChange("managerName", value)}
          placeholder="홍길동"
          autoComplete="name"
          error={errors.managerName}
        />

        <AuthField
          id="manager-email"
          label="담당자 이메일"
          icon={Mail}
          type="email"
          value={draft.email}
          onValueChange={(value) => handleChange("email", value)}
          placeholder="name@company.com"
          autoComplete="email"
          error={errors.email}
        />

        <AuthField
          id="manager-phone"
          label="연락처"
          icon={Phone}
          type="tel"
          value={draft.phone}
          onValueChange={(value) => handleChange("phone", value)}
          placeholder="010-0000-0000"
          autoComplete="tel"
          error={errors.phone}
        />

        {/* 랜딩과 같은 먹색 버튼 — 기본 variant는 파랑(액센트)이라 여기만 튄다 */}
        <Button
          type="submit"
          className="bg-foreground text-background hover:bg-foreground/90 mt-2 h-12 gap-1.5 text-[15px]"
        >
          신청하기
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthCard>
  );
}
