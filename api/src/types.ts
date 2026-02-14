export type Subject = 'math' | 'english' | 'science' | 'social' | 'history' | 'korean' | 'art' | 'music' | 'coding';

export interface GenerateContentRequest {
  subject: Subject;
  topic: string;
  gradeLevel: string;
  contentType?: ContentType;
  visualStyle?: VisualStyle;
  storyTheme?: StoryTheme;
  difficulty?: DifficultyLevel;
  useArtAssets?: boolean;
}

export interface ReviewContentRequest {
  moduleId: string;
  autoFix?: boolean;
  maxAttempts?: number;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReviewStatus = 'pending' | 'completed' | 'failed';
export type JobType = 'generate' | 'review';

export type ReviewIssueSeverity = 'high' | 'medium' | 'low';

export interface ReviewIssue {
  severity: ReviewIssueSeverity;
  location: string;
  message: string;
  fix?: string;
  category?: 'structure' | 'content' | 'visual' | 'accessibility' | 'interaction' | 'accuracy';
}

export interface ReviewResult {
  pass: boolean;
  score: number;
  requirements: Record<string, boolean>;
  issues: ReviewIssue[];
  summary: string;
  deterministic?: Record<string, boolean>;
  deterministicPass?: boolean;
  sceneCount?: number;
}

export interface GenerateContentResponse {
  success: true;
  jobId: string;
  message: string;
  reviewRecommended: boolean;
  reviewEndpoint: string;
  reviewStatusEndpoint: string;
}

export interface GenerateContentStatusResponse {
  jobId: string;
  status: JobStatus;
  jobType: JobType;
  moduleId?: string;
  modulePath?: string;
  files?: string[];
  error?: string;
  reviewStatus?: ReviewStatus;
  review?: ReviewResult;
  reviewError?: string;
}

export interface ReviewContentResponse {
  success: true;
  jobId: string;
  message: string;
  moduleId: string;
  statusEndpoint: string;
}

export interface ReviewContentStatusResponse {
  jobId: string;
  status: JobStatus;
  jobType: JobType;
  moduleId?: string;
  modulePath?: string;
  reviewStatus?: ReviewStatus;
  review?: ReviewResult;
  reviewError?: string;
  error?: string;
}

export type ErrorCode =
  | 'INVALID_SUBJECT'
  | 'INVALID_REQUEST'
  | 'JOB_NOT_FOUND'
  | 'MODULE_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
}

export interface Job {
  id: string;
  jobType: JobType;
  status: JobStatus;
  request: GenerateContentRequest | ReviewContentRequest;
  moduleId?: string;
  modulePath?: string;
  files?: string[];
  error?: string;
  reviewStatus?: ReviewStatus;
  review?: ReviewResult;
  reviewError?: string;
  createdAt: number;
}

// --- Admin 관련 타입 ---

export type ContentType = 'phaser' | 'threejs' | 'canvas-2d' | 'svg-animation' | 'css-animation' | 'pixel-art' | 'isometric';

export type VisualStyle = 'modern-flat' | 'pixel-art' | 'isometric' | 'hand-drawn' | 'watercolor' | 'neon-glow' | 'retro-arcade' | 'cartoon-3d' | 'minimal-clean';

export type StoryTheme = 'adventure' | 'mystery' | 'sci-fi' | 'daily-life' | 'historical' | 'fantasy' | 'sports' | 'nature';

export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced' | 'challenge';

export interface BatchGenerateRequest {
  subject: Subject;
  contentType: ContentType;
  gradeLevel: string;
  count: number;
  visualStyle?: VisualStyle;
  storyTheme?: StoryTheme;
  difficulty?: DifficultyLevel;
  useArtAssets?: boolean;
  topics?: string[];
}

export interface BatchGenerateResponse {
  batchId: string;
  jobs: Array<{
    jobId: string;
    topic: string;
    status: string;
  }>;
}

export interface AdminConfig {
  subjects: Array<{ id: Subject; label: string }>;
  contentTypes: Array<{ id: ContentType; label: string }>;
  gradeLevels: Array<{ id: string; label: string }>;
  visualStyles: Array<{ id: VisualStyle; label: string; description: string }>;
  storyThemes: Array<{ id: StoryTheme; label: string; description: string }>;
  difficultyLevels: Array<{ id: DifficultyLevel; label: string }>;
  artAssetCategories: string[];
}

export interface JobSummary {
  jobId: string;
  jobType: JobType;
  status: JobStatus;
  moduleId?: string;
  modulePath?: string;
  error?: string;
  createdAt: number;
}
