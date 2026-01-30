# Phaser.io Game Development Skill

Phaser.io 기반 2D 게임 및 인터랙티브 교육 콘텐츠 개발 스킬.

## Triggers

- "phaser", "phaser.io", "phaser game"
- "2D 게임", "아케이드 게임", "드래그 앤 드롭 게임"
- "게임 기반 학습", "교육용 게임"
- "스프라이트 애니메이션", "물리 게임"

## Overview

Phaser는 Canvas/WebGL 기반 2D 게임 프레임워크입니다. Three.js가 3D 시각화에 적합하다면, Phaser는 게임 메카닉(점수, 물리, 충돌, 드래그앤드롭)이 필요한 인터랙티브 콘텐츠에 적합합니다.

### Phaser vs Three.js 선택 기준

| 요구사항 | Phaser | Three.js |
|----------|--------|----------|
| 3D 공간 시각화 | X | O |
| 점수/레벨 시스템 | O | X |
| 물리 충돌 감지 | O (내장) | 별도 라이브러리 필요 |
| 드래그 앤 드롭 | O (내장) | 수동 구현 필요 |
| 스프라이트 애니메이션 | O | X |
| 씬 전환/게임 상태 | O | X |
| 모바일 터치 | O (내장) | 별도 처리 필요 |

---

## UI/UX Design Guidelines

### 핵심 원칙

1. **이모지 사용 금지**: 이모지 대신 Graphics API로 아이콘 그리기
2. **일관된 색상 팔레트**: CSS 변수 또는 상수로 정의
3. **충분한 터치 영역**: 최소 44x44px (모바일 접근성)
4. **명확한 시각적 피드백**: 호버, 클릭, 성공/실패 상태
5. **부드러운 전환**: Tween 애니메이션 활용

### 선명한 시각 디자인 원칙 (Crisp Visual Design)

| 요소 | 권장 패턴 |
|------|----------|
| **그림자** | 검은색 0.3~0.4 opacity, 4px 오프셋 |
| **테두리** | 카테고리 색상 100% opacity, 3~4px 두께 |
| **하이라이트** | 상단에 밝은 색상 0.3 opacity 레이어 |
| **헤더 바** | 드롭존 상단 50px, 0.85 opacity |
| **외곽 글로우** | 6px 패딩, 0.1 opacity |
| **텍스트 대비** | 밝은 배경엔 검은색, 어두운 배경엔 흰색 |
| **박스 크기** | 일관된 크기 사용 (예: 160x70, 210x270) |

```javascript
// 그림자 레이어 예시
const shadow = this.add.graphics();
shadow.fillStyle(0x000000, 0.4);
shadow.fillRoundedRect(x + 4, y + 4, width, height, radius);

// 하이라이트 레이어 예시
bg.fillStyle(0x60a5fa, 0.3);
bg.fillRoundedRect(x + 2, y + 2, width - 4, 20, { tl: 8, tr: 8, bl: 0, br: 0 });
```

### 색상 팔레트 (권장)

```javascript
const COLORS = {
    // 배경
    bgPrimary: 0x0f172a,      // 어두운 네이비
    bgSecondary: 0x1e293b,    // 슬레이트
    bgCard: 0x334155,         // 카드 배경

    // 주요 색상
    primary: 0x3b82f6,        // 블루
    secondary: 0x6366f1,      // 인디고
    accent: 0x8b5cf6,         // 퍼플

    // 상태 색상
    success: 0x22c55e,        // 그린
    warning: 0xf59e0b,        // 앰버
    error: 0xef4444,          // 레드

    // 카테고리 (교육용)
    categoryA: 0x4ade80,      // 민트 그린
    categoryB: 0xfbbf24,      // 골드
    categoryC: 0xf472b6,      // 핑크

    // 텍스트
    textPrimary: 0xffffff,
    textSecondary: 0x94a3b8,
    textMuted: 0x64748b
};
```

### 타이포그래피 스타일

```javascript
const TEXT_STYLES = {
    title: {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        fontStyle: 'bold'
    },
    subtitle: {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '24px',
        color: '#94a3b8'
    },
    body: {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '20px',
        color: '#e2e8f0',
        wordWrap: { width: 700 },
        lineSpacing: 8
    },
    button: {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
    },
    label: {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '16px',
        color: '#94a3b8'
    }
};
```

### 아이콘 구현 방법 (중요)

**file:// 프로토콜에서 SVG 로딩 이슈:**
- `this.load.svg()`는 CORS 정책으로 인해 `file://` 환경에서 작동하지 않음
- 빈 사각형으로 표시되는 문제 발생

**해결책: Phaser Graphics로 직접 그리기**

외부 SVG 파일 대신 `this.add.graphics()`를 사용하여 아이콘을 직접 그립니다. 이 방법은:
- 외부 파일 로딩 없음 (CORS 무관)
- `file://`, `http://`, `https://` 모든 환경에서 작동
- 색상, 크기 동적 변경 가능

```javascript
// Icons 객체로 재사용 가능한 아이콘 함수 정의
const Icons = {
    drawStar(graphics, x, y, size, color = 0xfbbf24) {
        graphics.fillStyle(color, 1);
        const points = [];
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? size : size * 0.5;
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
        }
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) graphics.lineTo(points[i].x, points[i].y);
        graphics.closePath();
        graphics.fillPath();
    },

    // ⚠️ bezierCurveTo는 Phaser Graphics에서 지원하지 않음!
    // 원과 삼각형으로 하트를 구현
    drawHeart(graphics, x, y, size, color = 0xf472b6) {
        graphics.fillStyle(color, 1);
        const r = size * 0.25;
        // Left circle
        graphics.fillCircle(x - r, y - r * 0.5, r);
        // Right circle
        graphics.fillCircle(x + r, y - r * 0.5, r);
        // Bottom triangle
        graphics.fillTriangle(
            x - size * 0.45, y - r * 0.3,
            x + size * 0.45, y - r * 0.3,
            x, y + size * 0.4
        );
    },

    drawPlay(graphics, x, y, size) {
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(x - size * 0.3, y - size * 0.4);
        graphics.lineTo(x + size * 0.4, y);
        graphics.lineTo(x - size * 0.3, y + size * 0.4);
        graphics.closePath();
        graphics.fillPath();
    },

    drawRefresh(graphics, x, y, size) {
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.beginPath();
        graphics.arc(x, y, size * 0.35, -Math.PI * 0.8, Math.PI * 0.5, false);
        graphics.strokePath();
        // Arrow head
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(x + size * 0.1, y + size * 0.35);
        graphics.lineTo(x + size * 0.35, y + size * 0.2);
        graphics.lineTo(x + size * 0.35, y + size * 0.5);
        graphics.closePath();
        graphics.fillPath();
    },

    drawRunner(graphics, x, y, size, color = 0xffffff) {
        graphics.lineStyle(2.5, color, 1);
        graphics.strokeCircle(x, y - size * 0.35, size * 0.12); // Head
        graphics.lineBetween(x, y - size * 0.23, x, y + size * 0.1); // Body
        graphics.lineBetween(x, y - size * 0.1, x - size * 0.25, y - size * 0.25); // Arm
        graphics.lineBetween(x, y - size * 0.1, x + size * 0.2, y + size * 0.05);
        graphics.lineBetween(x, y + size * 0.1, x - size * 0.2, y + size * 0.4); // Leg
        graphics.lineBetween(x, y + size * 0.1, x + size * 0.25, y + size * 0.3);
    },

    drawRobot(graphics, x, y, size) {
        // Body
        graphics.fillStyle(0x64748b, 1);
        graphics.fillRoundedRect(x - size * 0.35, y - size * 0.1, size * 0.7, size * 0.5, 8);
        // Head
        graphics.fillStyle(0x94a3b8, 1);
        graphics.fillRoundedRect(x - size * 0.3, y - size * 0.45, size * 0.6, size * 0.35, 6);
        // Antenna
        graphics.lineStyle(3, 0x64748b, 1);
        graphics.lineBetween(x, y - size * 0.45, x, y - size * 0.6);
        graphics.fillStyle(0x22c55e, 1);
        graphics.fillCircle(x, y - size * 0.65, size * 0.06);
        // Eyes
        graphics.fillStyle(0x3b82f6, 1);
        graphics.fillCircle(x - size * 0.12, y - size * 0.3, size * 0.08);
        graphics.fillCircle(x + size * 0.12, y - size * 0.3, size * 0.08);
    },

    drawTrophy(graphics, x, y, size) {
        graphics.fillStyle(0xfbbf24, 1);
        graphics.fillRoundedRect(x - size * 0.4, y - size * 0.3, size * 0.8, size * 0.5, 8);
        graphics.lineStyle(4, 0xfbbf24, 1);
        graphics.beginPath();
        graphics.arc(x - size * 0.5, y - size * 0.1, size * 0.15, -Math.PI / 2, Math.PI / 2, false);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(x + size * 0.5, y - size * 0.1, size * 0.15, Math.PI / 2, -Math.PI / 2, false);
        graphics.strokePath();
        graphics.fillRect(x - size * 0.15, y + size * 0.2, size * 0.3, size * 0.15);
        graphics.fillRect(x - size * 0.25, y + size * 0.35, size * 0.5, size * 0.1);
    }
};

// 사용법
create() {
    const starIcon = this.add.graphics();
    Icons.drawStar(starIcon, 100, 100, 20); // x, y, size

    const robotChar = this.add.graphics();
    Icons.drawRobot(robotChar, 400, 300, 80);
}
```

### 언제 SVG 파일을 사용할 수 있나?

| 환경 | SVG 로딩 | Graphics 그리기 |
|------|---------|----------------|
| `file://` 로컬 | X (CORS 차단) | O |
| `http://localhost` | O | O |
| 프로덕션 서버 | O | O |

**권장:** 항상 Graphics로 그리기 사용 (모든 환경에서 작동)

---

## CDN Setup (file:// 호환)

```html
<!-- Phaser 3 CDN (권장 버전) -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
```

## Basic Game Configuration

### ⚠️ 필수: 정사각형 레이아웃 (600x600)

**교육용 콘텐츠는 반드시 600x600 정사각형 캔버스를 사용합니다.**

| 항목 | 값 | 이유 |
|------|-----|------|
| width | 600 | 정사각형 레이아웃 |
| height | 600 | 모든 UI 요소가 캔버스 내에 완벽히 표시 |
| center | (300, 300) | 모든 요소의 중심 좌표 |

**주의:** 800x600으로 설정하면 UI 요소(키패드, 버튼 등)가 캔버스 밖으로 벗어나는 문제 발생!

```javascript
const config = {
    type: Phaser.AUTO,
    width: 600,      // ⚠️ 반드시 600 (정사각형)
    height: 600,     // ⚠️ 반드시 600 (정사각형)
    parent: 'game-container',
    backgroundColor: COLORS.bgPrimary,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, HookScene, CoreScene, QuizScene, WrapScene]
};
```

### 600x600 레이아웃 가이드

```javascript
// 배경 - 항상 (300, 300) 중심
this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);

// 타이틀 - 상단
this.add.text(300, 50, '제목', { ... }).setOrigin(0.5);

// 메인 콘텐츠 - 중앙
// y: 100 ~ 450 영역 사용

// 버튼 - 하단
this.createButton(300, 520, '다음', onClick);

// 피드백 텍스트 - 최하단
this.feedbackText = this.add.text(300, 565, '', { ... }).setOrigin(0.5);
```
```

## Scene Lifecycle

```javascript
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        // 모든 에셋을 BootScene에서 로드
        this.load.svg('robot', '../../illustrations/illust-robot-friendly-ai-20260124.svg', { width: 120, height: 120 });
        this.load.svg('star', '../../icons/icon-star-reward-cute-20260124.svg', { width: 32, height: 32 });
        // 로딩 바 표시 (선택사항)
    }

    create() {
        this.scene.start('HookScene');
    }
}
```

## Button Component Pattern

**이모지 없이 깔끔한 버튼:**

```javascript
createButton(x, y, text, onClick) {
    const container = this.add.container(x, y);

    // 배경 (둥근 사각형)
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.primary, 1);
    bg.fillRoundedRect(-100, -25, 200, 50, 12);

    // 텍스트
    const label = this.add.text(0, 0, text, TEXT_STYLES.button).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(200, 50);
    container.setInteractive({ useHandCursor: true });

    // 호버 효과
    container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.secondary, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 12);
        this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.primary, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 12);
        this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    container.on('pointerdown', onClick);

    return container;
}
```

## Card Component Pattern

**드래그 가능한 카드 (그림자 + 하이라이트):**

```javascript
createDraggableCard(x, y, word, meaning) {
    const container = this.add.container(x, y);
    const cardW = 115, cardH = 80;

    // 그림자 레이어 (깊이감)
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-cardW/2 + 4, -cardH/2 + 4, cardW, cardH, 10);

    // 카드 배경 + 테두리
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.primary, 1);
    bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    bg.lineStyle(2, 0x93c5fd, 1);  // 밝은 테두리
    bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);

    // 상단 하이라이트 (광택 효과)
    bg.fillStyle(0x60a5fa, 0.3);
    bg.fillRoundedRect(-cardW/2 + 2, -cardH/2 + 2, cardW - 4, 20, { tl: 8, tr: 8, bl: 0, br: 0 });

    // 메인 텍스트
    const wordText = this.add.text(0, -12, word, {
        fontFamily: 'Noto Sans KR',
        fontSize: '26px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // 서브 텍스트
    const meaningText = this.add.text(0, 18, meaning, {
        fontFamily: 'Noto Sans KR',
        fontSize: '14px',
        color: '#dbeafe'
    }).setOrigin(0.5);

    container.add([shadow, bg, wordText, meaningText]);
    container.setSize(cardW, cardH);
    container.setInteractive({ draggable: true, useHandCursor: true });
    container.bg = bg;  // 나중에 색상 변경용

    // 드래그 시 효과
    container.on('dragstart', () => {
        container.setDepth(100);
        this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
    });

    container.on('dragend', () => {
        container.setDepth(0);
        this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    return container;
}
```

## Drop Zone Pattern

**선명하고 전문적인 드롭 영역 (헤더 바 + 외곽 글로우):**

```javascript
createDropZone(x, y, width, height, label, color, iconDrawFn) {
    // 외곽 글로우 효과
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.1);
    glow.fillRoundedRect(x - width/2 - 6, y - height/2 - 6, width + 12, height + 12, 18);

    // 메인 영역 배경
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.2);
    bg.fillRoundedRect(x - width/2, y - height/2, width, height, 14);
    bg.lineStyle(4, color, 1);  // 굵은 테두리, 풀 투명도
    bg.strokeRoundedRect(x - width/2, y - height/2, width, height, 14);

    // 헤더 바 (상단 강조)
    const header = this.add.graphics();
    header.fillStyle(color, 0.85);
    header.fillRoundedRect(x - width/2, y - height/2, width, 50, { tl: 14, tr: 14, bl: 0, br: 0 });

    // 아이콘 (선택적)
    const icon = this.add.graphics();
    if (iconDrawFn) iconDrawFn(icon, x - 42, y - height/2 + 25, 20, 0x000000);

    // 라벨 (검은색 텍스트 - 밝은 헤더 위)
    const labelText = this.add.text(x + 5, y - height/2 + 25, label, {
        fontFamily: 'Noto Sans KR',
        fontSize: '20px',
        color: '#000000',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // 드롭 존 설정
    const zone = this.add.zone(x, y + 30, width - 20, height - 90)
        .setRectangleDropZone(width - 20, height - 90);

    return { glow, bg, header, icon, labelText, zone };
}

// 사용 예시
const moveZone = this.createDropZone(200, 350, 210, 270, '움직임', COLORS.categoryA, Icons.drawRunner);
const makeZone = this.createDropZone(440, 350, 210, 270, '만들기', COLORS.categoryB, Icons.drawPencil);
```

## Feedback Animations

```javascript
// 성공 피드백
showSuccess(x, y) {
    // 파티클 효과 (Graphics로 구현)
    for (let i = 0; i < 8; i++) {
        const particle = this.add.graphics();
        particle.fillStyle(COLORS.success, 1);
        particle.fillCircle(0, 0, 6);
        particle.setPosition(x, y);

        this.tweens.add({
            targets: particle,
            x: x + Phaser.Math.Between(-80, 80),
            y: y + Phaser.Math.Between(-80, 80),
            alpha: 0,
            scale: 0,
            duration: 600,
            onComplete: () => particle.destroy()
        });
    }
}

// 실패 피드백 (흔들기)
showError(target) {
    this.tweens.add({
        targets: target,
        x: target.x + 8,
        duration: 50,
        yoyo: true,
        repeat: 4,
        ease: 'Sine.easeInOut'
    });
}

// 점수 팝업
showScorePopup(x, y, points) {
    const popup = this.add.text(x, y, `+${points}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '28px',
        color: '#fbbf24',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: popup,
        y: y - 50,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => popup.destroy()
    });
}
```

## Score Display Pattern

```javascript
createScoreDisplay(x, y) {
    const container = this.add.container(x, y);

    // 배경
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgCard, 0.8);
    bg.fillRoundedRect(-60, -20, 120, 40, 8);

    // 별 아이콘 (SVG)
    const starIcon = this.add.image(-35, 0, 'star').setScale(0.8);

    // 점수 텍스트
    this.scoreText = this.add.text(10, 0, '0', {
        fontFamily: 'Noto Sans KR',
        fontSize: '24px',
        color: '#fbbf24',
        fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    container.add([bg, starIcon, this.scoreText]);
    return container;
}

updateScore(value) {
    this.scoreText.setText(value.toString());
    // 점수 업데이트 애니메이션
    this.tweens.add({
        targets: this.scoreText,
        scale: 1.2,
        duration: 100,
        yoyo: true
    });
}
```

## Progress Indicator

```javascript
createProgressBar(x, y, width, current, total) {
    const container = this.add.container(x, y);

    // 배경 바
    const bgBar = this.add.graphics();
    bgBar.fillStyle(COLORS.bgCard, 1);
    bgBar.fillRoundedRect(-width/2, -8, width, 16, 8);

    // 진행 바
    const progressBar = this.add.graphics();
    const progress = (current / total) * width;
    progressBar.fillStyle(COLORS.primary, 1);
    progressBar.fillRoundedRect(-width/2, -8, Math.max(16, progress), 16, 8);

    // 텍스트
    const label = this.add.text(0, 25, `${current} / ${total}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '16px',
        color: '#94a3b8'
    }).setOrigin(0.5);

    container.add([bgBar, progressBar, label]);
    return container;
}
```

---

## Multi-Scene Pattern (7씬 구조)

```javascript
// 씬 구조
const scenes = [
    'BootScene',      // 에셋 로드
    'HookScene',      // 흥미 유발
    'AnchorScene',    // 선행학습 복습
    'StoryScene',     // 캐릭터 스토리
    'CoreScene',      // 핵심 게임플레이
    'VisualizeScene', // 개념 정리
    'QuizScene',      // 퀴즈
    'WrapScene'       // 완료/보상
];
```

## Score and Registry

```javascript
// 초기화
this.registry.set('score', 0);
this.registry.set('round', 1);

// 업데이트
this.registry.inc('score', 10);

// 다른 씬에서 접근
const score = this.registry.get('score');
```

---

## Anti-Patterns (피해야 할 것)

| 피해야 할 것 | 대안 |
|-------------|------|
| **800x600 레이아웃** | **⚠️ 600x600 정사각형 필수!** 키패드/버튼이 캔버스 밖으로 벗어남 |
| 중심점 (400, 300) | 중심점 (300, 300) - 600x600 캔버스 기준 |
| 텍스트로 이모지 사용 | Graphics로 아이콘 그리기 |
| `this.load.svg()` 사용 | Graphics API로 직접 그리기 (CORS 무관) |
| `bezierCurveTo()` 사용 | ⚠️ **Phaser에 없음!** 원+삼각형으로 복잡한 도형 구현 |
| 하드코딩된 색상값 | COLORS 상수 객체 |
| 인라인 스타일 객체 | TEXT_STYLES 상수 |
| 정적인 UI | Tween 애니메이션 |
| 작은 터치 영역 | 최소 44x44px |
| 피드백 없는 인터랙션 | 호버/클릭/결과 피드백 |
| 낮은 투명도 배경 (0.15) | 0.2~0.25로 대비 향상 |
| 얇은 테두리 (2px, 0.8 opacity) | 3~4px, 1.0 opacity로 선명하게 |
| 그림자 없는 카드 | 4px 오프셋 그림자로 깊이감 |

### ⚠️ Phaser Graphics API 제한사항

Phaser의 Graphics 객체는 Canvas API와 다릅니다:

```javascript
// ❌ 작동 안 함 - Phaser에 없는 메서드
graphics.bezierCurveTo(...)
graphics.quadraticCurveTo(...)

// ✅ 사용 가능한 메서드
graphics.fillCircle(x, y, radius)
graphics.fillTriangle(x1, y1, x2, y2, x3, y3)
graphics.fillRoundedRect(x, y, w, h, radius)
graphics.arc(x, y, radius, startAngle, endAngle)
graphics.lineBetween(x1, y1, x2, y2)
```

---

## 교육 콘텐츠 템플릿

```
edu-content/YYYYMMDD-{topic}-phaser/
├── index.html      # Phaser 게임 진입점 (600x600 캔버스!)
└── (에셋은 ../../icons/, ../../illustrations/ 참조)
```

### 새 콘텐츠 생성 체크리스트

- [ ] config: `width: 600, height: 600` 확인
- [ ] 모든 씬: `this.add.rectangle(300, 300, 600, 600, ...)` 배경
- [ ] 중심 좌표: (400, 300) → (300, 300) 변경
- [ ] 하단 요소: y좌표가 600을 넘지 않도록 (버튼: ~520, 피드백: ~565)

## References

- [Phaser 3 Documentation](https://docs.phaser.io/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [Phaser 3 API](https://newdocs.phaser.io/docs/3.80.0)
