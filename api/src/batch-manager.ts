import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BatchGenerateRequest, BatchGenerateResponse, Subject } from './types';
import { createGenerateContentJob } from './index';
import { getDefaultTopics } from './default-topics';

// 배치 상태 저장 구조
interface BatchRecord {
  batchId: string;
  request: BatchGenerateRequest;
  jobs: Array<{
    jobId: string;
    topic: string;
    status: string;
  }>;
  createdAt: number;
}

interface BatchStore {
  version: number;
  batches: BatchRecord[];
}

const batches = new Map<string, BatchRecord>();
let isLoaded = false;

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

function getStorePath() {
  return (
    process.env.BATCH_STORE_PATH ||
    path.join(getProjectRoot(), 'api', 'data', 'batches.json')
  );
}

// 디스크에서 배치 데이터 로드
function loadBatchesFromDisk() {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed: BatchStore = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.batches)) {
      return;
    }

    parsed.batches.forEach((batch) => {
      batches.set(batch.batchId, batch);
    });
  } catch (error) {
    console.error('[Batch] 저장소 로드 실패:', error instanceof Error ? error.message : error);
  }
}

// 디스크에 배치 데이터 저장
function persistBatches() {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });

  const payload: BatchStore = {
    version: 1,
    batches: Array.from(batches.values())
  };

  fs.writeFileSync(storePath, JSON.stringify(payload, null, 2), 'utf8');
}

function ensureLoaded() {
  if (isLoaded) {
    return;
  }

  loadBatchesFromDisk();
  isLoaded = true;
}

export class BatchManager {
  // 배치 생성 요청 처리: 요청 수량만큼 개별 Job 생성
  async startBatch(request: BatchGenerateRequest): Promise<BatchGenerateResponse> {
    ensureLoaded();

    const batchId = `batch-${crypto.randomUUID().slice(0, 8)}-${Date.now()}`;
    const requestCount = Math.min(Math.max(request.count || 1, 1), 10);

    // 토픽 결정: 요청에 지정된 토픽 또는 기본 토픽
    const topics = (request.topics && request.topics.length > 0)
      ? request.topics
      : getDefaultTopics(request.subject);

    const results: BatchGenerateResponse['jobs'] = [];

    // 순차적으로 Job 생성 (각각 독립 context)
    for (let i = 0; i < requestCount; i++) {
      const topic = topics[i % topics.length];
      try {
        const result = await createGenerateContentJob({
          subject: request.subject,
          topic,
          gradeLevel: request.gradeLevel,
          useArtAssets: request.useArtAssets
        });

        if ('success' in result && result.success === false) {
          results.push({ jobId: '', topic, status: 'failed' });
        } else if ('jobId' in result) {
          results.push({ jobId: result.jobId, topic, status: 'created' });
        }
      } catch {
        results.push({ jobId: '', topic, status: 'failed' });
      }
    }

    // 배치 레코드 저장
    const record: BatchRecord = {
      batchId,
      request,
      jobs: results,
      createdAt: Date.now()
    };
    batches.set(batchId, record);
    persistBatches();

    return { batchId, jobs: results };
  }

  // 배치 상태 조회
  getBatchStatus(batchId: string): BatchRecord | undefined {
    ensureLoaded();
    return batches.get(batchId);
  }

  // 전체 배치 목록 조회
  getAllBatches(): BatchRecord[] {
    ensureLoaded();
    return Array.from(batches.values());
  }
}

// 싱글톤 인스턴스
export const batchManager = new BatchManager();
