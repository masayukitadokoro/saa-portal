// /types/assignment.ts

export type AssignmentType = 'pre' | 'post';
export type SubmissionStatus = 'submitted' | 'not_submitted' | 'overdue';

export interface Assignment {
  id: string;
  schedule_id: string;
  schedule_title: string;
  schedule_date: string;
  title: string;
  description: string | null;
  is_required: boolean;
  deadline: string | null;
  folder_url: string | null;
  type: AssignmentType;
}

export interface AssignmentSubmission {
  id: string;
  user_id: string;
  schedule_id: string;
  assignment_type: AssignmentType;
  submitted_at: string;
  notes: string | null;
  created_at: string;
}

export interface AssignmentWithStatus extends Assignment {
  submission_status: SubmissionStatus;
  latest_submission: AssignmentSubmission | null;
  submission_count: number;
}

export interface ScheduleAssignmentGroup {
  schedule_id: string;
  schedule_title: string;
  schedule_date: string;
  event_type: string;
  assignments: AssignmentWithStatus[];
}

export interface AssignmentsResponse {
  assignments: AssignmentWithStatus[];
  grouped: ScheduleAssignmentGroup[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
    overdue: number;
  };
}

export interface SubmitAssignmentRequest {
  submitted_at?: string;
  notes?: string;
}

export interface SubmitAssignmentResponse {
  success: boolean;
  submission: AssignmentSubmission;
}

export interface SubmissionHistoryResponse {
  submissions: AssignmentSubmission[];
}

export function getSubmissionStatus(
  submission: AssignmentSubmission | null,
  deadline: string | null
): SubmissionStatus {
  if (submission) return 'submitted';
  if (deadline && new Date(deadline) < new Date()) return 'overdue';
  return 'not_submitted';
}

export function getStatusDisplay(status: SubmissionStatus): {
  icon: string;
  color: string;
  label: string;
} {
  switch (status) {
    case 'submitted':
      return { icon: '✅', color: 'text-green-600', label: '提出済み' };
    case 'overdue':
      return { icon: '🔴', color: 'text-red-600', label: '期限超過' };
    case 'not_submitted':
    default:
      return { icon: '⏳', color: 'text-amber-600', label: '未提出' };
  }
}
