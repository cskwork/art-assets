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
const provider_1 = require("./llm/provider");
const zai_client_1 = require("./llm/zai-client");
const zai_output_1 = require("./llm/zai-output");
const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];
const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg']);
const RESULT_ERROR_MESSAGES = {
    error_during_execution: '콘텐츠 생성 중 오류가 발생했습니다.',
    error_max_turns: '최대 턴 수를 초과했습니다.',
    error_max_budget_usd: '예산 한도를 초과했습니다.',
    error_max_structured_output_retries: '출력 재시도 한도를 초과했습니다.'
};
const PERMISSION_MODES = ['default', 'acceptEdits', 'bypassPermissions'];
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
function remapTmpEduContentPath(filePath, rootDir) {
    const tmpRoot = node_path_1.default.resolve('/tmp/edu-content');
    const resolvedPath = node_path_1.default.resolve(rootDir, filePath);
    if (!resolvedPath.startsWith(`${tmpRoot}${node_path_1.default.sep}`)) {
        return null;
    }
    const relativePath = node_path_1.default.relative(tmpRoot, resolvedPath);
    if (!relativePath || relativePath.startsWith('..')) {
        return null;
    }
    return node_path_1.default.posix.join('edu-content', relativePath.split(node_path_1.default.sep).join('/'));
}
function mapResultErrorMessage(subtype) {
    return RESULT_ERROR_MESSAGES[subtype] || '콘텐츠 생성 중 오류가 발생했습니다.';
}
function getClaudeConfigDir(rootDir) {
    return node_path_1.default.join(rootDir, '.claude');
}
function getPermissionMode(value) {
    if (!value) {
        return 'default';
    }
    const mode = value.trim();
    if (PERMISSION_MODES.includes(mode)) {
        return mode;
    }
    return 'default';
}
function sanitizeEnv(env) {
    const cleaned = { ...env };
    ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'].forEach((key) => {
        const value = cleaned[key];
        if (value !== undefined && value.trim() === '') {
            delete cleaned[key];
        }
    });
    return cleaned;
}
async function loadClaudeSdk() {
    // ESM 전용 SDK를 CommonJS에서 동적 로딩하기 위한 처리
    const importer = new Function('return import(\"@anthropic-ai/claude-agent-sdk\")');
    return importer();
}
function buildZaiMessages(prompt, moduleId) {
    const outputGuide = [
        '응답은 JSON만 출력하세요.',
        `형식: {\"files\":[{\"path\":\"edu-content/${moduleId}/index.html\",\"content\":\"...\"}]}`,
        'JSON 외의 텍스트는 출력하지 마세요.',
        'content는 파일 전체 내용을 담은 문자열이어야 합니다.',
        '필수 파일: index.html, script.js, style.css'
    ].join('\n');
    return [
        {
            role: 'system',
            content: '당신은 교육용 웹 콘텐츠를 생성하는 도우미입니다.'
        },
        {
            role: 'user',
            content: `${prompt}\n\n${outputGuide}`
        }
    ];
}
async function writeGeneratedFiles(rootDir, files) {
    await Promise.all(files.map(async (file) => {
        const fullPath = node_path_1.default.join(rootDir, file.path);
        await promises_1.default.mkdir(node_path_1.default.dirname(fullPath), { recursive: true });
        await promises_1.default.writeFile(fullPath, file.content, 'utf8');
    }));
}
async function generateContentWithClaude(jobId, request, moduleId, rootDir, modulePath) {
    const prompt = await (0, prompt_loader_1.buildPrompt)(request, moduleId);
    const { query } = await loadClaudeSdk();
    const claudeConfigDir = getClaudeConfigDir(rootDir);
    await promises_1.default.mkdir(claudeConfigDir, { recursive: true });
    process.env.CLAUDE_CONFIG_DIR = claudeConfigDir;
    if (process.env.ANTHROPIC_API_KEY !== undefined && process.env.ANTHROPIC_API_KEY.trim() === '') {
        delete process.env.ANTHROPIC_API_KEY;
    }
    if (process.env.ANTHROPIC_AUTH_TOKEN !== undefined
        && process.env.ANTHROPIC_AUTH_TOKEN.trim() === '') {
        delete process.env.ANTHROPIC_AUTH_TOKEN;
    }
    const maxTurnsRaw = Number.parseInt(process.env.CLAUDE_MAX_TURNS || '10', 10);
    const maxTurns = Number.isFinite(maxTurnsRaw) ? maxTurnsRaw : 10;
    const permissionMode = getPermissionMode(process.env.CLAUDE_PERMISSION_MODE);
    const claudeNodePath = process.env.CLAUDE_CODE_NODE_PATH;
    const cliConfigDir = process.env.CLAUDE_CODE_CONFIG_DIR;
    const env = sanitizeEnv({
        ...process.env,
        PATH: claudeNodePath
            ? `${claudeNodePath}${node_path_1.default.delimiter}${process.env.PATH || ''}`
            : process.env.PATH
    });
    if (cliConfigDir) {
        env.CLAUDE_CONFIG_DIR = cliConfigDir;
    }
    else {
        delete env.CLAUDE_CONFIG_DIR;
    }
    const response = query({
        prompt,
        options: {
            model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
            cwd: rootDir,
            env,
            additionalDirectories: [node_path_1.default.join(rootDir, 'edu-content'), node_path_1.default.resolve('/tmp/edu-content')],
            permissionMode,
            tools: ['Read', 'Write', 'Glob'],
            disallowedTools: ['Bash'],
            maxTurns,
            canUseTool: async (toolName, input) => {
                if (toolName === 'Write') {
                    const filePath = extractFilePath(input);
                    if (!filePath) {
                        return { behavior: 'deny', message: '파일 경로가 필요합니다.' };
                    }
                    const remappedPath = remapTmpEduContentPath(filePath, rootDir);
                    if (remappedPath) {
                        return {
                            behavior: 'allow',
                            updatedInput: { ...input, file_path: remappedPath }
                        };
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
async function generateContentWithZai(jobId, request, moduleId, rootDir, modulePath) {
    const apiKey = process.env.ZAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('ZAI_API_KEY가 필요합니다.');
    }
    const prompt = await (0, prompt_loader_1.buildPrompt)(request, moduleId);
    const messages = buildZaiMessages(prompt, moduleId);
    const apiUrl = process.env.ZAI_API_URL?.trim();
    const model = process.env.ZAI_MODEL?.trim();
    const content = await (0, zai_client_1.streamZaiChat)(messages, {
        apiKey,
        apiUrl: apiUrl || undefined,
        model: model || undefined
    });
    const files = (0, zai_output_1.parseZaiOutput)(content, moduleId);
    await writeGeneratedFiles(rootDir, files);
    (0, job_manager_1.updateJob)(jobId, {
        status: 'completed',
        moduleId,
        modulePath,
        files: DEFAULT_FILES
    });
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
        const provider = (0, provider_1.getLlmProvider)(process.env.LLM_PROVIDER);
        if (provider === 'zai') {
            await generateContentWithZai(jobId, request, moduleId, rootDir, modulePath);
            return;
        }
        await generateContentWithClaude(jobId, request, moduleId, rootDir, modulePath);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: message });
    }
}
