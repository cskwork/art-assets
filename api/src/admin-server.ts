import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import expressWs from 'express-ws';
import dotenv from 'dotenv';

import {
  createGenerateContentJob,
  getGenerateContentStatus,
  createReviewContentJob,
  getReviewContentStatus
} from './index';
import { getAllJobs, updateJob as updateJobStatus } from './job-manager';
import { batchManager } from './batch-manager';
import {
  ErrorResponse,
  AdminConfig,
  BatchGenerateRequest,
  JobSummary,
  Job
} from './types';

dotenv.config();

const PORT = parseInt(process.env.ADMIN_PORT || process.env.PORT || '3000', 10);
const ROOT_DIR = process.env.PROJECT_ROOT || path.resolve(__dirname, '..', '..');
const WS_ENABLED = (process.env.WS_ENABLED || 'true').toLowerCase() !== 'false';

function getJobStorePath() {
  return process.env.JOB_STORE_PATH || path.join(ROOT_DIR, 'api', 'data', 'jobs.json');
}

function toJobSummary(job: Partial<Job> & { id?: string; createdAt?: number }): JobSummary | null {
  if (typeof job.id !== 'string' || typeof job.createdAt !== 'number') {
    return null;
  }

  return {
    jobId: job.id,
    jobType: (job.jobType || 'generate') as JobSummary['jobType'],
    status: (job.status || 'pending') as JobSummary['status'],
    moduleId: job.moduleId,
    modulePath: job.modulePath,
    error: job.error,
    createdAt: job.createdAt
  };
}

function readPersistedJobSummaries(): JobSummary[] {
  const storePath = getJobStorePath();
  if (!fs.existsSync(storePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw) as { jobs?: unknown };
    if (!parsed || !Array.isArray(parsed.jobs)) {
      return [];
    }

    const summaries: JobSummary[] = [];
    for (const entry of parsed.jobs) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const summary = toJobSummary(entry as Partial<Job> & { id?: string; createdAt?: number });
      if (summary) {
        summaries.push(summary);
      }
    }
    return summaries;
  } catch {
    return [];
  }
}

// Express 앱 + WebSocket 설정
const { app, getWss } = expressWs(express());

app.use(cors());
app.use(express.json());

// --- Archive/Restore 유틸 (기존 server.js에서 이관) ---
let archiveMod: { archiveAsset: Function; restoreAsset: Function } | null = null;
function getArchiveModule() {
  if (archiveMod) return archiveMod;
  try {
    archiveMod = require(path.join(ROOT_DIR, 'scripts', 'archive'));
  } catch {
    archiveMod = null;
  }
  return archiveMod;
}

function runGalleryBuild() {
  try {
    execSync('node build-gallery.js', { cwd: ROOT_DIR, stdio: 'inherit' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- WebSocket 브로드캐스트 ---
function broadcastJobUpdate(data: Record<string, unknown>) {
  const wss = getWss();
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// WebSocket 엔드포인트
if (WS_ENABLED) {
  app.ws('/ws', (ws) => {
    ws.on('message', () => {
      // 클라이언트 -> 서버 메시지는 무시
    });
  });
}

// --- 에러 응답 헬퍼 ---
function getErrorStatusCode(errorResponse: ErrorResponse): number {
  if (errorResponse.code === 'INVALID_REQUEST' || errorResponse.code === 'INVALID_SUBJECT') {
    return 400;
  }
  if (errorResponse.code === 'JOB_NOT_FOUND' || errorResponse.code === 'MODULE_NOT_FOUND') {
    return 404;
  }
  return 500;
}

// === 기존 API 엔드포인트 (server.js에서 이관) ===

// 콘텐츠 생성
app.post('/api/generate-content', async (req, res) => {
  try {
    const result = await createGenerateContentJob(req.body);
    if ('success' in result && result.success === false) {
      const status = getErrorStatusCode(result as ErrorResponse);
      res.status(status).json(result);
      return;
    }
    broadcastJobUpdate({ type: 'job_created', job: result });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 콘텐츠 생성 상태
app.get('/api/generate-content/status/:jobId', (req, res) => {
  const result = getGenerateContentStatus(req.params.jobId);
  if ('success' in result && result.success === false) {
    const status = getErrorStatusCode(result as ErrorResponse);
    res.status(status).json(result);
    return;
  }
  res.json(result);
});

// 리뷰 요청
app.post('/api/review-content', async (req, res) => {
  try {
    const result = await createReviewContentJob(req.body);
    if ('success' in result && result.success === false) {
      const status = getErrorStatusCode(result as ErrorResponse);
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 리뷰 상태
app.get('/api/review-content/status/:jobId', (req, res) => {
  const result = getReviewContentStatus(req.params.jobId);
  if ('success' in result && result.success === false) {
    const status = getErrorStatusCode(result as ErrorResponse);
    res.status(status).json(result);
    return;
  }
  res.json(result);
});

// 에셋 아카이브
app.post('/api/archive/:assetId', (req, res) => {
  const mod = getArchiveModule();
  if (!mod) {
    res.status(500).json({ success: false, error: 'Archive 모듈을 찾을 수 없습니다.' });
    return;
  }
  try {
    const result = mod.archiveAsset(req.params.assetId, { runBuild: false });
    runGalleryBuild();
    res.json({ success: true, message: `에셋이 아카이브되었습니다: ${req.params.assetId}`, warning: result?.warning });
  } catch (error: any) {
    const status = error.code === 'ASSET_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// 에셋 복원
app.post('/api/restore/:assetId', (req, res) => {
  const mod = getArchiveModule();
  if (!mod) {
    res.status(500).json({ success: false, error: 'Archive 모듈을 찾을 수 없습니다.' });
    return;
  }
  try {
    const result = mod.restoreAsset(req.params.assetId, { runBuild: false });
    runGalleryBuild();
    res.json({ success: true, message: `에셋이 복원되었습니다: ${req.params.assetId}`, warning: result?.warning });
  } catch (error: any) {
    const status = error.code === 'ARCHIVED_ASSET_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// === Admin API 엔드포인트 ===

// 설정 정보 반환
app.get('/api/admin/config', (_req, res) => {
  const config: AdminConfig = {
    subjects: [
      { id: 'math', label: '수학' },
      { id: 'english', label: '영어' },
      { id: 'science', label: '과학' },
      { id: 'social', label: '사회' },
      { id: 'history', label: '역사' },
      { id: 'korean', label: '국어' },
      { id: 'art', label: '미술' },
      { id: 'music', label: '음악' },
      { id: 'coding', label: '코딩' }
    ],
    contentTypes: [
      { id: 'phaser', label: 'Phaser 2D 게임' },
      { id: 'threejs', label: 'Three.js 3D 시각화' },
      { id: 'canvas-2d', label: 'Canvas 2D 그래픽' },
      { id: 'svg-animation', label: 'SVG 애니메이션' },
      { id: 'css-animation', label: 'CSS 애니메이션' },
      { id: 'pixel-art', label: '픽셀 아트 게임' },
      { id: 'isometric', label: '아이소메트릭 2.5D' }
    ],
    gradeLevels: [
      { id: 'elementary-1-2', label: '초등 1-2학년' },
      { id: 'elementary-3-4', label: '초등 3-4학년' },
      { id: 'elementary-5-6', label: '초등 5-6학년' },
      { id: 'middle-1', label: '중학교 1학년' },
      { id: 'middle-2', label: '중학교 2학년' },
      { id: 'middle-3', label: '중학교 3학년' },
      { id: 'high-1', label: '고등학교 1학년' },
      { id: 'high-2', label: '고등학교 2학년' },
      { id: 'high-3', label: '고등학교 3학년' }
    ],
    visualStyles: [
      { id: 'modern-flat', label: '모던 플랫', description: '깔끔하고 밝은 플랫 디자인' },
      { id: 'pixel-art', label: '픽셀 아트', description: '8비트/16비트 레트로 스타일' },
      { id: 'isometric', label: '아이소메트릭', description: '3D 느낌의 2.5D 뷰' },
      { id: 'hand-drawn', label: '손그림', description: '따뜻한 스케치/수채화 느낌' },
      { id: 'watercolor', label: '수채화', description: '부드러운 그라데이션과 색 번짐' },
      { id: 'neon-glow', label: '네온 글로우', description: '어두운 배경에 빛나는 네온' },
      { id: 'retro-arcade', label: '레트로 아케이드', description: '80년대 아케이드 게임 분위기' },
      { id: 'cartoon-3d', label: '카툰 3D', description: '만화풍 3D 렌더링' },
      { id: 'minimal-clean', label: '미니멀', description: '최소한의 요소, 넓은 여백' }
    ],
    storyThemes: [
      { id: 'adventure', label: '모험', description: '탐험과 발견의 여정' },
      { id: 'mystery', label: '미스터리', description: '수수께끼와 추리' },
      { id: 'sci-fi', label: 'SF', description: '미래 기술과 우주' },
      { id: 'daily-life', label: '일상생활', description: '학교와 가정의 친근한 상황' },
      { id: 'historical', label: '역사', description: '역사적 사건과 인물' },
      { id: 'fantasy', label: '판타지', description: '마법의 세계와 모험' },
      { id: 'sports', label: '스포츠', description: '운동과 경기' },
      { id: 'nature', label: '자연', description: '자연 탐구와 생태계' }
    ],
    difficultyLevels: [
      { id: 'basic', label: '기초' },
      { id: 'intermediate', label: '중급' },
      { id: 'advanced', label: '심화' },
      { id: 'challenge', label: '도전' }
    ],
    artAssetCategories: ['icons', 'illustrations', 'diagrams', 'backgrounds', '3d', '8bit']
  };
  res.json(config);
});

// 전체 Job 목록
app.get('/api/admin/jobs', (_req, res) => {
  const memorySummaries: JobSummary[] = getAllJobs().map((job) => ({
    jobId: job.id,
    jobType: job.jobType,
    status: job.status,
    moduleId: job.moduleId,
    modulePath: job.modulePath,
    error: job.error,
    createdAt: job.createdAt
  }));
  const persistedSummaries = readPersistedJobSummaries();
  const mergedMap = new Map<string, JobSummary>();

  [...memorySummaries, ...persistedSummaries].forEach((summary) => {
    const previous = mergedMap.get(summary.jobId);
    if (!previous || summary.createdAt >= previous.createdAt) {
      mergedMap.set(summary.jobId, summary);
    }
  });

  const summaries = Array.from(mergedMap.values());

  const modulePathSet = new Set(
    summaries
      .map((summary) => summary.modulePath)
      .filter((modulePath): modulePath is string => typeof modulePath === 'string' && modulePath.length > 0)
  );

  const eduRoot = path.join(ROOT_DIR, 'edu-content');
  if (fs.existsSync(eduRoot)) {
    const entries = fs.readdirSync(eduRoot, { withFileTypes: true });

    entries.forEach((entry) => {
      if (!entry.isDirectory()) {
        return;
      }

      const moduleId = entry.name;
      const modulePath = path.posix.join('edu-content', moduleId);
      if (modulePathSet.has(modulePath)) {
        return;
      }

      const indexPath = path.join(eduRoot, moduleId, 'index.html');
      if (!fs.existsSync(indexPath)) {
        return;
      }

      let createdAt = Date.now();
      try {
        createdAt = Math.floor(fs.statSync(indexPath).mtimeMs);
      } catch {
        createdAt = Date.now();
      }

      summaries.push({
        jobId: `existing-${moduleId}`,
        jobType: 'generate',
        status: 'completed',
        moduleId,
        modulePath,
        createdAt
      });
    });
  }

  summaries.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ jobs: summaries });
});

// 다중 콘텐츠 생성 (배치) - BatchManager 사용
app.post('/api/admin/batch-generate', async (req, res) => {
  const body = req.body as Partial<BatchGenerateRequest>;
  const { subject, gradeLevel, count } = body;

  if (!subject || !gradeLevel || !count) {
    res.status(400).json({ success: false, error: 'subject, gradeLevel, count는 필수입니다.' });
    return;
  }

  try {
    const response = await batchManager.startBatch(body as BatchGenerateRequest);

    // 생성된 Job들을 WebSocket으로 브로드캐스트
    response.jobs.forEach((job) => {
      if (job.jobId) {
        broadcastJobUpdate({
          type: 'job_created',
          jobId: job.jobId,
          topic: job.topic,
          batchId: response.batchId,
          contentType: body.contentType
        });
      }
    });

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '배치 생성 실패' });
  }
});

// 배치 상태 조회
app.get('/api/admin/batch/:batchId', (req, res) => {
  const batch = batchManager.getBatchStatus(req.params.batchId);
  if (!batch) {
    res.status(404).json({ success: false, error: '배치를 찾을 수 없습니다.' });
    return;
  }
  res.json(batch);
});

// 에셋 목록 (assets-index.json 기반)
app.get('/api/admin/assets', (_req, res) => {
  const indexPath = path.join(ROOT_DIR, 'assets-index.json');
  try {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(data);
  } catch {
    res.status(500).json({ success: false, error: 'assets-index.json 로드 실패' });
  }
});

// 프롬프트 목록
app.get('/api/admin/prompts', (_req, res) => {
  const promptsDir = path.join(ROOT_DIR, 'prompts');
  try {
    const files = fs.readdirSync(promptsDir).filter((f) => f.endsWith('.md'));
    const prompts = files.map((f) => ({
      name: f.replace('.md', ''),
      file: f,
      path: `prompts/${f}`
    }));
    res.json({ prompts });
  } catch {
    res.status(500).json({ success: false, error: 'prompts 디렉토리 로드 실패' });
  }
});

// === 정적 파일 서빙 ===

// Admin UI
const adminUiPath = path.join(ROOT_DIR, 'admin-ui');
app.use('/admin', express.static(adminUiPath));

// edu-content
const eduContentPath = path.join(ROOT_DIR, 'edu-content');
app.use('/edu-content', express.static(eduContentPath));

// 기존 에셋 파일 (갤러리 등)
app.use(express.static(ROOT_DIR));

// 루트 -> gallery.html
app.get('/', (_req, res) => {
  const galleryPath = path.join(ROOT_DIR, 'gallery.html');
  if (fs.existsSync(galleryPath)) {
    res.sendFile(galleryPath);
  } else {
    res.status(404).send('gallery.html not found');
  }
});

// /admin -> /admin/index.html
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(adminUiPath, 'index.html'));
});

// === 서버 시작 ===
// index.ts import 시 initializeJobStore() + startJobCleanup() 자동 호출됨

// 서버 재시작 시 좀비 Job 정리 (processing 상태로 남은 Job -> failed)
{
  const staleJobs = getAllJobs().filter((j) => j.status === 'processing');
  if (staleJobs.length > 0) {
    staleJobs.forEach((j) => {
      updateJobStatus(j.id, { status: 'failed', error: '서버 재시작으로 인해 중단됨' });
    });
    console.log(`[Startup] ${staleJobs.length}개 좀비 Job을 failed로 전환`);
  }
}

// Job 상태 변경 브로드캐스트 (5초 간격 폴링)
let previousJobStates: Record<string, string> = {};
setInterval(() => {
  const jobs = getAllJobs();
  jobs.forEach((job) => {
    const prevStatus = previousJobStates[job.id];
    if (prevStatus && prevStatus !== job.status) {
      broadcastJobUpdate({
        type: 'job_status_changed',
        jobId: job.id,
        status: job.status,
        moduleId: job.moduleId,
        error: job.error
      });
    }
    previousJobStates[job.id] = job.status;
  });
}, 5000);

app.listen(PORT, () => {
  console.log('');
  console.log('=== AI 교육 콘텐츠 Admin 서버 ===');
  console.log(`http://localhost:${PORT}`);
  console.log(`Admin UI: http://localhost:${PORT}/admin`);
  console.log('');
  console.log('API 엔드포인트:');
  console.log('  [기존]');
  console.log('  POST /api/generate-content');
  console.log('  GET  /api/generate-content/status/:jobId');
  console.log('  POST /api/review-content');
  console.log('  GET  /api/review-content/status/:jobId');
  console.log('  POST /api/archive/:assetId');
  console.log('  POST /api/restore/:assetId');
  console.log('  [Admin]');
  console.log('  GET  /api/admin/config');
  console.log('  GET  /api/admin/jobs');
  console.log('  POST /api/admin/batch-generate');
  console.log('  GET  /api/admin/assets');
  console.log('  GET  /api/admin/prompts');
  console.log('  [WebSocket]');
  console.log('  ws://localhost:' + PORT + '/ws');
  console.log('');
  console.log('종료: Ctrl+C');
  console.log('');
});

// 비동기 Job에서 발생하는 reject를 잡아 서버 크래시 방지
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.message : reason);
});

// 정상 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버 종료');
  process.exit(0);
});
