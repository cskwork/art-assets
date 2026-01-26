"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModuleId = createModuleId;
exports.generateContentForJob = generateContentForJob;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const prompt_loader_1 = require("./prompt-loader");
const job_manager_1 = require("./job-manager");
const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];
const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg']);
const RESULT_ERROR_MESSAGES = {
    error_during_execution: '콘텐츠 생성 중 오류가 발생했습니다.',
    error_max_turns: '최대 턴 수를 초과했습니다.',
    error_max_budget_usd: '예산 한도를 초과했습니다.',
    error_max_structured_output_retries: '출력 재시도 한도를 초과했습니다.'
};
function getProjectRoot() {
    return process.env.PROJECT_ROOT || process.cwd();
}
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}
function slugifyTopic(topic) {
    const normalized = topic.normalize('NFKD').toLowerCase();
    const slug = normalized
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    if (slug) {
        return slug;
    }
    const hash = node_crypto_1.default.createHash('sha1').update(topic).digest('hex').slice(0, 8);
    return `topic-${hash}`;
}
async function getExistingModuleNames(eduContentRoot) {
    try {
        const entries = await promises_1.default.readdir(eduContentRoot, { withFileTypes: true });
        return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    }
    catch (error) {
        return [];
    }
}
async function createModuleId(topic) {
    const rootDir = getProjectRoot();
    const eduContentRoot = node_path_1.default.join(rootDir, 'edu-content');
    await promises_1.default.mkdir(eduContentRoot, { recursive: true });
    const datePart = formatDate(new Date());
    const baseSlug = slugifyTopic(topic);
    const baseId = `${datePart}-${baseSlug}`;
    const existingNames = await getExistingModuleNames(eduContentRoot);
    if (!existingNames.includes(baseId)) {
        return baseId;
    }
    const versionPrefix = `${baseId}-v`;
    let maxVersion = 1;
    existingNames.forEach((name) => {
        if (!name.startsWith(versionPrefix)) {
            return;
        }
        const versionText = name.slice(versionPrefix.length);
        const version = Number.parseInt(versionText, 10);
        if (!Number.isNaN(version) && version > maxVersion) {
            maxVersion = version;
        }
    });
    return `${baseId}-v${maxVersion + 1}`;
}
function extractFilePath(input) {
    if (!input || typeof input !== 'object') {
        return null;
    }
    const record = input;
    const candidate = record.file_path || record.path || record.filePath || record.filepath;
    return typeof candidate === 'string' ? candidate : null;
}
function isAllowedWritePath(filePath, rootDir) {
    const resolvedPath = node_path_1.default.resolve(rootDir, filePath);
    const eduContentRoot = node_path_1.default.resolve(rootDir, 'edu-content');
    if (!resolvedPath.startsWith(`${eduContentRoot}${node_path_1.default.sep}`)) {
        return false;
    }
    const extension = node_path_1.default.extname(resolvedPath).toLowerCase();
    return ALLOWED_EXTENSIONS.has(extension);
}
function mapResultErrorMessage(subtype) {
    return RESULT_ERROR_MESSAGES[subtype] || '콘텐츠 생성 중 오류가 발생했습니다.';
}
async function loadClaudeSdk() {
    // ESM 전용 SDK를 CommonJS에서 동적 로딩하기 위한 처리
    const importer = new Function('return import(\"@anthropic-ai/claude-agent-sdk\")');
    return importer();
}
async function generateContentForJob(jobId, request, moduleId) {
    const rootDir = getProjectRoot();
    const modulePath = node_path_1.default.posix.join('edu-content', moduleId);
    (0, job_manager_1.updateJob)(jobId, {
        status: 'processing',
        moduleId,
        modulePath
    });
    try {
        const prompt = await (0, prompt_loader_1.buildPrompt)(request, moduleId);
        const { query } = await loadClaudeSdk();
        const maxTurnsRaw = Number.parseInt(process.env.CLAUDE_MAX_TURNS || '10', 10);
        const maxTurns = Number.isFinite(maxTurnsRaw) ? maxTurnsRaw : 10;
        const response = query({
            prompt,
            options: {
                model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
                cwd: rootDir,
                permissionMode: 'default',
                tools: ['Read', 'Write', 'Glob'],
                disallowedTools: ['Bash'],
                maxTurns,
                canUseTool: async (toolName, input) => {
                    if (toolName === 'Write') {
                        const filePath = extractFilePath(input);
                        if (!filePath) {
                            return { behavior: 'deny', message: '파일 경로가 필요합니다.' };
                        }
                        if (!isAllowedWritePath(filePath, rootDir)) {
                            return {
                                behavior: 'deny',
                                message: 'edu-content/ 경로와 허용 확장자만 저장 가능합니다.'
                            };
                        }
                    }
                    if (toolName === 'Bash') {
                        return { behavior: 'deny', message: 'Bash 실행은 금지됩니다.' };
                    }
                    return { behavior: 'allow' };
                }
            }
        });
        for await (const message of response) {
            if (message.type === 'result' && message.subtype !== 'success') {
                const errorMessage = mapResultErrorMessage(message.subtype);
                (0, job_manager_1.updateJob)(jobId, {
                    status: 'failed',
                    error: errorMessage
                });
                return;
            }
        }
        (0, job_manager_1.updateJob)(jobId, {
            status: 'completed',
            moduleId,
            modulePath,
            files: DEFAULT_FILES
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: message });
    }
}
