import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { GenerateContentRequest, Job } from './types';

const JOB_TTL_MS = 60 * 60 * 1000;
const jobs = new Map<string, Job>();
let isLoaded = false;
let cleanupTimer: NodeJS.Timeout | null = null;

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

function getStorePath() {
  return (
    process.env.JOB_STORE_PATH ||
    path.join(getProjectRoot(), 'api', 'data', 'jobs.json')
  );
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
      jobs.set(job.id, job);
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
    jobs: Array.from(jobs.values())
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

export function createJob(request: GenerateContentRequest): string {
  ensureLoaded();
  cleanupExpiredJobs();

  const jobId = crypto.randomUUID();
  const job: Job = {
    id: jobId,
    status: 'pending',
    request,
    createdAt: Date.now()
  };

  jobs.set(jobId, job);
  persistJobs();

  return jobId;
}

export function updateJob(jobId: string, updates: Partial<Job>) {
  ensureLoaded();

  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  jobs.set(jobId, { ...job, ...updates });
  persistJobs();
}

export function getJob(jobId: string): Job | undefined {
  ensureLoaded();
  cleanupExpiredJobs();
  return jobs.get(jobId);
}
