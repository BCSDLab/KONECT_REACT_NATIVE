# Repository Guidelines

## 언어 규칙

한국어로 입력을 받으면 영어로 생각하고 추론한 뒤, 최종 답변은 한국어로 작성합니다.

## 프로젝트 개요

- 이 저장소는 `agit.gg` 웹 서비스를 감싸는 React Native WebView 래퍼 앱입니다.
- 네이티브 레이어 책임 범위: 푸시 알림, 인증 토큰 저장, 강제 업데이트 체크, 딥 링크 처리
- 주요 비즈니스 UI/플로우는 WebView 내부 웹 앱에서 동작합니다.

## 프로젝트 구조 및 모듈 구성

- `app/`: Expo Router 라우트와 화면 (`_layout.tsx`, `index.tsx`, `forceupdate.tsx`, `webview/[path].tsx`)
- `services/`: 알림, 토큰 API, 보안 저장소 등 사이드이펙트 로직
- `utils/`: 재사용 유틸리티 (`userAgent`, `pushTokenStore`)
- `constants/`: 환경 변수 기반 상수 (`apiUrl`, `webUrl`)
- `assets/`: 아이콘/이미지 리소스
- 네이티브 프로젝트: `android/`, `ios/`
- 배포/설정: `app.config.ts`, `eas.json`, `.github/workflows/`

## 개발, 빌드, 테스트 명령어

- `pnpm install`: 의존성 설치 (CI 기준 Node `22.x`, `pnpm`)
- `pnpm start`: Expo 개발 서버 실행
- `pnpm android`: Android 로컬 실행/빌드
- `pnpm ios`: iOS 로컬 실행/빌드
- `pnpm lint`: ESLint 검사
- `pnpm test`: Jest watch 모드
- `pnpm test -- --watchAll=false`: 단발성 테스트 (PR 전 권장)

## 환경 변수

- `EXPO_PUBLIC_APP_ENV`: `development` 또는 `production` (기본 `production`)
- `EXPO_PUBLIC_API_ENV`: API/웹 URL 선택 시 `APP_ENV`를 오버라이드
- Production: `https://agit.gg`, `https://api.agit.gg`
- Stage: `https://stage.agit.gg`, `https://api.stage.agit.gg`

## 코딩 스타일 및 네이밍

- TypeScript `strict` 유지, 포맷은 Prettier 기준(2칸 들여쓰기, single quote, 세미콜론, `printWidth: 100`)
- 컴포넌트/타입: `PascalCase`, 함수/변수: `camelCase`
- 라우트 파일명은 Expo Router 규칙 준수 (`webview/[path].tsx`)
- 네트워크/플랫폼 의존 로직은 `services/`, 순수 유틸은 `utils/`에 배치

## 테스트 가이드

- 프레임워크: `jest-expo`
- 테스트 파일명: `*.test.ts`, `*.test.tsx`
- 우선 검증 대상: 푸시 토큰 등록/해제, 알림 권한 분기, API 실패 처리

## 이슈 작성 규칙

- 제목 형식: `[Type] 작업 내용 요약`
- `Type`: `Feat`, `Fix`, `Chore`, `Refactor`
- 본문 필수 항목: 배경, 작업 목록, 완료 조건(DoD), 영향 범위

예시:

```md
[Fix] 알림 권한 거부 후 재진입 시 재요청 처리
```

## 브랜치 네이밍 규칙

- 형식: `<issue-number>-<type>-<kebab-summary>`
- 예시: `48-feat-외부-링크-연결-시-expo-browser-사용`, `52-fix-notification-dialog`
- `type`: `feat`, `fix`, `refactor`, `chore`, `release`
- 이슈 없이 작업 시: `no-issue-<type>-<kebab-summary>`
- 릴리즈 브랜치: `release/v<major>.<minor>.<patch>` (예: `release/v1.0.6`)

## 커밋 메시지 규칙

- 형식: `<type>: <요약>`
- `type`: `feat`, `fix`, `refactor`, `chore`, `release`
- 한 커밋은 한 의도만 담고, 요약은 명령형으로 작성

예시:

```bash
git commit -m "fix: cancel 클릭 시 다이얼로그만 닫기"
```

## PR 작성 규칙

- 제목 형식: `[Type] 작업 내용 요약` (이슈 제목 형식과 동일)
- 본문 필수 항목:
  - 변경 배경/목적
  - 주요 변경점
  - 검증 방법 (`pnpm lint`, `pnpm test -- --watchAll=false`)
  - UI 변경 시 스크린샷/영상
  - 연관 이슈 링크

PR 본문 템플릿:

```md
## 배경

## 변경 사항

## 검증

- [ ] pnpm lint
- [ ] pnpm test -- --watchAll=false

## 이슈

close #52
```

## 보안 및 설정

- 신규 시크릿 커밋 금지. 환경 변수(`EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_API_ENV`)와 CI Secret(`EXPO_TOKEN`) 사용
- 민감 정보(토큰)는 `expo-secure-store`로만 저장
