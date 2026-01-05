import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // バリデーション
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    // パスワード要件チェック
    const minLength = newPassword.length >= 8;
    const maxLength = newPassword.length <= 20;
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!minLength || !maxLength || !hasLetter || !hasNumber) {
      return NextResponse.json({ 
        error: 'パスワードは半角英数を含む8〜20文字で設定してください' 
      }, { status: 400 });
    }

    // 現在のパスワードで再認証
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 });
    }

    // パスワードを更新
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'パスワードの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error in password API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
