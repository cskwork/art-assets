export type Subject = 'math' | 'english';

export interface GenerateContentRequest {
  subject: Subject;
  topic: string;
  gradeLevel: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReviewStatus = 'pending' | 'completed' | 'failed';

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
}

export interface GenerateContentStatusResponse {
  jobId: string;
  status: JobStatus;
  moduleId?: string;
  modulePath?: string;
  files?: string[];
  error?: string;
  reviewStatus?: ReviewStatus;
  review?: ReviewResult;
  reviewError?: string;
}

export type ErrorCode =
  | 'INVALID_SUBJECT'
  | 'INVALID_REQUEST'
  | 'JOB_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
}

export interface Job {
  id: string;
  status: JobStatus;
  request: GenerateContentRequest;
  moduleId?: string;
  modulePath?: string;
  files?: string[];
  error?: string;
  reviewStatus?: ReviewStatus;
  review?: ReviewResult;
  reviewError?: string;
  createdAt: number;
}
