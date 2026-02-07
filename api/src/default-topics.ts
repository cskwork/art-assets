import { Subject } from './types';

// 과목별 기본 토픽 목록
const DEFAULT_TOPICS: Record<Subject, string[]> = {
  math: [
    '분수의 덧셈',
    '소수의 곱셈',
    '비와 비율',
    '원의 넓이',
    '직육면체 부피',
    '각도의 측정',
    '대칭과 이동',
    '그래프와 표',
    '소인수분해',
    '비례식'
  ],
  english: [
    '현재시제',
    '비교급',
    '조동사 can',
    '전치사',
    '동사 분류',
    '과거시제',
    '미래시제',
    '형용사',
    '부사',
    '접속사'
  ],
  science: [
    '물의 상태 변화',
    '식물의 광합성',
    '전기 회로',
    '태양계',
    '소화 과정',
    '지구의 자전',
    '자석의 성질',
    '소리의 전달',
    '생태계',
    '열의 이동'
  ]
};

export function getDefaultTopics(subject: Subject): string[] {
  return DEFAULT_TOPICS[subject] || DEFAULT_TOPICS.math;
}

export { DEFAULT_TOPICS };
