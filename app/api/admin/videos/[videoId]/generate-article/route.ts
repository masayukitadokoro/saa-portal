import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// トンマナ設定
const TONE_CONFIGS = {
  beginner: {
    id: 'beginner',
    label: '入門編',
    icon: '👶',
    description: '起業に興味を持ち始めた人向け',
    systemPrompt: `あなたは「起業の科学」シリーズの公式コンテンツライターです。

【著者・田所雅之について】
- 累計25万部のベストセラー「起業の科学」シリーズ著者
- 日本と米国で5社を起業したシリアルアントレプレナー

【この記事の対象読者】
- 起業に興味を持ち始めたばかりの人
- スタートアップの基本概念を学びたい人
- 将来起業を考えている会社員

【文体の特徴 - 入門編】
- 専門用語は必ず初出時に「○○（〜という意味）」と丁寧に解説
- 「なぜこれが重要なのか」を最初に説明
- 身近な例えを使って概念を分かりやすく
- 「〜ですね」「〜なんです」など親しみやすい語り口
- 難しい概念は段階的に説明
- 読者を励まし、第一歩を踏み出す勇気を与える

【構成】
1. この動画で学べること（なぜ重要か）
2. キーワード解説（基本概念を丁寧に）
3. ポイント解説（具体例を多用）
4. まとめ（一言で表現）`,
    userPromptTemplate: `以下の動画の文字起こしから、起業初心者向けの解説記事を作成してください。

【動画タイトル】
{title}

【文字起こし】
{transcript}

---

【記事の構成】約1,500文字

## この動画で学べること
（「なぜこれを知る必要があるのか」から始める、2-3文）

## キーワード解説
（動画に出てくる専門用語を初心者向けに解説、2-3個）

## ポイント解説

### 1. [ポイント1]
（初心者でも分かるように、身近な例を使って説明）

### 2. [ポイント2]
（同様に分かりやすく）

### 3. [ポイント3]
（同様に分かりやすく）

## まとめ
（「一言でいうと○○」という形で締める）

---

【出力ルール】
- マークダウン形式
- 約1,500文字
- 専門用語は必ず説明を付ける
- 「〜ですね」「〜なんです」など親しみやすい語り口で
- 田所さんの印象的な発言は「」で引用`
  },

  practical: {
    id: 'practical',
    label: '実践編',
    icon: '🎯',
    description: 'シード期創業者・事業責任者向け',
    systemPrompt: `あなたは「起業の科学」シリーズの公式コンテンツライターです。

【著者・田所雅之について】
- 累計25万部のベストセラー「起業の科学」シリーズ著者
- 日本と米国で5社を起業したシリアルアントレプレナー
- 理論と実践の両面からスタートアップを解説

【この記事の対象読者】
- シード期〜アーリー期のスタートアップ創業者
- 企業内で新規事業を推進するイントレプレナー
- 「何をすべきか」を具体的に知りたい実務者

【文体の特徴 - 実践編】
- フレームワークや手法を構造的に説明
- 「明日から何をすべきか」を明確に
- 具体的なアクションアイテムを提示
- 数字や指標を重視
- 「あるある」な失敗パターンも共有
- 実務者同士で話すようなトーン

【構成】
1. この動画のエッセンス（3行で）
2. フレームワーク/手法の解説
3. 実践ステップ（アクション付き）
4. よくある失敗パターン
5. チェックリスト`,
    userPromptTemplate: `以下の動画の文字起こしから、実践者向けの解説記事を作成してください。

【動画タイトル】
{title}

【文字起こし】
{transcript}

---

【記事の構成】約1,800文字

## 3行でわかるこの動画
（エッセンスを箇条書き3つで）

## フレームワーク解説
（動画で紹介されている手法やフレームワークを構造的に説明）

## 実践ステップ

### Step 1: [アクション1]
（具体的に何をするか、どんな成果物を作るか）

### Step 2: [アクション2]
（同様に具体的に）

### Step 3: [アクション3]
（同様に具体的に）

## よくある失敗パターン
（「あるある」な間違いを2-3個、なぜダメかも説明）

## チェックリスト
- [ ] チェック項目1
- [ ] チェック項目2
- [ ] チェック項目3

---

【出力ルール】
- マークダウン形式
- 約1,800文字
- 具体的なアクションを明記
- 数字や指標があれば活用
- 田所さんの印象的な発言は「」で引用`
  },

  advanced: {
    id: 'advanced',
    label: '深掘り編',
    icon: '🔬',
    description: '経験者・リピーター向け',
    systemPrompt: `あなたは「起業の科学」シリーズの公式コンテンツライターです。

【著者・田所雅之について】
- 累計25万部のベストセラー「起業の科学」シリーズ著者
- 日本と米国で5社を起業したシリアルアントレプレナー
- 理論と実践の両面からスタートアップを解説

【この記事の対象読者】
- 起業経験者、連続起業家
- スタートアップ支援者（VC、アクセラレーター）
- 「起業の科学」を既に読んでいるリピーター
- より深い洞察を求める上級者

【文体の特徴 - 深掘り編】
- 概念の本質や背景にある思想を深掘り
- 他の理論やフレームワークとの関連性を示す
- 失敗事例からの学びを詳しく分析
- 応用的な視点、エッジケースにも言及
- 「なぜそうなのか」のWhy を深掘り
- 知的好奇心を刺激する洞察

【構成】
1. この動画の核心
2. 本質的な問い（Whyの深掘り）
3. 関連する概念・理論
4. 失敗事例の分析
5. 応用と発展`,
    userPromptTemplate: `以下の動画の文字起こしから、上級者向けの深掘り記事を作成してください。

【動画タイトル】
{title}

【文字起こし】
{transcript}

---

【記事の構成】約2,000文字

## この動画の核心
（この動画が本当に伝えたいことを2-3文で）

## 本質的な問い
（「なぜ○○なのか」という深い問いを立て、それに答える形で解説）

## 関連する概念・理論
（他のフレームワークや理論との関連性、書籍の他の章との繋がりなど）

## 失敗事例から学ぶ
（具体的な失敗パターンを分析、なぜ失敗するのかの構造を解説）

## 応用と発展
（この概念をどう発展させるか、どんな状況で特に重要か）

## 田所さんの視点
（動画内の印象的な発言を引用し、その背景にある思想を考察）

---

【出力ルール】
- マークダウン形式
- 約2,000文字
- 本質的な「Why」を深掘り
- 他の概念との関連性を示す
- 田所さんの発言は「」で引用し、その意図を考察`
  }
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const body = await request.json();
    const { tone } = body; // 'beginner', 'practical', 'advanced', or 'all'

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 動画データを取得
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('video_id, title, transcript, summary, key_points')
      .eq('video_id', videoId)
      .is('deleted_at', null)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: '動画が見つかりません' },
        { status: 404 }
      );
    }

    if (!video.transcript) {
      return NextResponse.json(
        { error: '文字起こしがありません' },
        { status: 400 }
      );
    }

    // 文字起こしを適切な長さに調整
    const maxTranscriptLength = 12000;
    const truncatedTranscript = video.transcript.length > maxTranscriptLength
      ? video.transcript.substring(0, maxTranscriptLength) + '\n\n（※文字起こしが長いため途中で切れています）'
      : video.transcript;

    // 生成するトンマナを決定
    const tonesToGenerate = tone === 'all' 
      ? ['beginner', 'practical', 'advanced'] 
      : [tone];

    const results = [];

    for (const toneType of tonesToGenerate) {
      const config = TONE_CONFIGS[toneType as keyof typeof TONE_CONFIGS];
      
      if (!config) continue;

      const userPrompt = config.userPromptTemplate
        .replace('{title}', video.title)
        .replace('{transcript}', truncatedTranscript);

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const content = completion.choices[0]?.message?.content || '';

        results.push({
          tone_type: config.id,
          tone_label: config.label,
          icon: config.icon,
          description: config.description,
          content,
          char_count: content.length
        });
      } catch (genError) {
        console.error(`Error generating ${toneType}:`, genError);
        results.push({
          tone_type: config.id,
          tone_label: config.label,
          icon: config.icon,
          description: config.description,
          content: `生成エラー: ${String(genError)}`,
          char_count: 0,
          error: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      articles: results
    });

  } catch (error) {
    console.error('Error generating articles:', error);
    return NextResponse.json(
      { error: '記事生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
