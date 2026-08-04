"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPANY_SIZE,
  COMPANY_SIZE_LABEL,
  COMPANY_STATUS,
  COMPANY_STATUS_LABEL,
} from "@/constants/domain";

const SIZE_OPTIONS = Object.values(COMPANY_SIZE);
const STATUS_OPTIONS = Object.values(COMPANY_STATUS);

/** 필터 셀렉트의 "전체" 값 — 빈 문자열은 URLSearchParams가 지워버려 구분이 안 된다 */
const ALL = "ALL";

/**
 * 기업명·코드 검색 + 규모·상태 필터.
 *
 * ⚠️ 검색·필터 결과는 **URL 쿼리로 표현한다** — 서버 컴포넌트(페이지)가 그 쿼리를 읽어
 *    목록을 좁힌다(CLAUDE.md §핵심 4원칙 ①: 조회는 Server Component). 그래서 이 바는
 *    입력만 받고 실제 필터링은 하지 않는다 — 목록 필터링 로직이 두 곳에 흩어지지 않는다.
 * ⚠️ 필터가 바뀌면 **1페이지로 되돌린다** — 3페이지를 보다가 검색하면 빈 화면을 만날 수 있다.
 */
export function CompanyFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");

  const pushWith = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === ALL) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`/system/companies?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative ml-auto w-full max-w-56">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") pushWith({ q: keyword });
          }}
          onBlur={() => pushWith({ q: keyword })}
          placeholder="기업명 또는 코드 검색"
          aria-label="기업명 또는 코드 검색"
          className="pl-8"
        />
      </div>

      <Select
        value={searchParams.get("size") ?? ALL}
        onValueChange={(value) => pushWith({ size: value ?? ALL })}
      >
        <SelectTrigger aria-label="규모 필터" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" alignItemWithTrigger={false}>
          <SelectItem value={ALL}>전체 규모</SelectItem>
          {SIZE_OPTIONS.map((size) => (
            <SelectItem key={size} value={size}>
              {COMPANY_SIZE_LABEL[size]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? ALL}
        onValueChange={(value) => pushWith({ status: value ?? ALL })}
      >
        <SelectTrigger aria-label="상태 필터" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" alignItemWithTrigger={false}>
          <SelectItem value={ALL}>전체 상태</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {COMPANY_STATUS_LABEL[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
