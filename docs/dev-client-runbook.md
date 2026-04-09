# 한끼비서 iOS dev-client 런북

## 고정 실행 명령
- Metro: `npm run start:dev`
- iOS build/open: `npm run ios:dev`

## 왜 이렇게 고정했는가
- 다른 Expo 프로젝트와 `8081` 충돌이 자주 발생함
- 한끼비서는 개발 포트를 `8083`으로 고정해 `No script URL provided` 재발을 줄임
- Expo 설정과 iOS Pod 설정의 `newArchEnabled`를 모두 `false`로 맞춤

## 기본 재현 절차
1. 새 터미널에서 `/Users/sangbinsmacbook/Desktop/Projects/hanggi`로 이동
2. `npm run start:dev`
3. 다른 터미널에서 `npm run ios:dev`
4. 시뮬레이터에서 `com.hanggi.app` dev client가 `8083`에 연결되는지 확인

## 포트 충돌 시
- `8083`이 이미 사용 중이면 해당 Expo 프로세스를 종료
- 다시 `npm run start:dev`
- 이후 `npm run ios:dev`

## 빨간 번들 에러가 떴을 때 확인할 것
- `com.hanggi.app`이 맞는지
- `8083` Metro가 살아 있는지
- 다른 앱 dev client가 열린 상태가 아닌지
- 시뮬레이터가 `localhost:8081` 같은 예전 주소를 잡고 있지 않은지

## 재발 방지 기준
- 같은 명령으로 3회 연속 실행 시 `No script URL provided`가 없어야 함
- `npm run ios:dev` 결과가 `Waiting on http://localhost:8083` 또는 동일 포트 연결로 보여야 함
