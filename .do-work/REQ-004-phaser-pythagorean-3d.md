---
id: REQ-004
title: Phaser 기반 피타고라스 정리 의사 3D 인터랙티브 콘텐츠 생성
status: completed
created_at: 2026-02-06T12:00:00Z
user_request: UR-004
claimed_at: 2026-02-06T12:05:00Z
route: A
completed_at: 2026-02-06T12:30:00Z
---

# Phaser 기반 피타고라스 정리 의사 3D 인터랙티브 콘텐츠 생성

## What
`prompts/3d-content.md` 템플릿에 따라 Phaser 3.x 기반 피타고라스 정리(a² + b² = c²) 인터랙티브 수학 콘텐츠를 생성한다. 의사 3D(2.5D) 표현 방식을 사용하며, 7개 장면 구조(Hook-Anchor-Story-Core-Visualize-Quiz-Wrap)를 따른다.

## Context
- 대상 학년: 중학교 2학년
- 선수 개념: 직각삼각형, 정사각형 넓이
- 후속 개념: 거리 공식
- 기존 Three.js 기반 피타고라스 콘텐츠(`edu-content/20260127-pythagorean-3d/`)가 있으나, 이번엔 Phaser 기반 의사 3D로 새로 제작
- `prompts/3d-content.md`의 템플릿, 장면 구조, 기술 기준을 모두 준수
- 출력 위치: `edu-content/20260206-phaser/` 폴더에 `index.html`, `style.css`, `script.js`, `CLAUDE.md` 생성
- Phaser 3.80.1 CDN 사용, Scene 분리, 16:9(1280x720) 해상도

## Assets
없음

---
*Source: @prompts/3d-content.md  make for math pythagorous math content new 3d based*
