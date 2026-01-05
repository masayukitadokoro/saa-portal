'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Search, Mail, Clock, Send, CheckCircle,
  Pencil, Trash2, Copy, X, Users, Calendar, BarChart3,
  FileText, AlertCircle, Info
} from 'lucide-react';

// モックデータ
interface EmailItem {
  id: string;
  subject: string;
  recipientCount: number;
  recipients: string[];
  template: string;
  templateIcon: string;
  status: 'draft' | 'scheduled' | 'sent';
  updatedAt: string;
  scheduledAt?: string;
  sentAt?: string;
  openRate?: number;
  clickRate?: number;
  body: string;
}

const mockEmails: EmailItem[] = [
  {
    id: '1',
    subject: '【起業の科学ポータル】トライアル期間終了のお知らせ',
    recipientCount: 3,
    recipients: ['田所 雅之', '山田 太郎', '佐藤 花子'],
    template: '解約防止',
    templateIcon: '🔥',
    status: 'draft',
    updatedAt: '2026-01-01T14:30:00',
    body: `{{name}}様

いつも起業の科学ポータルをご利用いただきありがとうございます。

トライアル期間終了まで残り{{days_remaining}}日となりました。
この機会にぜひ有料会員へのアップグレードをご検討ください。

【有料会員の特典】
・全コンテンツへの無制限アクセス
・新着コンテンツの優先配信
・限定イベントへの参加権

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: '2',
    subject: '【起業の科学ポータル】新着コンテンツのお知らせ',
    recipientCount: 12,
    recipients: ['全トライアルユーザー'],
    template: '新着告知',
    templateIcon: '📚',
    status: 'draft',
    updatedAt: '2025-12-28T10:15:00',
    body: `{{name}}様

起業の科学ポータルに新しいコンテンツが追加されました。

【今週の新着】
・動画: 「PMFを達成するための5つのステップ」
・記事: 「スタートアップの資金調達戦略」

ぜひご覧ください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: '3',
    subject: '【起業の科学ポータル】SAAアルムナイ特典のご案内',
    recipientCount: 5,
    recipients: ['SAAアルムナイ'],
    template: 'SAA特典',
    templateIcon: '🎓',
    status: 'draft',
    updatedAt: '2025-12-25T09:00:00',
    body: `{{name}}様

SAAアルムナイとしてご登録いただきありがとうございます。

アルムナイ限定の特典をご案内いたします。

【アルムナイ特典】
・3ヶ月間の無料アクセス
・アルムナイ限定コンテンツ

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: '4',
    subject: '【起業の科学ポータル】新年のご挨拶',
    recipientCount: 150,
    recipients: ['全ユーザー'],
    template: 'カスタム',
    templateIcon: '✨',
    status: 'scheduled',
    updatedAt: '2025-12-30T18:00:00',
    scheduledAt: '2026-01-01T00:00:00',
    body: `{{name}}様

新年あけましておめでとうございます。

本年も起業の科学ポータルをよろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: '5',
    subject: '【起業の科学ポータル】12月の新着まとめ',
    recipientCount: 45,
    recipients: ['有料会員'],
    template: '新着告知',
    templateIcon: '📚',
    status: 'sent',
    updatedAt: '2025-12-31T10:00:00',
    sentAt: '2025-12-31T10:00:00',
    openRate: 62,
    clickRate: 23,
    body: `{{name}}様

12月の新着コンテンツをまとめてお届けします。

【12月の人気コンテンツTOP3】
1. PMFを達成するための5つのステップ
2. スタートアップの資金調達戦略
3. LayerXの成長戦略分析

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: '6',
    subject: '【起業の科学ポータル】年末のご挨拶',
    recipientCount: 120,
    recipients: ['全ユーザー'],
    template: 'カスタム',
    templateIcon: '✨',
    status: 'sent',
    updatedAt: '2025-12-28T09:00:00',
    sentAt: '2025-12-28T09:00:00',
    openRate: 78,
    clickRate: 35,
    body: `{{name}}様

年末のご挨拶を申し上げます。

本年も起業の科学ポータルをご利用いただき、
誠にありがとうございました。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`
  },
];

// 確認ダイアログ
function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'はい',
  cancelText = 'いいえ',
  confirmColor = 'blue'
}: { 
  isOpen: boolean; 
  title: string; 
  message: React.ReactNode; 
  onConfirm: () => void; 
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'blue' | 'red';
}) {
  if (!isOpen) return null;
  
  const colorClasses = confirmColor === 'red' 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-blue-600 hover:bg-blue-700';
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="text-gray-600 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg ${colorClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// 成功ダイアログ
function SuccessDialog({ 
  isOpen, 
  message, 
  onClose 
}: { 
  isOpen: boolean; 
  message: string; 
  onClose: () => void;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

export default function EmailManagementPage() {
  const [emails, setEmails] = useState<EmailItem[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(mockEmails[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ダイアログ状態
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    confirmColor: 'blue' | 'red';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'はい',
    confirmColor: 'blue',
    action: () => {}
  });
  
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });

  // フィルタリング
  const filteredEmails = emails.filter(email => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!email.subject.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  // ステータス別にグループ化
  const draftEmails = filteredEmails.filter(e => e.status === 'draft');
  const scheduledEmails = filteredEmails.filter(e => e.status === 'scheduled');
  const sentEmails = filteredEmails.filter(e => e.status === 'sent');

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // アクション: 削除
  const handleDelete = (email: EmailItem) => {
    setConfirmDialog({
      isOpen: true,
      title: '下書きを削除しますか？',
      message: (
        <div>
          <p className="mb-2">この下書きを削除します。この操作は取り消せません。</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-medium truncate">{email.subject}</div>
          </div>
        </div>
      ),
      confirmText: '削除する',
      confirmColor: 'red',
      action: () => {
        setEmails(emails.filter(e => e.id !== email.id));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(null);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setSuccessDialog({ isOpen: true, message: '下書きを削除しました' });
      }
    });
  };

  // アクション: 送信
  const handleSend = (email: EmailItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'メールを送信しますか？',
      message: (
        <div>
          <p className="mb-2">以下の内容でメールを送信します。</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div><span className="text-gray-500">件名:</span> {email.subject}</div>
            <div><span className="text-gray-500">宛先:</span> {email.recipientCount}人</div>
          </div>
        </div>
      ),
      confirmText: 'はい、送信する',
      confirmColor: 'blue',
      action: () => {
        const updatedEmails = emails.map(e => 
          e.id === email.id 
            ? { ...e, status: 'sent' as const, sentAt: new Date().toISOString(), openRate: 0, clickRate: 0 }
            : e
        );
        setEmails(updatedEmails);
        const updatedEmail = updatedEmails.find(e => e.id === email.id);
        if (updatedEmail) setSelectedEmail(updatedEmail);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setSuccessDialog({ isOpen: true, message: 'メールを送信しました' });
      }
    });
  };

  // アクション: 複製
  const handleDuplicate = (email: EmailItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'メールを複製しますか？',
      message: (
        <div>
          <p className="mb-2">このメールを下書きとして複製します。</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-medium truncate">{email.subject}</div>
          </div>
        </div>
      ),
      confirmText: 'はい、複製する',
      confirmColor: 'blue',
      action: () => {
        const newEmail: EmailItem = {
          ...email,
          id: Date.now().toString(),
          subject: `${email.subject} (コピー)`,
          status: 'draft',
          updatedAt: new Date().toISOString(),
          sentAt: undefined,
          openRate: undefined,
          clickRate: undefined
        };
        setEmails([newEmail, ...emails]);
        setSelectedEmail(newEmail);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setSuccessDialog({ isOpen: true, message: '下書きとして複製しました' });
      }
    });
  };

  // アクション: 予約キャンセル
  const handleCancelSchedule = (email: EmailItem) => {
    setConfirmDialog({
      isOpen: true,
      title: '予約をキャンセルしますか？',
      message: (
        <div>
          <p className="mb-2">このメールの予約送信をキャンセルし、下書きに戻します。</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div><span className="text-gray-500">件名:</span> {email.subject}</div>
            <div><span className="text-gray-500">予約日時:</span> {email.scheduledAt && formatDate(email.scheduledAt)}</div>
          </div>
        </div>
      ),
      confirmText: 'はい、キャンセルする',
      confirmColor: 'red',
      action: () => {
        const updatedEmails = emails.map(e => 
          e.id === email.id 
            ? { ...e, status: 'draft' as const, scheduledAt: undefined }
            : e
        );
        setEmails(updatedEmails);
        const updatedEmail = updatedEmails.find(e => e.id === email.id);
        if (updatedEmail) setSelectedEmail(updatedEmail);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setSuccessDialog({ isOpen: true, message: '予約をキャンセルしました' });
      }
    });
  };

  // メールアイテムのレンダリング
  const renderEmailItem = (email: EmailItem) => {
    const isSelected = selectedEmail?.id === email.id;
    
    return (
      <button
        key={email.id}
        onClick={() => setSelectedEmail(email)}
        className={`w-full text-left p-3 border-b hover:bg-gray-50 transition ${
          isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg">{email.templateIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{email.subject}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {email.recipientCount}人
              </span>
              <span>•</span>
              <span>{formatDate(email.updatedAt)}</span>
              {email.status === 'sent' && email.openRate !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-green-600">✓{email.openRate}%</span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/users" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">ユーザー管理に戻る</span>
            </Link>
            <h1 className="text-xl font-bold">メール管理</h1>
          </div>
          <Link href="/admin/email/compose" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" /> 新規メール作成</Link>
        </div>
      </div>

      {/* 新規メール作成の案内 */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <span className="font-medium">新規メール作成について：</span>
            <span className="ml-1">ユーザー管理画面でユーザーを選択してから「新規メール作成」を押してください。</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex h-[calc(100vh-160px)] bg-white rounded-lg border overflow-hidden">
          {/* 左サイドバー */}
          <div className="w-80 border-r flex flex-col">
            {/* 検索 */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* メールリスト */}
            <div className="flex-1 overflow-y-auto">
              {/* 下書き */}
              {draftEmails.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2 sticky top-0">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm text-gray-700">下書き</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {draftEmails.length}
                    </span>
                  </div>
                  {draftEmails.map(renderEmailItem)}
                </div>
              )}

              {/* 予約済み */}
              {scheduledEmails.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2 sticky top-0">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm text-gray-700">予約済み</span>
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                      {scheduledEmails.length}
                    </span>
                  </div>
                  {scheduledEmails.map(renderEmailItem)}
                </div>
              )}

              {/* 送信済み */}
              {sentEmails.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2 sticky top-0">
                    <Send className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm text-gray-700">送信済み</span>
                    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                      {sentEmails.length}
                    </span>
                  </div>
                  {sentEmails.map(renderEmailItem)}
                </div>
              )}

              {filteredEmails.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>メールがありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 右プレビュー */}
          <div className="flex-1 overflow-y-auto">
            {selectedEmail ? (
              <div className="p-6">
                {/* ステータスバッジ */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {selectedEmail.status === 'draft' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" /> 下書き
                      </span>
                    )}
                    {selectedEmail.status === 'scheduled' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 予約済み
                      </span>
                    )}
                    {selectedEmail.status === 'sent' && (
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> 送信済み
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {selectedEmail.templateIcon} {selectedEmail.template}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    更新: {formatDate(selectedEmail.updatedAt)}
                  </div>
                </div>

                {/* メタ情報 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">宛先:</span>
                    <span>{selectedEmail.recipientCount}人（{selectedEmail.recipients.join(', ')}）</span>
                  </div>
                  {selectedEmail.scheduledAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">送信予定:</span>
                      <span>{formatDate(selectedEmail.scheduledAt)}</span>
                    </div>
                  )}
                  {selectedEmail.sentAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Send className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">送信日時:</span>
                      <span>{formatDate(selectedEmail.sentAt)}</span>
                    </div>
                  )}
                  {selectedEmail.status === 'sent' && (
                    <div className="flex items-center gap-4 text-sm pt-2 border-t mt-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">開封率:</span>
                        <span className="font-medium text-green-600">{selectedEmail.openRate}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">クリック率:</span>
                        <span className="font-medium text-blue-600">{selectedEmail.clickRate}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* メールプレビュー */}
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="text-sm">
                      <span className="text-gray-500">Subject:</span>{' '}
                      <span className="font-medium">{selectedEmail.subject}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {selectedEmail.body}
                    </pre>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex items-center gap-3">
                  {selectedEmail.status === 'draft' && (
                    <>
                      <Link
                        href={`/admin/email/compose?draftId=${selectedEmail.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" /> 編集
                      </Link>
                      <button
                        onClick={() => handleSend(selectedEmail)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> 送信
                      </button>
                      <button
                        onClick={() => handleDelete(selectedEmail)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> 削除
                      </button>
                    </>
                  )}
                  {selectedEmail.status === 'scheduled' && (
                    <>
                      <Link
                        href={`/admin/email/compose?draftId=${selectedEmail.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" /> 編集
                      </Link>
                      <button
                        onClick={() => handleCancelSchedule(selectedEmail)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> 予約キャンセル
                      </button>
                    </>
                  )}
                  {selectedEmail.status === 'sent' && (
                    <>
                      <button
                        onClick={() => handleDuplicate(selectedEmail)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" /> 複製して新規作成
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>メールを選択してください</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
      />

      {/* 成功ダイアログ */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
}
