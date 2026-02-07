import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import {
  createJob,
  createReviewJob,
  findGenerateJobByModuleId,
  getJob,
  initializeJobStore,
  startJobCleanup,
  updateJob
} from './job-manager';
import { createModuleId, generateContentForJob, reviewContentForJob } from './content-generator';
import {
  ErrorCode,
  ErrorResponse,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateContentStatusResponse,
  ReviewContentRequest,
  ReviewContentResponse,
  ReviewContentStatusResponse
} from './types';

dotenv.config();
initializeJobStore();
startJobCleanup();

const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];
const REVIEW_ENDPOINT = '/api/review-content';
const REVIEW_STATUS_ENDPOINT_TEMPLATE = '/api/review-content/status/{jobId}';

function buildErrorResponse(code: ErrorCode, message: string): ErrorResponse {
  return { success: false, error: message, code };
}

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function isAsyncJobsEnabled() {
  // 테스트에서 외부 API 호출을 막기 위해 비동기 실행을 끌 수 있다.
  return parseBooleanEnv(process.env.ASYNC_JOBS_ENABLED, true);
}

async function moduleExists(moduleId: string) {
  const rootDir = getProjectRoot();
  const baseDir = path.join(rootDir, 'edu-content', moduleId);
  const required = ['index.html', 'script.js', 'style.css'].map((name) => path.join(baseDir, name));

  try {
    await Promise.all(required.map((filePath) => fs.access(filePath)));
    return true;
  } catch {
    return false;
  }
}

export function validateGenerateContentRequest(input: unknown) {
  if (!input || typeof input !== 'object') {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  const record = input as Record<string, unknown>;
  const subject = record.subject;
  const topic = record.topic;
  const gradeLevel = record.gradeLevel;
  const useArtAssets = record.useArtAssets;

  if (subject !== 'math' && subject !== 'english' && subject !== 'science') {
    return { ok: false, code: 'INVALID_SUBJECT' as const };
  }

  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  if (typeof gradeLevel !== 'string' || gradeLevel.trim().length === 0) {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  if (topic.length > 200 || gradeLevel.length > 100) {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  if (useArtAssets !== undefined && typeof useArtAssets !== 'boolean') {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  return { ok: true as const };
}

export async function createGenerateContentJob(
  request: GenerateContentRequest
): Promise<GenerateContentResponse | ErrorResponse> {
  const validation = validateGenerateContentRequest(request);
  if (!validation.ok) {
    const message =
      validation.code === 'INVALID_SUBJECT'
        ? 'subject는 math, english, science만 허용됩니다.'
        : '요청 값이 올바르지 않습니다.';

    return buildErrorResponse(validation.code, message);
  }

  const jobId = createJob(request);

  try {
    const moduleId = await createModuleId(request.topic);
    const modulePath = path.posix.join('edu-content', moduleId);

    updateJob(jobId, { moduleId, modulePath });

    if (isAsyncJobsEnabled()) {
      setImmediate(() => {
        void generateContentForJob(jobId, request, moduleId);
      });
    }

    return {
      success: true,
      jobId,
      message: '콘텐츠 생성이 시작되었습니다',
      reviewRecommended: true,
      reviewEndpoint: REVIEW_ENDPOINT,
      reviewStatusEndpoint: REVIEW_STATUS_ENDPOINT_TEMPLATE
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '모듈 생성에 실패했습니다.';

    updateJob(jobId, { status: 'failed', error: message });
    return buildErrorResponse('INTERNAL_ERROR', '콘텐츠 생성 준비에 실패했습니다.');
  }
}

export function getGenerateContentStatus(
  jobId: string
): GenerateContentStatusResponse | ErrorResponse {
  const job = getJob(jobId, 'generate');
  if (!job) {
    return buildErrorResponse('JOB_NOT_FOUND', '작업을 찾을 수 없습니다.');
  }

  return {
    jobId: job.id,
    status: job.status,
    jobType: job.jobType,
    moduleId: job.moduleId,
    modulePath: job.modulePath,
    files: job.files || (job.status === 'completed' ? DEFAULT_FILES : undefined),
    error: job.error,
    reviewStatus: job.reviewStatus,
    review: job.review,
    reviewError: job.reviewError
  };
}

export function validateReviewContentRequest(input: unknown) {
  if (!input || typeof input !== 'object') {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  const record = input as Record<string, unknown>;
  const moduleId = record.moduleId;
  const autoFix = record.autoFix;
  const maxAttempts = record.maxAttempts;

  if (typeof moduleId !== 'string' || moduleId.trim().length === 0) {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }
  if (moduleId.length > 200) {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  if (autoFix !== undefined && typeof autoFix !== 'boolean') {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  if (maxAttempts !== undefined) {
    if (typeof maxAttempts !== 'number' || !Number.isFinite(maxAttempts)) {
      return { ok: false, code: 'INVALID_REQUEST' as const };
    }
    if (maxAttempts <= 0 || maxAttempts > 3) {
      return { ok: false, code: 'INVALID_REQUEST' as const };
    }
  }

  return {
    ok: true as const,
    value: {
      moduleId: moduleId.trim(),
      autoFix: autoFix ?? false,
      maxAttempts: maxAttempts ?? 1
    }
  };
}

export async function createReviewContentJob(
  request: ReviewContentRequest
): Promise<ReviewContentResponse | ErrorResponse> {
  const validation = validateReviewContentRequest(request);
  if (!validation.ok || !validation.value) {
    return buildErrorResponse('INVALID_REQUEST', '요청 값이 올바르지 않습니다.');
  }

  const { moduleId, autoFix, maxAttempts } = validation.value;
  const exists = await moduleExists(moduleId);
  if (!exists) {
    return buildErrorResponse('MODULE_NOT_FOUND', '리뷰할 모듈을 찾을 수 없습니다.');
  }

  const jobId = createReviewJob({ moduleId, autoFix, maxAttempts });
  const modulePath = path.posix.join('edu-content', moduleId);
  updateJob(jobId, { moduleId, modulePath });

  const sourceJob = findGenerateJobByModuleId(moduleId);
  const sourceRequest = sourceJob?.request as GenerateContentRequest | undefined;

  if (isAsyncJobsEnabled()) {
    setImmediate(() => {
      void reviewContentForJob(jobId, moduleId, { autoFix, maxAttempts }, sourceRequest);
    });
  }

  return {
    success: true,
    jobId,
    moduleId,
    message: '리뷰 작업이 시작되었습니다',
    statusEndpoint: `/api/review-content/status/${jobId}`
  };
}

export function getReviewContentStatus(
  jobId: string
): ReviewContentStatusResponse | ErrorResponse {
  const job = getJob(jobId, 'review');
  if (!job) {
    return buildErrorResponse('JOB_NOT_FOUND', '작업을 찾을 수 없습니다.');
  }

  return {
    jobId: job.id,
    status: job.status,
    jobType: job.jobType,
    moduleId: job.moduleId,
    modulePath: job.modulePath,
    error: job.error,
    reviewStatus: job.reviewStatus,
    review: job.review,
    reviewError: job.reviewError
  };
}

export { GenerateContentRequest, GenerateContentResponse, ReviewContentRequest, ReviewContentResponse };
