import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    /*
      ⚠️ `next/cache`를 대역으로 바꾼다. `"use server"` 파일을 클라이언트 컴포넌트가 import할 때
         실제 Next는 그 자리를 클라이언트 참조로 바꾸지만 jest에는 그 변환이 없어서,
         서버 내부 구현이 그대로 로드되며 jsdom에 없는 전역(`Request` 등)을 건드려 터진다.
         자세한 이유는 대역 파일 주석에 있다.
    */
    "^next/cache$": "<rootDir>/test/next-cache-stub.ts",
  },
  // Playwright 스펙은 e2e/ 에만 둔다 (CONVENTIONS §18)
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/e2e/"],
};

export default createJestConfig(config);
