import type { AssignableRole, Position } from "./types";

/** 직급 목록 조작 — 전부 순수 함수다(원본을 바꾸지 않는다). */

export function createPosition(name: string, role: AssignableRole): Position {
  return { id: crypto.randomUUID(), name, role };
}

/** 이름이 겹치지 않게 뒤에 번호를 붙인다 — `새 직급` → `새 직급 2`. */
export function nextAvailablePositionName(positions: Position[], base: string): string {
  const taken = new Set(positions.map((position) => position.name));
  if (!taken.has(base)) return base;

  let index = 2;
  while (taken.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

export function renamePosition(positions: Position[], id: string, name: string): Position[] {
  return positions.map((position) => (position.id === id ? { ...position, name } : position));
}

export function changePositionRole(
  positions: Position[],
  id: string,
  role: AssignableRole,
): Position[] {
  return positions.map((position) => (position.id === id ? { ...position, role } : position));
}

export function removePosition(positions: Position[], id: string): Position[] {
  return positions.filter((position) => position.id !== id);
}

/** 드래그 이동 — 대상의 앞/뒤로 옮긴다. 직급은 서열이라 순서 자체가 의미를 가진다. */
export function movePosition(
  positions: Position[],
  draggedId: string,
  targetId: string,
  position: "before" | "after",
): Position[] {
  if (draggedId === targetId) return positions;

  const from = positions.findIndex((item) => item.id === draggedId);
  const hasTarget = positions.some((item) => item.id === targetId);
  if (from === -1 || !hasTarget) return positions;

  const next = [...positions];
  const [moved] = next.splice(from, 1);
  if (!moved) return positions;

  const targetIndex = next.findIndex((item) => item.id === targetId);
  next.splice(position === "before" ? targetIndex : targetIndex + 1, 0, moved);
  return next;
}

/** 키보드용 — 한 칸 위/아래로 옮긴다. */
export function shiftPosition(positions: Position[], id: string, offset: 1 | -1): Position[] {
  const from = positions.findIndex((item) => item.id === id);
  if (from === -1) return positions;

  const to = from + offset;
  if (to < 0 || to >= positions.length) return positions;

  const next = [...positions];
  const [moved] = next.splice(from, 1);
  if (!moved) return positions;
  next.splice(to, 0, moved);
  return next;
}
