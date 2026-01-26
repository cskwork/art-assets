"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGenerateContentRequest = validateGenerateContentRequest;
exports.createGenerateContentJob = createGenerateContentJob;
exports.getGenerateContentStatus = getGenerateContentStatus;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
const job_manager_1 = require("./job-manager");
const content_generator_1 = require("./content-generator");
dotenv_1.default.config();
(0, job_manager_1.initializeJobStore)();
(0, job_manager_1.startJobCleanup)();
const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];
function buildErrorResponse(code, message) {
    return { success: false, error: message, code };
}
function validateGenerateContentRequest(input) {
    if (!input || typeof input !== 'object') {
        return { ok: false, code: 'INVALID_REQUEST' };
    }
    const record = input;
    const subject = record.subject;
    const topic = record.topic;
    const gradeLevel = record.gradeLevel;
    if (subject !== 'math' && subject !== 'english') {
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
    return { ok: true };
}
async function createGenerateContentJob(request) {
    const validation = validateGenerateContentRequest(request);
    if (!validation.ok) {
        const message = validation.code === 'INVALID_SUBJECT'
            ? 'subject는 math 또는 english만 허용됩니다.'
            : '요청 값이 올바르지 않습니다.';
        return buildErrorResponse(validation.code, message);
    }
    const jobId = (0, job_manager_1.createJob)(request);
    try {
        const moduleId = await (0, content_generator_1.createModuleId)(request.topic);
        const modulePath = node_path_1.default.posix.join('edu-content', moduleId);
        (0, job_manager_1.updateJob)(jobId, { moduleId, modulePath });
        setImmediate(() => {
            void (0, content_generator_1.generateContentForJob)(jobId, request, moduleId);
        });
        return {
            success: true,
            jobId,
            message: '콘텐츠 생성이 시작되었습니다'
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '모듈 생성에 실패했습니다.';
        (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: message });
        return buildErrorResponse('INTERNAL_ERROR', '콘텐츠 생성 준비에 실패했습니다.');
    }
}
function getGenerateContentStatus(jobId) {
    const job = (0, job_manager_1.getJob)(jobId);
    if (!job) {
        return buildErrorResponse('JOB_NOT_FOUND', '작업을 찾을 수 없습니다.');
    }
    return {
        jobId: job.id,
        status: job.status,
        moduleId: job.moduleId,
        modulePath: job.modulePath,
        files: job.files || (job.status === 'completed' ? DEFAULT_FILES : undefined),
        error: job.error
    };
}
