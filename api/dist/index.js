"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGenerateContentRequest = validateGenerateContentRequest;
exports.createGenerateContentJob = createGenerateContentJob;
exports.getGenerateContentStatus = getGenerateContentStatus;
exports.validateReviewContentRequest = validateReviewContentRequest;
exports.createReviewContentJob = createReviewContentJob;
exports.getReviewContentStatus = getReviewContentStatus;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
const job_manager_1 = require("./job-manager");
const content_generator_1 = require("./content-generator");
dotenv_1.default.config();
(0, job_manager_1.initializeJobStore)();
(0, job_manager_1.startJobCleanup)();
const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];
const REVIEW_ENDPOINT = '/api/review-content';
const REVIEW_STATUS_ENDPOINT_TEMPLATE = '/api/review-content/status/{jobId}';
function buildErrorResponse(code, message) {
    return { success: false, error: message, code };
}
function getProjectRoot() {
    return process.env.PROJECT_ROOT || process.cwd();
}
function parseBooleanEnv(value, defaultValue) {
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
async function moduleExists(moduleId) {
    const rootDir = getProjectRoot();
    const baseDir = node_path_1.default.join(rootDir, 'edu-content', moduleId);
    const required = ['index.html', 'script.js', 'style.css'].map((name) => node_path_1.default.join(baseDir, name));
    try {
        await Promise.all(required.map((filePath) => promises_1.default.access(filePath)));
        return true;
    }
    catch {
        return false;
    }
}
function validateGenerateContentRequest(input) {
    if (!input || typeof input !== 'object') {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    const record = input;
    const subject = record.subject;
    const topic = record.topic;
    const gradeLevel = record.gradeLevel;
    const useArtAssets = record.useArtAssets;
    if (subject !== 'math' && subject !== 'english' && subject !== 'science') {
        return { ok: false, code: 'INVALID_SUBJECT' };
    }
    if (typeof topic !== 'string' || topic.trim().length === 0) {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    if (typeof gradeLevel !== 'string' || gradeLevel.trim().length === 0) {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    if (topic.length > 200 || gradeLevel.length > 100) {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    if (useArtAssets !== undefined && typeof useArtAssets !== 'boolean') {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    return { ok: true };
}
async function createGenerateContentJob(request) {
    const validation = validateGenerateContentRequest(request);
    if (!validation.ok) {
        const message = validation.code === 'INVALID_SUBJECT'
            ? 'subject는 math, english, science만 허용됩니다.'
            : '요청 값이 올바르지 않습니다.';
        return buildErrorResponse(validation.code, message);
    }
    const jobId = (0, job_manager_1.createJob)(request);
    try {
        const moduleId = await (0, content_generator_1.createModuleId)(request.topic);
        const modulePath = node_path_1.default.posix.join('edu-content', moduleId);
        (0, job_manager_1.updateJob)(jobId, { moduleId, modulePath });
        if (isAsyncJobsEnabled()) {
            setImmediate(() => {
                void (0, content_generator_1.generateContentForJob)(jobId, request, moduleId);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '모듈 생성에 실패했습니다.';
        (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: message });
        return buildErrorResponse('INTERNAL_ERROR', '콘텐츠 생성 준비에 실패했습니다.');
    }
}
function getGenerateContentStatus(jobId) {
    const job = (0, job_manager_1.getJob)(jobId, 'generate');
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
function validateReviewContentRequest(input) {
    if (!input || typeof input !== 'object') {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    const record = input;
    const moduleId = record.moduleId;
    const autoFix = record.autoFix;
    const maxAttempts = record.maxAttempts;
    if (typeof moduleId !== 'string' || moduleId.trim().length === 0) {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    if (moduleId.length > 200) {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    if (autoFix !== undefined && typeof autoFix !== 'boolean') {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    if (maxAttempts !== undefined) {
        if (typeof maxAttempts !== 'number' || !Number.isFinite(maxAttempts)) {
            return { ok: false, code: 'INVALID_REQUEST' };
        }
        if (maxAttempts <= 0 || maxAttempts > 3) {
            return { ok: false, code: 'INVALID_REQUEST' };
        }
    }
    return {
        ok: true,
        value: {
            moduleId: moduleId.trim(),
            autoFix: autoFix ?? false,
            maxAttempts: maxAttempts ?? 1
        }
    };
}
async function createReviewContentJob(request) {
    const validation = validateReviewContentRequest(request);
    if (!validation.ok || !validation.value) {
        return buildErrorResponse('INVALID_REQUEST', '요청 값이 올바르지 않습니다.');
    }
    const { moduleId, autoFix, maxAttempts } = validation.value;
    const exists = await moduleExists(moduleId);
    if (!exists) {
        return buildErrorResponse('MODULE_NOT_FOUND', '리뷰할 모듈을 찾을 수 없습니다.');
    }
    const jobId = (0, job_manager_1.createReviewJob)({ moduleId, autoFix, maxAttempts });
    const modulePath = node_path_1.default.posix.join('edu-content', moduleId);
    (0, job_manager_1.updateJob)(jobId, { moduleId, modulePath });
    const sourceJob = (0, job_manager_1.findGenerateJobByModuleId)(moduleId);
    const sourceRequest = sourceJob?.request;
    if (isAsyncJobsEnabled()) {
        setImmediate(() => {
            void (0, content_generator_1.reviewContentForJob)(jobId, moduleId, { autoFix, maxAttempts }, sourceRequest);
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
function getReviewContentStatus(jobId) {
    const job = (0, job_manager_1.getJob)(jobId, 'review');
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
