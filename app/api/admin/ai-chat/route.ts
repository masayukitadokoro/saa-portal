import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    const systemPrompt = `あなたは「起業の科学」の記事作成をサポートするAIアシスタントです。

【あなたの役割】
- 記事の構成や内容についてアドバイスする
- タイトル案や見出し案を提案する
- 文章の改善提案をする
- 起業・スタートアップに関する質問に答える

【コンテキスト情報】
${context?.title ? `記事タイトル: ${context.title}` : ''}
${context?.currentContent ? `現在の記事内容（抜粋）:\n${context.currentContent.substring(0, 1000)}` : ''}
${context?.transcript ? `関連動画の文字起こし（抜粋）:\n${context.transcript}` : ''}

【回答のスタイル】
- 簡潔で実用的なアドバイスを心がける
- 具体例を交えて説明する
- 「起業の科学」の読者層（起業家、事業責任者）を意識する
- 必要に応じてマークダウン形式で整理して回答`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // コスト効率のためminiを使用
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || '';

    // コスト計算（gpt-4o-mini: 入力$0.15/1M、出力$0.60/1M）
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const costUsd = (inputTokens * 0.15 + outputTokens * 0.60) / 1000000;
    const costJpy = Math.round(costUsd * 150 * 100) / 100;

    return NextResponse.json({
      response,
      cost: {
        usd: costUsd.toFixed(4),
        jpy: costJpy
      }
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'AIチャットでエラーが発生しました' },
      { status: 500 }
    );
  }
}
