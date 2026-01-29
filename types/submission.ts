// =============================================
// 課題提出関連の型定義
// =============================================

// 提出物の型
export interface Submission {
  id: string;
  userId: string;
  scheduleId: string | null;
  assignmentType: 'pre' | 'post';
  assignmentTitle: string;
  
  // ファイル情報
  fileName: string | null;
  filePath: string | null;
  fileSize: number | null;
  fileType: string | null;
  
  // URLリンク情報
  urlLink: string | null;
  urlType: 'google_docs' | 'google_slides' | 'google_sheets' | 'other' | null;
  
  // メタデータ
  submittedAt: string;
  updatedAt: string;
  status: 'submitted' | 'reviewed' | 'resubmit_requested';
  adminNotes: string | null;
  
  // 関連情報（JOINで取得）
  schedule?: {
    title: string;
    lectureNumber: number | null;
    eventType: string;
  };
}

// 課題（提出対象）の型
export interface Assignment {
  id: string;
  scheduleId: string;
  type: 'pre' | 'post';
  title: string;
  description: string | null;
  deadline: string | null;
  lectureNumber: number | null;
  lectureTitle: string;
  
  // 提出状況
  submission: Submission | null;
  isSubmitted: boolean;
}

// 課題一覧のレスポンス型
export interface AssignmentsResponse {
  assignments: Assignment[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
    progressRate: number;
  };
}

// 提出履歴のレスポンス型
export interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
}

// ファイルアップロードのリクエスト型
export interface UploadSubmissionRequest {
  scheduleId: string;
  assignmentType: 'pre' | 'post';
  assignmentTitle: string;
  file?: File;
  urlLink?: string;
  urlType?: 'google_docs' | 'google_slides' | 'google_sheets' | 'other';
}

// APIレスポンス型
export interface SubmissionApiResponse {
  success: boolean;
  submission?: Submission;
  error?: string;
}

// DBから取得した生データの型
export interface SubmissionRaw {
  id: string;
  user_id: string;
  schedule_id: string | null;
  assignment_type: 'pre' | 'post';
  assignment_title: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  url_link: string | null;
  url_type: string | null;
  submitted_at: string;
  updated_at: string;
  status: 'submitted' | 'reviewed' | 'resubmit_requested';
  admin_notes: string | null;
  saa_schedules?: {
    title: string;
    lecture_number: number | null;
    event_type: string;
  };
}

// Raw → Submission 変換関数
export function mapRawToSubmission(raw: SubmissionRaw): Submission {
  return {
    id: raw.id,
    userId: raw.user_id,
    scheduleId: raw.schedule_id,
    assignmentType: raw.assignment_type,
    assignmentTitle: raw.assignment_title,
    fileName: raw.file_name,
    filePath: raw.file_path,
    fileSize: raw.file_size,
    fileType: raw.file_type,
    urlLink: raw.url_link,
    urlType: raw.url_type as Submission['urlType'],
    submittedAt: raw.submitted_at,
    updatedAt: raw.updated_at,
    status: raw.status,
    adminNotes: raw.admin_notes,
    schedule: raw.saa_schedules ? {
      title: raw.saa_schedules.title,
      lectureNumber: raw.saa_schedules.lecture_number,
      eventType: raw.saa_schedules.event_type,
    } : undefined,
  };
}

// ファイルタイプからアイコン種別を取得
export function getFileIconType(fileType: string | null, urlType: string | null): string {
  if (urlType) {
    switch (urlType) {
      case 'google_docs': return 'gdoc';
      case 'google_slides': return 'gslide';
      case 'google_sheets': return 'gsheet';
      default: return 'link';
    }
  }
  
  if (fileType) {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('ppt') || type.includes('presentation')) return 'pptx';
    if (type.includes('xls') || type.includes('sheet')) return 'xlsx';
    if (type.includes('doc') || type.includes('word')) return 'docx';
    if (type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('image')) return 'image';
  }
  
  return 'file';
}

// ファイルサイズをフォーマット
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
