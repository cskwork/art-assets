import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { GenerateContentRequest, Job, JobType, ReviewContentRequest } from './types';

const DEFAULT_JOB_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const JOB_TTL_MS = resolveJobTtlMs();
const jobs = new Map<string, Job>();
let isLoaded = false;
let cleanupTimer: NodeJS.Timeout | null = null;
type JobRequest = GenerateContentRequest | ReviewContentRequest;

function resolveJobTtlMs() {
  const raw = process.env.JOB_TTL_MS;
  if (!raw) {
    return DEFAULT_JOB_TTL_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_JOB_TTL_MS;
  }

  // 0 이하 값은 만료 비활성화로 처리한다.
  if (parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

function getStorePath() {
  return (
    process.env.JOB_STORE_PATH ||
    path.join(getProjectRoot(), 'api', 'data', 'jobs.json')
  );
}

function normalizeJob(job: Job): Job {
  // 과거 데이터에는 jobType이 없을 수 있어 기본값을 채운다.
  return {
    ...job,
    jobType: job.jobType ?? 'generate'
  };
}

function loadJobsFromDisk() {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.jobs)) {
      return;
    }

    parsed.jobs.forEach((job: Job) => {
      const normalized = normalizeJob(job);
      jobs.set(normalized.id, normalized);
    });
  } catch (error) {
    console.error('[Job] 저장소 로드 실패:', error instanceof Error ? error.message : error);
  }
}

function persistJobs() {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });

  const payload = {
    version: 1,
    jobs: Array.from(jobs.values()).map((job) => normalizeJob(job))
  };

  fs.writeFileSync(storePath, JSON.stringify(payload, null, 2), 'utf8');
}

function ensureLoaded() {
  if (isLoaded) {
    return;
  }

  loadJobsFromDisk();
  isLoaded = true;
}

export function initializeJobStore() {
  ensureLoaded();
}

export function startJobCleanup() {
  if (JOB_TTL_MS === 0) {
    return;
  }

  if (cleanupTimer) {
    return;
  }

  cleanupTimer = setInterval(() => {
    cleanupExpiredJobs();
  }, JOB_TTL_MS);

  cleanupTimer.unref();
}

export function cleanupExpiredJobs() {
  ensureLoaded();

  if (JOB_TTL_MS === 0) {
    return;
  }

  const now = Date.now();
  let changed = false;

  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(jobId);
      changed = true;
    }
  }

  if (changed) {
    persistJobs();
  }
}

function createJobWithType(jobType: JobType, request: JobRequest): string {
  ensureLoaded();
  cleanupExpiredJobs();

  const jobId = crypto.randomUUID();
  const job: Job = {
    id: jobId,
    jobType,
    status: 'pending',
    request,
    createdAt: Date.now()
  };

  jobs.set(jobId, job);
  persistJobs();

  return jobId;
}

export function createJob(request: GenerateContentRequest): string {
  // 기존 호출부 호환을 위해 생성 잡은 createJob으로 유지한다.
  return createJobWithType('generate', request);
}

export function createReviewJob(request: ReviewContentRequest): string {
  return createJobWithType('review', request);
}

export function updateJob(jobId: string, updates: Partial<Job>) {
  ensureLoaded();

  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  const next = normalizeJob({ ...job, ...updates } as Job);
  jobs.set(jobId, next);
  persistJobs();
}

export function getJob(jobId: string, expectedType?: JobType): Job | undefined {
  ensureLoaded();
  cleanupExpiredJobs();
  const job = jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  const normalized = normalizeJob(job);
  if (expectedType && normalized.jobType !== expectedType) {
    return undefined;
  }

  return normalized;
}

export function getAllJobs(): Job[] {
  ensureLoaded();
  cleanupExpiredJobs();
  return Array.from(jobs.values()).map(normalizeJob);
}

export function findGenerateJobByModuleId(moduleId: string): Job | undefined {
  ensureLoaded();
  cleanupExpiredJobs();

  let latest: Job | undefined;
  for (const job of jobs.values()) {
    const normalized = normalizeJob(job);
    if (normalized.jobType !== 'generate') {
      continue;
    }
    if (normalized.moduleId !== moduleId) {
      continue;
    }

    if (!latest || normalized.createdAt >= latest.createdAt) {
      latest = normalized;
    }
  }

  return latest;
}
