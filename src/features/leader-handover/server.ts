import type { LeaderHandoverCustodyStatus } from "@/constants/domain";

import { findMockLeaderHandover, listMockLeaderHandovers } from "./mock/leader-handovers";
import type { LeaderHandoverDetail, LeaderHandoverListItem } from "./types";

export async function listLeaderHandovers(
  filter: LeaderHandoverCustodyStatus | null,
): Promise<LeaderHandoverListItem[]> {
  const items = listMockLeaderHandovers();
  const filtered = filter ? items.filter((item) => item.custodyStatus === filter) : items;
  return filtered.map((item) => ({
    id: item.id,
    title: item.title,
    formerLeaderName: item.formerLeaderName,
    teamName: item.teamName,
    offboardingApprovedAt: item.offboardingApprovedAt,
    actionCount: item.actionCount,
    custodyStatus: item.custodyStatus,
  }));
}

export async function getLeaderHandoverDetail(id: string): Promise<LeaderHandoverDetail | null> {
  return findMockLeaderHandover(id);
}
