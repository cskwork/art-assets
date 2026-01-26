# 초등 3-4학년 영어 인터랙티브 콘텐츠 10개 모듈 개발

## Overview
- 초등 3-4학년(9-10세) 한국 학생 대상 영어 학습 인터랙티브 콘텐츠 10개 제작
- 기존 edu-content 모듈의 7씬 구조 및 ContentApp 패턴 활용
- 균형 잡힌 영역 구성: 어휘 3개 + 표현 3개 + 파닉스 2개 + 문법 2개
- 각 모듈은 게임형 인터랙션으로 학습 몰입도 향상

## Context (from discovery)
- Files/components involved:
  - `edu-content/20260126-modal-can/` - 기존 영어 모듈 참조
  - `edu-content/common.css` - 공통 CSS 변수
  - `prompts/english.md` - 영어 콘텐츠 가이드라인
- Related patterns found:
  - 7씬 구조: Hook > Anchor > Story > Core > Visualize > Quiz > Wrap
  - ContentApp 싱글톤 패턴
  - Web Speech API (발음)
  - 커스텀 SVG 캐릭터 (이모지 사용 금지)
- Dependencies identified:
  - Google Fonts (Noto Sans KR, Inter)
  - Web Speech API (브라우저 내장)

## 10개 모듈 목록

| # | 모듈 ID | 영역 | 주제 | 핵심 인터랙션 | 캐릭터 |
|---|---------|------|------|---------------|--------|
| 1 | `20260126-animals-vocabulary` | 어휘 | 동물 친구들 | 그림-단어 매칭 | Zoomi 사육사 |
| 2 | `20260126-food-vocabulary` | 어휘 | 맛있는 음식 | 카테고리 분류 | Chef Mimi |
| 3 | `20260126-school-items` | 어휘 | 학용품 | 책상 정리 게임 | Bobby 교환학생 |
| 4 | `20260126-greetings` | 표현 | 인사하기 | 상황-대화 매칭 | Emma |
| 5 | `20260126-feelings` | 표현 | 감정 표현 | 표정-단어 매칭 | Feelie |
| 6 | `20260126-asking-permission` | 표현 | 허락 구하기 | 문장 조립 | Polly |
| 7 | `20260126-short-vowels` | 파닉스 | 단모음 A E I O U | 소리 분류 | Vowel Voice |
| 8 | `20260126-consonant-blends` | 파닉스 | 자음군 BL CL FL | 블렌드 조합 | Blend Buddies |
| 9 | `20260126-singular-plural` | 문법 | 단수/복수 | 카운팅 변환 | Counter Carl |
| 10 | `20260126-demonstratives` | 문법 | This/That | 거리-수량 매트릭스 | Pointer Pete |

## Development Approach
- **Testing approach**: Regular (코드 먼저, 브라우저 수동 테스트)
- Complete each module fully before moving to the next
- Make small, focused changes
- **CRITICAL: every module MUST include browser testing** for all 7 scenes
  - 씬 전환 동작 확인
  - 드래그앤드롭/터치 인터랙션 확인
  - Web Speech API 발음 확인
  - 퀴즈 정답 판정 확인
- **CRITICAL: all scenes must work before starting next module** - no exceptions
- **CRITICAL: update this plan file when scope changes during implementation**
- 모바일 반응형 확인 (48px 최소 터치 타겟)

## Testing Strategy
- **Browser tests**: required for every module
  - Chrome/Safari에서 7씬 전체 플로우 확인
  - 모바일 뷰포트에서 레이아웃 확인
  - Web Speech API 발음 품질 확인
- **Manual QA checklist per module**:
  - [ ] Hook씬 SVG 애니메이션 정상
  - [ ] Anchor씬 선행지식 연결 명확
  - [ ] Story씬 타자 효과 + 캐릭터 표시
  - [ ] Core씬 인터랙션 (드래그/클릭) 정상
  - [ ] Visualize씬 규칙 차트 가독성
  - [ ] Quiz씬 정답 판정 + 피드백
  - [ ] Wrap씬 보상 표시 + 발음 버튼

## Progress Tracking
- Mark completed items with `[x]` immediately when done
- Add newly discovered tasks with + prefix
- Document issues/blockers with ! prefix
- Update plan if implementation deviates from original scope
- Keep plan in sync with actual work done

## Implementation Steps

### Task 1: 공통 템플릿 준비
- [x] 기존 modal-can 모듈 구조 분석
- [x] 3-4학년 적합 조정 사항 정의:
  - 폰트 크기 증가 (본문 18px 이상)
  - Web Speech API rate=0.8 (느린 발음)
  - 버튼 크기 48px 이상
  - 한국어 설명 비중 증가
- [x] 템플릿 HTML/JS/CSS 골격 준비
- [x] 브라우저에서 템플릿 확인

### Task 2: Module 1 - Animals Vocabulary (동물 어휘)
- [x] `edu-content/20260126-animals-vocabulary/` 디렉토리 생성
- [x] `index.html` 7씬 구조 작성
  - Hook: "QUACK QUACK! What's the animal's NAME?"
  - Anchor: 이미 아는 dog, cat 복습
  - Story: Zoomi 사육사가 동물원 라벨 도움 요청
  - Core: 12개 동물 그림-단어 매칭 (pet/zoo/farm)
  - Visualize: 카테고리별 동물 차트
  - Quiz: 4문항 동물 식별
  - Wrap: 동물 스티커 보상
- [x] `script.js` ContentApp 구현
  - 드래그앤드롭 로직
  - Web Speech API 발음
  - 퀴즈 정답 판정
- [x] `style.css` 스타일링
- [x] 브라우저 테스트 (7씬 전체, 터치, 발음)

### Task 3: Module 2 - Food Vocabulary (음식 어휘)
- [ ] `edu-content/20260126-food-vocabulary/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: 해외 레스토랑에서 피자 주문
  - Anchor: apple, banana 복습
  - Story: Chef Mimi 메뉴 작성 도움 요청
  - Core: 12개 음식 카테고리 분류 (과일/음식/음료)
  - Visualize: 음식 카테고리 차트
  - Quiz: 음식 식별 + 간단 주문
  - Wrap: 요리사 자격증 보상
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 4: Module 3 - School Items (학용품 어휘)
- [ ] `edu-content/20260126-school-items/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: "Can I borrow a pencil?" 미국 친구 질문
  - Anchor: pencil, book 복습
  - Story: Bobby 교환학생 책상 정리 도움
  - Core: 12개 학용품 책상 정리 게임
  - Visualize: 정돈된 책상 다이어그램
  - Quiz: 학용품 식별
  - Wrap: 골드 스타 보상
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 5: Module 4 - Greetings (인사 표현)
- [ ] `edu-content/20260126-greetings/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: 새 친구 만났을 때 첫 마디?
  - Anchor: Hello 복습 + 시간대별 인사 소개
  - Story: Emma가 새 이웃에게 인사
  - Core: 상황-인사 매칭 (Good morning/afternoon/evening/Goodbye)
  - Visualize: 시간대 타임라인 차트
  - Quiz: 상황별 인사 선택
  - Wrap: 악수 배지 보상
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 6: Module 5 - Feelings (감정 표현)
- [ ] `edu-content/20260126-feelings/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: 슬퍼 보이는 친구에게 영어로?
  - Anchor: happy, sad 복습
  - Story: Feelie 이모지가 감정 표현 가르침
  - Core: 표정-감정단어 매칭 + "I'm ___" 문장
  - Visualize: 감정 휠 다이어그램
  - Quiz: 표정 식별 + 표현 선택
  - Wrap: 이모지 스티커 컬렉션
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 7: Module 6 - Asking Permission (허락 구하기)
- [ ] `edu-content/20260126-asking-permission/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: 수업 중 화장실 가고 싶을 때?
  - Anchor: please에서 May I/Can I로 확장
  - Story: Polly가 영어캠프에서 허락 구하기
  - Core: May I/Can I + 동사 + 목적어 문장 조립
  - Visualize: 허락 공식 차트
  - Quiz: 상황별 허락 표현 선택
  - Wrap: 예의 배지 보상
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 8: Module 7 - Short Vowels (단모음 파닉스)
- [ ] `edu-content/20260126-short-vowels/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: cat vs cup 소리 차이?
  - Anchor: 알파벳 이름 vs 소리 구분
  - Story: Vowel Voice 노래하는 글자
  - Core: 단어 듣고 모음 소리 분류 (a/e/i/o/u)
  - Visualize: 5개 모음 발음 차트
  - Quiz: 같은 모음 소리 찾기
  - Wrap: 소리 마스터 배지
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 9: Module 8 - Consonant Blends (자음군 파닉스)
- [ ] `edu-content/20260126-consonant-blends/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: blue의 B+L 어떻게 발음?
  - Anchor: 개별 자음 소리 복습
  - Story: Blend Buddies 손잡은 글자들
  - Core: 글자 조합으로 블렌드 만들기 (bl/cl/fl/st/sp)
  - Visualize: 블렌드 패밀리 차트
  - Quiz: 블렌드 식별
  - Wrap: 블렌드 챔피언 배지
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 10: Module 9 - Singular/Plural (단수/복수 문법)
- [ ] `edu-content/20260126-singular-plural/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: One cat, two ___?
  - Anchor: 한국어 vs 영어 복수 비교
  - Story: Counter Carl 가게에서 물건 세기
  - Core: 카트에 물건 추가하며 단어 변화 (+s/+es/y->ies)
  - Visualize: 복수형 규칙 차트
  - Quiz: 복수형 만들기
  - Wrap: 카운터 배지
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 11: Module 10 - Demonstratives (지시대명사 문법)
- [ ] `edu-content/20260126-demonstratives/` 디렉토리 생성
- [ ] `index.html` 7씬 구조 작성
  - Hook: 책상 위 책 vs 저쪽 책 - 같은 단어?
  - Anchor: a/the에서 this/that으로 확장
  - Story: Pointer Pete 장난감 가게에서 물건 지목
  - Core: 거리x수량 2x2 매트릭스 선택
  - Visualize: This/That/These/Those 그리드 차트
  - Quiz: 상황별 지시대명사 선택
  - Wrap: 포인터 마스터 배지
- [ ] `script.js`, `style.css` 구현
- [ ] 브라우저 테스트

### Task 12: 전체 검증 및 문서 업데이트
- [ ] 10개 모듈 전체 브라우저 테스트
- [ ] 모바일 반응형 최종 확인
- [ ] Web Speech API 발음 일관성 확인
- [ ] CLAUDE.md 문서 업데이트 (새 모듈 목록 추가)
- [ ] docs/changelog/changelog-2026-01-26.md 업데이트

## Technical Details

### 3-4학년 적합 조정사항
```css
/* 폰트 크기 증가 */
body { font-size: 18px; }
.main-title { font-size: 32px; }
.sub-text { font-size: 20px; }

/* 버튼 크기 확대 */
.btn-primary { min-height: 56px; font-size: 18px; }

/* 터치 타겟 확대 */
.draggable, .clickable { min-width: 48px; min-height: 48px; }
```

### ContentApp 기본 구조
```javascript
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,

    init() {
        this.bindEvents();
        this.showScene(0);
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const scene = document.getElementById(this.scenes[index] + '-scene');
        if (scene) {
            scene.classList.add('active');
            this.currentScene = index;
            this.updateProgress();
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    updateProgress() {
        const percent = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = percent + '%';
    },

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8; // 3-4학년용 느린 속도
            speechSynthesis.speak(utterance);
        }
    },

    checkAnswer(quizNum, answer) {
        // 퀴즈 정답 확인 로직
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                this.nextScene();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
```

### 각 모듈 파일 구조
```
edu-content/
  20260126-{module-name}/
    index.html    (7씬 HTML, ~20-30KB)
    script.js     (ContentApp + 모듈별 로직, ~150-250줄)
    style.css     (모듈별 스타일, ~300-500줄)
```

### 어휘 목록

**Module 1 - Animals (12개)**:
- Pet: cat, dog, bird, fish
- Zoo: lion, elephant, monkey, tiger
- Farm: cow, pig, chicken, duck

**Module 2 - Food (12개)**:
- Fruits: apple, banana, orange, grape
- Main: bread, rice, pizza, hamburger
- Drinks: milk, juice, water, cake

**Module 3 - School Items (12개)**:
- Writing: pencil, pen, eraser, ruler
- Classroom: book, notebook, bag, desk
- Art: scissors, glue, paper, crayon

**Module 4 - Greetings**:
- Hello/Hi, Good morning/afternoon/evening
- How are you? - I'm fine
- Nice to meet you, Goodbye/Bye/See you

**Module 5 - Feelings**:
- I'm happy/sad/angry/scared
- I'm tired/hungry/excited/bored
- Are you okay? - Yes/No

**Module 6 - Asking Permission**:
- May I go to the bathroom?
- Can I have some water?
- May I use your pencil?
- Sure/Of course/No, sorry

**Module 7 - Short Vowels**:
- /a/: cat, bat, hat
- /e/: bed, red, pet
- /i/: big, pig, sit
- /o/: hot, pot, dog
- /u/: cup, bus, sun

**Module 8 - Consonant Blends**:
- bl: black, blue, block
- cl: clock, cloud, clap
- fl: flag, flower, fly
- st: star, stop, stick
- sp: spot, spin, spoon

**Module 9 - Singular/Plural**:
- Regular: cat->cats, dog->dogs
- +es: bus->buses, box->boxes
- y->ies: baby->babies
- Irregular: foot->feet, child->children

**Module 10 - Demonstratives**:
- This (하나, 가까이)
- That (하나, 멀리)
- These (여러개, 가까이)
- Those (여러개, 멀리)

## Post-Completion

**수동 검증**:
- 각 모듈 7씬 전체 플로우 확인
- 드래그앤드롭 터치 지원 테스트 (모바일)
- Web Speech API 발음 품질 확인
- 모바일 레이아웃 확인 (375px, 768px)

**문서 업데이트**:
- CLAUDE.md: 새 모듈 목록 추가
- changelog: 작업 내용 기록
