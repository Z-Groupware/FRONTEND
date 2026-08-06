"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_FIELD_LABEL, COMPANY_SECTION_TITLE } from "@/constants/company";
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
      {/*
        ⚠️ `role="alert"` — [저장]을 누르면 포커스가 버튼에 남는다. 이 자리가 live region이
           아니면 오류가 떠도 스크린리더는 아무 말도 안 해서 저장된 줄 안다(신청 화면의
           `AuthField`가 같은 이유로 달아 뒀다).
        ⚠️ 비어 있어도 노드는 남긴다 — 없다 생겼다 하면 읽히지 않고 높이도 출렁인다.
      */}
      <p id={`${id}-error`} role="alert" className="text-destructive min-h-4 text-[12px] leading-4">
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
            기업 등록 신청 때 적은 회사 정보입니다. 기업 코드는 사원이 로그인할 때 적는 값이라{" "}
            <span className="text-foreground font-medium">바꿀 수 없습니다.</span>
          </>
        }
        footer={
          <>
            {/*
              ⚠️ 칸과 무관한 실패는 **저장 줄에 남긴다.** 토스트로 띄우면 몇 초 뒤 사라져,
                 왜 저장이 안 됐는지 모른 채 같은 버튼을 다시 누르게 된다(§토스트는 보조다).
            */}
            {state.message && (
              <p role="alert" className="text-destructive mr-auto text-[12px] leading-4">
                {state.message}
              </p>
            )}
            <Button type="submit" size="sm" variant="ink" disabled={isPending}>
              {isPending ? "저장 중…" : "저장"}
            </Button>
          </>
        }
      >
        {/*
          ⚠️ **왼쪽이 지도, 오른쪽이 칸**이다. 세 가지를 다 시도해 보고 남은 배치다.
             · 좌 칸 / 우 지도 → 칸이 짧아 왼쪽 아래가 빈다
             · 전부 세로로 쌓기 → 지도가 전폭이라 5:1 띠가 된다
             · 지도만 폭을 720으로 → 카드 오른쪽 절반이 통째로 빈다
             지도를 반쪽에 두면 3:1에 가까워져 주변이 제대로 보이고, 남는 여백은
             오른쪽 칸 **아래**로 흩어져 눈에 덜 걸린다.
          ⚠️ `items-start` — 늘려 맞추면 지도만 커져 다시 비율이 무너진다.
        */}
        <div className="grid grid-cols-1 items-start gap-x-7 gap-y-6 px-7 py-6 lg:grid-cols-2">
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
              mapClassName="h-[232px]"
            />
          </Field>

          {/*
            ⚠️ 입력칸에는 **상한을 건다.** 반쪽이라도 1440에서는 한 칸이 680px가 되는데,
               `000-00-00000`을 적는 칸이 그만큼 넓으면 라벨과 커서가 멀어져 읽고 쓰기가
               나빠진다 — 폼 규격(720)을 둔 이유와 같다.
          */}
          <div className="flex max-w-[420px] flex-col gap-6">
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
              ⚠️ 기업 코드는 **적는 칸 아래 읽는 값**이다. 오른쪽 열이 사업자등록번호에서
                 끝나면 옆 지도만 남아 그 아래가 훵하다 — 여기에 두면 두 열 높이가 얼추 맞는다.
              ⚠️ 상자를 두르지 않는다. 점선은 "여기에 뭘 넣으세요"로, 실선은 입력칸으로 읽힌다 —
                 위 칸들과 같은 라벨을 쓰고 값만 글자로 두면 그 자체로 "적는 곳이 아니다"가 된다.
                 바꿀 수 없다는 말은 카드 설명이 이미 하고 있어 여기서 되풀이하지 않는다.
            */}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-none font-medium">{COMPANY_FIELD_LABEL.CODE}</p>
              <p className="text-[17px] leading-9 font-medium tracking-[0.14em] tabular-nums">
                {profile.code}
              </p>
            </div>
          </div>
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
