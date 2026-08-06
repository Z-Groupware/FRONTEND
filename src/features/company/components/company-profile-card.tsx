"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_CODE_HINT, COMPANY_FIELD_LABEL, COMPANY_SECTION_TITLE } from "@/constants/company";
import { formatBusinessNumber } from "@/features/auth/business-number";
import { AddressPicker } from "@/features/auth/components/address-picker";

import { type CompanyProfileFormState, saveCompanyProfileAction } from "../actions";
import type { CompanyProfile, CompanyProfileDraft, PickedPlace } from "../types";
import { SettingCard } from "./setting-card";

/** 폼 한 칸 — 라벨·입력·오류 한 줄. 오류 자리는 비워 두지 않는다(떠도 카드가 안 출렁인다) */
function Field({
  name,
  controlId,
  label,
  error,
  children,
}: {
  name: keyof CompanyProfileDraft;
  /**
   * 라벨이 가리킬 입력의 id.
   * ⚠️ 위치 칸만 다르다 — `AddressPicker`가 자기 입력에 `company-address`를 박아 두고 있어서,
   *    여기서 `company-place`로 부르면 라벨이 아무것도 안 가리킨다(§a11y: `label htmlFor`).
   */
  controlId?: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = controlId ?? `company-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <p id={`${id}-error`} className="text-destructive min-h-4 text-[12px] leading-4">
        {error}
      </p>
    </div>
  );
}

/**
 * 기본 정보 — 기업 등록 신청에서 받은 값을 고친다.
 *
 * ⚠️ **칸은 신청에서 받는 셋뿐이다**(기업명·사업자등록번호·회사 위치). 대표자·대표 연락처는
 *    신청에서도 온보딩에서도 안 받는 값이라 두지 않는다 — 없는 값을 칸으로 두면 여기가
 *    정본이 아닌 값의 유일한 출처가 된다(§types.ts).
 * ⚠️ 위치는 **입력이 아니라 고르는 일**이라 신청 화면의 `AddressPicker`를 그대로 쓴다.
 *    사람이 아는 건 "판교 우리 건물"이지 위경도가 아니다. 키가 없거나 SDK가 죽으면 그
 *    컴포넌트가 알아서 직접 입력 칸으로 내려간다(§정직성).
 * ⚠️ **기업 코드는 맨 위 따로 한 줄**이다. 편집 칸들 사이에 끼워 두면 고칠 수 있는 값으로
 *    읽힌다 — 줄로 갈라 두면 "못 고치는 값"이 위치로 드러난다.
 * ⚠️ 검증 오류는 **칸 밑 인라인**이다(§토스트). 성공만 토스트로 알린다 — 화면이 그대로라
 *    안 알리면 저장됐는지 알 수 없다.
 */
export function CompanyProfileCard({ profile }: { profile: CompanyProfile }) {
  const [state, formAction, isPending] = useActionState<CompanyProfileFormState, FormData>(
    saveCompanyProfileAction,
    { errors: {} },
  );
  const [businessNumber, setBusinessNumber] = useState(profile.businessNumber);
  const [place, setPlace] = useState<PickedPlace | null>(profile.place);
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
        description={
          <>
            기업 등록 신청 때 적은 회사 정보입니다.{" "}
            <span className="text-foreground font-medium">기업 코드는 바꿀 수 없습니다.</span>
          </>
        }
        footer={
          <Button type="submit" size="sm" variant="ink" disabled={isPending}>
            {isPending ? "저장 중…" : "저장"}
          </Button>
        }
      >
        {/*
          ⚠️ 왼쪽은 적는 칸, 오른쪽은 **지도**다. 전폭(1440)에서 한 줄에 늘어놓으면 입력칸
             하나가 700px가 되고, 지도는 반대로 납작해져 어디가 찍혔는지 안 보인다.
        */}
        <div className="grid grid-cols-1 gap-x-7 gap-y-6 px-7 py-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Field name="name" label={COMPANY_FIELD_LABEL.NAME} error={state.errors.name}>
              <Input
                id="company-name"
                name="name"
                defaultValue={profile.name}
                placeholder="사업자등록증에 적힌 이름"
                autoComplete="organization"
                aria-invalid={Boolean(state.errors.name)}
                aria-describedby="company-name-error"
              />
            </Field>

            <Field
              name="businessNumber"
              label={COMPANY_FIELD_LABEL.BUSINESS_NUMBER}
              error={state.errors.businessNumber}
            >
              {/* 적는 순간 하이픈을 넣어 굳힌다 — 신청 화면과 **같은 함수**다 */}
              <Input
                id="company-businessNumber"
                name="businessNumber"
                value={businessNumber}
                onChange={(event) => setBusinessNumber(formatBusinessNumber(event.target.value))}
                placeholder="000-00-00000"
                inputMode="numeric"
                aria-invalid={Boolean(state.errors.businessNumber)}
                aria-describedby="company-businessNumber-error"
              />
            </Field>

            {/*
              ⚠️ 기업 코드는 **왼쪽 칸 맨 아래**다. 입력칸 사이에 끼면 고칠 수 있는 값으로
                 읽히고, 위에 따로 띠로 빼면 왼쪽 칸이 지도보다 짧아져 아래가 텅 빈다.
              ⚠️ 상자를 두르지 않는다. 점선은 "여기에 뭘 넣으세요"로 읽히고, 실선은 입력칸으로
                 읽힌다 — 위 두 칸과 **같은 라벨·같은 자리**에 값만 글자로 두면 그 자체로
                 "적는 곳이 아니다"가 된다.
            */}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-none font-medium">{COMPANY_FIELD_LABEL.CODE}</p>
              <p className="text-[17px] leading-[38px] font-medium tracking-[0.14em] tabular-nums">
                {profile.code}
              </p>
              <p className="text-muted-foreground text-[12px] leading-4">{COMPANY_CODE_HINT}</p>
            </div>
          </div>

          <Field
            name="place"
            controlId="company-address"
            label={COMPANY_FIELD_LABEL.PLACE}
            error={state.errors.place}
          >
            <AddressPicker
              picked={place}
              onPick={setPlace}
              hasError={Boolean(state.errors.place)}
            />
          </Field>
        </div>

        {/*
          ⚠️ 지도가 고른 값은 눈에 보이는 칸이 없다 — `FormData`에 실으려면 숨은 칸이 필요하다.
             좌표를 사람이 고칠 일은 없으니 `hidden`이 맞다(신청 화면과 같은 모양).
        */}
        <input type="hidden" name="placeAddress" value={place?.address ?? ""} />
        <input type="hidden" name="placeLat" value={place?.lat ?? ""} />
        <input type="hidden" name="placeLng" value={place?.lng ?? ""} />
      </SettingCard>
    </form>
  );
}
