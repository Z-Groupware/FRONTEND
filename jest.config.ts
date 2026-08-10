import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  // 테스트는 전부 src/ 안에 있다. 수집 범위를 여기로 못박아야
  // 레포 안에 생기는 체크아웃 사본(.claude/worktrees/* 등)의 테스트를 끌어오지 않는다.
  roots: ["<rootDir>/src"],
  // Playwright 스펙은 e2e/ 에만 둔다 (CONVENTIONS §18)
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/e2e/"],
};

export default createJestConfig(config);
