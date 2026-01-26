"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPromptTemplate = loadPromptTemplate;
exports.buildPrompt = buildPrompt;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const SUBJECT_PROMPTS = {
    math: 'math.md',
    english: 'english.md'
};
function getProjectRoot() {
    return process.env.PROJECT_ROOT || process.cwd();
}
async function loadPromptTemplate(subject) {
    const fileName = SUBJECT_PROMPTS[subject];
    const promptPath = node_path_1.default.join(getProjectRoot(), 'prompts', fileName);
    return promises_1.default.readFile(promptPath, 'utf8');
}
async function buildPrompt(request, moduleId) {
    const template = await loadPromptTemplate(request.subject);
    return `${template}\n\n---\n\n## 생성 요청\n- 주제: ${request.topic}\n- 학년: ${request.gradeLevel}\n\n위 주제에 대한 7씬 교육 콘텐츠를 생성하고 edu-content/${moduleId}/ 폴더에 저장하세요.\n필수 파일: index.html, script.js, style.css\n`;
}
