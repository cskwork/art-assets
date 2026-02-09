---
id: REQ-006
title: 월드 퀴즈 배틀 게임 HTML/CSS/JS 모듈 변환
status: done
created_at: 2026-02-09T10:30:00Z
user_request: UR-006
claimed_at: 2026-02-09T14:00:00Z
route: A
---

# 월드 퀴즈 배틀 게임 HTML/CSS/JS 모듈 변환

## What
React UltimateBattleGame 컴포넌트를 순수 HTML/CSS/JS로 분리하여 edu-content 모듈로 변환.

## Context
- React useState/useEffect/useRef/useCallback -> 순수 JS 상태 관리
- Tailwind CSS 클래스 -> 순수 CSS
- lucide-react 아이콘 -> SVG 인라인
- Canvas 기반 전투 애니메이션 (Fighter 객체, 파티클, 충격파)
- Web Audio API SoundManager 클래스
- 20문제 중 10문제 랜덤 출제, 4지선다
- HP 시스템, 콤보, 타이머
- 6개 화면: START, LOADING, SELECT, VS, BATTLE, RESULT
- 대상 위치: `edu-content/20260209-world-quiz-battle/`

---
*Source: React UltimateBattleGame -> HTML/CSS/JS 분리*
