"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_CODE_HINT, COMPANY_FIELD_LABEL, COMPANY_SECTION_TITLE } from "@/constants/company";

import { type CompanyProfileFormState, saveCompanyProfileAction } from "../actions";
import type { CompanyProfile, CompanyProfileDraft } from "../types";
import { SettingCard } from "./setting-card";

/** 폼 한 칸. 2열 격자 안에서 한 칸 또는 두 칸(`wide`)을 차지한다 */
function Field({
  name,
  label,
  defaultValue,
  error,
  wide,
  ...rest
}: {
  name: keyof CompanyProfileDraft;
  label: string;
  defaultValue: string;
  error?: string;
  wide?: boolean;
} & Pick<React.ComponentProps<typeof Input>, "placeholder" | "inputMode" | "autoComplete">) {
  const id = `company-${name}`;

  return (
    <div className={wide ? "flex flex-col gap-1.5 sm:col-span-2" : "flex flex-col gap-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 기본 정보 — 사업자 정보를 고친다.
 *
 * ⚠️ 검증 오류는 **칸 밑 인라인**이다(§토스트: 폼 검증 오류는 토스트로 안 띄운다).
 *    성공만 토스트로 알린다 — 화면이 그대로라 안 알리면 저장됐는지 알 수 없다.
 * ⚠️ **기업 코드는 칸이 아니라 읽는 값**이다. 사원이 로그인할 때 적는 값이라 바뀌면
 *    기존 사원이 전부 못 들어온다 — 입력칸으로 두면 바꿀 수 있는 값으로 읽힌다.
 */
export function CompanyProfileCard({ profile }: { profile: CompanyProfile }) {
  const [state, formAction, isPending] = useActionState<CompanyProfileFormState, FormData>(
    saveCompanyProfileAction,
    { errors: {} },
  );
  const notified = useRef<number | null>(null);

  useEffect(() => {
    if (state.savedAt && state.savedAt !== notified.current) {
      notified.current = state.savedAt;
      toast.success("기본 정보를 저장했습니다");
    }
  }, [state.savedAt]);

  return (
    <form action={formAction}>
      <SettingCard
        title={COMPANY_SECTION_TITLE.PROFILE}
        footer={
          <Button type="submit" size="sm" variant="ink" disabled={isPending}>
            {isPending ? "저장 중…" : "저장"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
          <Field
            name="name"
            label={COMPANY_FIELD_LABEL.NAME}
            defaultValue={profile.name}
            error={state.errors.name}
            autoComplete="organization"
          />
          <Field
            name="businessNumber"
            label={COMPANY_FIELD_LABEL.BUSINESS_NUMBER}
            defaultValue={profile.businessNumber}
            error={state.errors.businessNumber}
            placeholder="000-00-00000"
            inputMode="numeric"
          />
          <Field
            name="ceoName"
            label={COMPANY_FIELD_LABEL.CEO_NAME}
            defaultValue={profile.ceoName}
            error={state.errors.ceoName}
          />
          <Field
            name="phone"
            label={COMPANY_FIELD_LABEL.PHONE}
            defaultValue={profile.phone}
            error={state.errors.phone}
            placeholder="02-0000-0000"
            inputMode="tel"
          />
          <Field
            name="address"
            label={COMPANY_FIELD_LABEL.ADDRESS}
            defaultValue={profile.address}
            error={state.errors.address}
            wide
          />

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <p className="text-sm leading-none font-medium">{COMPANY_FIELD_LABEL.CODE}</p>
            <p className="text-[15px] tracking-[0.08em] tabular-nums">{profile.code}</p>
            <p className="text-muted-foreground text-xs">{COMPANY_CODE_HINT}</p>
          </div>
        </div>
      </SettingCard>
    </form>
  );
}
