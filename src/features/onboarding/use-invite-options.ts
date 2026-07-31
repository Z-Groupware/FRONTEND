"use client";

import { useEffect, useMemo, useState } from "react";

import { ROLE } from "@/constants/domain";

import { loadDraft } from "./draft";
import { departmentRoles, rootDepartments } from "./tree";
import type { DepartmentNode, Position } from "./types";

/**
 * 3단계에서 고를 수 있는 것들 — 1·2단계에서 정한 값에서 뽑는다.
 *
 * 서버 저장이 아직 없어서 **임시 보관함(`draft.ts`)** 을 먼저 보고, 없으면 서버 값을 쓴다.
 * 연동되면 이 훅은 props만 보게 되고 보관함 부분은 사라진다.
 */
export function useInviteOptions(departments: DepartmentNode[], positions: Position[]) {
  const [source, setSource] = useState({ departments, positions });

  useEffect(() => {
    const draft = loadDraft();
    if (!draft.departments && !draft.positions) return;
    // sessionStorage는 첫 렌더 뒤에야 읽을 수 있다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSource({
      departments: draft.departments ?? departments,
      positions: draft.positions ?? positions,
    });
    // 첫 렌더에서 한 번만 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 소속은 부서(윗단) + 역할(아랫단)로 정한다. 역할 없이 부서에만 속할 수도 있다.
  const departmentOptions = useMemo(() => rootDepartments(source.departments), [source]);

  const rolesOf = useMemo(
    () => (departmentId: string) => departmentRoles(source.departments, departmentId),
    [source],
  );

  const positionOptions = useMemo(
    () => source.positions.map((position) => ({ id: position.id, name: position.name })),
    [source],
  );

  /** 2단계에서 리더 권한이 붙은 직급 — 부서마다 한 명만 가질 수 있다 */
  const isLeaderPosition = useMemo(() => {
    const leaderIds = new Set(
      source.positions
        .filter((position) => position.role === ROLE.LEADER)
        .map((position) => position.id),
    );
    return (positionId: string) => leaderIds.has(positionId);
  }, [source]);

  /**
   * 새 줄의 기본 직급 — **리더가 아닌 직급**으로 잡는다.
   * 목록 첫 줄이 팀장(리더)이라 그대로 쓰면 줄을 추가할 때마다 리더가 겹친다.
   */
  const defaultPositionId = useMemo(() => {
    const member = source.positions.find((position) => position.role !== ROLE.LEADER);
    return member?.id ?? positionOptions[0]?.id ?? "";
  }, [source, positionOptions]);

  return {
    departmentOptions,
    rolesOf,
    positionOptions,
    isLeaderPosition,
    defaultPositionId,
    defaultDepartmentId: departmentOptions[0]?.id ?? "",
  };
}
