import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { SubmissionRaw, mapRawToSubmission } from '@/types/submission';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ファイル提出
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const scheduleId = formData.get('scheduleId') as string;
    const assignmentType = formData.get('assignmentType') as 'pre' | 'post';
    const assignmentTitle = formData.get('assignmentTitle') as string;
    const file = formData.get('file') as File | null;
    const urlLink = formData.get('urlLink') as string | null;
    const urlType = formData.get('urlType') as string | null;

    if (!scheduleId || !assignmentType || !assignmentTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!file && !urlLink) {
      return NextResponse.json({ error: 'File or URL is required' }, { status: 400 });
    }

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let fileType: string | null = null;

    // ファイルアップロード処理
    if (file) {
      fileName = file.name;
      fileSize = file.size;
      fileType = file.name.split('.').pop()?.toLowerCase() || null;

      // ファイルパスを生成: {userId}/{scheduleId}_{assignmentType}_{timestamp}_{filename}
      const timestamp = Date.now();
      // ファイル名をサニタイズ（日本語・特殊文字をエンコード）
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      filePath = `${user.id}/${scheduleId}_${assignmentType}_${timestamp}_${sanitizedFileName}`;

      // Supabase Storageにアップロード
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabaseAdmin.storage
        .from('submissions')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }
    }

    // 提出レコードを作成
    const { data: submission, error: insertError } = await supabaseAdmin
      .from('saa_submissions')
      .insert({
        user_id: user.id,
        schedule_id: scheduleId,
        assignment_type: assignmentType,
        assignment_title: assignmentTitle,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        file_type: fileType,
        url_link: urlLink || null,
        url_type: urlLink ? (urlType || 'other') : null,
        status: 'submitted',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // アップロードしたファイルを削除（ロールバック）
      if (filePath) {
        await supabaseAdmin.storage.from('submissions').remove([filePath]);
      }
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submission: mapRawToSubmission(submission as SubmissionRaw),
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 提出物の詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: submission, error } = await supabaseAdmin
      .from('saa_submissions')
      .select(`
        *,
        saa_schedules (
          title,
          lecture_number,
          event_type
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // ファイルURLを生成（署名付きURL）
    let fileUrl: string | null = null;
    if (submission.file_path) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('submissions')
        .createSignedUrl(submission.file_path, 3600); // 1時間有効
      fileUrl = signedUrlData?.signedUrl || null;
    }

    return NextResponse.json({
      submission: mapRawToSubmission(submission as SubmissionRaw),
      fileUrl,
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 提出物の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 提出物を取得
    const { data: submission } = await supabaseAdmin
      .from('saa_submissions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // ファイルがあれば削除
    if (submission.file_path) {
      await supabaseAdmin.storage.from('submissions').remove([submission.file_path]);
    }

    // レコードを削除
    const { error: deleteError } = await supabaseAdmin
      .from('saa_submissions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
