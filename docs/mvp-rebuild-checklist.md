# 한끼비서 체크리스트 업데이트

## 0. 현재 기준
- [x] 앱 방향을 `추천 앱`보다 `선택을 끝내주는 앱` 쪽으로 재정의했다.
- [x] 홈 CTA를 `이걸로 결정`, `바꿀래`, `귀찮아. 근처 가게 보여줘` 기준으로 정리했다.
- [ ] 최종 카피를 전 화면에서 `두 번 안에 무조건 결정하게 만드는 식사 앱`으로 완전히 통일한다.

## 1. 이번에 이미 구현된 것

### 1-1. 소비자 앱
- [x] 상태 선택 UI
- [x] 목표 모드 4종 (`자유식`, `균형식`, `다이어트`, `고고당`)
- [x] 메뉴 1개 추천 흐름
- [x] `바꿀래` 1회 구조
- [x] 메뉴 확정 후 장보기 리스트 자동 생성
- [x] 고고당 모드용 저염/대체 재료 노출
- [x] `귀찮아` 이후 근처 음식점 추천 흐름
- [x] 가입 매장 우선 음식점 추천 로직의 초안

### 1-2. 개발 안정화
- [x] `start:dev`, `ios:dev` 스크립트 추가
- [x] dev 포트를 `8083`으로 고정
- [x] iOS `newArchEnabled` 불일치 수정
- [x] dev client 런북 문서 추가

### 1-3. 운영/영업 스캐폴드
- [x] Supabase 스키마 초안 문서 추가
- [x] QR 유입 사장님 가입 웹 목업 추가
- [x] 운영 어드민 목업 추가
- [x] 현장 영업 플레이북 문서 추가

## 2. 지금 코드 기준 완료 상태

### 2-1. 타입/상태
- [x] 추천 세션 타입 추가
- [x] 장보기 타입 추가
- [x] 음식점 추천 타입 추가
- [x] 사장님/매장 상태 타입 추가

### 2-2. 데이터
- [x] 메뉴 데이터에 장보기 정보 추가
- [x] 메뉴 데이터에 고고당 대응 정보 추가
- [x] 음식점 더미 데이터 추가

### 2-3. 엔진/훅
- [x] 추천 엔진을 단일 추천 중심으로 단순화
- [x] 음식점 추천 엔진 초안 추가
- [x] 추천 훅을 새 세션 구조에 맞게 수정

### 2-4. 화면
- [x] 홈 화면을 새 결정 흐름 중심으로 재구성
- [x] 설정 화면에 고고당 포함
- [x] 온보딩에 고고당 추가
- [ ] 온보딩을 `앱 철학 안내` 중심으로 더 축소한다.

## 3. 아직 남은 앱 작업

### 3-1. 결정 UX 다듬기
- [ ] `바꿀래`가 실제로 두 번째 후보를 명확히 보여주는지 실기기에서 검증
- [ ] 두 번째 후보 이후 더 이상 후보가 바뀌지 않도록 UX를 더 강하게 잠금
- [ ] 추천 전에는 추천 카드가 비어 있거나 안내 상태로만 보이게 정리
- [ ] 기록/달력 화면이 현재 앱 철학을 방해하지 않게 노출 우선순위 조정

### 3-2. 장보기/귀찮아
- [x] 장보기 리스트 자동 생성
- [x] 고고당 대체 재료 안내
- [ ] 장보기를 모달형으로 갈지 현재처럼 같은 화면 섹션으로 갈지 최종 결정
- [ ] `귀찮아` 이후 음식점 카드 수, 정렬 방식, 노출 문구를 더 다듬기

### 3-3. 음식점 추천
- [x] 가입 매장 우선 + 메뉴 일치 + 거리 기준 초안 반영
- [ ] 실제 위치 기반으로 검증
- [ ] 활성 매장만 노출되는지 QA
- [ ] 메뉴 불일치 매장이 섞이지 않는지 QA
- [ ] 추천 이벤트 로그를 실제 DB에 적재하는 연결 추가

## 4. 운영 시스템에서 아직 남은 것

### 4-1. Supabase
- [x] 스키마 초안 작성
- [ ] 실제 Supabase 프로젝트 생성
- [ ] RLS/권한 정책 추가
- [ ] Storage 버킷 설계
- [ ] 추천 조회용 RPC 또는 Edge Function 구현

### 4-2. 사장님 가입 웹
- [x] HTML 목업 작성
- [ ] 실제 웹 앱 프로젝트 생성
- [ ] 가입 폼 저장
- [ ] 계약 확인 상태 저장
- [ ] 계좌이체 후 신청 완료 저장
- [ ] QR별 유입 추적 추가

### 4-3. 운영 어드민
- [x] HTML 목업 작성
- [ ] 실제 어드민 프로젝트 생성
- [ ] 영업 리드 목록 조회
- [ ] 입금 확인 처리
- [ ] 매장 활성화/비활성화 처리
- [ ] 메뉴-매장 매핑 편집

## 5. 디자인 체크리스트
- [x] 3색 중심 테마 구조 추가
- [x] 공통 셸과 하단 네비게이션 추가
- [ ] 로고 색상을 새 톤에 맞게 재정의
- [ ] 초록 채도를 더 낮추고 `배달앱` 느낌을 덜어내기
- [ ] 온보딩/페이월도 현재 테마로 통일
- [ ] 실제 음식 이미지나 일러스트를 넣을지 결정

## 6. iOS/dev-client 체크리스트
- [x] 포트 고정 스크립트 작성
- [x] 런북 문서 작성
- [ ] 동일 명령으로 3회 연속 실행 시 `No script URL provided`가 재발하지 않는지 확인
- [ ] 다른 Expo 프로젝트가 켜져 있을 때도 복구 절차가 충분한지 확인
- [ ] 시뮬레이터/Metro/앱 재연결 과정을 실제로 한 번 더 정리

## 7. QA 우선순위

### 7-1. 지금 바로 봐야 할 것
- [ ] 홈 화면에서 상태 선택 후 추천이 바로 뜨는가
- [ ] `바꿀래` 후 후보가 실제로 바뀌는가
- [ ] 메뉴 확정 후 장보기가 자연스럽게 이어지는가
- [ ] `귀찮아` 후 음식점 카드가 뜨는가
- [ ] 타입 체크 외 실제 런타임 에러가 없는가

### 7-2. 그 다음
- [ ] 고고당 모드에서 대체 재료가 어색하지 않은가
- [ ] 위치 권한 거부 시 fallback 추천이 자연스러운가
- [ ] 가입 매장 배지가 광고처럼 과해 보이지 않는가
- [ ] 기록/달력/설정의 정보 밀도가 전체 앱 톤과 맞는가

## 8. 파일별 완료/다음 작업

### 완료 중심 파일
- [x] [src/types/index.ts](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/types/index.ts)
- [x] [src/store.ts](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/store.ts)
- [x] [src/core/engine.ts](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/core/engine.ts)
- [x] [src/hooks/useRecommendation.ts](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/hooks/useRecommendation.ts)
- [x] [src/data/menus.json](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/data/menus.json)
- [x] [src/data/restaurants.json](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/data/restaurants.json)
- [x] [src/components/HomeScreen.tsx](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/components/HomeScreen.tsx)

### 다음 우선 작업 파일
- [ ] [src/components/OnboardingScreen.tsx](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/components/OnboardingScreen.tsx)
- [ ] [src/components/PaywallScreen.tsx](/Users/sangbinsmacbook/Desktop/Projects/hanggi/src/components/PaywallScreen.tsx)
- [ ] [app.json](/Users/sangbinsmacbook/Desktop/Projects/hanggi/app.json)
- [ ] [docs/dev-client-runbook.md](/Users/sangbinsmacbook/Desktop/Projects/hanggi/docs/dev-client-runbook.md)
- [ ] [docs/supabase-schema.sql](/Users/sangbinsmacbook/Desktop/Projects/hanggi/docs/supabase-schema.sql)

## 9. 바로 다음 할 일
- [ ] 시뮬레이터에서 현재 홈 흐름 런타임 검증
- [ ] `바꿀래` 1회 UX를 실제 동작 기준으로 고정
- [ ] 온보딩/페이월 디자인 톤 통일
- [ ] Supabase 실제 프로젝트 기준으로 스키마/권한 적용
- [ ] 사장님 가입 웹과 운영 어드민을 실제 앱으로 분리 착수

> 추천이 아니라, 선택을 끝내주는 앱  
> 그리고 귀찮아지면, 근처에서 그 선택을 바로 이어주는 앱
