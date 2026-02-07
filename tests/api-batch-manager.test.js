const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

// 테스트용 임시 경로 설정
const tmpDir = path.join(__dirname, '..', '.test-tmp-batch');
process.env.PROJECT_ROOT = path.join(__dirname, '..');
process.env.BATCH_STORE_PATH = path.join(tmpDir, 'batches.json');
process.env.JOB_STORE_PATH = path.join(tmpDir, 'jobs.json');
// 비동기 Job 실행 비활성화 (실제 LLM 호출 방지)
process.env.ASYNC_JOBS_ENABLED = 'false';

// 테스트 전 임시 디렉토리 생성
fs.mkdirSync(tmpDir, { recursive: true });

const { getDefaultTopics, DEFAULT_TOPICS } = require('../api/dist/default-topics');
const { BatchManager } = require('../api/dist/batch-manager');

test('DEFAULT_TOPICS에 math, english, science 토픽이 존재한다', () => {
  assert.ok(Array.isArray(DEFAULT_TOPICS.math));
  assert.ok(Array.isArray(DEFAULT_TOPICS.english));
  assert.ok(Array.isArray(DEFAULT_TOPICS.science));

  assert.ok(DEFAULT_TOPICS.math.length >= 5);
  assert.ok(DEFAULT_TOPICS.english.length >= 5);
  assert.ok(DEFAULT_TOPICS.science.length >= 5);
});

test('getDefaultTopics는 과목별 토픽 배열을 반환한다', () => {
  const mathTopics = getDefaultTopics('math');
  assert.ok(Array.isArray(mathTopics));
  assert.ok(mathTopics.includes('분수의 덧셈'));

  const englishTopics = getDefaultTopics('english');
  assert.ok(englishTopics.includes('현재시제'));

  const scienceTopics = getDefaultTopics('science');
  assert.ok(scienceTopics.includes('물의 상태 변화'));
});

test('BatchManager는 startBatch로 배치를 생성할 수 있다', async () => {
  const manager = new BatchManager();
  const response = await manager.startBatch({
    subject: 'math',
    contentType: 'threejs',
    gradeLevel: 'elementary-5-6',
    count: 2
  });

  assert.ok(response.batchId);
  assert.ok(response.batchId.startsWith('batch-'));
  assert.equal(response.jobs.length, 2);

  // 각 Job이 생성되었는지 확인
  response.jobs.forEach((job) => {
    assert.ok(job.topic);
    assert.ok(['created', 'failed'].includes(job.status));
  });
});

test('BatchManager는 사용자 지정 토픽으로 배치를 생성할 수 있다', async () => {
  const manager = new BatchManager();
  const customTopics = ['커스텀 토픽 A', '커스텀 토픽 B'];
  const response = await manager.startBatch({
    subject: 'english',
    contentType: 'phaser',
    gradeLevel: 'elementary-3-4',
    count: 2,
    topics: customTopics
  });

  assert.equal(response.jobs.length, 2);
  assert.equal(response.jobs[0].topic, '커스텀 토픽 A');
  assert.equal(response.jobs[1].topic, '커스텀 토픽 B');
});

test('BatchManager는 count를 1-10 범위로 클램핑한다', async () => {
  const manager = new BatchManager();

  // count가 0 이하면 1로
  const response1 = await manager.startBatch({
    subject: 'math',
    contentType: 'threejs',
    gradeLevel: 'middle-1',
    count: 0
  });
  assert.equal(response1.jobs.length, 1);

  // count가 10 초과면 10으로
  const response2 = await manager.startBatch({
    subject: 'math',
    contentType: 'threejs',
    gradeLevel: 'middle-1',
    count: 15
  });
  assert.equal(response2.jobs.length, 10);
});

test('BatchManager.getBatchStatus는 생성된 배치를 조회할 수 있다', async () => {
  const manager = new BatchManager();
  const response = await manager.startBatch({
    subject: 'science',
    contentType: 'threejs',
    gradeLevel: 'middle-2',
    count: 1
  });

  const status = manager.getBatchStatus(response.batchId);
  assert.ok(status);
  assert.equal(status.batchId, response.batchId);
  assert.equal(status.request.subject, 'science');
  assert.ok(status.createdAt > 0);
});

test('BatchManager.getBatchStatus는 없는 배치에 undefined를 반환한다', () => {
  const manager = new BatchManager();
  const status = manager.getBatchStatus('nonexistent-batch');
  assert.equal(status, undefined);
});

// 테스트 후 정리
test.after(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // 정리 실패 무시
  }
});
