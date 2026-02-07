"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModuleId = createModuleId;
exports.generateContentForJob = generateContentForJob;
exports.reviewContentForJob = reviewContentForJob;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const prompt_loader_1 = require("./prompt-loader");
const job_manager_1 = require("./job-manager");
const provider_1 = require("./llm/provider");
const zai_client_1 = require("./llm/zai-client");
const zai_output_1 = require("./llm/zai-output");
const review_1 = require("./llm/review");
const logger_1 = require("./logger");
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
function isReviewEnabled(value) {
    // 리뷰는 기본적으로 비활성화하고, 명시적으로 켜야 동작한다.
    return parseBooleanEnv(value, false);
}
function shouldBlockOnReviewFail(value) {
    return parseBooleanEnv(value, true);
}
function isAutoFixEnabled(value) {
    // 자동 수정도 기본 비활성화로 두어 예측 가능성을 높인다.
    return parseBooleanEnv(value, false);
}
function isLoggingEnabled(value) {
    return parseBooleanEnv(value, false);
}
function getAutoFixMaxAttempts(value) {
    const parsed = Number.parseInt(value || '', 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 1;
    }
    return Math.min(parsed, 3);
}
function getReviewProvider(value) {
    if (!value) {
        return 'zai';
    }
    const provider = (0, provider_1.getLlmProvider)(value);
    if (provider !== 'zai') {
        throw new Error('리뷰 제공자는 zai만 지원합니다.');
    }
    return provider;
}
async function loadClaudeSdk() {
    // ESM 전용 SDK를 CommonJS에서 동적 로딩하기 위한 처리
    const importer = new Function('return import(\"@anthropic-ai/claude-agent-sdk\")');
    return importer();
}
function buildZaiMessages(prompt, moduleId) {
    const outputGuide = [
        '응답 형식은 아래 두 가지 중 하나로만 출력하세요.',
        `1) JSON: {"files":[{"path":"edu-content/${moduleId}/index.html","content":"..."}]}`,
        '2) 마크다운 코드블록:',
        '### index.html',
        '```html',
        '...',
        '```',
        '### script.js',
        '```js',
        '...',
        '```',
        '### style.css',
        '```css',
        '...',
        '```',
        '필수 파일은 index.html, script.js, style.css 입니다.',
        '설명 문장 없이 파일 결과만 출력하세요.'
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
async function loadReviewFiles(rootDir, moduleId) {
    const baseDir = node_path_1.default.join(rootDir, 'edu-content', moduleId);
    const [indexHtml, scriptJs, styleCss] = await Promise.all([
        promises_1.default.readFile(node_path_1.default.join(baseDir, 'index.html'), 'utf8'),
        promises_1.default.readFile(node_path_1.default.join(baseDir, 'script.js'), 'utf8'),
        promises_1.default.readFile(node_path_1.default.join(baseDir, 'style.css'), 'utf8')
    ]);
    return { indexHtml, scriptJs, styleCss };
}
async function generateContentWithClaude(jobId, request, moduleId, rootDir, prompt) {
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
            throw new Error(mapResultErrorMessage(message.subtype));
        }
    }
}
async function generateContentWithZai(jobId, request, moduleId, rootDir, prompt) {
    const apiKey = process.env.ZAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('ZAI_API_KEY가 필요합니다.');
    }
    (0, logger_1.log)('GEN', `Z.ai 콘텐츠 생성 시작...`);
    (0, logger_1.logSize)('프롬프트', prompt);
    const messages = buildZaiMessages(prompt, moduleId);
    const apiUrl = process.env.ZAI_API_URL?.trim();
    const model = process.env.ZAI_MODEL?.trim();
    const content = await (0, zai_client_1.streamZaiChat)(messages, {
        apiKey,
        apiUrl: apiUrl || undefined,
        model: model || undefined,
        label: 'GEN'
    });
    let files;
    try {
        files = (0, zai_output_1.parseZaiOutput)(content, moduleId);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 파싱 오류';
        throw new Error(`생성 결과 파싱 실패: ${message}`);
    }
    await writeGeneratedFiles(rootDir, files);
    files.forEach((file) => {
        (0, logger_1.log)('WRITE', `${file.path} (${file.content.length.toLocaleString()}자)`);
    });
    (0, logger_1.log)('GEN', `콘텐츠 생성 완료 (${files.length}개 파일)`);
}
async function runContentReview(prompt, rootDir, moduleId) {
    const provider = getReviewProvider(process.env.LLM_REVIEW_PROVIDER);
    if (provider !== 'zai') {
        throw new Error('리뷰 제공자는 zai만 지원합니다.');
    }
    const apiKey = process.env.ZAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('ZAI_API_KEY가 필요합니다.');
    }
    const files = await loadReviewFiles(rootDir, moduleId);
    (0, logger_1.logSize)('index.html', files.indexHtml);
    (0, logger_1.logSize)('script.js', files.scriptJs);
    (0, logger_1.logSize)('style.css', files.styleCss);
    const deterministic = (0, review_1.evaluateDeterministicReview)(files.indexHtml);
    (0, logger_1.log)('REVIEW', `결정론적: ${deterministic.pass ? '통과' : '실패'} (씬 ${deterministic.sceneCount}개)`);
    if (!deterministic.pass) {
        deterministic.issues.forEach((issue, i) => {
            (0, logger_1.log)('ISSUE', `[결정] ${i + 1}. ${issue.message}`);
        });
    }
    const reviewMessages = (0, review_1.buildReviewMessages)(prompt, files, deterministic);
    const apiUrl = process.env.ZAI_REVIEW_API_URL?.trim() || process.env.ZAI_API_URL?.trim();
    const model = process.env.ZAI_REVIEW_MODEL?.trim() || process.env.ZAI_MODEL?.trim();
    const reviewText = await (0, zai_client_1.streamZaiChat)(reviewMessages, {
        apiKey,
        apiUrl: apiUrl || undefined,
        model: model || undefined,
        label: 'REVIEW'
    });
    const review = (0, review_1.parseReviewOutput)(reviewText);
    (0, logger_1.log)('REVIEW', `LLM 결과: ${review.pass ? '통과' : '실패'}, 점수: ${review.score}, 이슈: ${review.issues.length}개`);
    if (review.issues.length > 0) {
        review.issues.forEach((issue, i) => {
            (0, logger_1.log)('ISSUE', `[LLM] ${i + 1}. [${issue.severity}] ${issue.location}: ${issue.message}`);
        });
    }
    const mergedIssues = [...deterministic.issues, ...review.issues];
    const mergedReview = {
        ...review,
        issues: mergedIssues,
        deterministic: deterministic.requirements,
        deterministicPass: deterministic.pass,
        sceneCount: deterministic.sceneCount
    };
    const reviewPass = review.pass && deterministic.pass;
    (0, logger_1.log)('REVIEW', `최종 판정: ${reviewPass ? '통과' : '실패'}`);
    return { review: mergedReview, reviewPass, deterministic };
}
async function runContentFix(prompt, rootDir, moduleId, review, deterministic) {
    const provider = getReviewProvider(process.env.LLM_REVIEW_PROVIDER);
    if (provider !== 'zai') {
        throw new Error('리뷰 제공자는 zai만 지원합니다.');
    }
    const apiKey = process.env.ZAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('ZAI_API_KEY가 필요합니다.');
    }
    (0, logger_1.log)('FIX', `수정 시작 (이슈 ${review.issues.length}개)...`);
    const files = await loadReviewFiles(rootDir, moduleId);
    const fixMessages = (0, review_1.buildFixMessages)(prompt, files, review, deterministic);
    const apiUrl = process.env.ZAI_REVIEW_API_URL?.trim() || process.env.ZAI_API_URL?.trim();
    const model = process.env.ZAI_REVIEW_MODEL?.trim() || process.env.ZAI_MODEL?.trim();
    const fixText = await (0, zai_client_1.streamZaiChat)(fixMessages, {
        apiKey,
        apiUrl: apiUrl || undefined,
        model: model || undefined,
        label: 'FIX'
    });
    let updatedFiles;
    try {
        updatedFiles = (0, zai_output_1.parseZaiFiles)(fixText, { moduleId, requireAll: false });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 파싱 오류';
        throw new Error(`리뷰 자동수정 결과 파싱 실패: ${message}`);
    }
    await writeGeneratedFiles(rootDir, updatedFiles);
    updatedFiles.forEach((file) => {
        (0, logger_1.log)('WRITE', `${file.path} (${file.content.length.toLocaleString()}자)`);
    });
    (0, logger_1.log)('FIX', `${updatedFiles.length}개 파일 적용 완료`);
}
function buildFallbackPrompt(moduleId) {
    return `edu-content/${moduleId} 모듈에 대한 리뷰 요청입니다.`;
}
function clampAutoFixMaxAttempts(value) {
    const parsed = Number.isFinite(value) ? Math.trunc(value) : 1;
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 1;
    }
    return Math.min(parsed, 3);
}
async function performReviewFlow(jobId, prompt, rootDir, moduleId, options) {
    (0, job_manager_1.updateJob)(jobId, { reviewStatus: 'pending' });
    try {
        let { review, reviewPass, deterministic } = await runContentReview(prompt, rootDir, moduleId);
        (0, job_manager_1.updateJob)(jobId, {
            reviewStatus: reviewPass ? 'completed' : 'failed',
            review
        });
        let needsFix = !reviewPass || review.issues.length > 0;
        if (needsFix && options.autoFixEnabled) {
            for (let attempt = 1; attempt <= options.autoFixMaxAttempts; attempt++) {
                (0, logger_1.log)('REVIEW', `=== 자동 수정 시도 ${attempt}/${options.autoFixMaxAttempts} ===`);
                (0, job_manager_1.updateJob)(jobId, { reviewStatus: 'pending' });
                await runContentFix(prompt, rootDir, moduleId, review, deterministic);
                const next = await runContentReview(prompt, rootDir, moduleId);
                review = next.review;
                reviewPass = next.reviewPass;
                deterministic = next.deterministic;
                (0, job_manager_1.updateJob)(jobId, {
                    reviewStatus: reviewPass ? 'completed' : 'failed',
                    review
                });
                needsFix = !reviewPass || review.issues.length > 0;
                if (!needsFix) {
                    (0, logger_1.log)('DONE', `자동 수정 성공 (시도 ${attempt}회)`);
                    break;
                }
            }
            if (needsFix) {
                (0, logger_1.log)('ERROR', `자동 수정 실패 (최대 ${options.autoFixMaxAttempts}회 시도)`);
            }
        }
        if (needsFix && options.blockOnReviewFail) {
            (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: '리뷰 검증에 실패했습니다.' });
            return false;
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '리뷰 처리 오류';
        (0, job_manager_1.updateJob)(jobId, { reviewStatus: 'failed', reviewError: message });
        if (options.blockOnReviewFail) {
            (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: message });
            return false;
        }
    }
    return true;
}
async function generateContentForJob(jobId, request, moduleId) {
    const rootDir = getProjectRoot();
    const modulePath = node_path_1.default.posix.join('edu-content', moduleId);
    const reviewEnabled = isReviewEnabled(process.env.LLM_REVIEW_ENABLED);
    const blockOnReviewFail = shouldBlockOnReviewFail(process.env.LLM_REVIEW_BLOCK_ON_FAIL);
    const autoFixEnabled = isAutoFixEnabled(process.env.LLM_REVIEW_AUTO_FIX_ENABLED);
    const autoFixMaxAttempts = getAutoFixMaxAttempts(process.env.LLM_REVIEW_AUTO_FIX_MAX_ATTEMPTS);
    const loggingEnabled = isLoggingEnabled(process.env.LLM_LOGGING_ENABLED);
    const reviewOptions = {
        autoFixEnabled,
        autoFixMaxAttempts,
        blockOnReviewFail
    };
    (0, logger_1.enableLogging)(loggingEnabled);
    (0, logger_1.log)('INIT', `모듈: ${moduleId}, 리뷰: ${reviewEnabled}, 자동수정: ${autoFixEnabled} (최대 ${autoFixMaxAttempts}회)`);
    (0, job_manager_1.updateJob)(jobId, {
        status: 'processing',
        moduleId,
        modulePath
    });
    try {
        const prompt = await (0, prompt_loader_1.buildPrompt)(request, moduleId);
        const provider = (0, provider_1.getLlmProvider)(process.env.LLM_PROVIDER);
        if (provider === 'zai') {
            if (!process.env.ZAI_API_KEY?.trim()) {
                throw new Error('ZAI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
            }
            await generateContentWithZai(jobId, request, moduleId, rootDir, prompt);
        }
        else {
            try {
                await loadClaudeSdk();
            }
            catch {
                throw new Error('@anthropic-ai/claude-agent-sdk 패키지가 설치되지 않았습니다. npm install @anthropic-ai/claude-agent-sdk 를 실행하거나, LLM_PROVIDER=zai로 설정하세요.');
            }
            if (!process.env.ANTHROPIC_API_KEY?.trim() && !process.env.ANTHROPIC_AUTH_TOKEN?.trim()) {
                throw new Error('ANTHROPIC_API_KEY 또는 ANTHROPIC_AUTH_TOKEN 환경변수가 필요합니다. .env 파일을 확인하세요.');
            }
            await generateContentWithClaude(jobId, request, moduleId, rootDir, prompt);
        }
        if (reviewEnabled) {
            const canContinue = await performReviewFlow(jobId, prompt, rootDir, moduleId, reviewOptions);
            if (!canContinue) {
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
async function reviewContentForJob(jobId, moduleId, options, sourceRequest) {
    const rootDir = getProjectRoot();
    const modulePath = node_path_1.default.posix.join('edu-content', moduleId);
    const loggingEnabled = isLoggingEnabled(process.env.LLM_LOGGING_ENABLED);
    (0, logger_1.enableLogging)(loggingEnabled);
    (0, logger_1.log)('INIT', `리뷰 작업 시작: ${moduleId}, 자동수정: ${options.autoFix}`);
    (0, job_manager_1.updateJob)(jobId, {
        status: 'processing',
        moduleId,
        modulePath
    });
    try {
        const prompt = sourceRequest
            ? await (0, prompt_loader_1.buildPrompt)(sourceRequest, moduleId)
            : buildFallbackPrompt(moduleId);
        const reviewOptions = {
            autoFixEnabled: options.autoFix,
            autoFixMaxAttempts: clampAutoFixMaxAttempts(options.maxAttempts),
            blockOnReviewFail: true
        };
        const completed = await performReviewFlow(jobId, prompt, rootDir, moduleId, reviewOptions);
        if (!completed) {
            return;
        }
        (0, job_manager_1.updateJob)(jobId, {
            status: 'completed',
            moduleId,
            modulePath
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : '리뷰 실행 오류';
        (0, job_manager_1.updateJob)(jobId, { status: 'failed', error: message });
    }
}
