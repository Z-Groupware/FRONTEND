import { FileText, type LucideIcon, Mic, Send, Sparkles } from "lucide-react";

/**
 * 흐름 네 단계 — 회의 한 번이 어떻게 굴러가는지.
 *
 * ⚠️ 아이콘은 lucide만 쓴다(§디자인 토큰: 이모지 금지).
 * ⚠️ 문구는 명세에 있는 것만 적는다 — 자막은 화자 없는 청크, AI 산출물은 액션 할당이다.
 */
export interface FlowStep {
  step: string;
  title: string;
  body: string;
  mock: "capture" | "analyze" | "assign" | "handover";
  icon: LucideIcon;
}

export const FLOW_STEPS: readonly FlowStep[] = [
  {
    step: "01",
    title: "회의 캡처",
    body: "녹음하면 자막이 실시간으로 쌓여요",
    mock: "capture",
    icon: Mic,
  },
  {
    step: "02",
    title: "AI 분석",
    body: "결정과 할 일을 가려내요",
    mock: "analyze",
    icon: Sparkles,
  },
  { step: "03", title: "액션 하달", body: "담당자에게 바로 배정돼요", mock: "assign", icon: Send },
  {
    step: "04",
    title: "인수인계",
    body: "쌓인 기록이 문서가 돼요",
    mock: "handover",
    icon: FileText,
  },
] as const;

export type FlowMock = FlowStep["mock"];
