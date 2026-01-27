export type Subject = 'math' | 'english';

export interface GenerateContentRequest {
  subject: Subject;
  topic: string;
  gradeLevel: string;
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
