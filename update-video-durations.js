/**
 * YouTube動画のdurationを取得してSupabaseを更新するスクリプト
 * 
 * 使い方:
 * 1. npm install @supabase/supabase-js を実行
 * 2. 下記の環境変数を設定
 * 3. node update-video-durations.js を実行
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================
// 設定（ここを編集してください）
// ============================================
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY';  // YouTube Data API v3 のAPIキー
const SUPABASE_URL = 'YOUR_SUPABASE_URL';        // Supabaseプロジェクト URL
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';   // Supabase anon key

// ============================================
// メイン処理
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// YouTube URLからvideo_idを抽出
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/,
    /^([\w-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ISO 8601 duration を秒に変換 (PT1H2M30S -> 3750)
function parseDuration(isoDuration) {
  if (!isoDuration) return null;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// YouTube APIからdurationを取得（最大50件ずつ）
async function fetchYouTubeDurations(videoIds) {
  const results = {};
  
  // 50件ずつバッチ処理（YouTube APIの制限）
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const ids = batch.join(',');
    
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${ids}&part=contentDetails&key=${YOUTUBE_API_KEY}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('YouTube API Error:', data.error.message);
        continue;
      }
      
      if (data.items) {
        for (const item of data.items) {
          const duration = parseDuration(item.contentDetails.duration);
          results[item.id] = duration;
        }
      }
      
      console.log(`Fetched batch ${Math.floor(i/50) + 1}: ${batch.length} videos`);
    } catch (error) {
      console.error('Fetch error:', error.message);
    }
  }
  
  return results;
}

// メイン実行
async function main() {
  console.log('=== YouTube Duration Updater ===\n');
  
  // 1. Supabaseから動画一覧を取得
  console.log('1. Fetching videos from Supabase...');
  const { data: videos, error } = await supabase
    .from('videos')
    .select('video_id, title, video_url, duration');
  
  if (error) {
    console.error('Supabase error:', error.message);
    return;
  }
  
  console.log(`   Found ${videos.length} videos\n`);
  
  // 2. durationがnullの動画をフィルタ
  const videosToUpdate = videos.filter(v => v.duration === null);
  console.log(`2. Videos needing duration update: ${videosToUpdate.length}\n`);
  
  if (videosToUpdate.length === 0) {
    console.log('All videos already have duration. Done!');
    return;
  }
  
  // 3. YouTube IDを抽出
  const videoMap = {};  // youtube_id -> supabase video_id
  const youtubeIds = [];
  
  for (const video of videosToUpdate) {
    const ytId = extractYouTubeId(video.video_url);
    if (ytId) {
      videoMap[ytId] = video.video_id;
      youtubeIds.push(ytId);
    } else {
      console.log(`   Warning: Could not extract YouTube ID from: ${video.video_url}`);
    }
  }
  
  console.log(`3. Extracted ${youtubeIds.length} YouTube IDs\n`);
  
  // 4. YouTube APIでduration取得
  console.log('4. Fetching durations from YouTube API...');
  const durations = await fetchYouTubeDurations(youtubeIds);
  console.log(`   Retrieved ${Object.keys(durations).length} durations\n`);
  
  // 5. Supabaseを更新
  console.log('5. Updating Supabase...');
  let updated = 0;
  let failed = 0;
  
  for (const [ytId, duration] of Object.entries(durations)) {
    const supabaseVideoId = videoMap[ytId];
    if (!supabaseVideoId || !duration) continue;
    
    const { error: updateError } = await supabase
      .from('videos')
      .update({ duration })
      .eq('video_id', supabaseVideoId);
    
    if (updateError) {
      console.log(`   Failed: ${supabaseVideoId} - ${updateError.message}`);
      failed++;
    } else {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      console.log(`   Updated: ${supabaseVideoId} -> ${mins}:${secs.toString().padStart(2, '0')}`);
      updated++;
    }
  }
  
  console.log(`\n=== Complete ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped (no YouTube ID): ${videosToUpdate.length - youtubeIds.length}`);
}

main().catch(console.error);
