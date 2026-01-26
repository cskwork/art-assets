import path from 'node:path';
import dotenv from 'dotenv';
import {
  createJob,
  getJob,
  initializeJobStore,
  startJobCleanup,
  updateJob
} from './job-manager';
import { createModuleId, generateContentForJob } from './content-generator';
import {
  ErrorCode,
  ErrorResponse,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateContentStatusResponse
} from './types';

dotenv.config();
initializeJobStore();
startJobCleanup();

const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];

function buildErrorResponse(code: ErrorCode, message: string): ErrorResponse {
  return { success: false, error: message, code };
}

export function validateGenerateContentRequest(input: unknown) {
  if (!input || typeof input !== 'object') {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  const record = input as Record<string, unknown>;
  const subject = record.subject;
  const topic = record.topic;
  const gradeLevel = record.gradeLevel;

  if (subject !== 'math' && subject !== 'english') {
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

  return { ok: true as const };
}

export async function createGenerateContentJob(
  request: GenerateContentRequest
): Promise<GenerateContentResponse | ErrorResponse> {
  const validation = validateGenerateContentRequest(request);
  if (!validation.ok) {
    const message =
      validation.code === 'INVALID_SUBJECT'
        ? 'subject는 math 또는 english만 허용됩니다.'
        : '요청 값이 올바르지 않습니다.';

    return buildErrorResponse(validation.code, message);
  }

  const jobId = createJob(request);

  try {
    const moduleId = await createModuleId(request.topic);
    const modulePath = path.posix.join('edu-content', moduleId);

    updateJob(jobId, { moduleId, modulePath });

    setImmediate(() => {
      void generateContentForJob(jobId, request, moduleId);
    });

    return {
      success: true,
      jobId,
      message: '콘텐츠 생성이 시작되었습니다'
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
  const job = getJob(jobId);
  if (!job) {
    return buildErrorResponse('JOB_NOT_FOUND', '작업을 찾을 수 없습니다.');
  }

  return {
    jobId: job.id,
    status: job.status,
    moduleId: job.moduleId,
    modulePath: job.modulePath,
    files: job.files || (job.status === 'completed' ? DEFAULT_FILES : undefined),
    error: job.error,
    reviewStatus: job.reviewStatus,
    review: job.review,
    reviewError: job.reviewError
  };
}

export { GenerateContentRequest, GenerateContentResponse };
