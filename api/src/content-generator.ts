import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildPrompt } from './prompt-loader';
import { updateJob } from './job-manager';
import { GenerateContentRequest } from './types';
import { getLlmProvider } from './llm/provider';
import { streamZaiChat, ZaiChatMessage } from './llm/zai-client';
import { parseZaiOutput, GeneratedFile } from './llm/zai-output';

const DEFAULT_FILES = ['index.html', 'script.js', 'style.css'];
const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg']);
const RESULT_ERROR_MESSAGES: Record<string, string> = {
  error_during_execution: '콘텐츠 생성 중 오류가 발생했습니다.',
  error_max_turns: '최대 턴 수를 초과했습니다.',
  error_max_budget_usd: '예산 한도를 초과했습니다.',
  error_max_structured_output_retries: '출력 재시도 한도를 초과했습니다.'
};
const PERMISSION_MODES = ['default', 'acceptEdits', 'bypassPermissions'] as const;
type PermissionModeValue = (typeof PERMISSION_MODES)[number];

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function slugifyTopic(topic: string) {
  const normalized = topic.normalize('NFKD').toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug) {
    return slug;
  }

  const hash = crypto.createHash('sha1').update(topic).digest('hex').slice(0, 8);
  return `topic-${hash}`;
}

async function getExistingModuleNames(eduContentRoot: string) {
  try {
    const entries = await fs.readdir(eduContentRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    return [];
  }
}

export async function createModuleId(topic: string) {
  const rootDir = getProjectRoot();
  const eduContentRoot = path.join(rootDir, 'edu-content');
  await fs.mkdir(eduContentRoot, { recursive: true });

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

function extractFilePath(input: unknown) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Record<string, unknown>;
  const candidate =
    record.file_path || record.path || record.filePath || record.filepath;

  return typeof candidate === 'string' ? candidate : null;
}

function isAllowedWritePath(filePath: string, rootDir: string) {
  const resolvedPath = path.resolve(rootDir, filePath);
  const eduContentRoot = path.resolve(rootDir, 'edu-content');
  if (!resolvedPath.startsWith(`${eduContentRoot}${path.sep}`)) {
    return false;
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension);
}

function remapTmpEduContentPath(filePath: string, rootDir: string) {
  const tmpRoot = path.resolve('/tmp/edu-content');
  const resolvedPath = path.resolve(rootDir, filePath);
  if (!resolvedPath.startsWith(`${tmpRoot}${path.sep}`)) {
    return null;
  }

  const relativePath = path.relative(tmpRoot, resolvedPath);
  if (!relativePath || relativePath.startsWith('..')) {
    return null;
  }

  return path.posix.join('edu-content', relativePath.split(path.sep).join('/'));
}

function mapResultErrorMessage(subtype: string) {
  return RESULT_ERROR_MESSAGES[subtype] || '콘텐츠 생성 중 오류가 발생했습니다.';
}

function getClaudeConfigDir(rootDir: string) {
  return path.join(rootDir, '.claude');
}

function getPermissionMode(value: string | undefined): PermissionModeValue {
  if (!value) {
    return 'default';
  }

  const mode = value.trim() as PermissionModeValue;
  if (PERMISSION_MODES.includes(mode)) {
    return mode;
  }

  return 'default';
}

function sanitizeEnv(env: NodeJS.ProcessEnv) {
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
  return importer() as Promise<typeof import('@anthropic-ai/claude-agent-sdk')>;
}

function buildZaiMessages(prompt: string, moduleId: string): ZaiChatMessage[] {
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

async function writeGeneratedFiles(rootDir: string, files: GeneratedFile[]) {
  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(rootDir, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf8');
    })
  );
}

async function generateContentWithClaude(
  jobId: string,
  request: GenerateContentRequest,
  moduleId: string,
  rootDir: string,
  modulePath: string
) {
  const prompt = await buildPrompt(request, moduleId);
  const { query } = await loadClaudeSdk();
  const claudeConfigDir = getClaudeConfigDir(rootDir);
  await fs.mkdir(claudeConfigDir, { recursive: true });
  process.env.CLAUDE_CONFIG_DIR = claudeConfigDir;
  if (process.env.ANTHROPIC_API_KEY !== undefined && process.env.ANTHROPIC_API_KEY.trim() === '') {
    delete process.env.ANTHROPIC_API_KEY;
  }
  if (
    process.env.ANTHROPIC_AUTH_TOKEN !== undefined
    && process.env.ANTHROPIC_AUTH_TOKEN.trim() === ''
  ) {
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
      ? `${claudeNodePath}${path.delimiter}${process.env.PATH || ''}`
      : process.env.PATH
  });
  if (cliConfigDir) {
    env.CLAUDE_CONFIG_DIR = cliConfigDir;
  } else {
    delete env.CLAUDE_CONFIG_DIR;
  }

  const response = query({
    prompt,
    options: {
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
      cwd: rootDir,
      env,
      additionalDirectories: [path.join(rootDir, 'edu-content'), path.resolve('/tmp/edu-content')],
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
      updateJob(jobId, {
        status: 'failed',
        error: errorMessage
      });
      return;
    }
  }

  updateJob(jobId, {
    status: 'completed',
    moduleId,
    modulePath,
    files: DEFAULT_FILES
  });
}

async function generateContentWithZai(
  jobId: string,
  request: GenerateContentRequest,
  moduleId: string,
  rootDir: string,
  modulePath: string
) {
  const apiKey = process.env.ZAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ZAI_API_KEY가 필요합니다.');
  }

  const prompt = await buildPrompt(request, moduleId);
  const messages = buildZaiMessages(prompt, moduleId);
  const apiUrl = process.env.ZAI_API_URL?.trim();
  const model = process.env.ZAI_MODEL?.trim();
  const content = await streamZaiChat(messages, {
    apiKey,
    apiUrl: apiUrl || undefined,
    model: model || undefined
  });
  const files = parseZaiOutput(content, moduleId);
  await writeGeneratedFiles(rootDir, files);

  updateJob(jobId, {
    status: 'completed',
    moduleId,
    modulePath,
    files: DEFAULT_FILES
  });
}

export async function generateContentForJob(
  jobId: string,
  request: GenerateContentRequest,
  moduleId: string
) {
  const rootDir = getProjectRoot();
  const modulePath = path.posix.join('edu-content', moduleId);

  updateJob(jobId, {
    status: 'processing',
    moduleId,
    modulePath
  });

  try {
    const provider = getLlmProvider(process.env.LLM_PROVIDER);
    if (provider === 'zai') {
      await generateContentWithZai(jobId, request, moduleId, rootDir, modulePath);
      return;
    }

    await generateContentWithClaude(jobId, request, moduleId, rootDir, modulePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    updateJob(jobId, { status: 'failed', error: message });
  }
}
