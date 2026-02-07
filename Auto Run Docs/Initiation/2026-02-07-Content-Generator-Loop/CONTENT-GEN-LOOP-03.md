# Phase 03: Trending Research Agent + Korean Education DB

이 Phase에서는 네이버 트렌드 API와 한국 교육과정 데이터를 수집하는 Trending Research Agent를 구현한다. 이 Agent는 인기 교육 주제를 자동으로 수집하고, 학년/과목별로 분류하여 콘텐츠 생성 파이프라인에 주입한다. Admin UI에서 "트렌딩 기반 자동 생성" 옵션을 선택하면 리서치 결과를 기반으로 콘텐츠가 자동 생성된다.

## Tasks

- [ ] 네이버 검색 트렌드 API 클라이언트 구현 (`api/src/agents/trend-researcher.ts`):
  - 네이버 개발자 센터 API 문서를 조사한다 (DataLab 검색어 트렌드 API: `https://openapi.naver.com/v1/datalab/search`)
  - `TrendResearcher` 클래스 생성:
    - `fetchNaverTrends(keywords: string[], startDate, endDate)`: 네이버 DataLab API 호출
      - 키워드 그룹별 검색량 추이 조회
      - 교육 관련 키워드 프리셋: ["초등수학", "중학수학", "영어문법", "과학실험", "교과서"]
    - `fetchNaverSearchResults(query: string)`: 네이버 검색 API (`https://openapi.naver.com/v1/search/blog.json`)
      - 블로그/카페에서 인기 교육 주제 추출
      - 결과에서 주제 키워드 파싱
    - API 키 관리: `.env`에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 추가
    - 네이버 API 없을 경우 폴백: 하드코딩된 기본 트렌딩 주제 목록 반환
  - `api/src/agents/education-db.ts` 생성: 한국 교육과정 데이터 소스
    - 한국 교육과정 성취기준 DB 구축 (`api/data/curriculum-kr.json`):
      - 초등 수학 (3~6학년): 학년별 주요 단원 및 성취기준
      - 초등 영어 (3~6학년): 학년별 문법/어휘 단원
      - 중학 수학 (1~3학년): 학년별 주요 단원
      - 중학 과학 (1~3학년): 학년별 주요 단원
    - `CurriculumDB` 클래스:
      - `getTopics(subject, gradeLevel)`: 특정 학년/과목의 단원 목록
      - `getRandomTopic(subject, gradeLevel)`: 랜덤 주제 선택
      - `getTopicsByTrend(trendKeywords[])`: 트렌드 키워드와 매칭되는 교육과정 주제 반환

- [ ] 한국 교육과정 성취기준 데이터 파일 생성 (`api/data/curriculum-kr.json`):
  - 이 파일은 JSON 형식으로 한국 교육과정의 핵심 주제를 포함한다
  - 구조:
    ```json
    {
      "math": {
        "elementary-3": ["자연수의 곱셈", "나눗셈", "분수", "원", "들이와 무게"],
        "elementary-4": ["큰 수", "각도", "삼각형", "소수", "규칙 찾기"],
        "elementary-5": ["약수와 배수", "분수의 덧셈과 뺄셈", "소수의 곱셈", "합동과 대칭", "직육면체"],
        "elementary-6": ["분수의 나눗셈", "소수의 나눗셈", "비와 비율", "원의 넓이", "원기둥/원뿔/구"],
        "middle-1": ["정수와 유리수", "문자와 식", "일차방정식", "좌표와 그래프", "정비례와 반비례"],
        "middle-2": ["유리수와 순환소수", "식의 계산", "일차함수", "삼각형의 성질", "피타고라스 정리"],
        "middle-3": ["제곱근과 실수", "이차방정식", "이차함수", "통계", "피타고라스 정리 활용"]
      },
      "english": { ... },
      "science": { ... }
    }
    ```
  - 각 과목별 최소 5개 주제를 학년별로 포함
  - 주제명은 한국어로 작성

- [ ] 트렌딩 리서치 -> 주제 선정 -> 파이프라인 주입 통합:
  - `api/src/agents/pipeline.ts`를 읽고 현재 파이프라인 구조를 확인한다
  - `pipeline.ts`의 `research` 단계에 TrendResearcher + CurriculumDB 연결:
    - 네이버 트렌드 API로 현재 인기 키워드 수집 (API 키 없으면 폴백)
    - CurriculumDB에서 매칭되는 교육과정 주제 조회
    - 매칭 결과가 없으면 CurriculumDB에서 랜덤 주제 선택
    - 선정된 주제를 `generator-agent.ts`의 프롬프트에 주입
  - `admin-server.ts` 수정: 새 API 엔드포인트 추가
    - `GET /api/admin/trending` -> 현재 트렌딩 주제 목록 반환
    - `GET /api/admin/curriculum/:subject/:grade` -> 교육과정 주제 목록 반환
    - `POST /api/admin/auto-generate` -> 트렌딩 기반 자동 생성 (수량 지정, 주제 자동 선정)
  - `BatchGenerateRequest` 타입에 `mode` 필드 추가: `'manual' | 'trending' | 'curriculum'`

- [ ] Admin UI에 트렌딩 기반 생성 UI 추가:
  - `admin-ui/index.html`을 읽고 현재 UI 구조를 확인한다
  - 사이드바에 "생성 모드" 라디오 버튼 추가:
    - 수동 모드: 기존 주제 직접 입력
    - 트렌딩 모드: 네이버 트렌드 기반 자동 주제 선정
    - 교육과정 모드: 학년/과목 기반 교육과정 주제 자동 선택
  - 트렌딩 모드 선택 시: 현재 트렌딩 주제 목록을 카드로 표시, 사용자가 선택하거나 전체 자동 가능
  - 교육과정 모드 선택 시: 학년/과목 선택하면 해당 단원 목록 표시
  - `admin-ui/app.js` 수정: 새 API 호출 로직 추가

- [ ] 트렌딩 리서치 테스트 작성:
  - `tests/trend-researcher.test.js` 생성:
    - CurriculumDB 단위 테스트: 학년별 주제 조회, 랜덤 선택, 트렌드 매칭
    - TrendResearcher 폴백 테스트: API 키 없을 때 기본 목록 반환
    - 파이프라인 research 단계 통합 테스트: 주제가 올바르게 선정되어 generator에 전달되는지

- [ ] 빌드 및 통합 검증:
  - `cd api && npm run build` 컴파일 확인 및 에러 수정
  - `npm test` 전체 테스트 실행 및 실패 수정
  - 서버 시작 후 `/api/admin/curriculum/math/elementary-5` 응답 확인
  - 서버 시작 후 `/api/admin/trending` 응답 확인 (폴백 데이터라도 반환)
  - `docs/changelog/changelog-2026-02-07.md`에 트렌딩 리서치 구현 내역 추가
