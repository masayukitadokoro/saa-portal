/**
 * SCM データベース設計 & API定義
 * 
 * 原則2: SELECT文は共通定義から組み立てる
 * 原則4: データベース設計は「将来の変更」を想定する
 * 原則6: 既存資産を最大限活用する
 */

// ========================================
// データベーステーブル設計
// ========================================

/**
 * scm_results テーブル
 * 
 * 設計チェックリスト:
 * ✓ 将来の質問追加に対応（answers は JSONB で柔軟に）
 * ✓ 複数回受験に対応（user_id + taken_at で一意）
 * ✓ カテゴリスコアはJSONBで保存（カテゴリ追加に柔軟）
 * ✓ AI分析結果も保存可能（ai_analysis カラム）
 */
export const SCM_RESULTS_TABLE = `
CREATE TABLE IF NOT EXISTS scm_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- スコア（計算済み）
  total_score INTEGER NOT NULL,
  total_percentage INTEGER NOT NULL,
  
  -- カテゴリ別スコア（JSONB）
  category_scores JSONB NOT NULL,
  -- 例: {"foundation": {"score": 45, "percentage": 65}, "pmf": {...}}
  
  -- 全回答（JSONB）
  answers JSONB NOT NULL,
  -- 例: [{"questionId": 1, "score": 4}, {"questionId": 2, "score": 5}, ...]
  
  -- 強み・弱み
  strengths TEXT[] NOT NULL,  -- カテゴリID配列
  weaknesses TEXT[] NOT NULL,
  
  -- AI分析（Phase 2で使用）
  ai_analysis JSONB,
  -- 例: {"summary": "...", "recommendations": [...], "learningPath": [...]}
  
  -- メタデータ
  version VARCHAR(10) DEFAULT 'v3.0',  -- SCMバージョン
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- インデックス
  CONSTRAINT unique_user_result UNIQUE (user_id, taken_at)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_scm_results_user_id ON scm_results(user_id);
CREATE INDEX IF NOT EXISTS idx_scm_results_taken_at ON scm_results(taken_at DESC);
`;

// ========================================
// API レスポンス型（原則2: 共通定義）
// ========================================

import type { SCMAnswer, SCMCategoryScore, SCMResult } from './scm';

// API レスポンス型
export interface SCMResultResponse {
  success: boolean;
  data?: SCMResult;
  error?: string;
}

export interface SCMResultsListResponse {
  success: boolean;
  data?: SCMResult[];
  error?: string;
}

// API リクエスト型
export interface SubmitSCMRequest {
  answers: SCMAnswer[];
}

// ========================================
// SELECT文の共通定義（原則2）
// ========================================

export const SCM_SELECT_COLUMNS = `
  id,
  user_id,
  total_score,
  total_percentage,
  category_scores,
  answers,
  strengths,
  weaknesses,
  ai_analysis,
  version,
  taken_at,
  created_at
`;

export const SCM_SELECT_BASE = `
  SELECT ${SCM_SELECT_COLUMNS}
  FROM scm_results
`;

export const SCM_QUERIES = {
  // 最新の結果を取得
  getLatest: `
    ${SCM_SELECT_BASE}
    WHERE user_id = $1
    ORDER BY taken_at DESC
    LIMIT 1
  `,
  
  // 全履歴を取得
  getHistory: `
    ${SCM_SELECT_BASE}
    WHERE user_id = $1
    ORDER BY taken_at DESC
  `,
  
  // 特定の結果を取得
  getById: `
    ${SCM_SELECT_BASE}
    WHERE id = $1 AND user_id = $2
  `,
  
  // 受験回数を取得
  getCount: `
    SELECT COUNT(*) as count
    FROM scm_results
    WHERE user_id = $1
  `,
  
  // 結果を保存
  insert: `
    INSERT INTO scm_results (
      user_id,
      total_score,
      total_percentage,
      category_scores,
      answers,
      strengths,
      weaknesses,
      version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${SCM_SELECT_COLUMNS}
  `,
} as const;

// ========================================
// DBレコードから型への変換（原則2）
// ========================================

interface SCMResultRow {
  id: string;
  user_id: string;
  total_score: number;
  total_percentage: number;
  category_scores: Record<string, { score: number; percentage: number }>;
  answers: SCMAnswer[];
  strengths: string[];
  weaknesses: string[];
  ai_analysis: unknown;
  version: string;
  taken_at: string;
  created_at: string;
}

export function dbRowToSCMResult(row: SCMResultRow): SCMResult {
  // category_scores を配列形式に変換
  const categoryScores: SCMCategoryScore[] = Object.entries(row.category_scores).map(
    ([categoryId, data]) => ({
      categoryId: categoryId as SCMCategoryScore['categoryId'],
      totalScore: data.score,
      maxScore: 0, // 必要に応じて計算
      percentage: data.percentage,
      questionCount: 0, // 必要に応じて計算
    })
  );

  return {
    id: row.id,
    userId: row.user_id,
    totalScore: row.total_score,
    totalPercentage: row.total_percentage,
    categoryScores,
    answers: row.answers,
    strengths: row.strengths as SCMResult['strengths'],
    weaknesses: row.weaknesses as SCMResult['weaknesses'],
    takenAt: row.taken_at,
  };
}
