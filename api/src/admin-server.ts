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
import { getAllJobs } from './job-manager';
import { batchManager } from './batch-manager';
import {
  ErrorResponse,
  AdminConfig,
  BatchGenerateRequest,
  JobSummary
} from './types';

dotenv.config();

const PORT = parseInt(process.env.ADMIN_PORT || process.env.PORT || '3000', 10);
const ROOT_DIR = process.env.PROJECT_ROOT || path.resolve(__dirname, '..', '..');
const WS_ENABLED = (process.env.WS_ENABLED || 'true').toLowerCase() !== 'false';

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
      { id: 'science', label: '과학' }
    ],
    contentTypes: [
      { id: 'phaser', label: 'Phaser 2D 게임' },
      { id: 'threejs', label: 'Three.js 3D 시각화' }
    ],
    gradeLevels: [
      { id: 'elementary-3-4', label: '초등 3-4학년' },
      { id: 'elementary-5-6', label: '초등 5-6학년' },
      { id: 'middle-1', label: '중학교 1학년' },
      { id: 'middle-2', label: '중학교 2학년' },
      { id: 'middle-3', label: '중학교 3학년' }
    ],
    artAssetCategories: ['icons', 'illustrations', 'diagrams', 'backgrounds', '3d']
  };
  res.json(config);
});

// 전체 Job 목록
app.get('/api/admin/jobs', (_req, res) => {
  const jobs = getAllJobs();
  const summaries: JobSummary[] = jobs.map((job) => ({
    jobId: job.id,
    jobType: job.jobType,
    status: job.status,
    moduleId: job.moduleId,
    modulePath: job.modulePath,
    error: job.error,
    createdAt: job.createdAt
  }));
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

// 정상 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버 종료');
  process.exit(0);
});
