// /app/api/student/assignments/[id]/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ファイルアップロード + 提出記録作成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [scheduleId, assignmentType] = id.split('_');
    
    if (!scheduleId || !['pre', 'post'].includes(assignmentType)) {
      return NextResponse.json({ error: '無効な課題IDです' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // profiles.idを取得（saa_submission_recordsのforeign keyはprofiles.idを参照）
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('プロフィール取得エラー:', profileError);
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
    }

    // スケジュール情報を取得
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('saa_schedules')
      .select('id, title, pre_assignment_title, post_assignment_title')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'スケジュールが見つかりません' }, { status: 404 });
    }

    // FormDataかJSONかを判定
    const contentType = request.headers.get('content-type') || '';
    
    let submissionData: {
      file_name?: string;
      file_path?: string;
      file_size?: number;
      file_type?: string;
      url_link?: string;
      url_type?: string;
      notes?: string;
    } = {};

    if (contentType.includes('multipart/form-data')) {
      // ファイルアップロードの場合
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const notes = formData.get('notes') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 });
      }

      // ファイルサイズチェック (50MB)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'ファイルサイズは50MB以下にしてください' }, { status: 400 });
      }

      // 許可されたファイル形式チェック
      const allowedTypes = ['pdf', 'pptx', 'ppt', 'xlsx', 'xls', 'docx', 'doc', 'png', 'jpg', 'jpeg'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        return NextResponse.json({ 
          error: `許可されていないファイル形式です。対応形式: ${allowedTypes.join(', ')}` 
        }, { status: 400 });
      }

      // ファイルパスを生成
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `submissions/${user.id}/${scheduleId}/${assignmentType}/${timestamp}_${sanitizedFileName}`;

      // Supabase Storageにアップロード
      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabaseAdmin.storage
        .from('assignments')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('ファイルアップロードエラー:', uploadError);
        return NextResponse.json({ error: 'ファイルのアップロードに失敗しました' }, { status: 500 });
      }

      submissionData = {
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileExt,
        notes: notes || undefined,
      };
    } else {
      // URL提出の場合
      const body = await request.json().catch(() => ({}));
      
      if (body.url_link) {
        // URL種別を判定
        let urlType = 'other';
        if (body.url_link.includes('docs.google.com/presentation')) urlType = 'google_slides';
        else if (body.url_link.includes('docs.google.com/document')) urlType = 'google_docs';
        else if (body.url_link.includes('docs.google.com/spreadsheets')) urlType = 'google_sheets';
        else if (body.url_link.includes('drive.google.com')) urlType = 'google_drive';

        submissionData = {
          url_link: body.url_link,
          url_type: urlType,
          notes: body.notes || undefined,
        };
      } else {
        return NextResponse.json({ error: 'ファイルまたはURLが必要です' }, { status: 400 });
      }
    }

    // 提出記録を作成
    const { data: submission, error: insertError } = await supabaseAdmin
      .from('saa_submission_records')
      .insert({
        user_id: profile.id,  // profiles.idを使用
        schedule_id: scheduleId,
        assignment_type: assignmentType,
        ...submissionData,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select()
      .single();

    if (insertError) {
      console.error('提出記録作成エラー:', insertError);
      return NextResponse.json({ error: '提出記録の作成に失敗しました' }, { status: 500 });
    }

    // ファイルの公開URLを生成（ファイル提出の場合）
    let fileUrl = null;
    if (submissionData.file_path) {
      const { data: urlData } = supabaseAdmin.storage
        .from('assignments')
        .getPublicUrl(submissionData.file_path);
      fileUrl = urlData.publicUrl;
    }

    return NextResponse.json({ 
      success: true, 
      submission: {
        ...submission,
        file_url: fileUrl,
      }
    });

  } catch (error) {
    console.error('提出記録APIエラー:', error);
    return NextResponse.json({ error: '提出記録の作成に失敗しました' }, { status: 500 });
  }
}

// 提出履歴取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [scheduleId, assignmentType] = id.split('_');
    
    if (!scheduleId || !['pre', 'post'].includes(assignmentType)) {
      return NextResponse.json({ error: '無効な課題IDです' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // profiles.idを取得
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
    }

    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('saa_submission_records')
      .select('*')
      .eq('user_id', profile.id)  // profiles.idを使用
      .eq('schedule_id', scheduleId)
      .eq('assignment_type', assignmentType)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('提出履歴取得エラー:', submissionsError);
      return NextResponse.json({ error: '提出履歴の取得に失敗しました' }, { status: 500 });
    }

    // 各ファイルの公開URLを生成
    const submissionsWithUrls = (submissions || []).map(sub => {
      let fileUrl = null;
      if (sub.file_path) {
        const { data: urlData } = supabaseAdmin.storage
          .from('assignments')
          .getPublicUrl(sub.file_path);
        fileUrl = urlData.publicUrl;
      }
      return {
        ...sub,
        file_url: fileUrl,
      };
    });

    return NextResponse.json({ submissions: submissionsWithUrls });

  } catch (error) {
    console.error('提出履歴APIエラー:', error);
    return NextResponse.json({ error: '提出履歴の取得に失敗しました' }, { status: 500 });
  }
}

// 提出削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // profiles.idを取得
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
    }

    // URLパラメータから提出IDを取得
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: '提出IDが必要です' }, { status: 400 });
    }

    // 提出記録を取得
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('saa_submission_records')
      .select('*')
      .eq('id', submissionId)
      .eq('user_id', profile.id)  // profiles.idを使用
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: '提出記録が見つかりません' }, { status: 404 });
    }

    // ファイルがある場合はStorageからも削除
    if (submission.file_path) {
      const { error: deleteFileError } = await supabaseAdmin.storage
        .from('assignments')
        .remove([submission.file_path]);

      if (deleteFileError) {
        console.error('ファイル削除エラー:', deleteFileError);
        // ファイル削除に失敗してもレコード削除は続行
      }
    }

    // 提出記録を削除
    const { error: deleteError } = await supabaseAdmin
      .from('saa_submission_records')
      .delete()
      .eq('id', submissionId)
      .eq('user_id', profile.id);  // profiles.idを使用

    if (deleteError) {
      console.error('提出記録削除エラー:', deleteError);
      return NextResponse.json({ error: '提出記録の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('提出削除APIエラー:', error);
    return NextResponse.json({ error: '提出記録の削除に失敗しました' }, { status: 500 });
  }
}
