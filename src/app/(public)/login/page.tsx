import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "로그인 — Z",
  description: "기업 코드로 워크스페이스에 연결하고 로그인하세요.",
};

/**
 * 로그인 — 기업 코드 확인 후 계정을 받는다.
 *
 * ⚠️ **기업 코드를 주소에 붙이지 않는다**(CLAUDE.md §라우트 그룹). 주소창 값은 사용자가
 *    고칠 수 있어 어차피 서버가 세션과 대조해야 한다. 코드는 로그인 전 화면에만 등장한다.
 */
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
