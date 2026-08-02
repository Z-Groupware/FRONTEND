"use client";

import { AlertCircle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveCompanyCode } from "../company-code";
import { findCompany } from "../mock";
import { AuthCard } from "./auth-card";

/**
 * 로그인 1단계 — 어느 회사로 들어가는지 먼저 정한다(카카오워크 문법).
 *
 * ⚠️ 코드 확인은 지금 **목**이다(`findCompany`). 실제로는 서버가 판정한다 —
 *    화면이 통과시켜도 서버가 다시 본다(CLAUDE.md §권한: 화면 숨김은 보안이 아니다).
 * ⚠️ 브라우저 기본 검증(`required` + 말풍선)을 쓰지 않는다. 회색 말풍선이 우리 화면 위에
 *    떠서 디자인이 깨지고 문구도 못 고친다 — `noValidate` + 필드 인라인으로 직접 알린다.
 */
export function CompanyCodeStep() {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = findCompany(code);
    if (!found) {
      setCodeError("기업 코드를 찾을 수 없어요. 관리자에게 다시 확인해 주세요.");
      return;
    }
    setCodeError(null);
    saveCompanyCode(found.code);
  };

  return (
    <AuthCard
      icon={Building2}
      step="1 / 2"
      title="워크스페이스 연결"
      description="회사에서 받은 기업 코드로 워크스페이스에 연결해요"
      footer={
        <>
          아직 기업 코드가 없나요?{" "}
          <Link href="/register" className="text-foreground font-medium hover:underline">
            기업 등록 신청
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company-code" className="flex items-center gap-1.5">
            <Building2 className="text-muted-foreground size-3.5" aria-hidden />
            <span className="translate-y-px">기업 코드</span>
          </Label>
          <Input
            id="company-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCodeError(null);
            }}
            placeholder="예: NOVA-7K3D"
            autoComplete="organization"
            aria-invalid={codeError !== null}
            aria-describedby="company-code-help"
          />
          {/*
            ⚠️ 검증 오류는 토스트가 아니라 필드 아래 인라인이다(CLAUDE.md §토스트).
            ⚠️ 안내 문구("이메일로 받은 코드를 입력하세요")는 여기 두지 않는다 —
               카드 설명이 이미 같은 말을 한다. 같은 말이 두 번 있으면 둘 다 안 읽힌다.
               이 자리는 **오류 전용**이고, 자리만 미리 비워 카드 높이가 흔들리지 않게 한다.
          */}
          <p
            id="company-code-help"
            className="text-destructive flex min-h-4 items-center gap-1.5 text-[12px] leading-4 break-keep"
          >
            {codeError && <AlertCircle className="size-3.5 shrink-0" aria-hidden />}
            <span className="translate-y-px">{codeError}</span>
          </p>
        </div>

        {/* 랜딩과 같은 먹색 버튼 — 기본 variant는 파랑(액센트)이라 여기만 튄다 */}
        <Button
          type="submit"
          className="bg-foreground text-background hover:bg-foreground/90 h-12 gap-1.5 text-[15px]"
        >
          다음
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthCard>
  );
}
