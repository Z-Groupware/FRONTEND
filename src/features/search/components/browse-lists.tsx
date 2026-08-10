import Link from "next/link";

import { ProjectTag } from "@/components/common/project-tag";
import { AUTHORITY_BADGE_CLASS, AUTHORITY_LABEL } from "@/constants/authority";

import type { PersonBrowseItem, ProjectBrowseItem } from "../types";

interface BrowseProjectsProps {
  projects: ProjectBrowseItem[];
}

/** 검색어 없이 프로젝트를 훑어보는 목록 — 순수 이동이라 서버에서 그린다 */
export function BrowseProjects({ projects }: BrowseProjectsProps) {
  if (projects.length === 0) return null;

  return (
    <div>
      <h2 className="text-muted-foreground mb-3 text-[12px] leading-4">프로젝트로 찾기</h2>
      <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
        {projects.map((project) => {
          return (
            <li key={project.id}>
              <Link
                href={`/app/projects/${project.id}`}
                className="hover:bg-foreground/[0.03] focus-visible:ring-ring flex items-center gap-2.5 px-5 py-3.5 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
              >
                {/*
                  ⚠️ **색 점 대신 태그 칩을 세운다.** 점은 색만 있고 글자가 없어, 색이 겹치는
                     프로젝트끼리(팔레트가 열한 색뿐이라 겹친다 — §palette) 구분이 안 됐다.
                     칩은 색과 이름을 함께 들고 있어 점이 못 하던 일을 한다.
                */}
                <ProjectTag tag={project.tag} />
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  회의 {project.meetingCount}건
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface BrowsePeopleProps {
  people: PersonBrowseItem[];
}

/**
 * 검색어 없이 사람을 훑어보는 목록.
 * ⚠️ **구성원 상세 화면이 없다** — 눌러도 갈 곳이 없어 링크로 만들지 않는다(§명세에 없는 기능은 안 만든다).
 */
export function BrowsePeople({ people }: BrowsePeopleProps) {
  if (people.length === 0) return null;

  return (
    <div>
      <h2 className="text-muted-foreground mb-3 text-[12px] leading-4">사람으로 찾기</h2>
      <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border">
        {people.map((person) => (
          <li key={person.id} className="flex items-center gap-2.5 px-5 py-3.5 text-[13px]">
            <span className="min-w-0 flex-1 truncate">{person.name}</span>
            <span
              className={`${AUTHORITY_BADGE_CLASS[person.authority]} shrink-0 rounded px-1.5 py-0.5 text-[11px] leading-4`}
            >
              {AUTHORITY_LABEL[person.authority]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
