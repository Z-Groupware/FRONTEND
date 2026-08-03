import type { Metadata } from "next";
import { Suspense } from "react";

import { Pagination } from "@/components/common/pagination";
import type { CompanySize, CompanyStatus } from "@/constants/domain";
import { CompanyDetailSheet } from "@/features/system/components/company-detail-sheet";
import { CompanyFilterBar } from "@/features/system/components/company-filter-bar";
import { CompanyTable } from "@/features/system/components/company-table";
import { getManagedCompanies, getManagedCompanyById } from "@/features/system/server";

export const metadata: Metadata = {
  title: "기업 관리",
};

const PAGE_SIZE = 10;
const BASE_PATH = "/system/companies";

interface SystemCompaniesPageProps {
  searchParams: Promise<{
    page?: string;
    id?: string;
    q?: string;
    size?: string;
    status?: string;
  }>;
}

function buildHref(
  page: number,
  query: { q?: string; size?: string; status?: string },
  id?: string,
): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.size) params.set("size", query.size);
  if (query.status) params.set("status", query.status);
  if (page > 1) params.set("page", String(page));
  if (id) params.set("id", id);
  const qs = params.toString();
  return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
}

export default async function SystemCompaniesPage({ searchParams }: SystemCompaniesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = { q: params.q, size: params.size, status: params.status };

  const [{ items, totalPages }, selected] = await Promise.all([
    getManagedCompanies(
      {
        keyword: params.q,
        size: params.size as CompanySize | undefined,
        status: params.status as CompanyStatus | undefined,
      },
      page,
      PAGE_SIZE,
    ),
    params.id ? getManagedCompanyById(params.id) : Promise.resolve(null),
  ]);

  const currentPath = buildHref(page, query);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <Suspense>
          <CompanyFilterBar />
        </Suspense>

        <CompanyTable
          companies={items}
          buildDetailHref={(id) => buildHref(page, query, id)}
          pageSize={PAGE_SIZE}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(target) => buildHref(target, query)}
        />
      </div>

      <CompanyDetailSheet company={selected} closeHref={currentPath} currentPath={currentPath} />
    </main>
  );
}
