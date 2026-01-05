// sync-thumbnails.js
// Supabase Storageのサムネイルをvideosテーブルのcustom_thumbnail_urlに一括反映するスクリプト
//
// 使い方:
// 1. このファイルをプロジェクトのルートに保存
// 2. node sync-thumbnails.js を実行

const { createClient } = require('@supabase/supabase-js');

// 環境変数から取得、または直接入力
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncThumbnails() {
  console.log('🔍 Storageからサムネイル一覧を取得中...\n');

  // Storageのthumbnailsバケットからファイル一覧を取得
  const { data: files, error: listError } = await supabase.storage
    .from('thumbnails')
    .list('', { limit: 1000 });

  if (listError) {
    console.error('❌ ファイル一覧の取得に失敗:', listError.message);
    return;
  }

  if (!files || files.length === 0) {
    console.log('📭 サムネイルが見つかりませんでした');
    return;
  }

  console.log(`📁 ${files.length}件のサムネイルが見つかりました\n`);

  // video_idごとに最新のサムネイルを取得（同じvideo_idで複数ある場合は最新を使用）
  const thumbnailMap = new Map();

  for (const file of files) {
    // ファイル名からvideo_idを抽出 (例: video001-1704067890123.jpg → video001)
    const match = file.name.match(/^(video\d+)-/);
    if (match) {
      const videoId = match[1];
      const existing = thumbnailMap.get(videoId);
      
      // より新しいファイルで上書き（タイムスタンプが大きい方）
      if (!existing || file.name > existing.name) {
        thumbnailMap.set(videoId, file);
      }
    }
  }

  console.log(`🎬 ${thumbnailMap.size}件の動画に対応するサムネイルを処理します\n`);

  // 各サムネイルをDBに反映
  let successCount = 0;
  let errorCount = 0;

  for (const [videoId, file] of thumbnailMap) {
    // 公開URLを生成
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(file.name);

    // videosテーブルを更新
    const { error: updateError } = await supabase
      .from('videos')
      .update({ custom_thumbnail_url: publicUrl })
      .eq('video_id', videoId);

    if (updateError) {
      console.log(`❌ ${videoId}: 更新失敗 - ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`✅ ${videoId}: ${publicUrl.substring(0, 60)}...`);
      successCount++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${errorCount}件`);
  console.log('========================================');
}

syncThumbnails().catch(console.error);
