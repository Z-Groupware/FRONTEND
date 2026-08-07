import type { AssigneeOption } from "./types";

/** "김서준 개발팀장"처럼 이름 뒤에 역할 라벨을 붙인다. 없으면 이름만. */
export function formatAssigneeLabel(option: AssigneeOption): string {
  return option.roleLabel ? `${option.name} ${option.roleLabel}` : option.name;
}
