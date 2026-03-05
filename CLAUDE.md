# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 규칙

한국어로 입력을 받으면 영어로 생각하고 추론한 뒤, 최종 답변은 한국어로 작성합니다.

## 개요

agit.gg 웹 앱을 감싸는 WebView 래퍼 앱입니다. 네이티브 레이어는 푸시 알림, 인증 토큰 저장, 강제 업데이트 체크, 딥 링크만 담당합니다.

## 개발 명령어

```bash
pnpm install          # 의존성 설치
pnpm start            # Expo 개발 서버
pnpm ios / android    # 플랫폼별 실행
pnpm lint             # ESLint 검사
pnpm test             # Jest watch 모드
pnpm test -- --watchAll=false  # 단발성 테스트 (PR 전 권장)
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `EXPO_PUBLIC_APP_ENV` | `development` \| `production` (기본: `production`) |
| `EXPO_PUBLIC_API_ENV` | `APP_ENV`를 덮어써서 API/웹 URL 선택 |

- Production: `https://agit.gg`, `https://api.agit.gg`
- Stage: `https://stage.agit.gg`, `https://api.stage.agit.gg`

## 아키텍처

**라우팅** (Expo Router 파일 기반)
- `app/_layout.tsx` — 푸시 알림 초기화, 강제 업데이트 체크, 알림 탭 딥 링크 처리
- `app/index.tsx` — `/webview/home`으로 리다이렉트
- `app/webview/[path].tsx` — 메인 WebView; `path`가 `${webUrl}/${path}`로 매핑
- `app/forceupdate.tsx` — 서버 버전 > 앱 버전일 때 표시

**WebView ↔ 네이티브 브릿지** (`window.postMessage`)

| type | 동작 |
|------|------|
| `LOGIN_COMPLETE` | `accessToken` SecureStore 저장 + 푸시 토큰 백엔드 등록 |
| `TOKEN_REFRESH` | `accessToken` 갱신 |
| `LOGOUT` | 푸시 토큰 백엔드 삭제 + `accessToken` 초기화 |

등록 결과는 `NOTIFICATION_STATUS` CustomEvent로 WebView에 주입합니다.

**주요 모듈**
- `services/nativeAuthStore.ts` — `expo-secure-store` 기반 액세스 토큰 CRUD
- `services/pushTokenApi.ts` — 푸시 토큰 등록/삭제; in-flight 중복 방지, 토큰 캐싱
- `services/notifications.ts` — 알림 권한 요청, 설정 이동 후 재진입 시 권한 재체크
- `services/forceupdate.ts` — `GET /versions/latest?platform=IOS|ANDROID` 버전 비교
- `utils/pushTokenStore.ts` — 인메모리 + SecureStore 캐시, 콜백 지원
- `utils/userAgent.ts` — `KONECT_APP/{version}` 포함 커스텀 User-Agent 생성

## 코딩 스타일

- TypeScript strict 모드 유지
- Prettier 기준: 2칸 들여쓰기, single quote, 세미콜론, `printWidth: 100`
- 컴포넌트/타입 `PascalCase`, 함수/변수 `camelCase`
- 네트워크/플랫폼 의존 로직 → `services/`, 순수 유틸 → `utils/`
- 민감 정보는 반드시 `expo-secure-store`에만 저장, 커밋 금지

---

## Git 작업 규칙

타입: `feat` | `fix` | `refactor` | `chore` | `release`

### 이슈 제목
```
[타입] 작업 요약
[fix] 푸시 알림 토큰 중복 등록 문제 수정
```

### 브랜치명
```
{이슈번호}-{타입}-{kebab-case-요약}
50-fix-푸시-알림-토큰-중복-등록-문제-수정

# 이슈 없을 때
no-issue-{타입}-{kebab-case-요약}
```

### 커밋 메시지
한 커밋에 한 가지 의도만, 요약은 명령형으로 작성합니다.
```
타입: 변경 내용 요약
fix: cancel 클릭 시 다이얼로그만 닫기
```

### PR

제목은 이슈와 동일한 형식 `[타입] 요약`, 본문 템플릿:

```md
## 배경

## 변경 사항

## 검증

- [ ] pnpm lint
- [ ] pnpm test -- --watchAll=false

## 이슈

Closes #{이슈번호}
```
