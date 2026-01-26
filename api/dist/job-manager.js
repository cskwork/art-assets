"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeJobStore = initializeJobStore;
exports.startJobCleanup = startJobCleanup;
exports.cleanupExpiredJobs = cleanupExpiredJobs;
exports.createJob = createJob;
exports.updateJob = updateJob;
exports.getJob = getJob;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const JOB_TTL_MS = 60 * 60 * 1000;
const jobs = new Map();
let isLoaded = false;
let cleanupTimer = null;
function getProjectRoot() {
    return process.env.PROJECT_ROOT || process.cwd();
}
function getStorePath() {
    return (process.env.JOB_STORE_PATH ||
        node_path_1.default.join(getProjectRoot(), 'api', 'data', 'jobs.json'));
}
function loadJobsFromDisk() {
    const storePath = getStorePath();
    if (!node_fs_1.default.existsSync(storePath)) {
        return;
    }
    try {
        const raw = node_fs_1.default.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.jobs)) {
            return;
        }
        parsed.jobs.forEach((job) => {
            jobs.set(job.id, job);
        });
    }
    catch (error) {
        console.error('[Job] 저장소 로드 실패:', error instanceof Error ? error.message : error);
    }
}
function persistJobs() {
    const storePath = getStorePath();
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(storePath), { recursive: true });
    const payload = {
        version: 1,
        jobs: Array.from(jobs.values())
    };
    node_fs_1.default.writeFileSync(storePath, JSON.stringify(payload, null, 2), 'utf8');
}
function ensureLoaded() {
    if (isLoaded) {
        return;
    }
    loadJobsFromDisk();
    isLoaded = true;
}
function initializeJobStore() {
    ensureLoaded();
}
function startJobCleanup() {
    if (cleanupTimer) {
        return;
    }
    cleanupTimer = setInterval(() => {
        cleanupExpiredJobs();
    }, JOB_TTL_MS);
    cleanupTimer.unref();
}
function cleanupExpiredJobs() {
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
function createJob(request) {
    ensureLoaded();
    cleanupExpiredJobs();
    const jobId = node_crypto_1.default.randomUUID();
    const job = {
        id: jobId,
        status: 'pending',
        request,
        createdAt: Date.now()
    };
    jobs.set(jobId, job);
    persistJobs();
    return jobId;
}
function updateJob(jobId, updates) {
    ensureLoaded();
    const job = jobs.get(jobId);
    if (!job) {
        return;
    }
    jobs.set(jobId, { ...job, ...updates });
    persistJobs();
}
function getJob(jobId) {
    ensureLoaded();
    cleanupExpiredJobs();
    return jobs.get(jobId);
}
