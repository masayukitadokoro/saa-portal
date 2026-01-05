'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Mail, Sparkles, Clock, Send, 
  ChevronDown, X, Loader2, Save, Eye, CheckCircle,
  Target, Smile, FileText, Gift, RefreshCw, Pencil
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  plan_type: string;
  trial_ends_at: string;
  is_super_user: boolean;
  engagementScore: number | null;
  churnRisk: 'low' | 'medium' | 'high' | null;
}

interface Template {
  id: string;
  name: string;
  icon: string;
  description: string;
  subject: string;
  body: string;
}

// 確認ダイアログ
function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'はい',
  cancelText = 'いいえ',
  isLoading = false
}: { 
  isOpen: boolean; 
  title: string; 
  message: React.ReactNode; 
  onConfirm: () => void; 
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="text-gray-600 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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
  title,
  message, 
  onClose,
  buttonText = '閉じる'
}: { 
  isOpen: boolean; 
  title?: string;
  message: string; 
  onClose: () => void;
  buttonText?: string;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

const templates: Template[] = [
  {
    id: 'churn_prevention',
    name: '解約防止',
    icon: '🔥',
    description: 'トライアル終了間近のユーザーへ',
    subject: '【起業の科学ポータル】トライアル期間終了のお知らせ',
    body: `{{name}}様

いつも起業の科学ポータルをご利用いただきありがとうございます。

トライアル期間終了まで残り{{days_remaining}}日となりました。
この機会にぜひ有料会員へのアップグレードをご検討ください。

【有料会員の特典】
・全コンテンツへの無制限アクセス
・新着コンテンツの優先配信
・限定イベントへの参加権
・コミュニティへのアクセス

ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: 'saa_benefits',
    name: 'SAA特典',
    icon: '🎓',
    description: 'アルムナイ向け特典案内',
    subject: '【起業の科学ポータル】SAAアルムナイ特典のご案内',
    body: `{{name}}様

SAAアルムナイとしてご登録いただきありがとうございます。

アルムナイ限定の特典をご案内いたします。

【アルムナイ特典】
・3ヶ月間の無料アクセス
・アルムナイ限定コンテンツ
・コミュニティイベントへの優先参加
・1on1メンタリングの割引

ぜひこの機会にポータルをご活用ください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: 'new_content',
    name: '新着告知',
    icon: '📚',
    description: '新しいコンテンツのお知らせ',
    subject: '【起業の科学ポータル】新着コンテンツのお知らせ',
    body: `{{name}}様

起業の科学ポータルに新しいコンテンツが追加されました。

【今週の新着】
・動画: 「PMFを達成するための5つのステップ」
・記事: 「スタートアップの資金調達戦略」
・ケーススタディ: 「LayerXの成長戦略分析」

ぜひご覧ください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`
  },
  {
    id: 'custom',
    name: 'ゼロから',
    icon: '✨',
    description: 'AIでゼロから生成',
    subject: '',
    body: ''
  }
];

// 調整タイプの定義
const adjustmentTypes = [
  { id: 'urgent', label: '緊急感を出す', icon: Target, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
  { id: 'casual', label: 'カジュアルに', icon: Smile, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
  { id: 'formal', label: '丁寧に', icon: FileText, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
  { id: 'benefits', label: '特典を強調', icon: Gift, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
];

function EmailComposeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userIdsParam = searchParams.get('userIds');
  
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('churn_prevention');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [sendTiming, setSendTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAdjustment, setLastAdjustment] = useState<string | null>(null);
  
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  
  // ダイアログ状態
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    nextAction: 'users' | 'emails';
  }>({ isOpen: false, title: '', message: '', nextAction: 'users' });
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      if (!userIdsParam) {
        setIsLoadingUsers(false);
        return;
      }
      
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          const userIds = userIdsParam.split(',');
          const users = data.users.filter((u: User) => userIds.includes(u.id));
          setSelectedUsers(users);
          if (users.length > 0) {
            setPreviewUser(users[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [userIdsParam]);

  // テンプレート選択時に内容を反映
  useEffect(() => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template && template.id !== 'custom') {
      setSubject(template.subject);
      setBody(template.body);
      setLastAdjustment(null);
    } else if (template?.id === 'custom') {
      setSubject('');
      setBody('');
    }
  }, [selectedTemplate]);

  const getDaysRemaining = (trialEndsAt: string) => {
    const now = new Date();
    const end = new Date(trialEndsAt);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const replaceVariables = (text: string, user: User) => {
    return text
      .replace(/\{\{name\}\}/g, user.display_name || 'お客様')
      .replace(/\{\{email\}\}/g, user.email)
      .replace(/\{\{days_remaining\}\}/g, String(getDaysRemaining(user.trial_ends_at)))
      .replace(/\{\{plan\}\}/g, user.plan_type === 'trial' ? 'トライアル' : '有料');
  };

  // ワンクリック調整
  const handleQuickAdjust = async (adjustmentId: string) => {
    setIsGenerating(true);
    setLastAdjustment(adjustmentId);
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const currentTemplate = templates.find(t => t.id === selectedTemplate);
    let newSubject = subject || currentTemplate?.subject || '';
    let newBody = body || currentTemplate?.body || '';
    
    switch (adjustmentId) {
      case 'urgent':
        newSubject = newSubject.replace('のお知らせ', '【重要】残りわずか！');
        newBody = `{{name}}様

【重要なお知らせ】

トライアル期間終了まで、あと{{days_remaining}}日です！

この期間を過ぎると、すべてのコンテンツにアクセスできなくなります。
今すぐ有料会員にアップグレードして、学びを継続しましょう。

▼ 今すぐアップグレード
https://portal.example.com/upgrade

【有料会員の特典】
・全300本以上の動画が見放題
・限定コミュニティへのアクセス
・月1回のオンラインイベント参加権

お見逃しなく！

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`;
        break;
        
      case 'casual':
        newSubject = `あと{{days_remaining}}日！起業の科学ポータルからのお知らせ 👋`;
        newBody = `{{name}}さん、こんにちは！

起業の科学ポータルをご利用いただきありがとうございます 🙏

トライアル期間があと{{days_remaining}}日で終了します。

もしポータルが役に立っているなら、ぜひ有料会員への切り替えをご検討ください！

有料会員になると...
✨ 全コンテンツが見放題に
✨ 限定コミュニティに参加できる
✨ 毎月のイベントに参加できる

わからないことがあれば、いつでも聞いてくださいね！

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`;
        break;
        
      case 'formal':
        newSubject = '【起業の科学ポータル】トライアル期間終了に関するご案内';
        newBody = `{{name}}様

平素より起業の科学ポータルをご利用いただき、誠にありがとうございます。

さて、ご利用いただいておりますトライアル期間が、{{days_remaining}}日後に終了いたします。

つきましては、引き続きサービスをご利用いただける有料会員プランへのお切り替えをご検討いただけますと幸いです。

【有料会員プランの特典】
・全コンテンツへの無制限アクセス
・新着コンテンツの優先配信
・限定イベントへのご招待
・会員専用コミュニティへのアクセス

ご不明な点がございましたら、お気軽にお問い合わせくださいませ。

今後とも起業の科学ポータルをよろしくお願い申し上げます。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル運営事務局
━━━━━━━━━━━━━━━━━━━━━━`;
        break;
        
      case 'benefits':
        newSubject = '【起業の科学ポータル】有料会員の特典をご紹介 🎁';
        newBody = `{{name}}様

起業の科学ポータルをご利用いただきありがとうございます。

トライアル期間終了まで残り{{days_remaining}}日となりました。
この機会に、有料会員になるとどんな特典があるかご紹介させてください！

━━━━━━━━━━━━━━━━━━━━━━
🎁 有料会員だけの5つの特典
━━━━━━━━━━━━━━━━━━━━━━

【特典1】全300本以上の動画が見放題
PMF達成、資金調達、チームビルディングなど、
起業に必要な知識を網羅した動画コンテンツにアクセスできます。

【特典2】限定コミュニティ
同じ志を持つ起業家仲間とつながれる
Slackコミュニティにご招待します。

【特典3】月1回のオンラインイベント
田所雅之による最新トレンド解説や
Q&Aセッションに参加できます。

【特典4】新着コンテンツの優先配信
新しい動画や記事をいち早くお届けします。

【特典5】1on1メンタリング割引
有料会員限定で、メンタリングを特別価格でご提供します。

━━━━━━━━━━━━━━━━━━━━━━

▼ 今すぐ有料会員になる
https://portal.example.com/upgrade

ご質問があれば、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`;
        break;
    }
    
    setSubject(newSubject);
    setBody(newBody);
    setIsGenerating(false);
  };

  // カスタム指示での生成
  const handleCustomGenerate = async () => {
    if (!customPrompt.trim()) return;
    
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newSubject = `【起業の科学ポータル】${customPrompt.slice(0, 15)}...`;
    const newBody = `{{name}}様

いつも起業の科学ポータルをご利用いただきありがとうございます。

${customPrompt}

【ご案内】
トライアル期間は残り{{days_remaining}}日です。
ぜひこの機会に有料会員へのアップグレードをご検討ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`;

    setSubject(newSubject);
    setBody(newBody);
    setIsGenerating(false);
    setCustomPrompt('');
    setLastAdjustment('custom');
  };

  // テンプレートに戻す
  const handleResetToTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setLastAdjustment(null);
    }
  };

  const removeUser = (userId: string) => {
    const newUsers = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newUsers);
    if (previewUser?.id === userId && newUsers.length > 0) {
      setPreviewUser(newUsers[0]);
    }
  };

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case 'high': return <span className="text-xs text-red-600">🔴高</span>;
      case 'medium': return <span className="text-xs text-yellow-600">🟡中</span>;
      case 'low': return <span className="text-xs text-green-600">🟢低</span>;
      default: return null;
    }
  };

  // 送信処理
  const handleSend = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setShowSendConfirm(false);
    setShowSuccessDialog({
      isOpen: true,
      title: '送信完了',
      message: 'メールを送信しました。',
      nextAction: 'emails'
    });
  };

  // 下書き保存処理
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setShowSaveConfirm(false);
    setShowSuccessDialog({
      isOpen: true,
      title: '保存完了',
      message: '下書きを保存しました。メール管理画面から確認できます。',
      nextAction: 'emails'
    });
  };

  // 送信ボタンクリック
  const handleSendClick = () => {
    if (selectedUsers.length === 0 || !subject || !body) return;
    setShowSendConfirm(true);
  };

  // 下書き保存ボタンクリック
  const handleSaveClick = () => {
    if (!subject && !body) return;
    setShowSaveConfirm(true);
  };

  // 成功ダイアログを閉じる
  const handleSuccessClose = () => {
    const nextAction = showSuccessDialog.nextAction;
    setShowSuccessDialog({ isOpen: false, title: '', message: '', nextAction: 'users' });
    if (nextAction === 'emails') {
      router.push('/admin/email');
    } else {
      router.push('/admin/users');
    }
  };

  const canSend = selectedUsers.length > 0 && subject && body;
  const canSave = subject || body;

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/email" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" /><span className="text-sm">メール管理に戻る</span>
            </Link>
            <h1 className="text-xl font-bold">メール作成</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveClick}
              disabled={!canSave}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" /> 下書き保存
            </button>
            <button 
              onClick={handleSendClick}
              disabled={!canSend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" /> 
              {sendTiming === 'immediate' ? '送信確認' : 'スケジュール設定'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左カラム */}
          <div className="space-y-6">
            {/* 宛先 */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  宛先 ({selectedUsers.length}人)
                </h2>
              </div>
              
              {selectedUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-2">ユーザーが選択されていません</p>
                  <Link
                    href="/admin/users"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    ユーザー管理画面で選択する →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedUsers.map(user => (
                    <div 
                      key={user.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        previewUser?.id === user.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setPreviewUser(user)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {user.display_name || '(名前未設定)'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {getRiskBadge(user.churnRisk)}
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeUser(user.id); }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ステップ1: テンプレート選択 */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-medium mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">1</span>
                テンプレートを選択
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-lg border text-center transition ${
                      selectedTemplate === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{template.icon}</div>
                    <div className="text-xs font-medium">{template.name}</div>
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <p className="text-xs text-gray-500 mt-2">
                  {templates.find(t => t.id === selectedTemplate)?.description}
                </p>
              )}
            </div>

            {/* ステップ2: AIで調整 */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-medium mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">2</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
                AIで調整（オプション）
              </h2>
              
              {/* ワンクリック調整ボタン */}
              <div className="flex flex-wrap gap-2 mb-4">
                {adjustmentTypes.map(adj => (
                  <button
                    key={adj.id}
                    onClick={() => handleQuickAdjust(adj.id)}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition ${adj.color} ${
                      lastAdjustment === adj.id ? 'ring-2 ring-offset-1 ring-blue-400' : ''
                    } disabled:opacity-50`}
                  >
                    <adj.icon className="w-3.5 h-3.5" />
                    {adj.label}
                  </button>
                ))}
              </div>
              
              {/* 自由入力 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="または自由に指示... 例: 「もっと短くして」「絵文字を追加」"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPrompt.trim()) {
                      handleCustomGenerate();
                    }
                  }}
                />
                <button
                  onClick={handleCustomGenerate}
                  disabled={isGenerating || !customPrompt.trim()}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1.5 text-sm"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  調整
                </button>
              </div>
              
              {lastAdjustment && (
                <button
                  onClick={handleResetToTemplate}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> テンプレートに戻す
                </button>
              )}
            </div>

            {/* 件名 */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-medium flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-gray-500" />
                件名
              </h2>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="メールの件名を入力..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* 本文（編集モード） */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-gray-500" />
                  本文
                </h2>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`text-xs px-2 py-1 rounded ${
                    isEditMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isEditMode ? '編集中' : '手動編集'}
                </button>
              </div>
              
              {isEditMode ? (
                <>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="メール本文を入力..."
                    className="w-full px-3 py-2 border rounded-lg h-64 resize-none font-mono text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">差し込み変数:</span>
                    {['{{name}}', '{{email}}', '{{days_remaining}}', '{{plan}}'].map(variable => (
                      <button
                        key={variable}
                        onClick={() => setBody(body + variable)}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap h-64 overflow-y-auto">
                  {body || '(本文が未設定です)'}
                </div>
              )}
            </div>

            {/* 送信タイミング */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-medium flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-500" />
                送信タイミング
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={sendTiming === 'immediate'}
                    onChange={() => setSendTiming('immediate')}
                    className="text-blue-600"
                  />
                  <span>即時送信</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={sendTiming === 'scheduled'}
                    onChange={() => setSendTiming('scheduled')}
                    className="text-blue-600"
                  />
                  <span>スケジュール送信</span>
                </label>
                
                {sendTiming === 'scheduled' && (
                  <div className="flex gap-2 ml-6">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="px-3 py-1.5 border rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右カラム: プレビュー */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                <h2 className="font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  プレビュー
                  {isGenerating && (
                    <span className="text-xs text-purple-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> 生成中...
                    </span>
                  )}
                </h2>
                {selectedUsers.length > 1 && previewUser && (
                  <select
                    value={previewUser.id}
                    onChange={(e) => {
                      const user = selectedUsers.find(u => u.id === e.target.value);
                      if (user) setPreviewUser(user);
                    }}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {selectedUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.display_name || user.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="p-4">
                {previewUser ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-500">To:</span> {previewUser.email}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Subject:</span>{' '}
                        <span className="font-medium">
                          {subject ? replaceVariables(subject, previewUser) : '(件名未入力)'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white max-h-[500px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                        {body ? replaceVariables(body, previewUser) : '(本文未入力)'}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    宛先を選択するとプレビューが表示されます
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 送信確認ダイアログ */}
      <ConfirmDialog
        isOpen={showSendConfirm}
        title="メールを送信しますか？"
        message={
          <div>
            <p className="mb-2">以下の内容でメールを送信します。</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div><span className="text-gray-500">宛先:</span> {selectedUsers.length}人</div>
              <div className="truncate"><span className="text-gray-500">件名:</span> {subject}</div>
              <div><span className="text-gray-500">送信:</span> {sendTiming === 'immediate' ? '即時' : `${scheduledDate} ${scheduledTime}`}</div>
            </div>
          </div>
        }
        onConfirm={handleSend}
        onCancel={() => setShowSendConfirm(false)}
        confirmText="はい、送信する"
        cancelText="いいえ"
        isLoading={isSending}
      />

      {/* 下書き保存確認ダイアログ */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="下書きを保存しますか？"
        message={
          <div>
            <p className="mb-2">このメールを下書きとして保存します。</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div><span className="text-gray-500">宛先:</span> {selectedUsers.length}人</div>
              <div className="truncate"><span className="text-gray-500">件名:</span> {subject || '(未設定)'}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              保存した下書きは「メール管理」画面から確認・編集できます。
            </p>
          </div>
        }
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        confirmText="はい、保存する"
        cancelText="いいえ"
        isLoading={isSaving}
      />

      {/* 成功ダイアログ */}
      <SuccessDialog
        isOpen={showSuccessDialog.isOpen}
        title={showSuccessDialog.title}
        message={showSuccessDialog.message}
        onClose={handleSuccessClose}
        buttonText="メール管理へ"
      />
    </div>
  );
}

export default function EmailComposePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <EmailComposeContent />
    </Suspense>
  );
}
