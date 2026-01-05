import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 管理者メールアドレス
const ADMIN_EMAILS = [
  'masa@unicornfarm.co',
  'tadokoro@unicornfarm.co',
];

// Slack通知を送信
async function sendSlackNotification(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not set');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        username: '起業の科学ポータル',
        icon_emoji: ':mortar_board:',
      }),
    });
    
    if (!response.ok) {
      console.error('Slack notification failed:', response.status, await response.text());
    } else {
      console.log('Slack notification sent successfully');
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

// メール通知を送信（Supabase Edge FunctionまたはResend等を使用）
async function sendEmailNotification(
  to: string[],
  subject: string,
  body: string
) {
  // TODO: メール送信サービスとの連携
  // Resend, SendGrid, または Supabase Edge Function を使用
  console.log('Email notification:', { to, subject, body });
  
  // Resendを使用する場合の例：
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not set');
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '起業の科学ポータル <noreply@unicornfarm.co>',
        to: to,
        subject: subject,
        text: body,
      }),
    });
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batch_number } = await request.json();

    // バリデーション
    if (!batch_number || typeof batch_number !== 'number') {
      return NextResponse.json({ error: 'バッチ番号を選択してください' }, { status: 400 });
    }

    // バッチが存在するか確認
    const { data: batch, error: batchError } = await supabase
      .from('saa_batches')
      .select('batch_number, name')
      .eq('batch_number', batch_number)
      .eq('is_active', true)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: '無効なバッチ番号です' }, { status: 400 });
    }

    // 既に申請済みか確認
    const { data: existingAlumni } = await supabase
      .from('saa_alumni')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existingAlumni) {
      if (existingAlumni.status === 'pending') {
        return NextResponse.json({ error: '既に申請中です' }, { status: 400 });
      }
      if (existingAlumni.status === 'approved') {
        return NextResponse.json({ error: '既にアルムナイ認定されています' }, { status: 400 });
      }
      // rejected の場合は再申請を許可（既存レコードを更新）
      const { error: updateError } = await supabase
        .from('saa_alumni')
        .update({
          batch_number,
          status: 'pending',
          applied_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', existingAlumni.id);

      if (updateError) {
        console.error('Error updating alumni application:', updateError);
        return NextResponse.json({ error: '申請に失敗しました' }, { status: 500 });
      }
    } else {
      // 新規申請
      const { error: insertError } = await supabase
        .from('saa_alumni')
        .insert({
          user_id: user.id,
          batch_number,
          status: 'pending',
        });

      if (insertError) {
        console.error('Error inserting alumni application:', insertError);
        return NextResponse.json({ error: '申請に失敗しました' }, { status: 500 });
      }
    }

    // プロフィール情報を取得（実際のカラムのみ）
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single();

    const userName = profile?.display_name || 
      user.email?.split('@')[0] || 
      'Unknown';
    const userEmail = profile?.email || user.email || 'Unknown';

    // Slack通知
    const slackMessage = `🎓 *SAAアルムナイ申請*\n\n` +
      `*申請者:* ${userName}\n` +
      `*メール:* ${userEmail}\n` +
      `*バッチ:* ${batch.name}\n\n` +
      `管理画面で確認してください。`;
    
    await sendSlackNotification(slackMessage);

    // メール通知
    const emailSubject = `【起業の科学ポータル】SAAアルムナイ申請がありました`;
    const emailBody = `SAAアルムナイの申請がありました。\n\n` +
      `申請者: ${userName}\n` +
      `メールアドレス: ${userEmail}\n` +
      `申請バッチ: ${batch.name}\n\n` +
      `管理画面から承認/却下を行ってください。`;

    await sendEmailNotification(ADMIN_EMAILS, emailSubject, emailBody);

    return NextResponse.json({ 
      message: 'Application submitted successfully',
      status: 'pending'
    });

  } catch (error) {
    console.error('Error in alumni apply API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
