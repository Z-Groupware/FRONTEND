import { ROLE, type Role, ROLE_LABEL } from "@/constants/role";
import type { Actor } from "@/lib/permission";

import { navFor } from "../nav-config";
import type { Viewer } from "../viewer";
import { RoleSidebar } from "./role-sidebar";

/**
 * 역할별 사이드바를 **한 화면에 늘어놓는 개발용 화면**.
 *
 * ⚠️ **제품 화면이 아니다.** 명세에 없다(§라우트 그룹: 명세에 없는 화면은 안 만든다) —
 *    목을 네 번 바꿔 가며 확인하는 대신 네 벌을 나란히 놓고 배치를 판단하려고 둔 것이다.
 *    배포 전에 지울지 팀이 정한다. 그래서 화면 안에도 개발용이라고 적는다(§정직성).
 * ⚠️ **실제 컴포넌트를 그대로 쓴다.** 그림을 따로 그리면 진짜 사이드바와 어긋나서,
 *    여기서 괜찮아 보이던 게 실제로는 다르게 나온다.
 */

interface PreviewCase {
  key: string;
  title: string;
  note: string;
  viewer: Viewer;
}

const person = (role: Role, name: string, isAdmin = false): Viewer => ({
  id: 1,
  name,
  role,
  isAdmin,
});

/**
 * 보여줄 경우들.
 *
 * ⚠️ **Admin 겸직을 역할마다 따로 둔다.** Admin은 역할이 아니라 덧붙는 권한이라
 *    (WORKFLOW §9), "Leader + Admin"과 "Member + Admin"이 서로 다른 사이드바가 된다 —
 *    한 줄로 뭉뚱그리면 그 차이를 못 본다.
 * ⚠️ Owner는 겸직 경우를 두지 않는다. **Owner는 Admin을 겸할 수 없다**(`canGrantAdmin`).
 */
const CASES: PreviewCase[] = [
  {
    key: "owner",
    title: ROLE_LABEL[ROLE.OWNER],
    note: "회사 운영이 늘 보인다. 계정 발급은 없다 — 발급은 Admin의 일이다",
    viewer: person(ROLE.OWNER, "박대표"),
  },
  {
    key: "leader",
    title: ROLE_LABEL[ROLE.LEADER],
    note: "팀 관리 구역이 붙는다. 회사 운영은 없다",
    viewer: person(ROLE.LEADER, "김팀장"),
  },
  {
    key: "leader-admin",
    title: `${ROLE_LABEL[ROLE.LEADER]} + Admin`,
    note: "팀 관리를 그대로 두고 회사 운영이 덧붙는다 — 역할을 갈아치우지 않는다",
    viewer: person(ROLE.LEADER, "김팀장", true),
  },
  {
    key: "member",
    title: ROLE_LABEL[ROLE.MEMBER],
    note: "워크벤치만 본다",
    viewer: person(ROLE.MEMBER, "이사원"),
  },
  {
    key: "member-admin",
    title: `${ROLE_LABEL[ROLE.MEMBER]} + Admin`,
    note: "사원인 채로 회사 운영이 덧붙는다. 기업 설정·팀장 인수인계는 Owner 것이라 없다",
    viewer: person(ROLE.MEMBER, "이사원", true),
  },
];

export function NavPreview() {
  return (
    <div className="bg-background bg-dot-grid min-h-dvh overflow-x-auto p-8">
      <div className="mx-auto w-fit">
        <header className="pb-6">
          <h1 className="text-2xl leading-8 font-semibold tracking-[-0.48px]">역할별 사이드바</h1>
          {/*
            ⚠️ **개발용이라고 화면에 적는다.** 안 적으면 다음 사람이 제품 화면으로 알고
               링크를 걸거나 명세에 없는 화면을 유지보수하게 된다(§정직성).
          */}
          <p className="text-muted-foreground pt-1.5 text-[13px] leading-5 break-keep">
            배치를 비교하려고 둔 개발용 화면입니다. 명세에 없는 화면이라 배포 전에 지울지 정해야
            합니다. 실제 사이드바 컴포넌트를 그대로 그립니다.
          </p>
        </header>

        <div className="flex items-start gap-5">
          {CASES.map((item) => (
            <PreviewColumn key={item.key} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewColumn({ item }: { item: PreviewCase }) {
  return (
    <section className="flex w-[220px] shrink-0 flex-col gap-2.5">
      <div className="min-h-[62px]">
        <h2 className="text-[15px] leading-6 font-semibold tracking-[-0.2px]">{item.title}</h2>
        <p className="text-muted-foreground/80 pt-1 text-[12px] leading-[18px] break-keep">
          {item.note}
        </p>
      </div>

      {/*
        ⚠️ 사이드바는 `h-full`을 전제로 만들어졌다 — 여기서는 **높이를 정해** 담는다.
           안 그러면 내용만큼만 커져서 아래 테두리가 항목에 붙는다.
      */}
      <div className="border-border h-[620px] overflow-hidden rounded-xl border">
        <RoleSidebar sections={navFor(item.viewer as Actor)} user={item.viewer} />
      </div>
    </section>
  );
}
