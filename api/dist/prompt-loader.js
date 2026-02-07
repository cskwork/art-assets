"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSystemPrompt = loadSystemPrompt;
exports.buildPrompt = buildPrompt;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
function getProjectRoot() {
    return process.env.PROJECT_ROOT || process.cwd();
}
const MAX_CORE_ASSETS = 10;
const MAX_EIGHT_BIT_ASSETS = 14;
const TOKEN_MIN_LENGTH = 2;
const SUBJECT_KEYWORDS = {
    math: ['math', 'geometry', 'fraction', 'graph', 'number', 'shape', '수학', '도형', '분수', '그래프', '숫자'],
    english: ['english', 'word', 'vocabulary', 'grammar', 'alphabet', '영어', '단어', '문법', '알파벳', '문장'],
    science: ['science', 'biology', 'chemistry', 'physics', 'planet', '과학', '생물', '화학', '물리', '행성']
};
const STOP_WORDS = new Set([
    'the',
    'and',
    'for',
    'with',
    'this',
    'that',
    'from',
    'to',
    'of',
    'in',
    'on',
    'at',
    'by',
    '초등',
    '중학교',
    '고등학교',
    '학년'
]);
function tokenize(input) {
    return input
        .toLowerCase()
        .split(/[^a-z0-9가-힣]+/g)
        .filter((token) => token.length >= TOKEN_MIN_LENGTH && !STOP_WORDS.has(token));
}
function normalizeTags(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
function toAssetCandidate(value) {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const record = value;
    const assetPath = record.path;
    const description = record.description;
    if (typeof assetPath !== 'string' || assetPath.trim().length === 0) {
        return null;
    }
    if (typeof description !== 'string' || description.trim().length === 0) {
        return null;
    }
    return {
        path: assetPath.trim().replace(/\\/g, '/'),
        tags: normalizeTags(record.tags),
        description: description.trim()
    };
}
async function loadJsonFile(filePath) {
    try {
        const raw = await promises_1.default.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function loadCoreAssetCandidates(projectRoot) {
    const payload = await loadJsonFile(node_path_1.default.join(projectRoot, 'assets.json'));
    if (!payload || typeof payload !== 'object') {
        return [];
    }
    const assets = payload.assets;
    if (!Array.isArray(assets)) {
        return [];
    }
    return assets
        .map((entry) => toAssetCandidate(entry))
        .filter((entry) => Boolean(entry));
}
async function loadEightBitAssetCandidates(projectRoot) {
    const payload = await loadJsonFile(node_path_1.default.join(projectRoot, '8bit-assets', 'index.json'));
    if (!payload || typeof payload !== 'object') {
        return [];
    }
    const assets = payload.assets;
    if (!Array.isArray(assets)) {
        return [];
    }
    return assets
        .map((entry) => toAssetCandidate(entry))
        .filter((entry) => Boolean(entry));
}
function scoreCandidate(candidate, keywordTokens) {
    if (keywordTokens.size === 0) {
        return 0;
    }
    const pathText = candidate.path.toLowerCase();
    const descText = candidate.description.toLowerCase();
    const tagText = candidate.tags.join(' ').toLowerCase();
    let score = 0;
    keywordTokens.forEach((token) => {
        if (tagText.includes(token)) {
            score += 4;
        }
        if (pathText.includes(token)) {
            score += 3;
        }
        if (descText.includes(token)) {
            score += 2;
        }
    });
    return score;
}
function selectAssetCandidates(candidates, keywordTokens, limit) {
    const scored = candidates
        .map((candidate) => ({ candidate, score: scoreCandidate(candidate, keywordTokens) }))
        .sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.candidate.path.localeCompare(b.candidate.path);
    });
    const filtered = scored.filter((entry) => entry.score > 0);
    if (filtered.length > 0) {
        return filtered.slice(0, limit).map((entry) => entry.candidate);
    }
    return scored.slice(0, limit).map((entry) => entry.candidate);
}
function toPathLabel(assetPath) {
    return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
}
function formatAssetLine(candidate) {
    const tags = candidate.tags.slice(0, 5).join(', ');
    if (tags.length === 0) {
        return `- ${toPathLabel(candidate.path)} | 설명: ${candidate.description}`;
    }
    return `- ${toPathLabel(candidate.path)} | 설명: ${candidate.description} | 태그: ${tags}`;
}
function collectKeywordTokens(request) {
    const seed = [
        request.topic,
        request.gradeLevel,
        request.subject,
        ...SUBJECT_KEYWORDS[request.subject]
    ].join(' ');
    return new Set(tokenize(seed));
}
async function buildArtAssetContext(request) {
    const shouldUseArtAssets = request.useArtAssets !== false;
    if (!shouldUseArtAssets) {
        return '';
    }
    const projectRoot = getProjectRoot();
    const [coreAssets, eightBitAssets] = await Promise.all([
        loadCoreAssetCandidates(projectRoot),
        loadEightBitAssetCandidates(projectRoot)
    ]);
    const keywordTokens = collectKeywordTokens(request);
    const selectedCore = selectAssetCandidates(coreAssets, keywordTokens, MAX_CORE_ASSETS);
    const selectedEightBit = selectAssetCandidates(eightBitAssets, keywordTokens, MAX_EIGHT_BIT_ASSETS);
    const lines = [
        '## 아트 에셋 사용 지침',
        '- 아래 경로의 기존 에셋을 우선 사용하고, 필요한 경우에만 새 SVG를 생성하세요.',
        '- HTML/CSS/JS에서 경로는 절대 경로(`/...`)로 참조하세요.',
        '- 8비트 에셋 루트: /8bit-assets/'
    ];
    if (selectedCore.length > 0) {
        lines.push('', '### 기본 아트 에셋 추천');
        selectedCore.forEach((candidate) => {
            lines.push(formatAssetLine(candidate));
        });
    }
    if (selectedEightBit.length > 0) {
        lines.push('', '### 8비트 아트 에셋 추천');
        selectedEightBit.forEach((candidate) => {
            lines.push(formatAssetLine(candidate));
        });
    }
    return `${lines.join('\n')}\n`;
}
/**
 * 공통 시스템 프롬프트 로드
 * api/system-prompt/system.md 파일 사용
 */
async function loadSystemPrompt() {
    const promptPath = node_path_1.default.join(getProjectRoot(), 'api', 'system-prompt', 'system.md');
    return promises_1.default.readFile(promptPath, 'utf8');
}
/**
 * 최종 프롬프트 생성
 * 공통 시스템 프롬프트 + 과목/주제별 요청
 */
async function buildPrompt(request, moduleId) {
    const systemPrompt = await loadSystemPrompt();
    const artAssetContext = await buildArtAssetContext(request);
    return `${systemPrompt}\n\n---\n\n${artAssetContext}## 생성 요청\n- 과목: ${request.subject}\n- 주제: ${request.topic}\n- 학년: ${request.gradeLevel}\n- 아트 에셋 사용: ${request.useArtAssets === false ? '아니오' : '예'}\n\n위 주제에 대한 7씬 교육 콘텐츠를 생성하고 edu-content/${moduleId}/ 폴더에 저장하세요.\n필수 파일: index.html, script.js, style.css\n`;
}
