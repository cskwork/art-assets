# Changelog - 2026-02-09

## 세계 퀴즈 배틀 게임 모듈 추가

### 추가
- `edu-content/20260209-world-quiz-battle/index.html`: 게임 메인 HTML 구조
- `edu-content/20260209-world-quiz-battle/style.css`: 순수 CSS 스타일 (Tailwind 제거)
- `edu-content/20260209-world-quiz-battle/script.js`: 순수 JS 게임 로직 (React 제거)
- `.do-work/REQ-006-world-quiz-battle.md`: do-work 추적 파일

### 변환 내용
- React 컴포넌트(UltimateBattleGame)를 순수 HTML/CSS/JS 3파일로 분리 변환
- React useState/useEffect/useRef/useCallback -> 순수 JS 상태 객체 + DOM 직접 조작
- Tailwind CSS 유틸리티 클래스 -> 순수 CSS 클래스
- lucide-react 아이콘(Zap, Skull, RefreshCw) -> 인라인 SVG
- Canvas 기반 전투 애니메이션 유지 (파이터, 파티클, 충격파)
- Web Audio API SoundManager 클래스 유지

### 주요 기능
- 6개 화면: START, LOADING, SELECT, VS, BATTLE, RESULT
- 20문제 풀에서 10문제 랜덤 출제 (4지선다, 옵션 셔플)
- HP 시스템 (15데미지/문제), 콤보 시스템, 10초 타이머
- 캐릭터 선택 (탄지로/고죠 사토루)
- 공격 시퀀스 애니메이션 (대시, 히트, 파티클, 충격파)
- CRT 스캔라인 오버레이, 히트 플래시, 화면 흔들림

### 코드 리뷰 반영
- 틀렸을 때/시간 초과 시 정답 하이라이트 표시 (교육적 피드백)
- Canvas clearRect shake 오프셋 잔상 방지
- AudioContext 에러 핸들링 (try-catch)
- 타이머 정수 밀리초 사용 (부동소수점 정밀도 문제 해결)
- 퀴즈 옵션 셔플 (정답 위치 고정 방지)

### 검증
- JS 문법 검증 통과 (`node --check`)
