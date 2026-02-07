export type Subject = 'math' | 'english' | 'science';

export interface GenerateContentRequest {
  subject: Subject;
  topic: string;
  gradeLevel: string;
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

export type ContentType = 'phaser' | 'threejs';

export interface BatchGenerateRequest {
  subject: Subject;
  contentType: ContentType;
  gradeLevel: string;
  count: number;
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
