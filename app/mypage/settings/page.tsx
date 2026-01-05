import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // 設定ページにアクセスしたらプロフィール設定にリダイレクト
  redirect('/mypage/settings/profile');
}
