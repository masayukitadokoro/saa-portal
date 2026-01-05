import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newEmail } = await request.json();

    // バリデーション
    if (!newEmail) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 });
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }

    // 現在のメールアドレスと同じかチェック
    if (newEmail === user.email) {
      return NextResponse.json({ error: '現在と同じメールアドレスです' }, { status: 400 });
    }

    // Supabase Auth でメールアドレス変更をリクエスト
    // これにより、新しいメールアドレスに確認メールが送信される
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) {
      console.error('Error updating email:', updateError);
      
      // すでに使用されているメールアドレスの場合
      if (updateError.message.includes('already registered')) {
        return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'メールアドレスの変更に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Verification email sent',
      detail: '確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。'
    });

  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
