import type { Metadata } from "next";
import { Suspense } from "react";

import type { CompanySort, CompanyStatus } from "@/constants/domain";
import { CompanyDetailSheet } from "@/features/system/components/company-detail-sheet";
import { CompanyFilterBar } from "@/features/system/components/company-filter-bar";
import { CompanyList } from "@/features/system/components/company-list";
import { getManagedCompanies, getManagedCompanyById } from "@/features/system/server";

export const metadata: Metadata = {
  title: "기업 관리",
};

const PAGE_SIZE = 10;
const BASE_PATH = "/system/companies";

interface SystemCompaniesPageProps {
  searchParams: Promise<{
    id?: string;
    q?: string;
    sort?: string;
    status?: string;
  }>;
}

/** 목록은 더 이상 URL에 페이지 번호를 담지 않는다(무한 스크롤) — 검색어·정렬·상세 id만 남는다. */
function buildHref(query: { q?: string; sort?: string; status?: string }, id?: string): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.status) params.set("status", query.status);
  if (id) params.set("id", id);
  const qs = params.toString();
  return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
}

export default async function SystemCompaniesPage({ searchParams }: SystemCompaniesPageProps) {
  const params = await searchParams;
  const query = { q: params.q, sort: params.sort, status: params.status };
  const filter = {
    keyword: params.q,
    status: params.status as CompanyStatus | undefined,
    sort: params.sort as CompanySort | undefined,
  };

  const [{ items, page, totalPages, totalCount }, selected] = await Promise.all([
    getManagedCompanies(filter, 1, PAGE_SIZE),
    params.id ? getManagedCompanyById(params.id) : Promise.resolve(null),
  ]);

  const currentPath = buildHref(query);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <Suspense>
          <CompanyFilterBar />
        </Suspense>

        {/*
          ⚠️ 검색·정렬이 바뀌면 새로 마운트돼야 한다(누적된 예전 결과가 섞이지 않게) —
             필터 값으로 만든 key로 그걸 보장한다(`company-list.tsx` 주석 참고).
        */}
        <CompanyList
          key={`${query.q ?? ""}-${query.sort ?? ""}-${query.status ?? ""}`}
          initialItems={items}
          initialPage={page}
          initialTotalPages={totalPages}
          initialTotalCount={totalCount}
          pageSize={PAGE_SIZE}
          filter={filter}
          buildDetailHref={(id) => buildHref(query, id)}
        />
      </div>

      <CompanyDetailSheet company={selected} closeHref={currentPath} currentPath={currentPath} />
    </main>
  );
}
