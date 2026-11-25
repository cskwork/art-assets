# 3D Prepositions of Place - 3D 위치 전치사

## 콘텐츠 정보
- **주제**: Prepositions of Place (in, on, under, next to, between)
- **영역**: Grammar
- **대상 학년**: 초등학교 3-4학년
- **선수 학습**: 기본 명사, "Where is...?" 질문
- **후속 학습**: 방향 전치사 (to, from, into)

## 핵심 개념
- in: 안에 (3차원 공간)
- on: 위에 (표면에 접촉)
- under: 아래에
- next to: 옆에
- between: 사이에

## 특징: Three.js 3D 시각화
이 콘텐츠는 Three.js를 사용하여 공간적 관계를 3D로 시각화합니다:
- **OrbitControls**: 마우스 드래그로 3D 장면 회전
- **실시간 애니메이션**: 공이 각 전치사 위치로 이동
- **인터랙티브**: 전치사 버튼 클릭 시 3D 장면 변화
- **Web Speech API**: 영어 발음 재생

## 파일 구조
- `index.html` - 메인 HTML 파일
- `style.css` - 스타일시트
- `script.js` - Three.js 3D 씬 및 인터랙션 로직

## 기술 스택
- Three.js r128 (CDN)
- OrbitControls (CDN)
- Web Speech API (발음)
- Noto Sans KR + Nunito 폰트

## 7씬 구조
1. **Hook**: 3D 방에서 공의 위치 찾기 질문
2. **Anchor**: 3D 미니 프리뷰로 단어 복습 (box, table, chair, ball)
3. **Story**: 로봇 캐릭터 Rex와 함께 위치 단어 배우기
4. **Core**: 전치사 버튼 클릭 → 3D 공 위치 변화 애니메이션
5. **Visualize**: 5개 전치사 동시 3D 시각화
6. **Quiz**: 3D 장면을 보고 올바른 전치사 선택
7. **Wrap**: 트로피 3D 애니메이션, 학습 요약

## 실행 방법
```bash
# 로컬 서버 권장 (Three.js 모듈 로딩)
python -m http.server 8080
# 또는
npx serve .
```
브라우저에서 `http://localhost:8080` 접속

## 주의사항
- Three.js는 CDN에서 비모듈 방식으로 로드
- OrbitControls로 3D 장면 회전 가능
- 모바일에서 터치 드래그 지원
- Web Speech API는 브라우저 지원 필요
